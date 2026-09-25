/**
 * academic-result service
 */

import { factories } from '@strapi/strapi';

type ImportMode = 'skip' | 'update';

type ParsedResult = {
  row: number;
  liaId: string;
  studentName: string;
  academicYear: string;
  grade: string;
  semester: 'semester_1' | 'semester_2' | 'average';
  subjects: Record<string, number>;
  total: number | null;
  average: number | null;
  rank: number | null;
};

const normalizeHeader = (value: unknown) =>
  String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');

const text = (value: unknown) => String(value ?? '').trim();

const numberOrNull = (value: unknown) => {
  if (value === null || value === undefined || text(value) === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const liaIdCandidates = (value: string) => {
  const compact = value.toUpperCase().replace(/[^A-Z0-9]/g, '');
  const digits = compact.replace(/^LIA/, '');
  const candidates = new Set([value.trim(), compact, `LIA-${digits}`]);

  // Some exported IDs above 100 use LIA100101 rather than the database's
  // LIA-00101/LIA-000101 form. Retain both known legacy representations.
  if (/^100\d{3}$/.test(digits)) {
    const sequence = digits.slice(-3);
    candidates.add(`LIA-${sequence.padStart(5, '0')}`);
    candidates.add(`LIA-000${sequence}`);
  }

  return [...candidates];
};

const studentGroupKey = (record: ParsedResult) =>
  [record.academicYear, record.grade, normalizeHeader(record.studentName)].join('|');

const semesterValue = (value: unknown): ParsedResult['semester'] | null => {
  const normalized = normalizeHeader(value);
  if (['i', '1', 'semester1', 'sem1'].includes(normalized)) return 'semester_1';
  if (['ii', '2', 'semester2', 'sem2'].includes(normalized)) return 'semester_2';
  if (['averg', 'average', 'avg'].includes(normalized)) return 'average';
  return null;
};

const findColumn = (headers: unknown[], aliases: string[]) => {
  const normalizedAliases = aliases.map(normalizeHeader);
  return headers.findIndex((header) => normalizedAliases.includes(normalizeHeader(header)));
};

export default factories.createCoreService(
  'api::academic-result.academic-result',
  ({ strapi }) => ({
    parseWorksheet(rows: unknown[][]): { records: ParsedResult[]; errors: any[] } {
      const errors: any[] = [];
      const headerIndex = rows.findIndex((row) => {
        const normalized = row.map(normalizeHeader);
        return normalized.includes('semester') &&
          (normalized.includes('nameofstudents') ||
            normalized.includes('originalresultname') ||
            normalized.includes('mappedliaid') ||
            normalized.includes('liaid'));
      });

      if (headerIndex < 0) {
        throw new Error('Could not find a header row containing student and semester columns.');
      }

      const headers = rows[headerIndex];
      const nameIndex = findColumn(headers, [
        'Original Result Name',
        'NAME OF STUDENTS',
        'Student Name',
        'Full name',
      ]);
      const idIndex = findColumn(headers, ['Mapped LIA ID', 'LIA ID']);
      const gradeIndex = findColumn(headers, ['GRADE', 'Result Grade']);
      const semesterIndex = findColumn(headers, ['SEMESTER']);
      const yearIndex = findColumn(headers, ['Academic Year']);
      const totalIndex = findColumn(headers, ['TOTAL']);
      const averageIndex = findColumn(headers, ['AVERG', 'AVERAGE', 'AVG']);
      const rankIndex = findColumn(headers, ['RANK']);

      if (nameIndex < 0 || semesterIndex < 0) {
        throw new Error('The workbook must contain student-name and semester columns.');
      }

      const detectedYear = rows
        .slice(0, headerIndex + 1)
        .flat()
        .map(text)
        .find((value) => /\d{4}\s*E\.?C/i.test(value)) ?? '';

      const excludedColumns = new Set([
        nameIndex,
        idIndex,
        gradeIndex,
        semesterIndex,
        yearIndex,
        totalIndex,
        averageIndex,
        rankIndex,
        findColumn(headers, ['SEX']),
        findColumn(headers, ['Official Full Name']),
        findColumn(headers, ['Match Confidence']),
        findColumn(headers, ['Review Status']),
        findColumn(headers, ['Source Row']),
      ]);

      let currentName = '';
      let currentId = '';
      let currentGrade = '';
      const records: ParsedResult[] = [];

      for (let index = headerIndex + 1; index < rows.length; index += 1) {
        const row = rows[index];
        if (!row || row.every((value) => text(value) === '')) continue;

        const rowName = text(row[nameIndex]);
        if (rowName && rowName !== currentName) {
          // A named row starts a new student block. Reset ID/grade as well so a
          // blank value can never inherit the preceding student's identity.
          currentName = rowName;
          currentId = idIndex >= 0 ? text(row[idIndex]) : '';
          currentGrade = gradeIndex >= 0 ? text(row[gradeIndex]) : '';
        } else {
          if (idIndex >= 0 && text(row[idIndex])) currentId = text(row[idIndex]);
          if (gradeIndex >= 0 && text(row[gradeIndex])) currentGrade = text(row[gradeIndex]);
        }

        const semester = semesterValue(row[semesterIndex]);
        if (!semester) {
          errors.push({ row: index + 1, message: `Unknown semester: ${text(row[semesterIndex]) || '(blank)'}` });
          continue;
        }

        const academicYear = yearIndex >= 0 && text(row[yearIndex])
          ? text(row[yearIndex])
          : detectedYear;

        if (!currentName) {
          errors.push({ row: index + 1, message: 'Student name is missing.' });
          continue;
        }
        if (!academicYear) {
          errors.push({ row: index + 1, studentName: currentName, message: 'Academic year is missing.' });
          continue;
        }
        if (!currentGrade) {
          errors.push({ row: index + 1, studentName: currentName, message: 'Grade is missing.' });
          continue;
        }

        const subjects: Record<string, number> = {};
        headers.forEach((header, column) => {
          if (excludedColumns.has(column) || !text(header)) return;
          const score = numberOrNull(row[column]);
          if (score !== null) subjects[text(header)] = score;
        });

        records.push({
          row: index + 1,
          liaId: currentId,
          studentName: currentName,
          academicYear,
          grade: currentGrade,
          semester,
          subjects,
          total: totalIndex >= 0 ? numberOrNull(row[totalIndex]) : null,
          average: averageIndex >= 0 ? numberOrNull(row[averageIndex]) : null,
          rank: rankIndex >= 0 ? numberOrNull(row[rankIndex]) : null,
        });
      }

      return { records, errors };
    },

    async importRecords(
      records: ParsedResult[],
      options: { mode: ImportMode; dryRun: boolean; sourceFileName: string }
    ) {
      const report = {
        total: records.length,
        created: 0,
        matched: 0,
        pending: 0,
        updated: 0,
        skipped: 0,
        pendingRecords: [] as any[],
        invalid: [] as any[],
      };
      const childCache = new Map<string, any>();

      for (const record of records) {
        if (record.rank !== null && (!Number.isInteger(record.rank) || record.rank < 1)) {
          report.invalid.push({ row: record.row, studentName: record.studentName, message: 'Rank must be a positive whole number.' });
          continue;
        }

        let child = record.liaId ? childCache.get(record.liaId) : null;
        let unresolvedReason = record.liaId ? '' : 'LIA ID is missing.';
        if (record.liaId && child === undefined) {
          const matches = await strapi.db.query('api::child.child').findMany({
            where: { liaId: { $in: liaIdCandidates(record.liaId) } },
            select: ['id', 'documentId', 'liaId', 'fullName', 'publishedAt'],
          });
          const documents = new Map<string, any[]>();
          for (const match of matches) {
            const key = match.documentId || String(match.id);
            documents.set(key, [...(documents.get(key) ?? []), match]);
          }
          const uniqueDocuments = [...documents.values()];
          child = uniqueDocuments.length === 1
            ? uniqueDocuments[0].find((entry) => entry.publishedAt) ?? uniqueDocuments[0][0]
            : null;
          childCache.set(record.liaId, child);
          if (uniqueDocuments.length > 1) {
            unresolvedReason = 'LIA ID belongs to more than one child document.';
          } else if (!child) {
            unresolvedReason = 'No child exists with this LIA ID.';
          }
        }

        if (record.liaId && !child && !unresolvedReason) {
          unresolvedReason = 'No child exists with this LIA ID.';
        }

        if (!child) {
          report.pendingRecords.push({
            row: record.row,
            liaId: record.liaId,
            studentName: record.studentName,
            message: unresolvedReason,
          });
        }

        const groupKey = studentGroupKey(record);
        const matchStatus: 'matched' | 'pending' = child ? 'matched' : 'pending';
        const existing = await strapi.db.query('api::academic-result.academic-result').findOne({
          where: child
            ? {
                child: child.id,
                academicYear: record.academicYear,
                semester: record.semester,
              }
            : {
                studentGroupKey: groupKey,
                academicYear: record.academicYear,
                semester: record.semester,
              },
          select: ['id', 'documentId'],
        });

        const data = {
          child: child?.id ?? null,
          academicYear: record.academicYear,
          grade: record.grade,
          semester: record.semester,
          subjects: record.subjects,
          total: record.total,
          average: record.average,
          rank: record.rank,
          studentName: child?.fullName || record.studentName,
          studentGroupKey: groupKey,
          matchStatus,
          unresolvedReason: child ? null : unresolvedReason,
          sourceStudentName: record.studentName,
          sourceFileName: options.sourceFileName,
          importedAt: new Date().toISOString(),
        };

        if (existing) {
          if (options.mode === 'skip') {
            report.skipped += 1;
          } else {
            if (!options.dryRun) {
              await strapi.entityService.update('api::academic-result.academic-result', existing.id, { data });
            }
            report.updated += 1;
          }
          continue;
        }

        if (!options.dryRun) {
          await strapi.entityService.create('api::academic-result.academic-result', { data });
        }
        report.created += 1;
        if (child) report.matched += 1;
        else report.pending += 1;
      }

      return report;
    },
  })
);
