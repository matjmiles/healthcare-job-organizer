const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

// Read job data from multiple sources
const jobs = [];

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

// Prepare data for Excel
const data = [
  ['Job Title', 'Company', 'City', 'State', 'Region', 'Job Description', 'Qualifications', 'Pay', 'Date', 'Remote Flag', 'Source Platform', 'Career Track', 'Entry Level Flag', 'Collected At', 'Source File']
];

jobs.forEach(job => {
  const cleanTitle = job.jobTitle.split(' - ')[0];
  data.push([
    cleanTitle,
    job.company || 'N/A',
    job.city || job.location || 'N/A',  // Handle both new city field and old location field for compatibility
    job.state || 'N/A',
    job.region || 'N/A',
    (job.jobDescription || 'N/A').substring(0, 10000), // Limit for Excel cell
    (job.qualifications || 'N/A').substring(0, 5000),
    job.pay || 'N/A',
    job.date && job.date.startsWith('updated') ? 'N/A' : (job.date || 'N/A'),
    job.remoteFlag !== undefined ? job.remoteFlag.toString() : 'N/A',
    job.sourcePlatform || 'N/A',
    job.careerTrack || 'N/A',
    job.entryLevelFlag !== undefined ? job.entryLevelFlag.toString() : 'N/A',
    job.collectedAt || 'N/A',
    job.sourceFile || 'N/A'
  ]);
});

// Create workbook
const wb = XLSX.utils.book_new();
const ws = XLSX.utils.aoa_to_sheet(data);

// Set column widths for better readability
const colWidths = [
  { wch: 40 }, // Job Title
  { wch: 25 }, // Company  
  { wch: 20 }, // City
  { wch: 8 },  // State
  { wch: 12 }, // Region
  { wch: 50 }, // Job Description
  { wch: 60 }, // Qualifications - wider for multi-line content
  { wch: 15 }, // Pay
  { wch: 12 }, // Date
  { wch: 10 }, // Remote Flag
  { wch: 15 }, // Source Platform
  { wch: 20 }, // Career Track
  { wch: 12 }, // Entry Level Flag
  { wch: 20 }, // Collected At
  { wch: 50 }  // Source File
];
ws['!cols'] = colWidths;

// Enable text wrapping for all cells and set row heights
const range = XLSX.utils.decode_range(ws['!ref']);
for (let R = range.s.r; R <= range.e.r; ++R) {
  // Set row height for data rows (not header)
  if (R > 0) {
    if (!ws['!rows']) ws['!rows'] = [];
    ws['!rows'][R] = { hpt: 60 }; // Set height to accommodate multi-line content
  }
  
  for (let C = range.s.c; C <= range.e.c; ++C) {
    const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
    if (!ws[cellAddress]) continue;
    
    // Set cell style for text wrapping
    ws[cellAddress].s = {
      alignment: {
        wrapText: true,
        vertical: 'top'
      }
    };
    
    // Special formatting for qualifications column (index 6)
    if (C === 6 && ws[cellAddress].v) {
      // Ensure proper line breaks in qualifications
      ws[cellAddress].v = ws[cellAddress].v.toString().replace(/\r\n/g, '\n');
    }
  }
}

XLSX.utils.book_append_sheet(wb, ws, 'Jobs');

// Generate timestamp for filename
const now = new Date();
const timestamp = now.toISOString()
  .replace(/:/g, '-')        // Replace colons with hyphens for Windows compatibility
  .replace(/\..+/, '')       // Remove milliseconds
  .replace('T', '_');        // Replace T with underscore for readability

const filename = `output/jobs_consolidated_${timestamp}.xlsx`;

// Write to file
XLSX.writeFile(wb, filename);

console.log(`Excel file created: ${filename} with ${jobs.length} job entries`);