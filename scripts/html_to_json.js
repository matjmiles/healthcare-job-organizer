const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

// Constants for field inference (matching Python pipeline exactly)
const US_REGIONS = {
  "Northeast": new Set(["ME", "NH", "VT", "MA", "RI", "CT", "NY", "NJ", "PA"]),
  "Midwest": new Set(["OH", "IN", "IL", "MI", "WI", "MN", "IA", "MO", "ND", "SD", "NE", "KS"]),
  "South": new Set(["DE", "MD", "DC", "VA", "WV", "NC", "SC", "GA", "FL", "KY", "TN", "AL", "MS", "AR", "LA", "OK", "TX"]),
  "West": new Set(["MT", "ID", "WY", "CO", "NM", "AZ", "UT", "NV", "WA", "OR", "CA", "AK", "HI"])
};

// All US states and territories for target filtering
const TARGET_STATES = new Set();
for (const regionStates of Object.values(US_REGIONS)) {
  for (const state of regionStates) {
    TARGET_STATES.add(state);
  }
}

// State name to abbreviation mapping for additional inference
const STATE_NAMES = {
  'alabama': 'AL', 'alaska': 'AK', 'arizona': 'AZ', 'arkansas': 'AR', 'california': 'CA',
  'colorado': 'CO', 'connecticut': 'CT', 'delaware': 'DE', 'florida': 'FL', 'georgia': 'GA',
  'hawaii': 'HI', 'idaho': 'ID', 'illinois': 'IL', 'indiana': 'IN', 'iowa': 'IA',
  'kansas': 'KS', 'kentucky': 'KY', 'louisiana': 'LA', 'maine': 'ME', 'maryland': 'MD',
  'massachusetts': 'MA', 'michigan': 'MI', 'minnesota': 'MN', 'mississippi': 'MS', 'missouri': 'MO',
  'montana': 'MT', 'nebraska': 'NE', 'nevada': 'NV', 'new hampshire': 'NH', 'new jersey': 'NJ',
  'new mexico': 'NM', 'new york': 'NY', 'north carolina': 'NC', 'north dakota': 'ND', 'ohio': 'OH',
  'oklahoma': 'OK', 'oregon': 'OR', 'pennsylvania': 'PA', 'rhode island': 'RI', 'south carolina': 'SC',
  'south dakota': 'SD', 'tennessee': 'TN', 'texas': 'TX', 'utah': 'UT', 'vermont': 'VT',
  'virginia': 'VA', 'washington': 'WA', 'west virginia': 'WV', 'wisconsin': 'WI', 'wyoming': 'WY',
  'district of columbia': 'DC'
};

const ENTRY_LEVEL_TITLE_HINTS = [
  "coordinator", "representative", "specialist", "assistant", "associate",
  "clerk", "scheduler", "scheduling", "patient access", "registration",
  "referral", "prior auth", "authorization", "front desk", "unit clerk",
  "medical receptionist", "office", "admin", "administrator in training", "ait"
];

const EXCLUDE_TITLE_HINTS = [
  "director", "senior director", "vp", "vice president", "chief", "cfo", "coo",
  "manager, senior", "sr manager", "principal", "physician", "rn", "np", "pa-c"
];

const CAREER_TRACK_RULES = [
  ["Long-Term Care Administration", [/\bait\b/i, /administrator in training/i, /assisted living/i, /skilled nursing/i, /snf/i, /memory care/i, /long[-\s]?term care/i]],
  ["Hospital Administration", [/patient access/i, /registration/i, /scheduler/i, /scheduling/i, /clinic/i, /front desk/i, /revenue cycle/i, /billing/i, /referral/i, /prior auth/i, /authorization/i, /him/i, /health information/i]]
];

// Helper function to get region for a state
function getStateRegion(stateCode) {
  if (!stateCode) return null;
  stateCode = stateCode.toUpperCase().trim();
  for (const [region, states] of Object.entries(US_REGIONS)) {
    if (states.has(stateCode)) {
      return region;
    }
  }
  return null;
}

