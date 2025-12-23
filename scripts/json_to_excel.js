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
  ['Job Title', 'Company', 'Location', 'Job Description', 'Qualifications', 'Pay', 'Date', 'Entry Level Flag', 'Career Track']
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
    job.entryLevelFlag !== undefined ? job.entryLevelFlag.toString() : 'N/A',
    job.careerTrack || 'N/A'
  ]);
});

// Create workbook
const wb = XLSX.utils.book_new();
const ws = XLSX.utils.aoa_to_sheet(data);
XLSX.utils.book_append_sheet(wb, ws, 'Jobs');

// Write to file
XLSX.writeFile(wb, 'output/jobs_consolidated.xlsx');

console.log(`Excel file created: output/jobs_consolidated.xlsx with ${jobs.length} job entries`);