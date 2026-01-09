const XLSX = require('xlsx');
const XlsxPopulate = require('xlsx-populate');
const fs = require('fs');
const path = require('path');

const htmlDir = 'data/json/html';
const webScrapeDir = 'data/json/webScrape';
let jobs = [];

[htmlDir, webScrapeDir].forEach(jsonDir => {
  if (fs.existsSync(jsonDir)) {
    const jsonFiles = fs.readdirSync(jsonDir).filter(file => file.endsWith('.json'));
    jsonFiles.forEach(file => {
      try {
        const filePath = path.join(jsonDir, file);
        const jobData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        if (Array.isArray(jobData)) {
          jobs.push(...jobData);
        } else {
          jobs.push(jobData);
        }
        console.log(`Loaded job data from ${file}`);
      } catch (err) {
        console.error(`Error reading ${file}:`, err.message);
      }
    });
  }
});

const data = [
  ['Job Title', 'Company', 'City', 'State', 'Region', 'Job Description', 'Qualifications', 'Pay', 'Date', 'Remote Flag', 'Source Platform', 'Career Track', 'Entry Level Flag', 'Collected At', 'Source File']
];

function formatQualifications(qualStr) {
  if (!qualStr || qualStr === 'N/A') return 'N/A';
  let parts = qualStr.split(';').map(p => p.trim()).filter(p => p);
  if (parts.length === 1) {
    const bulletCount = (qualStr.match(/[-•*]/g) || []).length;
    if (bulletCount > 1) {
      parts = qualStr.split(/[-•*]/).slice(1).map(p => p.trim()).filter(p => p);
    } else if (bulletCount === 1 && !qualStr.match(/^[-•*]/)) {
      parts = [qualStr];
    } else {
      parts = [qualStr.replace(/^[-•*]\s*/, '')];
    }
  }
  const processedParts = [];
  for (const part of parts) {
    if (part.length > 100) {
      const subparts = part.split(/;\s*|\.\s*|\d+\.\s*/).map(p => p.trim()).filter(p => p.length > 10);
      if (subparts.length > 1) {
        processedParts.push(...subparts);
      } else {
        processedParts.push(part);
      }
    } else {
      processedParts.push(part);
    }
  }
  parts = processedParts;
  parts = parts.map(part => part.replace(/^[-•*]\s*/, ''));
  return parts.map(part => `• ${part}`).join('\n');
}

function formatDate(dateStr) {
  if (!dateStr || dateStr === 'N/A') return 'N/A';
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return 'N/A';
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${month}-${day}-${year}`;
  } catch (e) {
    return 'N/A';
  }
}

jobs.forEach(job => {
  const cleanTitle = job.jobTitle.split(' - ')[0];
  const formattedQualifications = formatQualifications(job.qualifications);
  data.push([
    cleanTitle,
    job.company || 'N/A',
    job.city || job.location || 'N/A',
    job.state || 'N/A',
    job.region || 'N/A',
    (job.jobDescription || 'N/A').substring(0, 10000),
    formattedQualifications.substring(0, 5000),
    job.pay || 'N/A',
    job.date && job.date.startsWith('updated') ? 'N/A' : (job.date || 'N/A'),
    job.remoteFlag !== undefined ? job.remoteFlag.toString() : 'N/A',
    job.sourcePlatform || 'N/A',
    job.careerTrack || 'N/A',
    job.entryLevelFlag !== undefined ? job.entryLevelFlag.toString() : 'N/A',
    formatDate(job.collectedAt),
    job.sourceFile || 'N/A'
  ]);
});

(async () => {
  const workbook = await XlsxPopulate.fromBlankAsync();
  const sheet = workbook.sheet(0);
  sheet.name('Jobs');
  data.forEach((row, rowIndex) => {
    row.forEach((cellValue, colIndex) => {
      sheet.cell(rowIndex + 1, colIndex + 1).value(cellValue);
    });
  });
  sheet.column(1).width(40);
  sheet.column(2).width(25);
  sheet.column(3).width(20);
  sheet.column(4).width(8);
  sheet.column(5).width(12);
  sheet.column(6).width(50);
  sheet.column(7).width(60);
  sheet.column(8).width(15);
  sheet.column(9).width(12);
  sheet.column(10).width(10);
  sheet.column(11).width(15);
  sheet.column(12).width(20);
  sheet.column(13).width(12);
  sheet.column(14).width(20);
  sheet.column(15).width(50);
  for (let row = 1; row <= data.length; row++) {
    if (row > 1) {
      sheet.row(row).height(60);
    }
    for (let col = 1; col <= data[0].length; col++) {
      const cell = sheet.cell(row, col);
      cell.style('wrapText', true);
      cell.style('verticalAlignment', 'top');
    }
  }
  for (let row = 2; row <= data.length; row++) {
    const sourceFile = data[row - 1][14];
    if (sourceFile && sourceFile !== 'N/A' && sourceFile.startsWith('http')) {
      const cell = sheet.cell(row, 15);
      cell.hyperlink(sourceFile).style({ fontColor: '0563C1', underline: true });
    }
  }
  const now = new Date();
  const timestamp = now.toISOString().replace(/:/g, '-').replace(/\..+/, '').replace('T', '_');
  const outputDir = require('path').resolve(__dirname, '../output');
  if (!require('fs').existsSync(outputDir)) require('fs').mkdirSync(outputDir, { recursive: true });
  const filename = require('path').join(outputDir, `jobs_all_json_${timestamp}.xlsx`);
  await workbook.toFileAsync(filename);
  console.log(`Excel file created: ${filename} with ${jobs.length} job entries`);
})();