// Enhanced state inference function
function inferState(location, company, jobTitle) {
  if (!location && !company && !jobTitle) return null;
  
  const searchText = [location, company, jobTitle].filter(Boolean).join(' ');
  
  // First try to find state abbreviation (case insensitive)
  const match = searchText.match(/\b([A-Za-z]{2})\b/);
  if (match && TARGET_STATES.has(match[1].toUpperCase())) {
    return match[1].toUpperCase();
  }
  
  // Try to find state name
  const searchTextLower = searchText.toLowerCase();
  for (const [stateName, stateCode] of Object.entries(STATE_NAMES)) {
    if (searchTextLower.includes(stateName)) {
      return stateCode;
    }
  }
  
  // Extract from location patterns like "Kansas (Hybrid work available)"
  if (location) {
    const locationPatterns = [
      /location[:\s]+([a-z\s]+?)(?:\s*\(|$)/i,
      /^([a-z\s]+?)(?:\s*\(|,|$)/i
    ];
    
    for (const pattern of locationPatterns) {
      const locationMatch = location.match(pattern);
      if (locationMatch) {
        const locationName = locationMatch[1].trim().toLowerCase();
        if (STATE_NAMES[locationName]) {
          return STATE_NAMES[locationName];
        }
      }
    }
  }
  
  return null;
}

function inferRemoteFlag(location) {
  if (!location) return false;
  return /\bremote\b|\bwork from home\b|\btelecommute\b/i.test(location);
}

function inferCareerTrack(text) {
  const t = (text || "").toLowerCase();
  for (const [track, patterns] of CAREER_TRACK_RULES) {
    for (const pattern of patterns) {
      if (pattern.test(t)) {
        return track;
      }
    }
  }
  return "Hospital Administration";
}

function titleIsExcluded(title) {
  const t = (title || "").toLowerCase();
  return EXCLUDE_TITLE_HINTS.some(hint => t.includes(hint));
}

function inferEntryLevelFlag(title, description) {
  const t = (title || "").toLowerCase();
  if (titleIsExcluded(title)) return false;
  
  if (ENTRY_LEVEL_TITLE_HINTS.some(hint => t.includes(hint))) {
    return true;
  }

  // fallback: look for "0-1 years", "no experience required", etc.
  const d = (description || "").toLowerCase();
  if (/\bno experience required\b|\b0\s?[-–]\s?1\s?year\b|\bentry[-\s]?level\b/.test(d)) {
    return true;
  }
  
  // if explicitly requires 5+ years, treat as not entry
  if (/\b5\+\s?years\b|\bfive\+\s?years\b|\b7\+\s?years\b/.test(d)) {
    return false;
  }
  
  return false;
}

function extractFromHTML(htmlContent) {
  const $ = cheerio.load(htmlContent);
  const result = {};

    // --- Table-based Extraction (Word/DOCX or similar) ---
    const tables = $('table');
    let foundTableJob = false;
    if (tables.length > 0) {
      tables.each((ti, table) => {
        const headers = [];
        $(table).find('tr').first().find('td,th').each((i, cell) => {
          headers.push($(cell).text().trim().toLowerCase());
        });
        function findHeaderIdx(possibles) {
          for (let i = 0; i < headers.length; i++) {
            for (const p of possibles) {
              if (headers[i].replace(/[^a-z]/g, '').startsWith(p.replace(/[^a-z]/g, ''))) {
                return i;
              }
            }
          }
          return -1;
        }
        const expected = [
          ['company'],
          ['job title', 'title'],
          ['job description', 'description', 'position summary'],
          ['qualifications', 'requirements'],
          ['pay', 'compensation', 'salary', 'wage'],
          ['date', 'date posted', 'posting date']
        ];
        const matchCount = expected.filter(possibles => findHeaderIdx(possibles) !== -1).length;
        if (matchCount >= 4) {
          const row = $(table).find('tr').eq(1);
          if (row.length > 0) {
            const cells = row.find('td,th');
            let colMap = {
              company: findHeaderIdx(['company']),
              jobTitle: findHeaderIdx(['job title', 'title']),
              jobDescription: findHeaderIdx(['job description', 'description', 'position summary']),
              qualifications: findHeaderIdx(['qualifications', 'requirements']),
              pay: findHeaderIdx(['pay', 'compensation', 'salary', 'wage']),
              date: findHeaderIdx(['date', 'date posted', 'posting date'])
            };
            result.company = cells.eq(colMap.company).text().trim() || 'N/A';
            result.jobTitle = cells.eq(colMap.jobTitle).text().trim() || 'N/A';
            result.jobDescription = cells.eq(colMap.jobDescription).text().trim() || 'N/A';
            result.qualifications = cells.eq(colMap.qualifications).text().trim() || 'N/A';
            result.pay = cells.eq(colMap.pay).text().trim() || 'N/A';
            result.date = cells.eq(colMap.date).text().trim() || null;
            result.location = 'N/A';
            const extractedState = inferState(result.location, result.company, result.jobTitle);
            result.state = extractedState;
            result.region = getStateRegion(extractedState);
            result.city = 'N/A';
            result.remoteFlag = inferRemoteFlag(result.location);
            result.sourcePlatform = 'word-table';
            result.careerTrack = inferCareerTrack(result.jobDescription + ' ' + result.qualifications);
            result.entryLevelFlag = inferEntryLevelFlag(result.jobTitle, result.jobDescription);
            result.collectedAt = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
            result._extractionStrategy = 'table-based';
            foundTableJob = true;
            return false;
          }
        }
      });
      if (foundTableJob) {
        return result;
      }
    }

    // --- Web/Indeed-style Extraction ---
    // Look for meta tags and main content blocks
    const metaTitle = $('meta[id="indeed-share-message"]').attr('content') || $('meta[property="og:title"]').attr('content') || $('title').text();
    const metaCompany = $('meta[property="og:description"]').attr('content') || $('meta[name="twitter:description"]').attr('content');
    const metaLocation = metaTitle && metaTitle.match(/- ([^-]+)$/) ? metaTitle.match(/- ([^-]+)$/)[1].trim() : '';
    if (metaTitle && metaCompany) {
      result.jobTitle = metaTitle.split('-')[0].trim();
      result.company = metaCompany.trim();
      result.location = metaLocation || 'N/A';
      // Try to extract job description from main content
      let desc = '';
      // Try largest <div> or <section> with lots of text
      let maxText = '';
      $('div,section,p').each((i, el) => {
        const t = $(el).text().trim();
        if (t.length > maxText.length) maxText = t;
      });
      desc = maxText;
      result.jobDescription = desc || 'N/A';
      // Try to find pay and date in meta or body
      let pay = '';
      let date = '';
      const payMatch = desc.match(/\$[\d,]+( to \$[\d,]+)?( per (year|hour|annum|month|week))?/i);
      if (payMatch) pay = payMatch[0];
      const dateMatch = desc.match(/\b(\d{1,2}\/\d{1,2}\/\d{2,4}|\w+ \d{1,2}, \d{4}|\d{4}-\d{2}-\d{2})\b/);
      if (dateMatch) date = dateMatch[0];
      result.pay = pay || 'N/A';
      result.date = date || null;
      result.qualifications = 'N/A';
      const extractedState = inferState(result.location, result.company, result.jobTitle);
      result.state = extractedState;
      result.region = getStateRegion(extractedState);
      result.city = 'N/A';
      result.remoteFlag = inferRemoteFlag(result.location);
      result.sourcePlatform = 'web-indeed';
      result.careerTrack = inferCareerTrack(result.jobDescription);
      result.entryLevelFlag = inferEntryLevelFlag(result.jobTitle, result.jobDescription);
      result.collectedAt = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
      result._extractionStrategy = 'web-indeed';
      return result;
    }

    // --- Section-based Extraction ---
    // Look for fields by label in <strong>, <b>, or as section headers
    let sectionJobTitle = $('h1').first().text().trim() || $('title').text().trim();
    let sectionCompany = '';
    let sectionLocation = '';
    let sectionPay = '';
    let sectionDate = '';
    let sectionDescription = '';
    let sectionQualifications = '';
    // Company and location from labeled <p> or <div>
    $('p,strong,b,div').each((i, el) => {
      const t = $(el).text().trim().toLowerCase();
      if (!sectionCompany && t.startsWith('company:')) sectionCompany = $(el).text().replace(/company:/i, '').trim();
      if (!sectionLocation && t.startsWith('location:')) sectionLocation = $(el).text().replace(/location:/i, '').trim();
      if (!sectionPay && t.match(/pay range:|pay:|salary:|compensation:/)) sectionPay = $(el).text().replace(/pay range:|pay:|salary:|compensation:/i, '').trim();
      if (!sectionDate && t.match(/date:|date posted:|posting date:/)) sectionDate = $(el).text().replace(/date:|date posted:|posting date:/i, '').trim();
    });
    // Description from Job Summary or first large <p>
    sectionDescription = '';
    $('h2,h3').each((i, el) => {
      const txt = $(el).text().toLowerCase();
      if (txt.includes('job summary') || txt.includes('position summary') || txt.includes('about the role')) {
        let next = $(el).next('p');
        if (next.length) sectionDescription = next.text().trim();
      }
    });
    if (!sectionDescription) {
      let maxP = '';
      $('p').each((i, el) => {
        const t = $(el).text().trim();
        if (t.length > maxP.length) maxP = t;
      });
      sectionDescription = maxP;
    }
    // Qualifications from Qualifications section
    $('h2,h3').each((i, el) => {
      const txt = $(el).text().toLowerCase();
      if (txt.includes('qualifications')) {
        let next = $(el).next('ul');
        if (next.length) {
          sectionQualifications = next.text().trim();
        }
      }
    });
    // If we have at least job title and company, treat as section-based
    if (sectionJobTitle && (sectionCompany || sectionLocation)) {
      result.jobTitle = sectionJobTitle;
      result.company = sectionCompany || 'N/A';
      result.location = sectionLocation || 'N/A';
      result.pay = sectionPay || 'N/A';
      result.date = sectionDate || null;
      result.jobDescription = sectionDescription || 'N/A';
      result.qualifications = sectionQualifications || 'N/A';
      const extractedState = inferState(result.location, result.company, result.jobTitle);
      result.state = extractedState;
      result.region = getStateRegion(extractedState);
      result.city = 'N/A';
      result.remoteFlag = inferRemoteFlag(result.location);
      result.sourcePlatform = 'section-based';
      result.careerTrack = inferCareerTrack(result.jobDescription + ' ' + result.qualifications);
      result.entryLevelFlag = inferEntryLevelFlag(result.jobTitle, result.jobDescription);
      result.collectedAt = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
      result._extractionStrategy = 'section-based';
      return result;
    }

    // --- Outlier/Non-job page detection ---
    // If no job-relevant fields, skip
    result._extractionStrategy = 'none';
    result.jobTitle = 'N/A';
    result.company = 'N/A';
    result.location = 'N/A';
    result.pay = 'N/A';
    result.date = null;
    result.jobDescription = 'N/A';
    result.qualifications = 'N/A';
    result.state = null;
    result.region = null;
    result.city = 'N/A';
    result.remoteFlag = false;
    result.sourcePlatform = 'unknown';
    result.careerTrack = 'Hospital Administration';
    result.entryLevelFlag = false;
    result.collectedAt = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
    return result;
  // --- DOCX/Structured HTML Extraction ---
  // Detect if this is a DOCX-converted/structured HTML (look for .section-title or .container)
  const isDocxHtml = $('.section-title').length > 0 || $('.container').length > 0;
  if (isDocxHtml) {
    // Job Title
    let jobTitle = $('h1').first().text().trim();
    if (!jobTitle) jobTitle = $('title').text().trim();
    result.jobTitle = jobTitle || 'N/A';

    // Company
    let company = '';
    // Try to find company in .job-meta or About section
    const metaText = $('.job-meta').text();
    const companyMatch = metaText.match(/Company:\s*([^\n<]+)/i);
    if (companyMatch) company = companyMatch[1].trim();
    if (!company) {
      // Try to find in About section
      const about = $('.section-title').filter((i, el) => $(el).text().toLowerCase().includes('about the company')).next('p').text();
      if (about) {
        // Heuristic: first word(s) before 'is' or 'are'
        const m = about.match(/^(\w[\w\s&,-]+?)\s+(is|are)\b/i);
        if (m) company = m[1].trim();
      }
    }
    result.company = company || 'N/A';

    // Location
    let location = '';
    const locMatch = metaText.match(/Location:\s*([^\n<]+)/i);
    if (locMatch) location = locMatch[1].trim();
    // Try additional location in Additional Information section
    if (!location) {
      const addInfo = $('.section-title').filter((i, el) => $(el).text().toLowerCase().includes('additional information')).next('ul').text();
      const loc2 = addInfo.match(/Location:\s*([^\n<]+)/i);
      if (loc2) location = loc2[1].trim();
    }
    result.location = location || 'N/A';

    // State, region, city
    const extractedState = inferState(location, result.company, result.jobTitle);
    result.state = extractedState;
    result.region = getStateRegion(extractedState);
    let city = 'N/A';
    if (location && location !== 'N/A') {
      const cityStateMatch = location.match(/^([^,]+),?\s*([A-Z]{2})?/);
      if (cityStateMatch) {
        city = cityStateMatch[1].trim();
        city = city.replace(/^[\s]*(location[:\s]*|based in[:\s]*)/i, '').trim();
      } else {
        const firstPart = location.split(/[,(]/)[0].trim();
        if (firstPart.length > 0 && firstPart.toLowerCase() !== 'remote') {
          city = firstPart.replace(/^[\s]*(location[:\s]*|based in[:\s]*)/i, '').trim();
        }
      }
    }
    result.city = city;

    // Job Description: concatenate About the Opportunity, Essential Functions, etc.
    let jobDesc = '';
    const descSections = ['about the opportunity', 'essential functions', 'responsibilities', 'job summary', 'position summary', 'about the role', 'job description'];
    descSections.forEach(section => {
      $('.section-title').each((i, el) => {
        if ($(el).text().toLowerCase().includes(section)) {
          // Get next <p> or <ul>
          let next = $(el).next();
          if (next.is('ul')) {
            jobDesc += section.charAt(0).toUpperCase() + section.slice(1) + ':\n';
            next.find('li').each((j, li) => {
              jobDesc += '- ' + $(li).text().trim() + '\n';
            });
          } else if (next.is('p')) {
            jobDesc += section.charAt(0).toUpperCase() + section.slice(1) + ':\n' + next.text().trim() + '\n';
          }
        }
      });
    });
    result.jobDescription = jobDesc.trim() || 'N/A';

    // Qualifications: from Qualifications and Desired Qualifications sections
    let quals = [];
    $('.section-title').each((i, el) => {
      const txt = $(el).text().toLowerCase();
      if (txt.includes('qualifications')) {
        let next = $(el).next();
        if (next.is('ul')) {
          next.find('li').each((j, li) => {
            quals.push($(li).text().trim());
          });
        } else if (next.is('p')) {
          quals.push(next.text().trim());
        }
      }
    });
    result.qualifications = quals.join('; ') || 'N/A';

    // Pay: look for Wage Rate or similar
    let pay = '';
    const payMatch = metaText.match(/Wage Rate:\s*([^\n<]+)/i);
    if (payMatch) pay = payMatch[1].trim();
    result.pay = pay || 'N/A';

    // Date: try to find in comment or meta
    let date = '';
    const commentMatch = htmlContent.match(/Saved:\s*(\d{4}-\d{2}-\d{2})/);
    if (commentMatch) date = commentMatch[1];
    result.date = date || null;

    // Add missing fields to match schema
    result.remoteFlag = inferRemoteFlag(result.location);
    result.sourcePlatform = 'html';
    result.careerTrack = inferCareerTrack(result.jobDescription + ' ' + result.qualifications);
    result.entryLevelFlag = inferEntryLevelFlag(result.jobTitle, result.jobDescription);
    result.collectedAt = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');

    return result;
  }

  // --- Default/Indeed/Web Extraction (existing logic) ---
  // ...existing code...

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
  result.date = date === 'N/A' ? null : date;

  // Add missing fields to match Python pipeline schema (state and region already set above)
  result.remoteFlag = inferRemoteFlag(result.location);
  result.sourcePlatform = "html";
  result.careerTrack = inferCareerTrack(result.jobDescription + " " + result.qualifications);
  result.entryLevelFlag = inferEntryLevelFlag(result.jobTitle, result.jobDescription);
  result.collectedAt = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');

  return result;
}


// Use absolute paths for input/output directories
const htmlDir = path.resolve(__dirname, '../data/html');
const jsonDir = path.resolve(__dirname, '../data/json');
console.log('DEBUG: Using htmlDir:', htmlDir);
console.log('DEBUG: Using jsonDir:', jsonDir);

// Read HTML files from htmlDir
const htmlFiles = fs.readdirSync(htmlDir).filter(file => file.endsWith('.html')).map(file => path.join(htmlDir, file));

// Create jsonDir if it doesn't exist
if (!fs.existsSync(jsonDir)) {
  fs.mkdirSync(jsonDir, { recursive: true });
}

// Clean up old JSON files first
const existingJsonFiles = fs.existsSync(jsonDir) ? 
  fs.readdirSync(jsonDir).filter(file => file.endsWith('.json') && file.match(/^[\d]+_/)) : [];
existingJsonFiles.forEach(file => {
  fs.unlinkSync(path.join(jsonDir, file));
});
console.log(`Cleaned up ${existingJsonFiles.length} existing JSON files`);

let jobIndex = 1;
let processedCount = 0;

htmlFiles.forEach(file => {
  try {
    console.log(`Processing ${file}...`);
    const html = fs.readFileSync(file, 'utf-8');
    const data = extractFromHTML(html);

    // Extract original URL from HTML metadata if available, otherwise use file path
    const $ = cheerio.load(html);
    const originalUrl = $('#indeed-share-url').attr('content');
    if (originalUrl) {
      // Decode HTML entities in the URL
      data.sourceFile = originalUrl.replace(/&amp;/g, '&');
    } else {
      data.sourceFile = file;
    }

    // Create individual JSON file for each job (no education filtering since files are hand-selected)
    const baseName = path.basename(file, '.html');
    const cleanName = baseName.replace(/[^\w\s]/g, '').replace(/\s+/g, '_').substring(0, 50);
    const outputFileName = path.join(jsonDir, `${jobIndex}_${cleanName}.json`);

    console.log(`Writing to ${outputFileName}...`);
    fs.writeFileSync(outputFileName, JSON.stringify(data, null, 2));
    console.log(`INCLUDED ${outputFileName}: Hand-selected file processed successfully`);

    jobIndex++;
    processedCount++;
  } catch (err) {
    console.error(`Error parsing ${file}:`, err.message);
    console.error('Stack trace:', err.stack);
  }
});

console.log(`\n=== HTML TO JSON CONVERSION RESULTS ===`);
console.log(`Total HTML files processed: ${htmlFiles.length}`);
console.log(`JSON files created: ${processedCount}`);
console.log(`Conversion success rate: ${((processedCount / htmlFiles.length) * 100).toFixed(1)}%`);