const fs = require('fs');
const path = require('path');

// Directories containing JSON job files
const directories = [
  path.resolve(__dirname, '../data/json/webScrape'),
  path.resolve(__dirname, '../data/json/html'),
  path.resolve(__dirname, '../data/json/word')
];

// Analysis data structures
let jobs = [];
let skillFrequency = new Map();
let certificationFrequency = new Map();
let jobCategories = new Map();
let experienceRequirements = new Map();

// Load all job data
function loadJobData() {
  directories.forEach(dir => {
    if (fs.existsSync(dir)) {
      const files = fs.readdirSync(dir).filter(file => file.endsWith('.json'));
      files.forEach(file => {
        try {
          const filePath = path.join(dir, file);
          const jobData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

          // Handle both single job objects and arrays
          const jobArray = Array.isArray(jobData) ? jobData : [jobData];
          jobs.push(...jobArray);
        } catch (err) {
          console.error(`Error reading ${file}:`, err.message);
        }
      });
    }
  });

  console.log(`Loaded ${jobs.length} jobs from ${directories.length} directories`);
}

// Analyze job categories
function categorizeJobs() {
  jobs.forEach(job => {
    const title = (job.jobTitle || '').toLowerCase();
    const description = (job.jobDescription || '').toLowerCase();
    const qualifications = (job.qualifications || '').toLowerCase();
    const combined = `${title} ${description} ${qualifications}`;

    let category = 'Other';

    // Healthcare Administration roles - prioritize specific terms
    if (combined.includes('patient access') || (combined.includes('access') && combined.includes('coordinator'))) {
      category = 'Patient Access Coordinator';
    } else if (combined.includes('patient services') && combined.includes('specialist')) {
      category = 'Patient Services Specialist';
    } else if (combined.includes('patient services') && combined.includes('representative')) {
      category = 'Patient Services Representative';
    } else if (combined.includes('medical scheduler') || combined.includes('scheduling coordinator')) {
      category = 'Medical Scheduler';
    } else if (combined.includes('registration') && (combined.includes('specialist') || combined.includes('coordinator'))) {
      category = 'Registration Specialist';
    } else if (combined.includes('referral') && combined.includes('coordinator')) {
      category = 'Referral Coordinator';
    } else if (combined.includes('case management') || combined.includes('case manager')) {
      category = 'Case Management Coordinator';
    } else if (combined.includes('benefits') && combined.includes('specialist')) {
      category = 'Benefits Specialist';
    } else if (combined.includes('authorization') && combined.includes('specialist')) {
      category = 'Authorization Specialist';
    } else if (combined.includes('quality') && combined.includes('coordinator')) {
      category = 'Quality Coordinator';
    } else if (combined.includes('compliance') && combined.includes('specialist')) {
      category = 'Compliance Specialist';
    } else if (combined.includes('program') && combined.includes('coordinator')) {
      category = 'Program Coordinator';
    } else if (combined.includes('business') && combined.includes('analyst')) {
      category = 'Business Analyst';
    } else if (combined.includes('business') && combined.includes('coordinator')) {
      category = 'Business Coordinator';
    } else if (combined.includes('healthcare') && combined.includes('analyst')) {
      category = 'Healthcare Analyst';
    } else if (combined.includes('healthcare') && combined.includes('consultant')) {
      category = 'Healthcare Consultant';
    } else if (combined.includes('medical') && combined.includes('coordinator')) {
      category = 'Medical Coordinator';
    } else if (combined.includes('office') && combined.includes('manager')) {
      category = 'Office Manager';
    } else if (combined.includes('patient services') && combined.includes('supervisor')) {
      category = 'Patient Services Supervisor';
    } else if (combined.includes('administrative') && combined.includes('assistant')) {
      category = 'Administrative Assistant';
    } else if (combined.includes('unit clerk') || (combined.includes('unit') && combined.includes('clerk'))) {
      category = 'Unit Clerk';
    } else if (combined.includes('medical') && combined.includes('technician')) {
      category = 'Medical Technician';
    } else if (combined.includes('medical') && combined.includes('receptionist')) {
      category = 'Medical Receptionist';
    } else if (combined.includes('coordinator')) {
      category = 'Coordinator (General)';
    } else if (combined.includes('specialist')) {
      category = 'Specialist (General)';
    } else if (combined.includes('analyst')) {
      category = 'Analyst (General)';
    } else if (combined.includes('assistant')) {
      category = 'Assistant (General)';
    } else if (combined.includes('representative')) {
      category = 'Representative (General)';
    } else if (combined.includes('manager')) {
      category = 'Manager (General)';
    }

    jobCategories.set(category, (jobCategories.get(category) || 0) + 1);
  });
}

