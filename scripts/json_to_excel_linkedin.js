const XLSX = require('xlsx');
const XlsxPopulate = require('xlsx-populate');
const fs = require('fs');
const path = require('path');

const jsonDir = path.resolve(__dirname, '../data/json/linkedin');
console.log('DEBUG: Using jsonDir:', jsonDir);
let jobs = [];

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

console.log(`DEBUG: jobs array length before Excel: ${jobs.length}`);
if (jobs.length > 0) {
  console.log('DEBUG: Sample job:', jobs[0]);
}
jobs.forEach(job => {
  const cleanTitle = job.jobTitle && typeof job.jobTitle === 'string' ? job.jobTitle.split(' - ')[0] : 'N/A';
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

console.log(`DEBUG: Total rows (including header): ${data.length}`);
console.log(`DEBUG: Job count: ${jobs.length}`);

const ws = XLSX.utils.aoa_to_sheet(data);
const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, 'Jobs');

const outputDir = path.resolve(__dirname, '../output');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
const tempFilePath = path.join(outputDir, `temp_jobs_linkedin_only_${timestamp}.xlsx`);
XLSX.writeFile(wb, tempFilePath);

XlsxPopulate.fromFileAsync(tempFilePath)
  .then(workbook => {
    const sheet = workbook.sheet(0);
    const usedRange = sheet.usedRange();
    const rowCount = usedRange ? usedRange.endCell().rowNumber() : 0;
    
    console.log('DEBUG: After reading back with XlsxPopulate, rowCount =', rowCount);

    // Header row formatting
    sheet.range('A1:O1').style({
      bold: true,
      fill: 'D3D3D3',
      fontColor: '000000'
    });

    // Column widths
    sheet.column('A').width(30);
    sheet.column('B').width(25);
    sheet.column('C').width(20);
    sheet.column('D').width(8);
    sheet.column('E').width(12);
    sheet.column('F').width(50);
    sheet.column('G').width(50);
    sheet.column('H').width(15);
    sheet.column('I').width(12);
    sheet.column('J').width(12);
    sheet.column('K').width(15);
    sheet.column('L').width(25);
    sheet.column('M').width(15);
    sheet.column('N').width(20);
    sheet.column('O').width(25);

    // Apply formatting to all rows
    for (let i = 2; i <= rowCount; i++) {
      // Wrap text in description and qualifications
      sheet.cell(`F${i}`).style({ wrapText: true });
      sheet.cell(`G${i}`).style({ wrapText: true });
      
      // Date formatting
      const dateVal = sheet.cell(`I${i}`).value();
      if (dateVal && dateVal !== 'N/A') {
        sheet.cell(`I${i}`).style({ numberFormat: 'mm-dd-yyyy' });
      }
    }

    const finalFilePath = path.join(outputDir, `jobs_linkedin_only_${timestamp}.xlsx`);
    return workbook.toFileAsync(finalFilePath);
  })
  .then(() => {
    console.log(`\n✓ LinkedIn Excel file created successfully!`);
    console.log(`✓ Total jobs: ${jobs.length}`);
    console.log(`✓ Output: output/jobs_linkedin_only_${timestamp}.xlsx`);
    
    fs.unlinkSync(tempFilePath);
  })
  .catch(err => {
    console.error('Error creating styled Excel file:', err);
  });
