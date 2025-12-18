const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Read jobs data
const jobs = JSON.parse(fs.readFileSync('data/jobs_data.json', 'utf-8'));

jobs.forEach((job, index) => {
  console.log(`Generating DOCX for job ${index + 1}: ${job.jobTitle}`);

  // Sanitize title for filename
  const title = job.jobTitle.split(' - ')[0].replace(/[^a-zA-Z0-9 ]/g, '').replace(/\s+/g, '_');
  const outputFile = `output/${title}.docx`;

  // Copy template
  execSync(`cp -r templates temp_gen_${index}`);

  // Unzip
  execSync(`cd temp_gen_${index} && unzip "Job Template.docx"`);

  // Edit XML
  const xmlPath = `temp_gen_${index}/word/document.xml`;
  let xml = fs.readFileSync(xmlPath, 'utf-8');

  // Company
  xml = xml.replace(
    /<w:p w14:paraId="7A83733B"[^>]*><\/w:p>/,
    `<w:p w14:paraId="7A83733B" w14:textId="2337F118" w:rsidR="00D109F7" w:rsidRDefault="00D109F7"><w:r><w:t>${job.company || 'N/A'}</w:t></w:r></w:p>`
  );

  // Job Title
  const cleanTitle = job.jobTitle.split(' - ')[0];
  xml = xml.replace(
    /<w:p w14:paraId="1FE8A947"[^>]*><\/w:p>/,
    `<w:p w14:paraId="1FE8A947" w14:textId="57B70497" w:rsidR="00D109F7" w:rsidRDefault="00D109F7"><w:r><w:t>${cleanTitle}</w:t></w:r></w:p>`
  );

  // Job Description
  xml = xml.replace(
    /<w:p w14:paraId="3BB2D299"[^>]*><\/w:p>/,
    `<w:p w14:paraId="3BB2D299" w14:textId="17B08158" w:rsidR="004A01D2" w:rsidRDefault="004A01D2"><w:r><w:t>${(job.jobDescription || 'N/A').substring(0, 5000)}</w:t></w:r></w:p>`
  );

  // Qualifications
  xml = xml.replace(
    /<w:p w14:paraId="56460E33"[^>]*><\/w:p>/,
    `<w:p w14:paraId="56460E33" w14:textId="77777777" w:rsidR="00472889" w:rsidRDefault="00472889"><w:r><w:t>${job.qualifications || 'N/A'}</w:t></w:r></w:p>`
  );

  // Pay
  xml = xml.replace(
    /<w:p w14:paraId="589B9377"[^>]*><\/w:p>/,
    `<w:p w14:paraId="589B9377" w14:textId="52753E8B" w:rsidR="00D109F7" w:rsidRDefault="00D109F7" w:rsidP="00E36C4B"><w:r><w:t>${job.pay || 'N/A'}</w:t></w:r></w:p>`
  );

  // Date
  xml = xml.replace(
    /<w:p w14:paraId="215A79FE"[^>]*><\/w:p>/,
    `<w:p w14:paraId="215A79FE" w14:textId="3428F033" w:rsidR="00D109F7" w:rsidRDefault="00D109F7"><w:r><w:t>${job.date.startsWith('updated') ? 'N/A' : job.date}</w:t></w:r></w:p>`
  );

  fs.writeFileSync(xmlPath, xml);

  // Zip to DOCX
  execSync(`powershell -Command "Compress-Archive -Path 'temp_gen_${index}\\*' -DestinationPath '${outputFile}.zip'"`);
  execSync(`mv "${outputFile}.zip" "${outputFile}"`);

  // Clean up
  execSync(`rm -rf temp_gen_${index}`);

  console.log(`Created ${outputFile}`);
});

console.log('All DOCX files generated in output/');