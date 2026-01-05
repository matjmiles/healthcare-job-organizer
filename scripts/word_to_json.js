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

    // Clean up the text - remove excessive whitespace
    const cleanText = text.replace(/\n\s*\n/g, '\n').replace(/\r/g, '').trim();

    // Split text into sections based on common job posting patterns
    const lines = cleanText.split('\n').filter(line => line.trim().length > 0);

    // Try to extract job title from filename first
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
      // Extract HCA job titles from filename
      const titlePart = fileName.replace('HCA_', '').replace(/_/g, ' ');
      jobData.jobTitle = titlePart;
    } else if (fileName.includes('IHC_')) {
      // Extract IHC job titles from filename
      const titlePart = fileName.replace('IHC_', '').replace(/_/g, ' ');
      jobData.jobTitle = titlePart;
    } else if (fileName.includes('StLuke_')) {
      // Extract St. Luke's job titles from filename
      const titlePart = fileName.replace('StLuke_', '').replace(/_/g, ' ');
      jobData.jobTitle = titlePart;
    } else {
      // Fallback: Try to extract job title (usually first meaningful line)
      for (let i = 0; i < Math.min(10, lines.length); i++) {
        const line = lines[i].trim();
        if (line.length > 5 && line.length < 100 &&
            !line.toLowerCase().includes('qualifications') &&
            !line.toLowerCase().includes('requirements') &&
            !line.toLowerCase().includes('university of utah') &&
            !line.toLowerCase().includes('hca') &&
            !line.toLowerCase().includes('intermountain')) {
          jobData.jobTitle = line;
          break;
        }
      }
    }

    // Try to extract company from filename
    if (fileName.includes('HCA_')) {
      jobData.company = 'HCA Healthcare';
    } else if (fileName.includes('IHC_')) {
      jobData.company = 'Intermountain Healthcare';
    } else if (fileName.includes('UofU_')) {
      jobData.company = 'University of Utah';
    } else if (fileName.includes('StLuke_')) {
      jobData.company = 'St. Luke\'s Health System';
    }

    // Extract location information - improved patterns for Word docs
    const locationPatterns = [
      /(?:location|city|state|work location):\s*([^,\n\r]+)/i,
      /(?:at|in|located in)\s+([^,\n\r]+(?:,\s*[A-Z]{2})?)/i,
      /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*,\s*[A-Z]{2})/,
      /Salt Lake City/i,
      /Murray/i,
      /West Valley/i
    ];

    for (const pattern of locationPatterns) {
      const match = cleanText.match(pattern);
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
    jobData.remoteFlag = /remote|work from home|telecommute/i.test(cleanText);

    // Extract pay information
    const payPatterns = [
      /\$[\d,]+(?:\.\d+)?\s*(?:to|[-–])\s*\$[\d,]+(?:\.\d+)?/i,
      /\$[\d,]+(?:\.\d+)?\s*per\s*(?:hour|year)/i,
      /salary:\s*\$[\d,]+(?:\.\d+)?/i
    ];

    for (const pattern of payPatterns) {
      const match = cleanText.match(pattern);
      if (match) {
        jobData.pay = match[0].trim();
        break;
      }
    }

    // Split content into job description and qualifications
    // For Word documents, content is often in a single block
    // Look for section headers in the full text
    let descriptionStart = -1;
    let qualificationsStart = -1;

    const lowerText = cleanText.toLowerCase();

    // Find section boundaries
    const qualIndex = lowerText.indexOf('qualifications');
    const reqIndex = lowerText.indexOf('requirements');
    const skillsIndex = lowerText.indexOf('skills');

    if (qualIndex >= 0) {
      qualificationsStart = qualIndex;
    } else if (reqIndex >= 0) {
      qualificationsStart = reqIndex;
    } else if (skillsIndex >= 0) {
      qualificationsStart = skillsIndex;
    }

    // Extract description and qualifications
    if (qualificationsStart >= 0) {
      jobData.jobDescription = cleanText.substring(0, qualificationsStart).trim();
      jobData.qualifications = cleanText.substring(qualificationsStart).trim();
    } else {
      // If no clear qualifications section, try to find other markers
      const payIndex = lowerText.indexOf('pay');
      const dateIndex = lowerText.indexOf('date');

      let endIndex = cleanText.length;
      if (payIndex >= 0) endIndex = Math.min(endIndex, payIndex);
      if (dateIndex >= 0) endIndex = Math.min(endIndex, dateIndex);

      jobData.jobDescription = cleanText.substring(0, endIndex).trim();
      jobData.qualifications = cleanText.substring(endIndex).trim();
    }

    // Clean up common prefixes in job description
    if (jobData.jobDescription.toLowerCase().startsWith('pay date')) {
      const lines = jobData.jobDescription.split('\n');
      if (lines.length > 1) {
        jobData.jobDescription = lines.slice(1).join('\n').trim();
      }
    }

    // Clean up extracted text
    jobData.jobDescription = jobData.jobDescription.replace(/\s+/g, ' ').trim();
    jobData.qualifications = jobData.qualifications.replace(/\s+/g, ' ').trim();

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
    jobData.entryLevelFlag = /entry.?level|0-2 years|1-3 years|recent graduate/i.test(cleanText) ||
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