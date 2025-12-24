const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

// Read all JSON files from data/json directory
const jsonDir = 'data/json';
const jsonFiles = fs.readdirSync(jsonDir).filter(file => file.endsWith('.json'));

const jobs = [];

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

// Prepare data for Excel
const data = [
  ['Job Title', 'Company', 'Location', 'Job Description', 'Qualifications', 'Pay', 'Date', 'State', 'Remote Flag', 'Source Platform', 'Career Track', 'Entry Level Flag', 'Collected At', 'Source File']
];

jobs.forEach(job => {
  const cleanTitle = job.jobTitle.split(' - ')[0];
  data.push([
    cleanTitle,
    job.company || 'N/A',
    job.location || 'N/A',
    (job.jobDescription || 'N/A').substring(0, 10000), // Limit for Excel cell
    (job.qualifications || 'N/A').substring(0, 5000),
    job.pay || 'N/A',
    job.date && job.date.startsWith('updated') ? 'N/A' : (job.date || 'N/A'),
    job.state || 'N/A',
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