const fs = require('fs');
const path = require('path');
const mammoth = require('mammoth');

// Directory containing Word documents
const wordDir = path.resolve(__dirname, '../data/word');
const jsonOutputDir = path.resolve(__dirname, '../data/json/word');

// Ensure output directory exists
if (!fs.existsSync(jsonOutputDir)) {
  fs.mkdirSync(jsonOutputDir, { recursive: true });
}

/**
 * Parse table-based Word document format using cell boundary detection
 * 
 * Word documents are formatted as tables with columns:
 * Company | Job Title | Job Description | Qualifications | Pay | Date
 * 
 * When mammoth extracts the text, table cells are separated by multiple blank lines.
 * This function uses that pattern to properly separate job description from qualifications.
 */
function parseTableFormat(rawText, fileName) {
  const result = {
    company: 'Unknown',
    jobTitle: 'Unknown', 
    jobDescription: '',
    qualifications: '',
    pay: 'N/A',
    date: 'N/A'
  };

  // Split by double/triple newlines to find cell boundaries
  // This is the key insight: table cells in Word docs are separated by multiple blank lines
  const cellGroups = rawText.split(/\n\s*\n\s*\n/).map(s => s.trim()).filter(s => s.length > 0);
  
  if (cellGroups.length < 2) {
    return result;
  }

  // First cell group contains headers + company + job title + first part of description
  const firstGroup = cellGroups[0];
  const firstLines = firstGroup.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  
  // Find where headers end (after "Date" header)
  let headerEndIdx = -1;
  for (let i = 0; i < firstLines.length; i++) {
    if (firstLines[i] === 'Date') {
      headerEndIdx = i;
      break;
    }
  }
  
  // Content after headers
  const contentAfterHeaders = headerEndIdx >= 0 ? firstLines.slice(headerEndIdx + 1) : firstLines;
  
  // Known company patterns
  const companyPatterns = [
    { pattern: /^HCA$/i, name: 'HCA Healthcare' },
    { pattern: /^Intermountain Health$/i, name: 'Intermountain Health' },
    { pattern: /^St\.\s*Luke/i, name: "St. Luke's Health System" },
    { pattern: /^University of Utah$/i, name: 'University of Utah' }
  ];
  
  // Find company (first line after headers that matches a known company)
  let companyIdx = -1;
  for (let i = 0; i < Math.min(3, contentAfterHeaders.length); i++) {
    for (const cp of companyPatterns) {
      if (cp.pattern.test(contentAfterHeaders[i])) {
        result.company = cp.name;
        companyIdx = i;
        break;
      }
    }
    if (companyIdx >= 0) break;
  }
  
  // Fallback: extract company from filename
  if (result.company === 'Unknown') {
    if (fileName.includes('HCA_')) result.company = 'HCA Healthcare';
    else if (fileName.includes('IHC_')) result.company = 'Intermountain Health';
    else if (fileName.includes('UofU_')) result.company = 'University of Utah';
    else if (fileName.includes('StLuke_')) result.company = "St. Luke's Health System";
  }
  
  // Job title is typically right after company
  let jobTitleIdx = companyIdx >= 0 ? companyIdx + 1 : 0;
  if (jobTitleIdx < contentAfterHeaders.length) {
    const potentialTitle = contentAfterHeaders[jobTitleIdx];
    // Job title should be short and descriptive
    if (potentialTitle.length > 3 && potentialTitle.length < 100 &&
        !potentialTitle.toLowerCase().startsWith('the ') &&
        !potentialTitle.toLowerCase().startsWith('as a ') &&
        !potentialTitle.toLowerCase().startsWith('this ')) {
      result.jobTitle = potentialTitle;
    }
  }
  
  // Job description: starts after job title in first group, continues through subsequent groups
  // until we hit a qualifications marker
  const descStartIdx = jobTitleIdx + 1;
  let descriptionParts = [];
  
  // Add remaining content from first group to description
  if (descStartIdx < contentAfterHeaders.length) {
    descriptionParts.push(contentAfterHeaders.slice(descStartIdx).join(' '));
  }
  
  // Process remaining cell groups to find where description ends and qualifications begin
  let qualificationsCellIdx = -1;
  
  // Markers that indicate the START of qualifications (not description)
  // Note: [\x27\u2019] handles both straight apostrophe (') and curly apostrophe (')
  const qualStartMarkers = [
    /^minimum qualifications$/i,
    /^required qualifications$/i,
    /^qualifications:$/i,
    /^preferred qualifications:?$/i,
    /^education:\s/i,
    /^experience:\s/i,
    /^\d+\s*years?\s+(of\s+)?experience/i,
    /^(one|two|three|four|five|six)\s+years?\s+(of\s+)?/i,  // "One year of...", "Two years..."
    /^(one|two|three|six)\s+months?\s+(of\s+)?/i,           // "Six months of..."
    /^bachelor[\x27\u2019]?s?\s+degree/i,                    // Handle curly and straight apostrophes
    /^associate[\x27\u2019]?s?\s+degree/i,
    /^high school diploma/i,
    /^demonstrated\s+(basic\s+)?computer/i,                  // "Demonstrated basic computer skills"
    /^demonstrated\s+ability/i,                              // "Demonstrated ability to..."
    /^ability to\s/i,                                        // "Ability to..."
    /^knowledge of\s/i,                                      // "Knowledge of..."
    /^proficiency in\s/i,                                    // "Proficiency in..."
    /^strong\s+(written|verbal|interpersonal)/i,             // "Strong written/verbal/interpersonal..."
    /^excellent\s+(written|verbal|communication)/i,          // "Excellent communication..."
    /^significant and direct experience/i,                   // "Significant and direct experience..."
    /^minimum of\s+\d+/i                                     // "Minimum of 1 year..."
  ];
  
  // Markers that indicate we're in a SKILLS section (part of qualifications, not description)
  const skillsSectionMarkers = [
    /^professional etiquette/i,
    /^collaboration\s*\/?\s*teamwork$/i,
    /^customer service$/i,
    /^computer literacy$/i,
    /^time management$/i,
    /^critical thinking/i,
    /^confidentiality$/i,
    /^communication skills$/i,
    /^healthcare common procedure/i,
    /^icd coding$/i,
    /^medical billing/i,
    /^coding education$/i
  ];
  
  // Description section markers - these indicate we're still in job description
  const descriptionMarkers = [
    /^essential functions/i,
    /^key responsibilities/i,
    /^job duties/i,
    /^primary responsibilities/i,
    /^responsibilities include/i,
    /^complexity of scope/i
  ];
  
  for (let i = 1; i < cellGroups.length; i++) {
    const cellContent = cellGroups[i].trim();
    const cellLines = cellContent.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    
    if (cellLines.length === 0) continue;
    
    const firstLine = cellLines[0];
    const firstLineLower = firstLine.toLowerCase();
    
    // Check if this is the Pay/Date section (near the end)
    if (/^\$[\d,]+/.test(firstLine) || 
        /^NA$/i.test(firstLine) ||
        /^\d{2}\/\d{2}\/\d{4}$/.test(firstLine) ||
        /hourly range/i.test(firstLine)) {
      // This is pay/date section - stop here
      if (qualificationsCellIdx < 0) {
        qualificationsCellIdx = i;
      }
      
      // Extract pay and date
      for (const line of cellLines) {
        if (/\$[\d,]+(?:\.\d+)?\s*[-–]\s*\$[\d,]+/.test(line)) {
          result.pay = line.match(/\$[\d,]+(?:\.\d+)?\s*[-–]\s*\$[\d,]+(?:\.\d+)?/)[0];
        } else if (/^\d{2}\/\d{2}\/\d{4}$/.test(line)) {
          result.date = line;
        }
      }
      break;
    }
    
    // Check if this cell starts a qualifications section
    let isQualSection = false;
    
    // Check for explicit qualification markers
    for (const marker of qualStartMarkers) {
      if (marker.test(firstLine)) {
        isQualSection = true;
        break;
      }
    }
    
    // Check for skills section markers (indicates qualifications)
    if (!isQualSection) {
      for (const marker of skillsSectionMarkers) {
        if (marker.test(firstLine)) {
          isQualSection = true;
          break;
        }
      }
    }
    
    // Check if this is a short-item list (skills/abilities) - typically qualifications
    // These are characterized by many short lines (< 40 chars) that don't form sentences
    if (!isQualSection && cellLines.length > 3) {
      const shortLines = cellLines.filter(l => l.length < 40 && !l.endsWith('.'));
      if (shortLines.length > cellLines.length * 0.6) {
        // More than 60% are short non-sentence lines - likely a skills list
        isQualSection = true;
      }
    }
    
    // Check if this is still description content
    let isDescSection = false;
    for (const marker of descriptionMarkers) {
      if (marker.test(firstLine)) {
        isDescSection = true;
        break;
      }
    }
    
    // Lines that look like job responsibilities (start with action verbs, are complete sentences)
    const actionVerbPattern = /^(you will|provides?|performs?|coordinates?|ensures?|maintains?|handles?|assists?|evaluates?|communicates?|develops?|supports?|builds?|works?|participates?|completes?|conducts?|prepares?|manages?|creates?|posts?|identifies?|compiles?|reviews?|analyzes?|processes?|delivers?|screens?|interviews?|collects?|schedules?|registers?|obtains?|documents?|verifies?)\s/i;
    const looksLikeResponsibility = cellLines.some(l => actionVerbPattern.test(l) && l.length > 40);
    
    if (isDescSection || (looksLikeResponsibility && !isQualSection && qualificationsCellIdx < 0)) {
      // This is description content
      descriptionParts.push(cellContent);
    } else if (isQualSection) {
      // This is the start of qualifications
      if (qualificationsCellIdx < 0) {
        qualificationsCellIdx = i;
      }
    } else if (qualificationsCellIdx < 0) {
      // Ambiguous - add to description if we haven't hit qualifications yet
      descriptionParts.push(cellContent);
    }
  }
  
  // Build job description
  result.jobDescription = descriptionParts.join(' ').replace(/\s+/g, ' ').trim();
  
  // Build qualifications from cells starting at qualificationsCellIdx
  if (qualificationsCellIdx >= 0) {
    let qualParts = [];
    for (let i = qualificationsCellIdx; i < cellGroups.length; i++) {
      const cellContent = cellGroups[i].trim();
      const cellLines = cellContent.split('\n').map(l => l.trim()).filter(l => l.length > 0);
      
      // Stop if we hit pay/date
      let hitPayDate = false;
      let validLines = [];
      for (const line of cellLines) {
        if (/^\$[\d,]+/.test(line) || 
            /^NA$/i.test(line) ||
            /^\d{2}\/\d{2}\/\d{4}$/.test(line) ||
            /hourly range/i.test(line)) {
          hitPayDate = true;
          // Extract pay/date if not already done
          if (/\$[\d,]+(?:\.\d+)?\s*[-–]\s*\$[\d,]+/.test(line) && result.pay === 'N/A') {
            result.pay = line.match(/\$[\d,]+(?:\.\d+)?\s*[-–]\s*\$[\d,]+(?:\.\d+)?/)[0];
          } else if (/^\d{2}\/\d{2}\/\d{4}$/.test(line) && result.date === 'N/A') {
            result.date = line;
          }
        } else {
          validLines.push(line);
        }
      }
      
      if (validLines.length > 0) {
        qualParts.push(validLines.join('; '));
      }
      
      if (hitPayDate) break;
    }
    result.qualifications = qualParts.join('; ').replace(/\s+/g, ' ').trim();
  }
  
  return result;
}

