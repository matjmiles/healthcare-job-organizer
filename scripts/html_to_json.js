const fs = require('fs');
const cheerio = require('cheerio');
const { meetsBachelorsRequirement, analyzeEducationRequirements } = require('./education_filter_js');

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

  // Pay - search for salary info and normalize to hourly
  let pay = 'N/A';
  let payHourly = null;
  let payRaw = null;
  
  const bodyText = $.text();
  const payPatterns = [
    // hourly patterns
    { pattern: /\$\s?(\d+(?:\.\d+)?)\s?[-–]\s?\$\s?(\d+(?:\.\d+)?)\s?(?:per\s?hour|\/hr|hr)\b/gi, type: 'hourly_range' },
    { pattern: /\$\s?(\d+(?:\.\d+)?)\s?(?:per\s?hour|\/hr|hr)\b/gi, type: 'hourly' },
    // annual patterns with decimal support
    { pattern: /\$\s?(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s?[-–]\s?\$\s?(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s?(?:per\s?year|\/yr|annually|a\s?year)\b/gi, type: 'annual_range' },
    { pattern: /\$\s?(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s?(?:per\s?year|\/yr|annually|a\s?year)\b/gi, type: 'annual' },
    // fallback patterns
    { pattern: /\$[\d,]+(?:\.\d{2})?(?:\s*-\s*\$[\d,]+(?:\.\d{2})?)?(?:\s*(?:per|\/|a|an)\s*(?:year|month|hour|week|annum))/gi, type: 'fallback' },
    { pattern: /(?:salary|pay|compensation):?\s*\$[\d,]+(?:\.\d{2})?(?:\s*-\s*\$[\d,]+(?:\.\d{2})?)?(?:\s*(?:per|\/|a|an)\s*(?:year|month|hour|week|annum))/gi, type: 'fallback' }
  ];

  for (const patternObj of payPatterns) {
    const matches = [...bodyText.matchAll(patternObj.pattern)];
    if (matches.length > 0) {
      const match = matches[0];
      pay = match[0].trim();
      
      // Normalize to hourly based on pattern type
      if (patternObj.type === 'hourly_range' && match[1] && match[2]) {
        const low = parseFloat(match[1]);
        const high = parseFloat(match[2]);
        payHourly = Math.round((low + high) / 2 * 100) / 100;
        payRaw = { type: 'hourly_range', min: low, max: high };
      } else if (patternObj.type === 'hourly' && match[1]) {
        payHourly = Math.round(parseFloat(match[1]) * 100) / 100;
        payRaw = { type: 'hourly', value: parseFloat(match[1]) };
      } else if (patternObj.type === 'annual_range' && match[1] && match[2]) {
        const low = parseFloat(match[1].replace(/,/g, ''));
        const high = parseFloat(match[2].replace(/,/g, ''));
        const midAnnual = (low + high) / 2;
        payHourly = Math.round(midAnnual / 2080 * 100) / 100; // 2080 hours = 40hrs/week * 52 weeks
        payRaw = { type: 'annual_range', min: low, max: high, annual_mid: midAnnual };
      } else if (patternObj.type === 'annual' && match[1]) {
        const annual = parseFloat(match[1].replace(/,/g, ''));
        payHourly = Math.round(annual / 2080 * 100) / 100;
        payRaw = { type: 'annual', value: annual };
      }
      break;
    }
  }
  
  // Store normalized hourly pay as primary pay field
  result.pay = payHourly ? `$${payHourly}/hr` : pay;
  result.payHourly = payHourly;
  result.payRaw = payRaw;

  // Date - search for closing/deadline date, posting date, or any date
  let date = 'N/A';
  // Check JSON-LD for datePosted
  const jsonLd = $('script[type="application/ld+json"]').text();
  if (jsonLd) {
    try {
      const ldData = JSON.parse(jsonLd);
      if (ldData.datePosted) {
        date = 'Posted: ' + ldData.datePosted;
      }
    } catch (e) {}
  }
  // If no posting date, look for closing dates
  if (date === 'N/A') {
    const datePatterns = [
      /(?:deadline|closes?|filing period|application period|submission deadline|apply by|due|until|by)\s+[^.!?\n]*(?:\d{1,2}\/\d{1,2}\/\d{2,4}|\w+ \d{1,2}, \d{4}|\d{4}-\d{2}-\d{2})[^.!?\n]*/i,
      /(?:applications?\s+(?:will be|are)\s+accepted|open|posted)\s+(?:until|by|on)\s+[^.!?\n]*(?:\d{1,2}\/\d{1,2}\/\d{2,4}|\w+ \d{1,2}, \d{4})[^.!?\n]*/i,
      /(?:job\s+posted|updated|posted on)\s+[^.!?\n]*(?:\d{1,2}\/\d{1,2}\/\d{2,4}|\w+ \d{1,2}, \d{4})[^.!?\n]*/i,
      /[^.!?\n]*(?:\d{1,2}\/\d{1,2}\/\d{2,4}|\w+ \d{1,2}, \d{4}|\d{4}-\d{2}-\d{2})[^.!?\n]*(?:deadline|closes?|filing|application|submission|apply|due)[^.!?\n]*/i,
      /until\s+(?:the\s+)?positions?\s+(?:are\s+)?filled/i,
      /open\s+until\s+[^.!?\n]*/i,
      /continuous\s+(?:basis|recruitment)/i
    ];
    for (const pattern of datePatterns) {
      const match = bodyText.match(pattern);
      if (match) {
        date = match[0].trim();
        break;
      }
    }
  }
  // Fallback to any date with context
  if (date === 'N/A') {
    const dateRegex = /\b(?:\d{1,2}\/\d{1,2}\/\d{2,4}|\w+ \d{1,2}, \d{4}|\d{4}-\d{2}-\d{2})\b/g;
    const match = bodyText.match(dateRegex);
    if (match) {
      // Take the first date and some surrounding text
      const index = bodyText.indexOf(match[0]);
      const start = Math.max(0, index - 50);
      const end = Math.min(bodyText.length, index + match[0].length + 50);
      date = bodyText.substring(start, end).trim();
    }
  }
  // Format date if it's a posted ISO date
  if (date.startsWith('Posted: ')) {
    const iso = date.replace('Posted: ', '');
    try {
      const d = new Date(iso);
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const year = d.getFullYear();
      date = `${month}-${day}-${year}`;
    } catch (e) {
      // Keep original if parsing fails
    }
  }
  result.date = date;

  return result;
}

// Read HTML files from data/html directory and output individual JSON files
const htmlFiles = fs.readdirSync('data/html').filter(file => file.endsWith('.html')).map(file => 'data/html/' + file);

// Clean up old JSON files first
const existingJsonFiles = fs.readdirSync('data/json').filter(file => file.endsWith('.json') && file.match(/^\d+_/));
existingJsonFiles.forEach(file => {
  fs.unlinkSync(`data/json/${file}`);
});
console.log(`Cleaned up ${existingJsonFiles.length} existing JSON files`);

let jobIndex = 1;
let processedCount = 0;
let excludedCount = 0;

htmlFiles.forEach(file => {
  try {
    const html = fs.readFileSync(file, 'utf-8');
    const data = extractFromHTML(html);
    data.sourceFile = file;

    // Apply education filtering - only process jobs that require bachelor's degrees
    const passesEducationFilter = meetsBachelorsRequirement(data.jobDescription, data.qualifications);
    const analysis = analyzeEducationRequirements(data.jobDescription, data.qualifications);
    
    if (!passesEducationFilter) {
      excludedCount++;
      console.log(`EXCLUDED ${file}: ${analysis.reasoning} (Score: ${analysis.score})`);
      return; // Skip this job
    }

    // Create individual JSON file for each job that passes filtering
    const baseName = file.replace('data/html/', '').replace('.html', '');
    const cleanName = baseName.replace(/[^\w\s]/g, '').replace(/\s+/g, '_').substring(0, 50);
    const outputFileName = `data/json/${jobIndex}_${cleanName}.json`;

    fs.writeFileSync(outputFileName, JSON.stringify(data, null, 2));
    console.log(`INCLUDED ${outputFileName}: ${analysis.reasoning} (Score: ${analysis.score})`);

    jobIndex++;
    processedCount++;
  } catch (err) {
    console.error(`Error parsing ${file}:`, err.message);
  }
});

console.log(`\n=== EDUCATION FILTERING RESULTS ===`);
console.log(`Total HTML files processed: ${htmlFiles.length}`);
console.log(`Jobs meeting bachelor's requirement: ${processedCount}`);
console.log(`Jobs excluded (no bachelor's required): ${excludedCount}`);
console.log(`Filtering effectiveness: ${((excludedCount / htmlFiles.length) * 100).toFixed(1)}% filtered out`);