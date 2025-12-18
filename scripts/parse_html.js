const fs = require('fs');
const cheerio = require('cheerio');

function extractFromHTML(htmlContent) {
  const $ = cheerio.load(htmlContent);
  const result = {};

  // Job Title from title tag
  const titleTag = $('title').text();
  result.jobTitle = titleTag.replace(' - Indeed.com', '').trim() || 'N/A';

  // Company from meta
  result.company = $('meta[property="og:description"]').attr('content') || $('meta[name="twitter:description"]').attr('content') || 'N/A';

  // Location from title or meta
  const locationMatch = titleTag.match(/ - ([^,]+, \w+)/);
  result.location = locationMatch ? locationMatch[1] : 'N/A';

  // Job Description - collect plain text divs without CSS classes
  let jobDescription = '';
  $('#viewJobSSRRoot div').each((i, el) => {
    const text = $(el).text().trim();
    const classAttr = $(el).attr('class') || '';
    // Skip if has CSS-like class, or text starts with '.', or too short, or contains CSS keywords
    if (text && text.length > 10 && !classAttr.startsWith('css-') && !text.startsWith('.') && !text.includes('{') && !text.includes('Find Jobs') && !text.includes('Skip to main content')) {
      jobDescription += text + '\n';
    }
  });
  result.jobDescription = jobDescription.trim() || 'N/A';

  // Qualifications - extract from jobDescription text
  let qualifications = [];
  const desc = result.jobDescription;
  const reqIndex = desc.toLowerCase().indexOf('required qualifications:');
  if (reqIndex !== -1) {
    const start = desc.indexOf('\n', reqIndex) + 1;
    const prefIndex = desc.toLowerCase().indexOf('preferred qualifications:');
    const end = prefIndex !== -1 ? prefIndex : desc.length;
    const reqSection = desc.substring(start, end).trim();
    const lines = reqSection.split('\n').map(l => l.trim()).filter(l => l.length > 5 && !l.includes('Qualifications:'));
    qualifications.push(...lines);
  }
  const prefIndex = desc.toLowerCase().indexOf('preferred qualifications:');
  if (prefIndex !== -1) {
    const start = desc.indexOf('\n', prefIndex) + 1;
    const end = desc.toLowerCase().indexOf('job expectations:', start) !== -1 ? desc.toLowerCase().indexOf('job expectations:', start) : desc.length;
    const prefSection = desc.substring(start, end).trim();
    const lines = prefSection.split('\n').map(l => l.trim()).filter(l => l.length > 5 && !l.includes('Qualifications:'));
    qualifications.push(...lines.map(l => 'Preferred: ' + l));
  }
  result.qualifications = qualifications.join('; ') || 'N/A';

  // Pay - search for $ or salary
  let pay = 'N/A';
  const bodyText = $.text();
  const payMatch = bodyText.match(/\$[\d,]+(?:\s*-\s*\$[\d,]+)?(?:\s*\/\s*(?:year|month|hour|week))/i) || bodyText.match(/salary:?\s*\$[\d,]+/i);
  if (payMatch) pay = payMatch[0];
  result.pay = pay;

  // Date - search for posted
  let date = 'N/A';
  const dateMatch = bodyText.match(/(posted|updated)\s+[^.\n]*/i);
  if (dateMatch) date = dateMatch[0];
  result.date = date;

  return result;
}

// Assume HTML files are named job1.html, job2.html, etc., or list them
const htmlFiles = fs.readdirSync('data').filter(file => file.endsWith('.html')).map(file => 'data/' + file);
const jobs = [];

htmlFiles.forEach(file => {
  try {
    const html = fs.readFileSync(file, 'utf-8');
    const data = extractFromHTML(html);
    data.sourceFile = file;
    jobs.push(data);
  } catch (err) {
    console.error(`Error parsing ${file}:`, err.message);
  }
});

fs.writeFileSync('data/jobs_data.json', JSON.stringify(jobs, null, 2));
console.log('Data extracted to data/jobs_data.json');