/**
 * Legacy parsing for non-table format documents
 */
function parseLegacyFormat(cleanText, lines, fileName) {
  const result = {
    company: 'Unknown',
    jobTitle: 'Unknown',
    jobDescription: '',
    qualifications: '',
    pay: 'N/A',
    date: 'N/A'
  };
  
  // Extract company from filename
  if (fileName.includes('HCA_')) result.company = 'HCA Healthcare';
  else if (fileName.includes('IHC_')) result.company = 'Intermountain Health';
  else if (fileName.includes('UofU_')) result.company = 'University of Utah';
  else if (fileName.includes('StLuke_')) result.company = "St. Luke's Health System";
  
  // Find job title
  for (let i = 0; i < Math.min(10, lines.length); i++) {
    const line = lines[i].trim();
    if (line.length > 5 && line.length < 100 &&
        !line.toLowerCase().includes('qualifications') &&
        !line.toLowerCase().includes('requirements') &&
        !line.toLowerCase().includes('company') &&
        !line.toLowerCase().includes('job title')) {
      result.jobTitle = line;
      break;
    }
  }
  
  // Split content into description and qualifications
  const lowerText = cleanText.toLowerCase();
  const qualIndex = lowerText.indexOf('qualifications');
  const reqIndex = lowerText.indexOf('requirements');
  
  let qualificationsStart = -1;
  if (qualIndex >= 0) qualificationsStart = qualIndex;
  else if (reqIndex >= 0) qualificationsStart = reqIndex;
  
  if (qualificationsStart >= 0) {
    result.jobDescription = cleanText.substring(0, qualificationsStart).trim();
    result.qualifications = cleanText.substring(qualificationsStart).trim();
  } else {
    result.jobDescription = cleanText.substring(0, Math.min(2000, cleanText.length)).trim();
  }
  
  // Extract pay
  const payMatch = cleanText.match(/\$[\d,]+(?:\.\d+)?\s*(?:to|[-–])\s*\$[\d,]+(?:\.\d+)?/i);
  if (payMatch) result.pay = payMatch[0];
  
  return result;
}

