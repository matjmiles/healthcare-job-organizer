const fs = require('fs');
const path = require('path');

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
  
  return null;
}

// Infer career track from job title
function inferCareerTrack(jobTitle) {
  if (!jobTitle) return null;
  
  const titleLower = jobTitle.toLowerCase();
  for (const [trackName, patterns] of CAREER_TRACK_RULES) {
    for (const pattern of patterns) {
      if (pattern.test(titleLower)) {
        return trackName;
      }
    }
  }
  return null;
}

// Determine if job is entry level
function isEntryLevel(jobTitle) {
  if (!jobTitle) return false;
  
  const titleLower = jobTitle.toLowerCase();
  
  // Exclude senior positions
  for (const hint of EXCLUDE_TITLE_HINTS) {
    if (titleLower.includes(hint)) {
      return false;
    }
  }
  
  // Check for entry level hints
  for (const hint of ENTRY_LEVEL_TITLE_HINTS) {
    if (titleLower.includes(hint)) {
      return true;
    }
  }
  
  return false;
}

// Parse pay information
function parsePay(text) {
  if (!text) return null;
  
  // Look for salary ranges in various formats
  const patterns = [
    // Annual ranges: $80,000 - $90,000, $80K - $90K
    /\$?([\d,]+)k?\s*-\s*\$?([\d,]+)k?\s*(?:per year|annually|\/year)?/i,
    // Hourly ranges: $32.21 - $46.35
    /\$?([\d.]+)\s*-\s*\$?([\d.]+)\s*(?:per hour|hourly|\/hr)?/i,
    // Single values
    /\$?([\d,]+)k?\s*(?:per year|annually|\/year)/i,
    /\$?([\d.]+)\s*(?:per hour|hourly|\/hr)/i
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      if (match[2]) {
        // Range found
        let low = parseFloat(match[1].replace(/,/g, ''));
        let high = parseFloat(match[2].replace(/,/g, ''));
        
        // Check if it's annual (values > 100)
        if (low > 100 || high > 100) {
          // Convert to hourly
          low = (low / 2080).toFixed(2);
          high = (high / 2080).toFixed(2);
          return `$${low} - $${high}/hr`;
        } else {
          return `$${low} - $${high}/hr`;
        }
      } else {
        // Single value
        let value = parseFloat(match[1].replace(/,/g, ''));
        if (value > 100) {
          // Convert to hourly
          value = (value / 2080).toFixed(2);
          return `$${value}/hr`;
        } else {
          return `$${value}/hr`;
        }
      }
    }
  }
  
  return null;
}

// Extract city from location string
function extractCity(location) {
  if (!location) return null;
  
  // Remove state codes and common suffixes
  let city = location.replace(/,?\s*[A-Z]{2}\b/g, '');
  city = city.replace(/\s*\([^)]*\)/g, ''); // Remove parentheses
  city = city.replace(/\s*(Remote|Hybrid|On-?site).*/i, '');
  city = city.trim();
  
  return city || null;
}

// Check if job is remote
function isRemote(location, text) {
  if (!location && !text) return false;
  
  const searchText = [location, text].filter(Boolean).join(' ').toLowerCase();
  return /\b(remote|work from home|wfh)\b/i.test(searchText);
}

