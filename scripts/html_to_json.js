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

/**
 * Clean up Unicode encoding artifacts from text
 * Handles: Â (non-breaking space artifact), â€™ (smart quote), etc.
 */
function cleanEncodingArtifacts(text) {
  if (!text) return text;
  return text
    .replace(/Â\s*/g, ' ')           // Remove Â artifacts
    .replace(/â€™/g, "'")            // Smart single quote
    .replace(/â€œ/g, '"')            // Smart double quote open
    .replace(/â€/g, '"')             // Smart double quote close
    .replace(/â€"/g, '—')            // Em dash
    .replace(/â€"/g, '–')            // En dash
    .replace(/â€¦/g, '...')          // Ellipsis
    .replace(/[\u2018\u2019]/g, "'") // Unicode smart single quotes
    .replace(/[\u201C\u201D]/g, '"') // Unicode smart double quotes
    .replace(/\u2013/g, '–')         // Unicode en dash
    .replace(/\u2014/g, '—')         // Unicode em dash
    .replace(/\u2026/g, '...')       // Unicode ellipsis
    .replace(/\s+/g, ' ')            // Collapse multiple spaces
    .trim();
}

/**
 * Normalize company names to consistent format
 */
function normalizeCompanyName(company) {
  if (!company || company === 'N/A') return company;
  const companyMappings = {
    'HCA': 'HCA Healthcare',
    'Intermountain Health': 'Intermountain Health',
    'Intermountain': 'Intermountain Health',
    'IHC': 'Intermountain Health',
    "St. Luke's": "St. Luke's Health System",
    'St Lukes': "St. Luke's Health System",
    'University of Utah': 'University of Utah Health',
    'UofU': 'University of Utah Health'
  };
  for (const [pattern, normalized] of Object.entries(companyMappings)) {
    if (company.toLowerCase().includes(pattern.toLowerCase())) {
      return normalized;
    }
  }
  return company;
}

/**
 * Extract pay amount and normalize to hourly rate
 */
function extractAndNormalizePay(payText) {
  if (!payText || payText === 'N/A') return 'N/A';
  
  const HOURS_PER_YEAR = 2080;
  
  // Clean up the text first
  payText = cleanEncodingArtifacts(payText);
  
  // Extract dollar amounts
  const dollarMatches = payText.match(/\$[\d,]+(?:\.\d+)?/g);
  if (!dollarMatches || dollarMatches.length === 0) return payText;
  
  // Parse amounts
  const amounts = dollarMatches.map(m => parseFloat(m.replace(/[$,]/g, '')));
  
  // Determine if annual or hourly (threshold: >$500 is annual)
  const isAnnual = amounts.some(a => a > 500) || /per\s*year|annual|salary/i.test(payText);
  const isExplicitHourly = /per\s*hour|hourly|\/hr/i.test(payText);
  
  if (isExplicitHourly || (!isAnnual && amounts.every(a => a < 500))) {
    // Already hourly
    if (amounts.length === 2) {
      return `$${amounts[0].toFixed(2)} - $${amounts[1].toFixed(2)}/hr`;
    } else if (amounts.length === 1) {
      return `$${amounts[0].toFixed(2)}/hr`;
    }
    return payText;
  }
  
  // Convert annual to hourly
  const hourlyAmounts = amounts.map(a => a / HOURS_PER_YEAR);
  
  if (hourlyAmounts.length === 2) {
    return `$${hourlyAmounts[0].toFixed(2)} - $${hourlyAmounts[1].toFixed(2)}/hr`;
  } else if (hourlyAmounts.length === 1) {
    return `$${hourlyAmounts[0].toFixed(2)}/hr`;
  }
  
  return payText;
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
            
            // Extract and clean all fields
            result.company = normalizeCompanyName(cleanEncodingArtifacts(cells.eq(colMap.company).text().trim())) || 'N/A';
            result.jobTitle = cleanEncodingArtifacts(cells.eq(colMap.jobTitle).text().trim()) || 'N/A';
            result.jobDescription = cleanEncodingArtifacts(cells.eq(colMap.jobDescription).text().trim()) || 'N/A';
            result.qualifications = cleanEncodingArtifacts(cells.eq(colMap.qualifications).text().trim()) || 'N/A';
            result.pay = extractAndNormalizePay(cells.eq(colMap.pay).text().trim()) || 'N/A';
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
    
    // --- Container/Styled HTML Extraction (BCBS Kansas, WellSky style) ---
    const hasContainer = $('.container').length > 0 || $('.company-info').length > 0;
    if (hasContainer) {
      // Job Title - from h1 or title
      let jobTitle = $('h1').first().text().trim();
      if (!jobTitle) jobTitle = $('title').text().trim().split(' - ')[0];
      result.jobTitle = cleanEncodingArtifacts(jobTitle) || 'N/A';
      
      // Company - from .company-info h3 or strong with Company:
      let company = '';
      const companyInfoH3 = $('.company-info h3').first().text().trim();
      if (companyInfoH3) {
        company = companyInfoH3;
      } else {
        // Try Company: pattern in any element
        $('p, div, strong').each((i, el) => {
          const text = $(el).text();
          const match = text.match(/Company:\s*([^\n<]+)/i);
          if (match && !company) {
            company = match[1].trim();
          }
        });
      }
      // Extract company from title if still not found (e.g., "Job Title - Company Name")
      if (!company) {
        const titleParts = $('title').text().split(' - ');
        if (titleParts.length > 1) {
          company = titleParts[titleParts.length - 1].trim();
        }
      }
      result.company = normalizeCompanyName(cleanEncodingArtifacts(company)) || 'N/A';
      
      // Location - from .company-info or Location: pattern
      let location = '';
      $('p, div').each((i, el) => {
        const text = $(el).text();
        const match = text.match(/Location:\s*([^\n<]+)/i);
        if (match && !location) {
          location = match[1].trim();
        }
      });
      result.location = cleanEncodingArtifacts(location) || 'N/A';
      
      // Pay - from .salary class or Salary Range pattern
      let pay = '';
      const salaryEl = $('.salary, .detail-item.salary').first().text();
      if (salaryEl) {
        const payMatch = salaryEl.match(/\$[\d,]+(?:\.\d+)?(?:\s*[-–]\s*\$[\d,]+(?:\.\d+)?)?/);
        if (payMatch) pay = payMatch[0];
      }
      if (!pay) {
        // Look for salary patterns in body text
        const bodyText = $.text();
        const payPatterns = [
          /Salary(?:\s*Range)?:\s*(\$[\d,]+(?:\.\d+)?(?:\s*[-–]\s*\$[\d,]+(?:\.\d+)?)?(?:\s*(?:annually|per\s*year|\/yr))?)/i,
          /(\$[\d,]+(?:\.\d+)?(?:\s*[-–]\s*\$[\d,]+(?:\.\d+)?)?)\s*(?:annually|per\s*year|per\s*hour)/i
        ];
        for (const pattern of payPatterns) {
          const match = bodyText.match(pattern);
          if (match) {
            pay = match[1] || match[0];
            break;
          }
        }
      }
      result.pay = extractAndNormalizePay(pay) || 'N/A';
      
      // Job Description - combine Position Overview + Key Responsibilities
      let description = '';
      const descSections = ['position overview', 'job description', 'about the role', 'overview', 'summary'];
      const respSections = ['key responsibilities', 'responsibilities', 'essential functions', 'duties'];
      
      // Look for description sections by h2/h3 headers
      $('h2, h3').each((i, el) => {
        const headerText = $(el).text().toLowerCase().trim();
        if (descSections.some(s => headerText.includes(s))) {
          // Get following content (p or ul)
          let next = $(el).next();
          while (next.length && !next.is('h2, h3')) {
            if (next.is('p')) {
              description += next.text().trim() + ' ';
            } else if (next.is('ul')) {
              next.find('li').each((j, li) => {
                description += '• ' + $(li).text().trim() + ' ';
              });
            }
            next = next.next();
          }
        }
      });
      
      // Add responsibilities
      $('h2, h3').each((i, el) => {
        const headerText = $(el).text().toLowerCase().trim();
        if (respSections.some(s => headerText.includes(s))) {
          let next = $(el).next();
          while (next.length && !next.is('h2, h3')) {
            if (next.is('ul')) {
              next.find('li').each((j, li) => {
                description += '• ' + $(li).text().trim() + ' ';
              });
            } else if (next.is('p')) {
              description += next.text().trim() + ' ';
            }
            next = next.next();
          }
        }
      });
      
      result.jobDescription = cleanEncodingArtifacts(description) || 'N/A';
      
      // Qualifications - combine Education & Experience + Required Skills sections
      let qualifications = [];
      const qualSections = ['education', 'experience', 'requirements', 'qualifications', 'required skills', 'minimum qualifications'];
      
      $('h2, h3').each((i, el) => {
        const headerText = $(el).text().toLowerCase().trim();
        if (qualSections.some(s => headerText.includes(s))) {
          let next = $(el).next();
          while (next.length && !next.is('h2, h3')) {
            if (next.is('ul')) {
              next.find('li').each((j, li) => {
                qualifications.push($(li).text().trim());
              });
            } else if (next.is('p')) {
              const text = next.text().trim();
              if (text.length > 10) qualifications.push(text);
            }
            next = next.next();
          }
        }
      });
      
      result.qualifications = cleanEncodingArtifacts(qualifications.join('; ')) || 'N/A';
      
      // State, region, city
      const extractedState = inferState(result.location, result.company, result.jobTitle);
      result.state = extractedState;
      result.region = getStateRegion(extractedState);
      result.city = 'N/A';
      if (result.location && result.location !== 'N/A') {
        const cityMatch = result.location.match(/^([^,]+)/);
        if (cityMatch) result.city = cityMatch[1].trim();
      }
      
      result.remoteFlag = inferRemoteFlag(result.location) || /remote|hybrid|work from home/i.test($.text());
      result.sourcePlatform = 'html-styled';
      result.careerTrack = inferCareerTrack(result.jobDescription + ' ' + result.qualifications);
      result.entryLevelFlag = inferEntryLevelFlag(result.jobTitle, result.jobDescription + ' ' + result.qualifications);
      result.collectedAt = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
      result._extractionStrategy = 'container-styled';
      
      // Only return if we got meaningful data
      if (result.jobTitle !== 'N/A' && (result.company !== 'N/A' || result.jobDescription !== 'N/A')) {
        return result;
      }
    }
    
    // --- Indeed Raw HTML Extraction ---
    const isIndeed = htmlContent.includes('indeed.com') || $('meta[id="indeed-share-message"]').length > 0;
    if (isIndeed) {
      // Extract from meta tags first
      const indeedTitle = $('meta[id="indeed-share-message"]').attr('content');
      const ogTitle = $('meta[property="og:title"]').attr('content');
      const ogDescription = $('meta[property="og:description"]').attr('content');
      
      // Job title from indeed-share-message or og:title
      let jobTitle = indeedTitle || (ogTitle ? ogTitle.split(' - ')[0].trim() : '');
      result.jobTitle = cleanEncodingArtifacts(jobTitle) || 'N/A';
      
      // Company from og:description (Indeed puts company name there)
      result.company = normalizeCompanyName(cleanEncodingArtifacts(ogDescription)) || 'N/A';
      
      // Location from og:title (format: "Job Title - Location - Indeed.com")
      let location = '';
      if (ogTitle) {
        const parts = ogTitle.split(' - ');
        if (parts.length >= 2) {
          location = parts[1].replace('Indeed.com', '').trim();
        }
      }
      result.location = cleanEncodingArtifacts(location) || 'N/A';
      
      // Try to extract from JSON-LD
      const jsonLdScript = $('script[type="application/ld+json"]').text();
      if (jsonLdScript) {
        try {
          const ldData = JSON.parse(jsonLdScript);
          if (ldData.title) result.jobTitle = ldData.title;
          if (ldData.hiringOrganization?.name) result.company = ldData.hiringOrganization.name;
          if (ldData.jobLocation?.address) {
            const addr = ldData.jobLocation.address;
            result.location = [addr.addressLocality, addr.addressRegion].filter(Boolean).join(', ');
            result.city = addr.addressLocality || 'N/A';
            result.state = addr.addressRegion || null;
          }
          if (ldData.baseSalary) {
            const salary = ldData.baseSalary;
            if (salary.value) {
              result.pay = extractAndNormalizePay(`$${salary.value.minValue || salary.value} - $${salary.value.maxValue || salary.value}`);
            }
          }
          if (ldData.description) result.jobDescription = cleanEncodingArtifacts(ldData.description);
          if (ldData.datePosted) result.date = ldData.datePosted;
        } catch (e) {
          // JSON-LD parsing failed, continue with other methods
        }
      }
      
      // State, region
      const extractedState = result.state || inferState(result.location, result.company, result.jobTitle);
      result.state = extractedState;
      result.region = getStateRegion(extractedState);
      if (!result.city || result.city === 'N/A') {
        result.city = result.location.split(',')[0].trim() || 'N/A';
      }
      
      result.qualifications = result.qualifications || 'N/A';
      result.jobDescription = result.jobDescription || 'N/A';
      result.pay = result.pay || 'N/A';
      result.date = result.date || null;
      result.remoteFlag = inferRemoteFlag(result.location);
      result.sourcePlatform = 'indeed';
      result.careerTrack = inferCareerTrack(result.jobDescription + ' ' + result.qualifications);
      result.entryLevelFlag = inferEntryLevelFlag(result.jobTitle, result.jobDescription);
      result.collectedAt = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
      result._extractionStrategy = 'indeed-meta';
      
      if (result.jobTitle !== 'N/A') {
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
    // If no job-relevant fields, return with defaults
    result._extractionStrategy = 'none';
    result.jobTitle = cleanEncodingArtifacts($('h1').first().text().trim()) || cleanEncodingArtifacts($('title').text().split(' - ')[0].trim()) || 'N/A';
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
}


// Use absolute paths for input/output directories
const htmlDir = path.resolve(__dirname, '../data/html');
const jsonDir = path.resolve(__dirname, '../data/json/html');
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