async function extractJobFromWord(filePath) {
  try {
    // Read the Word document
    const result = await mammoth.extractRawText({ path: filePath });
    const text = result.value;

    // Extract filename for identification
    const fileName = path.basename(filePath, '.docx');

    // Initialize job data structure
    let jobData = {
      company: 'Unknown',
      jobTitle: 'Unknown',
      jobDescription: '',
      qualifications: '',
      pay: 'N/A',
      date: 'N/A',
      location: 'N/A',
      state: 'N/A',
      region: 'N/A',
      city: 'N/A',
      remoteFlag: false,
      sourcePlatform: 'word-docx',
      careerTrack: 'Unknown',
      entryLevelFlag: false,
      collectedAt: new Date().toISOString(),
      sourceFile: filePath,
      _extractionStrategy: 'word-document'
    };

    // Split text into lines for processing
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    // Detect table-based format (common in these Word docs)
    // Header pattern: Company, Job Title, Job Description, Qualifications, Pay, Date
    const isTableFormat = lines.some(line => line === 'Company') && 
                          lines.some(line => line === 'Job Title') &&
                          lines.some(line => line === 'Job Description');
    
    if (isTableFormat) {
      // Parse table-based format - pass raw text for cell boundary detection
      const parsed = parseTableFormat(text, fileName);
      Object.assign(jobData, parsed);
    } else {
      // Fallback to legacy parsing for non-table formats
      const cleanText = text.replace(/\n\s*\n/g, '\n').replace(/\r/g, '').trim();
      const legacyParsed = parseLegacyFormat(cleanText, lines, fileName);
      Object.assign(jobData, legacyParsed);
    }

    // Try to extract job title from filename (override if document extraction was poor)
    if (jobData.jobTitle === 'Unknown' || jobData.jobTitle.length < 3) {
      if (fileName.includes('UofU_PatientRelations')) {
        jobData.jobTitle = 'Patient Relations Specialist';
      } else if (fileName.includes('UofU_SchedulingCoordinator')) {
        jobData.jobTitle = 'Scheduling Coordinator';
      } else if (fileName.includes('UofU_ProgamAssistant')) {
        jobData.jobTitle = 'Program Assistant';
      } else if (fileName.includes('UofU_SupervisorPatientServices')) {
        jobData.jobTitle = 'Supervisor Patient Services';
      } else if (fileName.includes('UofU_ManagerAdministrativeServices')) {
        jobData.jobTitle = 'Manager Administrative Services';
      } else if (fileName.includes('UofU_MaterialsOperationsSupport')) {
        jobData.jobTitle = 'Materials Operations Support';
      } else if (fileName.includes('UofU_PatientDiagnosticAssistant')) {
        jobData.jobTitle = 'Patient Diagnostic Assistant';
      } else if (fileName.includes('UofU_CustomerAdvocate')) {
        jobData.jobTitle = 'Customer Advocate';
      } else if (fileName.includes('UofU_EDIAnalyst')) {
        jobData.jobTitle = 'EDI Analyst';
      } else if (fileName.includes('UofU_HeartFailureProgamSpecialist')) {
        jobData.jobTitle = 'Heart Failure Program Specialist';
      } else if (fileName.includes('UofU_LungTransplantProgamSpecialist')) {
        jobData.jobTitle = 'Lung Transplant Program Specialist';
      } else if (fileName.includes('HCA_')) {
        // Extract HCA job titles from filename - clean up date suffix
        const titlePart = fileName.replace('HCA_', '').replace(/_\d+$/, '').replace(/_/g, ' ');
        jobData.jobTitle = titlePart;
      } else if (fileName.includes('IHC_')) {
        // Extract IHC job titles from filename
        const titlePart = fileName.replace('IHC_', '').replace(/_\d+$/, '').replace(/_/g, ' ');
        jobData.jobTitle = titlePart;
      } else if (fileName.includes('StLuke_')) {
        // Extract St. Luke's job titles from filename
        const titlePart = fileName.replace('StLuke_', '').replace(/_\d+$/, '').replace(/_/g, ' ');
        jobData.jobTitle = titlePart;
      }
    }

    // Ensure company is set from filename if not extracted
    if (jobData.company === 'Unknown') {
      if (fileName.includes('HCA_')) {
        jobData.company = 'HCA Healthcare';
      } else if (fileName.includes('IHC_')) {
        jobData.company = 'Intermountain Health';
      } else if (fileName.includes('UofU_')) {
        jobData.company = 'University of Utah';
      } else if (fileName.includes('StLuke_')) {
        jobData.company = 'St. Luke\'s Health System';
      }
    }

    // Extract location information from full text
    const fullText = text.replace(/\s+/g, ' ');
    const locationPatterns = [
      /(?:location|city|state|work location):\s*([^,\n\r]+)/i,
      /(?:at|in|located in)\s+([^,\n\r]+(?:,\s*[A-Z]{2})?)/i,
      /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*,\s*[A-Z]{2})/,
      /Salt Lake City/i,
      /Murray/i,
      /West Valley/i
    ];

    for (const pattern of locationPatterns) {
      const match = fullText.match(pattern);
      if (match) {
        let location = match[1] || match[0];
        location = location.trim();
        if (location.length > 3 && !location.includes('http') && !location.includes('@')) {
          jobData.location = location;
          // Try to extract state
          const stateMatch = location.match(/,?\s*(UT|UTAH|TX|TEXAS|FL|FLORIDA|CA|CALIFORNIA)$/i);
          if (stateMatch) {
            jobData.state = stateMatch[1].toUpperCase().substring(0, 2);
            jobData.city = location.replace(/,?\s*(UT|UTAH|TX|TEXAS|FL|FLORIDA|CA|CALIFORNIA)$/i, '').trim();
          } else if (location.toLowerCase().includes('salt lake')) {
            jobData.city = 'Salt Lake City';
            jobData.state = 'UT';
          }
          break;
        }
      }
    }

    // Map states to regions
    const stateToRegion = {
      'AL': 'South', 'AK': 'West', 'AZ': 'West', 'AR': 'South', 'CA': 'West',
      'CO': 'West', 'CT': 'Northeast', 'DE': 'South', 'FL': 'South', 'GA': 'South',
      'HI': 'West', 'ID': 'West', 'IL': 'Midwest', 'IN': 'Midwest', 'IA': 'Midwest',
      'KS': 'Midwest', 'KY': 'South', 'LA': 'South', 'ME': 'Northeast', 'MD': 'South',
      'MA': 'Northeast', 'MI': 'Midwest', 'MN': 'Midwest', 'MS': 'South', 'MO': 'Midwest',
      'MT': 'West', 'NE': 'Midwest', 'NV': 'West', 'NH': 'Northeast', 'NJ': 'Northeast',
      'NM': 'West', 'NY': 'Northeast', 'NC': 'South', 'ND': 'Midwest', 'OH': 'Midwest',
      'OK': 'South', 'OR': 'West', 'PA': 'Northeast', 'RI': 'Northeast', 'SC': 'South',
      'SD': 'Midwest', 'TN': 'South', 'TX': 'South', 'UT': 'West', 'VT': 'Northeast',
      'VA': 'South', 'WA': 'West', 'WV': 'South', 'WI': 'Midwest', 'WY': 'West'
    };

    if (jobData.state && stateToRegion[jobData.state]) {
      jobData.region = stateToRegion[jobData.state];
    }

    // Check for remote work
    jobData.remoteFlag = /remote|work from home|telecommute/i.test(fullText);

    // Extract pay information if not already set
    if (jobData.pay === 'N/A') {
      const payPatterns = [
        /\$[\d,]+(?:\.\d+)?\s*(?:to|[-–])\s*\$[\d,]+(?:\.\d+)?/i,
        /\$[\d,]+(?:\.\d+)?\s*per\s*(?:hour|year)/i,
        /salary:\s*\$[\d,]+(?:\.\d+)?/i
      ];

      for (const pattern of payPatterns) {
        const match = fullText.match(pattern);
        if (match) {
          jobData.pay = match[0].trim();
          break;
        }
      }
    }

    // Infer career track based on keywords
    const title_lower = jobData.jobTitle.toLowerCase();
    const desc_lower = jobData.jobDescription.toLowerCase();

    if (title_lower.includes('coordinator') || title_lower.includes('specialist') || title_lower.includes('analyst')) {
      jobData.careerTrack = 'Healthcare Administration';
    } else if (title_lower.includes('manager') || title_lower.includes('supervisor')) {
      jobData.careerTrack = 'Healthcare Management';
    } else if (desc_lower.includes('patient') || desc_lower.includes('registration')) {
      jobData.careerTrack = 'Patient Access';
    } else {
      jobData.careerTrack = 'Healthcare Administration';
    }

    // Basic entry level detection
    jobData.entryLevelFlag = /entry.?level|0-2 years|1-3 years|recent graduate/i.test(fullText) ||
                             (jobData.qualifications && /0-2 years|1-3 years/i.test(jobData.qualifications));

    return jobData;

  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
    return null;
  }
}

async function processWordFiles() {
  if (!fs.existsSync(wordDir)) {
    console.error(`Word directory not found: ${wordDir}`);
    return;
  }

  const wordFiles = fs.readdirSync(wordDir).filter(file => file.endsWith('.docx'));

  console.log(`Found ${wordFiles.length} Word documents to process`);

  for (const file of wordFiles) {
    const filePath = path.join(wordDir, file);
    console.log(`Processing: ${file}`);

    const jobData = await extractJobFromWord(filePath);

    if (jobData) {
      // Generate JSON filename
      const jsonFileName = file.replace('.docx', '.json');
      const jsonFilePath = path.join(jsonOutputDir, jsonFileName);

      // Write JSON file
      fs.writeFileSync(jsonFilePath, JSON.stringify(jobData, null, 2), 'utf-8');
      console.log(`  ✓ Created: ${jsonFileName}`);
    } else {
      console.log(`  ✗ Failed to process: ${file}`);
    }
  }

  console.log(`\nProcessing complete! ${wordFiles.length} Word documents processed.`);
}

// Run the conversion
processWordFiles().catch(console.error);