// Main extraction function for LinkedIn txt files
function extractLinkedInJob(content, filename) {
  // Initialize fields
  let jobTitle = null;
  let company = null;
  let location = null;
  let jobDescription = [];
  let qualifications = [];
  let pay = null;
  
  // Split into sections using "About the job" as separator
  const aboutJobIndex = content.indexOf('About the job');
  if (aboutJobIndex === -1) {
    throw new Error('No "About the job" header found');
  }
  
  const mainContent = content.substring(aboutJobIndex + 'About the job'.length).trim();
  
  // Split content by double newlines to get paragraphs
  const paragraphs = mainContent.split(/\n\s*\n/).map(p => p.trim()).filter(p => p.length > 0);
  
  // Try to identify sections
  let currentSection = null;
  
  for (let i = 0; i < paragraphs.length; i++) {
    const para = paragraphs[i];
    const lowerPara = para.toLowerCase();
    const firstLine = para.split('\n')[0].trim();
    const lowerFirstLine = firstLine.toLowerCase();
    
    // Check if this is a section header
    if (lowerFirstLine === 'company description' || lowerFirstLine === 'about greater lakes mental health' || /^about [a-z]/i.test(firstLine)) {
      currentSection = 'company';
      
      // Extract company name from the header or next line
      if (firstLine.startsWith('About ')) {
        company = firstLine.replace(/^About\s+/i, '').trim();
      } else {
        // Company name might be in the paragraph content
        const lines = para.split('\n').filter(l => l.trim().length > 0);
        if (lines.length > 1) {
          // Second line might be company name, or extract from first sentence
          const companyMatch = para.match(/^(?:About\s+)?([A-Z][A-Za-z\s&'.-]+(?:Health|Healthcare|Hospital|Medical|Center|Services|Companies|Institute|Group|Care|Clinic|Eye|Network))/);
          if (companyMatch) {
            company = companyMatch[1].trim();
          }
        }
      }
      continue;
    }
    
    if (lowerFirstLine === 'role description' || lowerFirstLine === 'position description' || lowerFirstLine === 'job summary' || lowerFirstLine === 'position summary' || lowerFirstLine === 'description') {
      currentSection = 'description';
      
      // Extract job title from this paragraph
      const lines = para.split('\n').filter(l => l.trim().length > 0);
      if (lines.length > 1) {
        // Look for job title patterns in subsequent lines
        for (let j = 1; j < lines.length; j++) {
          const line = lines[j].trim();
          
          // Check if line contains job title pattern
          if (line.length < 200 && line.length > 10) {
            // Extract job title from patterns like "The XYZ is an exciting..." or "This is a...role for a XYZ"
            const titleMatch = line.match(/(?:The|This is.*?for (?:an?|the))\s+([A-Z][A-Za-z\s()/-]+?)\s+(?:is|will|manages|oversees|provides)/i);
            if (titleMatch && !jobTitle) {
              jobTitle = titleMatch[1].trim();
              break;
            }
            
            // Also check for location in this section
            if (!location) {
              const locMatch = line.match(/located in ([^.,]+?)(?:,|\.|for)/i);
              if (locMatch) {
                location = locMatch[1].trim();
              }
            }
          }
        }
      }
      continue;
    }
    
    if (lowerFirstLine === 'responsibilities' || lowerFirstLine === 'essential duties and responsibilities' || lowerFirstLine === 'key responsibilities' || lowerFirstLine === 'duties') {
      currentSection = 'responsibilities';
      // Add responsibilities to job description
      const lines = para.split('\n').filter(l => l.trim().length > 20);
      jobDescription.push(...lines.slice(1)); // Skip header line
      continue;
    }
    
    if (lowerFirstLine === 'qualifications' || lowerFirstLine === 'requirements' || lowerFirstLine === 'required qualifications' || lowerFirstLine === 'minimum qualifications' || lowerFirstLine === 'education / experience' || lowerFirstLine === 'knowledge, skills, abilities' || lowerFirstLine === 'what qualifications you will need:') {
      currentSection = 'qualifications';
      const lines = para.split('\n').filter(l => l.trim().length > 10);
      qualifications.push(...lines.slice(1)); // Skip header line
      continue;
    }
    
    if (lowerFirstLine === 'benefits' || lowerFirstLine === 'compensation' || lowerFirstLine === 'pay rate' || lowerFirstLine === 'salary') {
      currentSection = 'benefits';
      continue;
    }
    
    // Extract pay from anywhere in content
    if (!pay) {
      const payInfo = parsePay(para);
      if (payInfo) {
        pay = payInfo;
      }
    }
    
    // Add content to current section
    if (currentSection === 'description' && para.length > 30) {
      jobDescription.push(para);
    } else if (currentSection === 'qualifications' && para.length > 10) {
      qualifications.push(para);
    }
  }
  
  // Extract company from first meaningful paragraph if not found
  if (!company && paragraphs.length > 0) {
    const firstPara = paragraphs[0];
    const companyMatch = firstPara.match(/^([A-Z][A-Za-z\s&'.-]+(?:Health|Healthcare|Hospital|Medical|Center|Services|Companies|Institute|Group|Care|Clinic|Eye|Network))/);
    if (companyMatch) {
      company = companyMatch[1].trim();
    }
  }
  
  // Extract job title from content patterns if not found
  if (!jobTitle) {
    const titlePatterns = [
      /(?:position|role|job|hiring for|searching for).*?(?:as|for)\s+(?:an?|the)\s+([A-Z][A-Za-z\s()/-]+?)(?:\.|where|in|at)/i,
      /(?:as|for)\s+(?:an?|the)\s+([A-Z][A-Za-z\s]+?(?:Manager|Director|Administrator|Coordinator|Specialist|Professional|Representative|Analyst|Assistant|Associate))/i,
      /The\s+([A-Z][A-Za-z\s]+?(?:Manager|Director|Administrator|Coordinator|Specialist|Professional|Representative|Analyst))\s+(?:is|will|manages|oversees)/
    ];
    
    for (const pattern of titlePatterns) {
      const match = content.match(pattern);
      if (match) {
        jobTitle = match[1].trim();
        break;
      }
    }
  }
  
  // Extract location if not found
  if (!location) {
    const locPatterns = [
      /located in ([^.,]+)/i,
      /based in ([^.,]+)/i,
      /Location\s*:?\s*([^\n]+)/i
    ];
    
    for (const pattern of locPatterns) {
      const match = content.match(pattern);
      if (match) {
        location = match[1].trim();
        break;
      }
    }
  }
  
  // Last resort: use filename for job title
  if (!jobTitle) {
    jobTitle = filename.replace(/\.txt$/, '').replace(/pos\d+/g, '').replace(/_/g, ' ').trim();
    if (!jobTitle) {
      jobTitle = "Position";
    }
  }
  
  // Infer state and other fields
  const state = inferState(location, company, jobTitle);
  const region = state ? getStateRegion(state) : null;
  const city = extractCity(location);
  const remoteFlag = isRemote(location, content);
  const careerTrack = inferCareerTrack(jobTitle);
  const entryLevelFlag = isEntryLevel(jobTitle);
  
  // Build JSON object
  const jobData = {
    jobTitle: jobTitle || "Unknown Position",
    company: company || "Unknown Company",
    location: location || null,
    pay: pay || null,
    jobDescription: jobDescription.join(' • '),
    qualifications: qualifications.join('; '),
    state: state,
    region: region,
    city: city,
    remoteFlag: remoteFlag,
    sourcePlatform: "linkedin",
    careerTrack: careerTrack,
    entryLevelFlag: entryLevelFlag,
    collectedAt: new Date().toISOString(),
    _extractionStrategy: "linkedin-text",
    sourceFile: filename
  };
  
  return jobData;
}

// Main processing function
function processLinkedInFiles() {
  const linkedinDir = path.join(__dirname, '..', 'data', 'linkedin');
  const outputDir = path.join(__dirname, '..', 'data', 'json', 'linkedin');
  
  // Create output directory if it doesn't exist
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  // Get all txt files
  const files = fs.readdirSync(linkedinDir).filter(f => f.endsWith('.txt'));
  
  console.log(`Found ${files.length} LinkedIn txt files to process\n`);
  
  let successCount = 0;
  let failCount = 0;
  
  for (const file of files) {
    try {
      const filePath = path.join(linkedinDir, file);
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Extract job data
      const jobData = extractLinkedInJob(content, file);
      
      // Generate output filename
      const baseName = file.replace('.txt', '');
      const outputFilename = `${baseName}_linkedin.json`;
      const outputPath = path.join(outputDir, outputFilename);
      
      // Write JSON file
      fs.writeFileSync(outputPath, JSON.stringify(jobData, null, 2), 'utf8');
      
      console.log(`✓ Extracted: ${file}`);
      console.log(`  Title: ${jobData.jobTitle}`);
      console.log(`  Company: ${jobData.company}`);
      console.log(`  Pay: ${jobData.pay || 'N/A'}`);
      console.log(`  State: ${jobData.state || 'Unknown'}\n`);
      
      successCount++;
    } catch (error) {
      console.error(`✗ Failed to process ${file}:`, error.message);
      failCount++;
    }
  }
  
  console.log('\n=== Summary ===');
  console.log(`Success: ${successCount}`);
  console.log(`Failed: ${failCount}`);
  console.log(`Total: ${files.length}`);
}

// Run the script
processLinkedInFiles();
