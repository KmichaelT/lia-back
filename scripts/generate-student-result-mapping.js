const XLSX = require('xlsx');

const authoritativePath = process.argv[2];
const resultsPath = process.argv[3];
const outputPath = process.argv[4];

if (!authoritativePath || !resultsPath || !outputPath) {
  throw new Error('Usage: node scripts/generate-student-result-mapping.js <children.xlsx> <results.xlsx> <output.xlsx>');
}

const normalize = (value) =>
  String(value ?? '')
    .toLowerCase()
    .replace(/\([^)]*\)/g, '')
    .replace(/[^a-z]/g, '');

const levenshtein = (left, right) => {
  let previous = Array.from({ length: right.length + 1 }, (_, index) => index);
  for (let i = 1; i <= left.length; i += 1) {
    const current = [i];
    for (let j = 1; j <= right.length; j += 1) {
      current[j] = Math.min(
        current[j - 1] + 1,
        previous[j] + 1,
        previous[j - 1] + (left[i - 1] === right[j - 1] ? 0 : 1)
      );
    }
    previous = current;
  }
  return previous[right.length];
};

const similarity = (left, right) => {
  const normalizedLeft = normalize(left);
  const normalizedRight = normalize(right);
  const longest = Math.max(normalizedLeft.length, normalizedRight.length, 1);
  return 1 - levenshtein(normalizedLeft, normalizedRight) / longest;
};

const childrenWorkbook = XLSX.readFile(authoritativePath, { cellDates: true });
const childrenSheet = childrenWorkbook.Sheets[childrenWorkbook.SheetNames[0]];
const children = XLSX.utils.sheet_to_json(childrenSheet, { defval: '' });

const resultsWorkbook = XLSX.readFile(resultsPath, { cellDates: true });
const resultsSheet = resultsWorkbook.Sheets[resultsWorkbook.SheetNames[0]];
const sourceRows = XLSX.utils.sheet_to_json(resultsSheet, {
  header: 1,
  defval: '',
  raw: true,
});

const headers = sourceRows[1];
const academicYear = sourceRows[0].find((value) => /\d{4}\s*E\.C/i.test(String(value ?? ''))) ?? '';
const resultStudents = [];
let currentStudent = null;

for (let index = 2; index < sourceRows.length; index += 1) {
  const row = sourceRows[index];
  if (row[0]) {
    currentStudent = {
      resultName: String(row[0]).trim(),
      sex: row[1],
      grade: row[2],
      rows: [],
    };
    resultStudents.push(currentStudent);
  }
  if (currentStudent && row[3]) {
    currentStudent.rows.push({ sourceRow: index + 1, values: row });
  }
}

const mappings = resultStudents.map((student) => {
  const candidates = children
    .map((child) => ({
      id: child['LIA ID'],
      name: child['Full name'],
      currentGrade: child['Current grade'],
      dateOfBirth: child['Date of birth'],
      score: similarity(student.resultName, child['Full name']),
    }))
    .sort((left, right) => right.score - left.score);

  const best = candidates[0];
  const second = candidates[1];
  const isExact = best.score === 1;
  const isStrong = best.score >= 0.82 && best.score - second.score >= 0.08;
  const status = isExact ? 'Exact match - verify' : isStrong ? 'Strong suggestion - verify' : 'Manual review required';

  return {
    ...student,
    best,
    second,
    third: candidates[2],
    confidence: isExact ? 'Exact' : isStrong ? 'High' : 'Review',
    status,
    mappedId: isExact || isStrong ? best.id : '',
    mappedName: isExact || isStrong ? best.name : '',
  };
});

// A suggested ID must never be assigned automatically to two result students.
const assigned = new Map();
for (const mapping of mappings.filter((item) => item.mappedId)) {
  const collisions = assigned.get(mapping.mappedId) ?? [];
  collisions.push(mapping);
  assigned.set(mapping.mappedId, collisions);
}
for (const collisions of assigned.values()) {
  if (collisions.length <= 1) continue;
  for (const mapping of collisions) {
    mapping.mappedId = '';
    mapping.mappedName = '';
    mapping.confidence = 'Review';
    mapping.status = 'Manual review required - duplicate ID suggestion';
  }
}

