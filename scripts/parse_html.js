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

  // Job Description - collect plain text divs without CSS classes, deduplicate and format
  let descLines = [];
  $('#viewJobSSRRoot div').each((i, el) => {
    const text = $(el).text().trim();
    const classAttr = $(el).attr('class') || '';
    // Skip if has CSS-like class, or text starts with '.', or too short, or contains CSS keywords
    if (text && text.length > 20 && !classAttr.startsWith('css-') && !text.startsWith('.') && !text.includes('{') && !text.includes('Find Jobs') && !text.includes('Skip to main content')) {
      descLines.push(text);
    }
  });
  // Remove duplicates
  const uniqueLines = [...new Set(descLines)];
  // Format for readability: add blank line before headings
  let formattedLines = [];
  uniqueLines.forEach(line => {
    // Check if line looks like a heading (ends with :, or all caps, or starts with bullet)
    const isHeading = /:$/.test(line) || /^[A-Z\s]{5,}$/.test(line) || /^[-•*]\s/.test(line);
    if (isHeading && formattedLines.length > 0) {
      formattedLines.push(''); // Add blank line before heading
    }
    formattedLines.push(line);
  });
  result.jobDescription = formattedLines.join('\n').trim() || 'N/A';

  // Qualifications - extract from jobDescription text using multiple keywords
  let qualifications = [];
  const desc = result.jobDescription.toLowerCase();
  const keywords = ['required qualifications', 'qualifications', 'requirements', 'skills', 'experience', 'option i', 'option ii', 'preferred qualifications'];
  keywords.forEach(keyword => {
    const index = desc.indexOf(keyword + ':');
    if (index !== -1) {
      const start = desc.indexOf('\n', index) + 1;
      let end = desc.length;
      // Find next keyword
      const nextKeyword = keywords.find(k => desc.indexOf(k + ':', start) > start);
      if (nextKeyword) {
        end = desc.indexOf(nextKeyword + ':', start);
      }
      const section = result.jobDescription.substring(start, end).trim();
      const lines = section.split('\n').map(l => l.trim()).filter(l => l.length > 5 && !l.toLowerCase().includes(keyword));
      qualifications.push(...lines);
    }
  });
  // Also extract any lines with degree, experience, years
  if (qualifications.length === 0) {
    const lines = result.jobDescription.split('\n');
    lines.forEach(line => {
      const lower = line.toLowerCase();
      if (lower.includes('degree') || lower.includes('experience') || lower.includes('skills') || lower.includes('requirements') || /\d+\s+years/.test(lower)) {
        qualifications.push(line.trim());
      }
    });
  }
  result.qualifications = qualifications.join('; ') || 'N/A';

  // Pay - search for salary info
  let pay = 'N/A';
  const bodyText = $.text();
  const payPatterns = [
    /\$[\d,]+(?:\.\d{2})?(?:\s*-\s*\$[\d,]+(?:\.\d{2})?)?(?:\s*(?:per|\/|a|an)\s*(?:year|month|hour|week|annum))/i,
    /(?:salary|pay|compensation):?\s*\$[\d,]+(?:\.\d{2})?(?:\s*-\s*\$[\d,]+(?:\.\d{2})?)?(?:\s*(?:per|\/|a|an)\s*(?:year|month|hour|week|annum))/i,
    /\$[\d,]+(?:\.\d{2})?(?:\s*-\s*\$[\d,]+(?:\.\d{2})?)?\s*(?:an|per)\s*(?:hour|year)/i
  ];
  for (const pattern of payPatterns) {
    const match = bodyText.match(pattern);
    if (match) {
      pay = match[0].trim();
      break;
    }
  }
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