// Analyze skills and certifications
function analyzeSkillsAndCertifications() {
  const skillPatterns = [
    // Technical skills
    /\bexcel\b/i,
    /\bword\b/i,
    /\bpowerpoint\b/i,
    /\boutlook\b/i,
    /\bepic\b/i,
    /\bcerner\b/i,
    /\bmeditech\b/i,
    /\behr\b/i,
    /\belectronic health records?\b/i,
    /\bcomputer skills?\b/i,
    /\btyping\b/i,
    /\bdata entry\b/i,
    /\bmultitasking\b/i,
    /\borganization(al)? skills?\b/i,
    /\bcommunication skills?\b/i,
    /\binterpersonal skills?\b/i,
    /\bcustomer service\b/i,
    /\bproblem.solving\b/i,
    /\banalytical skills?\b/i,
    /\battention to detail\b/i,
    /\btime management\b/i,
    /\bprioritization\b/i,

    // Healthcare-specific skills
    /\bmedical terminology\b/i,
    /\bhipaa\b/i,
    /\bpatient care\b/i,
    /\bclinical experience\b/i,
    /\bhealthcare experience\b/i,
    /\binsurance verification\b/i,
    /\bbilling experience\b/i,
    /\bclaims processing\b/i,
    /\bpatient registration\b/i,
    /\bscheduling experience\b/i,
    /\btelephone etiquette\b/i,
    /\bconfidentiality\b/i,
    /\bcompliance\b/i,
    /\bregulatory requirements\b/i,

    // Education/Certifications
    /\bbachelor'?s? degree\b/i,
    /\bassociate'?s? degree\b/i,
    /\bhigh school diploma\b/i,
    /\bged\b/i,
    /\bcertification\b/i,
    /\blicensure\b/i,
    /\bcpr\b/i,
    /\baed\b/i,
    /\bbls\b/i,
    /\bcertified medical assistant\b/i,
    /\bmedical assistant certification\b/i,
    /\brhit\b/i,
    /\bcpc\b/i,
    /\bcoding certification\b/i,

    // Language skills
    /\bbilingual\b/i,
    /\bspanish\b/i,
    /\benglish\b/i,
    /\bmultilingual\b/i
  ];

  const certificationPatterns = [
    /\bcpr certified\b/i,
    /\baed certified\b/i,
    /\bbls certification\b/i,
    /\bacls certification\b/i,
    /\bcma\b/i,
    /\brhit\b/i,
    /\brhiat\b/i,
    /\bcpc\b/i,
    /\bccs\b/i,
    /\bcpc.h\b/i,
    /\bhcs.d\b/i,
    /\bmedical assistant certificate\b/i,
    /\bphlebotomy certification\b/i,
    /\bmedical billing certification\b/i,
    /\bmedical coding certification\b/i,
    /\bhca certification\b/i,
    /\bhealthcare administration certificate\b/i
  ];

  jobs.forEach(job => {
    const qualifications = (job.qualifications || '').toLowerCase();
    const description = (job.jobDescription || '').toLowerCase();
    const combined = `${qualifications} ${description}`;

    // Analyze skills
    skillPatterns.forEach(pattern => {
      if (pattern.test(combined)) {
        const skillMatch = combined.match(pattern);
        if (skillMatch) {
          const skill = skillMatch[0].toLowerCase().trim();
          skillFrequency.set(skill, (skillFrequency.get(skill) || 0) + 1);
        }
      }
    });

    // Analyze certifications
    certificationPatterns.forEach(pattern => {
      if (pattern.test(combined)) {
        const certMatch = combined.match(pattern);
        if (certMatch) {
          const cert = certMatch[0].toLowerCase().trim();
          certificationFrequency.set(cert, (certificationFrequency.get(cert) || 0) + 1);
        }
      }
    });
  });
}

