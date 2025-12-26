const XLSX = require('xlsx');
const XlsxPopulate = require('xlsx-populate');
const fs = require('fs');
const path = require('path');

// Read job data from multiple sources
let jobs = [];

// Load from new pipeline output (primary source)
const pipelineFile = 'hc_jobs_pipeline/output/healthcare_admin_jobs_us_nationwide.json';
if (fs.existsSync(pipelineFile)) {
  try {
    const pipelineData = JSON.parse(fs.readFileSync(pipelineFile, 'utf-8'));
    if (Array.isArray(pipelineData)) {
      jobs.push(...pipelineData);
      console.log(`Loaded ${pipelineData.length} jobs from pipeline output`);
    }
  } catch (err) {
    console.error(`Error reading pipeline file:`, err.message);
  }
}

// Load from legacy JSON files for additional data
const jsonDir = 'data/json';
if (fs.existsSync(jsonDir)) {
  const jsonFiles = fs.readdirSync(jsonDir).filter(file => 
    file.endsWith('.json') && 
    !file.includes('healthcare_admin_jobs_west_100plus.json') // Skip old file to avoid duplicates
  );

  jsonFiles.forEach(file => {
    try {
      const filePath = path.join(jsonDir, file);
      const jobData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      if (Array.isArray(jobData)) {
        jobs.push(...jobData);
      } else {
        jobs.push(jobData);
      }
      console.log(`Loaded additional job data from ${file}`);
    } catch (err) {
      console.error(`Error reading ${file}:`, err.message);
    }
   });
 }

 // Filter jobs based on education criteria
 const originalCount = jobs.length;
 jobs = jobs.filter(job => meetsEducationCriteria(job.qualifications));
 console.log(`Filtered jobs: ${originalCount} -> ${jobs.length} jobs meet education criteria`);

 // Prepare data for Excel
const data = [
  ['Job Title', 'Company', 'City', 'State', 'Region', 'Job Description', 'Qualifications', 'Pay', 'Date', 'Remote Flag', 'Source Platform', 'Career Track', 'Entry Level Flag', 'Collected At', 'Source File']
];

