const XLSX = require('xlsx');
const fs = require('fs');

// Read jobs data
const jobs = JSON.parse(fs.readFileSync('data/jobs_data.json', 'utf-8'));

// Prepare data for Excel
const data = [
  ['Job Title', 'Company', 'Location', 'Job Description', 'Qualifications', 'Pay', 'Date']
];

jobs.forEach(job => {
  const cleanTitle = job.jobTitle.split(' - ')[0];
  data.push([
    cleanTitle,
    job.company || 'N/A',
    job.location || 'N/A',
    (job.jobDescription || 'N/A').substring(0, 30000), // Limit for Excel cell
    job.qualifications || 'N/A',
    job.pay || 'N/A',
    job.date.startsWith('updated') ? 'N/A' : (job.date || 'N/A')
  ]);
});

// Create workbook
const wb = XLSX.utils.book_new();
const ws = XLSX.utils.aoa_to_sheet(data);
XLSX.utils.book_append_sheet(wb, ws, 'Jobs');

// Write to file
XLSX.writeFile(wb, 'output/jobs.xlsx');

console.log('Excel file created: output/jobs.xlsx');