// Analyze experience requirements
function analyzeExperienceRequirements() {
  jobs.forEach(job => {
    const qualifications = (job.qualifications || '').toLowerCase();
    const description = (job.jobDescription || '').toLowerCase();
    const title = (job.jobTitle || '').toLowerCase();
    const combined = `${qualifications} ${description} ${title}`;

    let experience = 'Not specified';

    // Check for specific experience ranges first
    if (/\b5\+?\s?years?\b/i.test(combined) || /\bfive\+?\s?years?\b/i.test(combined)) {
      experience = '5+ years';
    } else if (/\b3.?5\s?years?\b/i.test(combined) || /\bthree.?five\s?years?\b/i.test(combined)) {
      experience = '3-5 years';
    } else if (/\b2.?3\s?years?\b/i.test(combined) || /\btwo.?three\s?years?\b/i.test(combined)) {
      experience = '2-3 years';
    } else if (/\b1.?2\s?years?\b/i.test(combined) || /\bone.?two\s?years?\b/i.test(combined)) {
      experience = '1-2 years';
    } else if (/\bentry.?level\b/i.test(combined) || /\bno experience\b/i.test(combined) || /\b0\s?years?\b/i.test(combined)) {
      experience = 'Entry-level (0 years)';
    } else if (/\bexperience preferred\b/i.test(combined) || /\bsome experience\b/i.test(combined) || /\bprior experience\b/i.test(combined)) {
      experience = 'Some experience preferred';
    } else if (/\bminimum.*year/i.test(combined) || /\bat least.*year/i.test(combined)) {
      // Extract specific minimum years
      const minMatch = combined.match(/minimum.*?(\d+)\+?\s?years?/i) || combined.match(/at least.*?(\d+)\+?\s?years?/i);
      if (minMatch) {
        const years = parseInt(minMatch[1]);
        if (years >= 5) experience = '5+ years';
        else if (years >= 3) experience = '3-5 years';
        else if (years >= 2) experience = '2-3 years';
        else if (years >= 1) experience = '1-2 years';
        else experience = 'Entry-level (0 years)';
      }
    }

    experienceRequirements.set(experience, (experienceRequirements.get(experience) || 0) + 1);
  });
}

