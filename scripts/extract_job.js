// Script to extract job details from Indeed job page
// Run this in the browser console on a job posting page

function extractJobDetails() {
  const data = {};

  // Job Title
  const titleElement = document.querySelector('h1.jobsearch-JobInfoHeader-title');
  data.jobTitle = titleElement ? titleElement.textContent.trim() : 'N/A';

  // Company
  const companyElement = document.querySelector('div.jobsearch-InlineCompanyRating div[aria-label]');
  data.company = companyElement ? companyElement.textContent.trim() : 'N/A';

  // Location
  const locationElement = document.querySelector('div.jobsearch-JobInfoHeader-subtitle div[data-testid="jobsearch-JobInfoHeader-subtitle"] span');
  if (!locationElement) {
    // Alternative selector
    const loc = document.querySelector('div.jobsearch-JobMetadataHeader-item');
    data.location = loc ? loc.textContent.trim() : 'N/A';
  } else {
    data.location = locationElement.textContent.trim();
  }

  // Job Description
  const descElement = document.querySelector('div#jobDescriptionText');
  data.jobDescription = descElement ? descElement.textContent.trim() : 'N/A';

  // Qualifications - often in description or separate
  // Look for sections like "Requirements" or "Qualifications"
  const qualifications = [];
  const sections = document.querySelectorAll('div#jobDescriptionText b, div#jobDescriptionText strong');
  sections.forEach(section => {
    const text = section.textContent.toLowerCase();
    if (text.includes('qualifications') || text.includes('requirements') || text.includes('skills')) {
      const nextP = section.nextElementSibling;
      if (nextP && nextP.tagName === 'UL') {
        const lis = nextP.querySelectorAll('li');
        lis.forEach(li => qualifications.push(li.textContent.trim()));
      } else if (nextP) {
        qualifications.push(nextP.textContent.trim());
      }
    }
  });
  data.qualifications = qualifications.join('; ') || 'N/A';

  // Pay/Salary
  const payElement = document.querySelector('div.jobsearch-JobMetadataHeader-item');
  // Pay is often the first or second item
  const metadataItems = document.querySelectorAll('div.jobsearch-JobMetadataHeader-item');
  data.pay = metadataItems.length > 1 ? metadataItems[1].textContent.trim() : (metadataItems[0] ? metadataItems[0].textContent.trim() : 'N/A');

  // Posting Date
  data.date = metadataItems.length > 0 ? metadataItems[0].textContent.trim() : 'N/A';

  // Output as JSON
  console.log(JSON.stringify(data, null, 2));
}

extractJobDetails();