const fs = require('fs');
const path = require('path');

// Read the original jobs data
const jobsData = JSON.parse(fs.readFileSync('data/jobs_data.json', 'utf-8'));

// Clear the json directory
const jsonDir = 'data/json';
if (fs.existsSync(jsonDir)) {
    const files = fs.readdirSync(jsonDir);
    files.forEach(file => {
        if (file.endsWith('.json')) {
            fs.unlinkSync(path.join(jsonDir, file));
        }
    });
}

// Create individual JSON files
jobsData.forEach((job, index) => {
    const jobIndex = index + 1;
    const baseName = job.jobTitle.split(' - ')[0].replace(/[^\w\s]/g, '').replace(/\s+/g, '_');
    const fileName = baseName.substring(0, Math.min(baseName.length, 50));
    const outputPath = path.join(jsonDir, `${jobIndex}_${fileName}.json`);
    
    fs.writeFileSync(outputPath, JSON.stringify(job, null, 2), 'utf-8');
    console.log(`Created: ${outputPath}`);
});

console.log(`Successfully split ${jobsData.length} jobs into individual JSON files.`);