// Generate analysis report
function generateReport() {
  console.log('\n' + '='.repeat(80));
  console.log('HEALTHCARE ADMINISTRATION JOBS ANALYSIS REPORT');
  console.log('='.repeat(80));
  console.log(`Total jobs analyzed: ${jobs.length}`);
  console.log(`Analysis date: ${new Date().toLocaleDateString()}`);
  console.log('='.repeat(80));

  // Job Categories Analysis
  console.log('\n📊 JOB CATEGORIES ANALYSIS');
  console.log('-'.repeat(50));
  console.log('Main categories of healthcare administration job types:');

  const sortedCategories = Array.from(jobCategories.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15); // Top 15 categories

  sortedCategories.forEach(([category, count], index) => {
    const percentage = ((count / jobs.length) * 100).toFixed(1);
    console.log(`${index + 1}. ${category}: ${count} jobs (${percentage}%)`);
  });

  // Skills Analysis
  console.log('\n🎯 MOST IMPORTANT SKILLS FOR HEALTHCARE ADMIN STUDENTS');
  console.log('-'.repeat(60));
  console.log('Top skills mentioned across all job postings:');

  const sortedSkills = Array.from(skillFrequency.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20); // Top 20 skills

  sortedSkills.forEach(([skill, count], index) => {
    const percentage = ((count / jobs.length) * 100).toFixed(1);
    console.log(`${index + 1}. ${skill}: ${count} jobs (${percentage}%)`);
  });

  // Certifications Analysis
  console.log('\n📜 IMPORTANT CERTIFICATIONS AND CREDENTIALS');
  console.log('-'.repeat(50));
  console.log('Most requested certifications in healthcare admin jobs:');

  const sortedCerts = Array.from(certificationFrequency.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15); // Top 15 certifications

  sortedCerts.forEach(([cert, count], index) => {
    const percentage = ((count / jobs.length) * 100).toFixed(1);
    console.log(`${index + 1}. ${cert}: ${count} jobs (${percentage}%)`);
  });

  // Experience Requirements Analysis
  console.log('\n⏰ EXPERIENCE REQUIREMENTS ANALYSIS');
  console.log('-'.repeat(40));
  console.log('Experience levels required for healthcare admin positions:');

  const sortedExperience = Array.from(experienceRequirements.entries())
    .sort((a, b) => b[1] - a[1]);

  sortedExperience.forEach(([experience, count]) => {
    const percentage = ((count / jobs.length) * 100).toFixed(1);
    console.log(`${experience}: ${count} jobs (${percentage}%)`);
  });

  // Key Insights for Students
  console.log('\n🎓 KEY INSIGHTS FOR HEALTHCARE ADMINISTRATION STUDENTS');
  console.log('-'.repeat(60));

  const entryLevelJobs = experienceRequirements.get('Entry-level (0 years)') || 0;
  const lowExpJobs = (experienceRequirements.get('1-2 years') || 0) + (experienceRequirements.get('Some experience preferred') || 0);

  console.log(`• ${entryLevelJobs + lowExpJobs} jobs (${(((entryLevelJobs + lowExpJobs) / jobs.length) * 100).toFixed(1)}%) are suitable for recent graduates`);
  console.log(`• ${sortedSkills[0][1]} jobs require ${sortedSkills[0][0]} (${((sortedSkills[0][1] / jobs.length) * 100).toFixed(1)}% of all positions)`);
  console.log(`• ${sortedSkills[1][1]} jobs require ${sortedSkills[1][0]} (${((sortedSkills[1][1] / jobs.length) * 100).toFixed(1)}% of all positions)`);
  console.log(`• Top job category: ${sortedCategories[0][0]} (${sortedCategories[0][1]} positions)`);

  console.log('\n💡 RECOMMENDATIONS FOR STUDENTS:');
  console.log('• Focus on developing strong communication and customer service skills');
  console.log('• Gain proficiency in Microsoft Office (Excel, Word, Outlook)');
  console.log('• Learn healthcare-specific terminology and HIPAA regulations');
  console.log('• Consider obtaining CPR/BLS certification');
  console.log('• Develop experience in customer-facing roles during college');
  console.log('• Consider healthcare internships or part-time positions');

  console.log('\n' + '='.repeat(80));
  console.log('END OF ANALYSIS REPORT');
  console.log('='.repeat(80));
}

// Run the analysis
function runAnalysis() {
  console.log('🔍 Starting Healthcare Administration Jobs Analysis...');
  console.log('This may take a few moments for large datasets...\n');

  loadJobData();
  categorizeJobs();
  analyzeSkillsAndCertifications();
  analyzeExperienceRequirements();
  generateReport();
}

// Export for use as module
module.exports = { runAnalysis };

// Run if called directly
if (require.main === module) {
  runAnalysis();
}