// Helper function to format qualifications with bullets and newlines
function formatQualifications(qualStr) {
  if (!qualStr || qualStr === 'N/A') {
    return 'N/A';
  }

  // Split by semicolon first (common in legacy data)
  let parts = qualStr.split(';').map(p => p.trim()).filter(p => p);

  if (parts.length === 1) {
    // If no semicolons, check if there are multiple bullet markers
    const bulletCount = (qualStr.match(/[-•*]/g) || []).length;
    if (bulletCount > 1) {
      // Split by bullet markers and take parts after the first
      parts = qualStr.split(/[-•*]/).slice(1).map(p => p.trim()).filter(p => p);
    } else if (bulletCount === 1 && !qualStr.match(/^[-•*]/)) {
      // Single bullet not at start, treat as one item
      parts = [qualStr];
    } else {
      // Single bullet at start or no bullets
      parts = [qualStr.replace(/^[-•*]\s*/, '')]; // Remove leading bullet if present
    }
  }

  // For long parts, split by sentence/numbered list to create multiple bullets
  const processedParts = [];
  for (const part of parts) {
    if (part.length > 100) { // Split long parts
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

  // Ensure no leading bullets in parts and format with bullet
  parts = parts.map(part => part.replace(/^[-•*]\s*/, ''));
  return parts.map(part => `• ${part}`).join('\n');
}

// Helper function to check if job meets education criteria
function meetsEducationCriteria(qualifications) {
  if (!qualifications || qualifications === 'N/A') return false;

  const qualLower = qualifications.toLowerCase();

  // Exclude jobs that require only high school (without higher degrees mentioned)
  const requiresHighSchool = qualLower.includes('high school') || qualLower.includes('ged') || qualLower.includes('diploma');
  const hasHigherDegree = qualLower.includes('bachelor') || qualLower.includes('master') || qualLower.includes('phd') || qualLower.includes('doctorate') || qualLower.includes('mba') || qualLower.includes('mph') || qualLower.includes('mha');

  if (requiresHighSchool && !hasHigherDegree) {
    return false;
  }

  // Exclude jobs that require associate's degree (without higher degrees mentioned)
  const requiresAssociates = qualLower.includes('associate') || qualLower.includes('aa') || qualLower.includes('as');
  if (requiresAssociates && !hasHigherDegree) {
    return false;
  }

  // Include jobs that mention bachelor's or higher degrees (required or preferred)
  if (hasHigherDegree) {
    return true;
  }

  // Exclude jobs with no relevant education requirements
  return false;
}

// Helper function to format date as mm-dd-yyyy
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
     job.city || job.location || 'N/A',  // Handle both new city field and old location field for compatibility
     job.state || 'N/A',
     job.region || 'N/A',
     (job.jobDescription || 'N/A').substring(0, 10000), // Limit for Excel cell
     formattedQualifications.substring(0, 5000), // Apply substring after formatting
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

// Create workbook using xlsx-populate for better style support
(async () => {
  const workbook = await XlsxPopulate.fromBlankAsync();
  const sheet = workbook.sheet(0);
  sheet.name('Jobs');

  // Set data
  data.forEach((row, rowIndex) => {
    row.forEach((cellValue, colIndex) => {
      sheet.cell(rowIndex + 1, colIndex + 1).value(cellValue);
    });
  });

  // Set column widths
  sheet.column(1).width(40); // Job Title
  sheet.column(2).width(25); // Company
  sheet.column(3).width(20); // City
  sheet.column(4).width(8);  // State
  sheet.column(5).width(12); // Region
  sheet.column(6).width(50); // Job Description
  sheet.column(7).width(60); // Qualifications
  sheet.column(8).width(15); // Pay
  sheet.column(9).width(12); // Date
  sheet.column(10).width(10); // Remote Flag
  sheet.column(11).width(15); // Source Platform
  sheet.column(12).width(20); // Career Track
  sheet.column(13).width(12); // Entry Level Flag
  sheet.column(14).width(20); // Collected At
  sheet.column(15).width(50); // Source File

  // Set text wrapping and row heights
  for (let row = 1; row <= data.length; row++) {
    if (row > 1) {
      sheet.row(row).height(60); // Set height for data rows
    }
    for (let col = 1; col <= data[0].length; col++) {
      const cell = sheet.cell(row, col);
      cell.style('wrapText', true);
      cell.style('verticalAlignment', 'top');
    }
  }

  // Add hyperlinks with styling to Source File column (column 15, 1-based)
  for (let row = 2; row <= data.length; row++) { // Skip header
    const sourceFile = data[row - 1][14];
    if (sourceFile && sourceFile !== 'N/A' && sourceFile.startsWith('http')) {
      const cell = sheet.cell(row, 15);
      cell.hyperlink(sourceFile).style({
        fontColor: '0563C1', // Blue color
        underline: true
      });
    }
  }

  // Generate timestamp for filename
  const now = new Date();
  const timestamp = now.toISOString()
    .replace(/:/g, '-')        // Replace colons with hyphens for Windows compatibility
    .replace(/\..+/, '')       // Remove milliseconds
    .replace('T', '_');        // Replace T with underscore for readability

  const filename = `output/jobs_consolidated_${timestamp}.xlsx`;

  // Write to file
  await workbook.toFileAsync(filename);

  console.log(`Excel file created: ${filename} with ${jobs.length} job entries`);

  // Test the formatting by reading back with XLSX for verification
  const testWb = XLSX.readFile(filename);
  const testWs = testWb.Sheets[testWb.SheetNames[0]];
  const testData = XLSX.utils.sheet_to_json(testWs, { header: 1 });

console.log('\nTesting qualifications formatting for first 10 jobs:');
for (let i = 1; i <= Math.min(10, testData.length - 1); i++) {
  const qualIndex = 6; // Qualifications column index (0-based: 0=title,1=company,2=city,3=state,4=region,5=desc,6=qual,...)
  const qual = testData[i][qualIndex] || 'N/A';
  console.log(`Job ${i} (Row ${i+1}) qualifications:\n"${qual}"\n`);
}

  console.log('Testing hyperlinks in Source File column for first 3 jobs:');
  for (let i = 1; i <= Math.min(3, testData.length - 1); i++) {
    const sourceIndex = 14;
    const sourceFile = testData[i][sourceIndex] || 'N/A';
    const cellRef = XLSX.utils.encode_cell({ r: i, c: 14 });
    const hasLink = testWs[cellRef] && testWs[cellRef].l ? 'Yes' : 'No';
    console.log(`Job ${i} Source File: ${sourceFile} (Hyperlink: ${hasLink})`);
  }

  console.log('Testing Collected At date formatting for first 3 jobs:');
  for (let i = 1; i <= Math.min(3, testData.length - 1); i++) {
    const collectedIndex = 13; // Collected At column
    const collectedAt = testData[i][collectedIndex] || 'N/A';
    console.log(`Job ${i} Collected At: ${collectedAt}`);
  }
})();