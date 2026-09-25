/**
 * academic-result controller
 */

import fs from 'node:fs';
import * as XLSX from 'xlsx';
import { factories } from '@strapi/strapi';

const firstFile = (value: any) => Array.isArray(value) ? value[0] : value;

export default factories.createCoreController(
  'api::academic-result.academic-result',
  ({ strapi }) => ({
    async myChildResults(ctx) {
      const user = ctx.state.user;
      const childRef = String(ctx.params.childRef ?? '').trim();

      if (!user) return ctx.unauthorized('Authentication required.');
      if (!childRef) return ctx.badRequest('Child reference is required.');

      const sponsors = await strapi.db.query('api::sponsor.sponsor').findMany({
        where: {
          $or: [
            { user: user.id },
            { email: user.email },
          ],
        },
        select: ['id', 'documentId'],
      });

      if (!sponsors.length) {
        return ctx.forbidden('No sponsor profile is linked to this account.');
      }

      const numericChildId = /^\d+$/.test(childRef) ? Number(childRef) : null;
      const childEntries = await strapi.db.query('api::child.child').findMany({
        where: numericChildId
          ? { $or: [{ id: numericChildId }, { documentId: childRef }] }
          : { documentId: childRef },
        select: ['id', 'documentId', 'fullName'],
        populate: {
          sponsor: {
            select: ['id', 'documentId'],
          },
        },
      });

      const sponsorIds = new Set(sponsors.map((sponsor) => sponsor.id));
      const ownedEntries = childEntries.filter((entry) => entry.sponsor && sponsorIds.has(entry.sponsor.id));

      if (!ownedEntries.length) {
        return ctx.notFound('No sponsored child was found for this account.');
      }

      const childIds = ownedEntries.map((entry) => entry.id);
      const results = await strapi.db.query('api::academic-result.academic-result').findMany({
        where: {
          child: { id: { $in: childIds } },
          matchStatus: 'matched',
        },
        select: [
          'id',
          'documentId',
          'academicYear',
          'grade',
          'semester',
          'subjects',
          'total',
          'average',
          'rank',
        ],
        orderBy: [
          { academicYear: 'desc' },
          { semester: 'asc' },
        ],
      });

      ctx.body = {
        data: results,
        meta: {
          child: {
            documentId: ownedEntries[0].documentId,
            fullName: ownedEntries[0].fullName,
          },
          count: results.length,
        },
      };
    },

    async importWorkbook(ctx) {
      const uploaded = firstFile((ctx.request.files as any)?.file);
      if (!uploaded) {
        return ctx.badRequest('Attach an Excel workbook using the multipart field named "file".');
      }

      const filePath = uploaded.filepath || uploaded.path;
      const fileName = uploaded.originalFilename || uploaded.name || 'academic-results.xlsx';
      if (!filePath || !/\.xlsx?$/i.test(fileName)) {
        return ctx.badRequest('Only .xlsx or .xls workbooks are supported.');
      }

      const mode = String(ctx.query.mode ?? 'skip').toLowerCase();
      if (!['skip', 'update'].includes(mode)) {
        return ctx.badRequest('Query parameter "mode" must be either "skip" or "update".');
      }
      const dryRun = String(ctx.query.dryRun ?? 'false').toLowerCase() === 'true';

      try {
        const workbook = XLSX.read(fs.readFileSync(filePath), { type: 'buffer', cellDates: true });
        const preferredSheet = workbook.SheetNames.includes('Enriched Results')
          ? 'Enriched Results'
          : workbook.SheetNames[0];
        const worksheet = workbook.Sheets[preferredSheet];
        const rows = XLSX.utils.sheet_to_json(worksheet, {
          header: 1,
          defval: '',
          raw: true,
        }) as unknown[][];

        const service = strapi.service('api::academic-result.academic-result') as any;
        const parsed = service.parseWorksheet(rows);
        const report = await service.importRecords(parsed.records, {
          mode,
          dryRun,
          sourceFileName: fileName,
        });

        ctx.body = {
          message: dryRun ? 'Workbook validation completed; no data was saved.' : 'Workbook import completed.',
          data: {
            sheet: preferredSheet,
            dryRun,
            mode,
            ...report,
            parseErrors: parsed.errors,
          },
        };
      } catch (error) {
        strapi.log.error('Academic result import failed:', error);
        return ctx.badRequest(error instanceof Error ? error.message : 'Could not read the workbook.');
      }
    },
  })
);