const mappingRows = mappings.map((mapping) => ({
  'Result Sheet Name': mapping.resultName,
  'Result Grade': mapping.grade,
  'Result Sex': mapping.sex,
  'Mapped LIA ID': mapping.mappedId,
  'Official Full Name': mapping.mappedName,
  Confidence: mapping.confidence,
  'Review Status': mapping.status,
  'Best Suggested LIA ID': mapping.best.id,
  'Best Suggested Name': mapping.best.name,
  'Best Score': Number(mapping.best.score.toFixed(3)),
  'Best Current Grade': mapping.best.currentGrade,
  'Second Suggested LIA ID': mapping.second.id,
  'Second Suggested Name': mapping.second.name,
  'Second Score': Number(mapping.second.score.toFixed(3)),
  'Third Suggested LIA ID': mapping.third.id,
  'Third Suggested Name': mapping.third.name,
  'Third Score': Number(mapping.third.score.toFixed(3)),
  'Reviewer Notes': '',
}));

const reviewRows = mappingRows.filter((row) => row.Confidence === 'Review');
const enrichedRows = [];
for (const mapping of mappings) {
  for (const resultRow of mapping.rows) {
    const record = {
      'Mapped LIA ID': mapping.mappedId,
      'Official Full Name': mapping.mappedName,
      'Original Result Name': mapping.resultName,
      'Match Confidence': mapping.confidence,
      'Review Status': mapping.status,
      'Academic Year': academicYear,
      'Source Row': resultRow.sourceRow,
    };
    headers.forEach((header, column) => {
      if (header) record[String(header)] = resultRow.values[column];
    });
    enrichedRows.push(record);
  }
}

const instructions = [
  ['STUDENT RESULT ID MAPPING'],
  ['Purpose', 'Connect names in the results workbook to authoritative LIA child IDs.'],
  ['Original files', 'The source workbooks were read only and were not modified.'],
  ['Step 1', 'Open Student Mapping and review every row, including Exact and High matches.'],
  ['Step 2', 'For Review rows, compare the three suggested candidates and enter the confirmed ID and official name in the mapped columns.'],
  ['Step 3', 'Ensure one LIA ID is assigned to only one result student.'],
  ['Step 4', 'After confirmation, propagate corrected IDs to Enriched Results before importing.'],
  ['Important', 'Do not import rows with a blank Mapped LIA ID. Names must not be used as the permanent database key.'],
  ['Academic year detected', academicYear],
  ['Authoritative children', children.length],
  ['Result students', mappings.length],
  ['Exact suggestions', mappings.filter((item) => item.confidence === 'Exact').length],
  ['High-confidence suggestions', mappings.filter((item) => item.confidence === 'High').length],
  ['Manual review required', mappings.filter((item) => item.confidence === 'Review').length],
];

const output = XLSX.utils.book_new();
const instructionsSheet = XLSX.utils.aoa_to_sheet(instructions);
const mappingSheet = XLSX.utils.json_to_sheet(mappingRows);
const reviewSheet = XLSX.utils.json_to_sheet(reviewRows);
const enrichedSheet = XLSX.utils.json_to_sheet(enrichedRows);
const childrenOutputSheet = XLSX.utils.json_to_sheet(children);

instructionsSheet['!cols'] = [{ wch: 28 }, { wch: 110 }];
mappingSheet['!cols'] = Array.from({ length: 18 }, (_, index) => ({ wch: index === 0 || index === 4 || index === 8 || index === 12 || index === 15 ? 30 : 18 }));
reviewSheet['!cols'] = mappingSheet['!cols'];
enrichedSheet['!cols'] = [{ wch: 16 }, { wch: 30 }, { wch: 30 }, { wch: 18 }, { wch: 42 }];

XLSX.utils.book_append_sheet(output, instructionsSheet, 'Instructions');
XLSX.utils.book_append_sheet(output, mappingSheet, 'Student Mapping');
XLSX.utils.book_append_sheet(output, reviewSheet, 'Manual Review');
XLSX.utils.book_append_sheet(output, enrichedSheet, 'Enriched Results');
XLSX.utils.book_append_sheet(output, childrenOutputSheet, 'Official Children');
XLSX.writeFile(output, outputPath, { compression: true });

console.log(JSON.stringify({
  outputPath,
  children: children.length,
  students: mappings.length,
  resultRows: enrichedRows.length,
  exact: mappings.filter((item) => item.confidence === 'Exact').length,
  high: mappings.filter((item) => item.confidence === 'High').length,
  review: mappings.filter((item) => item.confidence === 'Review').length,
}, null, 2));
