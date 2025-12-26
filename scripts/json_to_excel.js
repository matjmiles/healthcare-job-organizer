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

// Helper function to format qualifications with bullets and newlines
function formatQualifications(qualStr) {
  if (!qualStr || qualStr === 'N/A') {
    return 'N/A';
  }

  // Split by semicolon first (common in legacy data)
  let parts = qualStr.split(';').map(p => p.trim()).filter(p => p);

  if (parts.length === 1) {
    // If no semicolons, check if there are multiple bullets
    const bulletCount = (qualStr.match(/•/g) || []).length;
    if (bulletCount > 1) {
      // Split by bullet and take parts after the first bullet
      parts = qualStr.split('•').slice(1).map(p => p.trim()).filter(p => p);
    } else if (bulletCount === 1 && !qualStr.startsWith('•')) {
      // Single bullet not at start, treat as one item
      parts = [qualStr];
    } else {
      // Single bullet at start or no bullets
      parts = [qualStr.replace(/^•\s*/, '')]; // Remove leading bullet if present
    }
  }

  // Format each part with bullet and join with newlines
  return parts.map(part => `• ${part}`).join('\n');
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

// Test the formatting by reading back first few qualifications
const testWb = XLSX.readFile(filename);
const testWs = testWb.Sheets[testWb.SheetNames[0]];
const testData = XLSX.utils.sheet_to_json(testWs, { header: 1 });

console.log('\nTesting qualifications formatting for first 3 jobs:');
for (let i = 1; i <= Math.min(3, testData.length - 1); i++) {
  const qualIndex = 6; // Qualifications column index (0-based: 0=title,1=company,2=city,3=state,4=region,5=desc,6=qual,...)
  const qual = testData[i][qualIndex] || 'N/A';
  console.log(`Job ${i} qualifications:\n"${qual}"\n`);
}