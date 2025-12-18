# Healthcare Administration Job Postings Organizer

This project extracts job posting details from saved Indeed HTML files and organizes them into an Excel spreadsheet for easy review and management.

## Project Structure

- `docs/`: Documentation (this README).
- `scripts/`: JavaScript files for extraction and generation.
  - `extract_job.js`: Manual script for browser console (for single jobs).
  - `parse_html.js`: Node.js script to parse saved HTML files and extract data.
  - `generate_excel.js`: Script to create Excel file from extracted job data.
- `data/`: Input and output data.
  - `Healthcare Operations Coordinator.txt`: List of job titles and URLs (reference).
  - `*.html`: Saved Indeed job pages.
  - `jobs_data.json`: Extracted job data in JSON format.
- `output/`: Generated Excel files (`jobs.xlsx`).
- `package.json`: Dependencies (Cheerio for HTML parsing, xlsx for Excel generation).

## Setup

1. Ensure Node.js is installed (https://nodejs.org).
2. Run `npm install` to install dependencies (Cheerio, xlsx).
3. Place saved HTML files in `data/` (e.g., `data/job1.html`).

## Usage

### Automated Workflow for Bulk Jobs

1. Save Indeed job pages: For each job URL, open in browser, save as "Webpage, Complete" (.html file) in `data/`.
2. Run `npm start`: Parses all `.html` files in `data/`, extracts job details (title, company, location, description, qualifications, pay, date), and saves to `data/jobs_data.json`.
3. Run `npm run excel`: Generates `output/jobs.xlsx` with data in columns (Job Title, Company, Location, Job Description, Qualifications, Pay, Date).

### Manual Extraction (Single Job)

1. Open job URL in browser.
2. Paste `scripts/extract_job.js` into console and run.
3. Copy the JSON output to `data/jobs_data.json`.
4. Run `npm run excel` to create the Excel file.

## Features

- **Robust Extraction**: Handles varied Indeed page structures with fuzzy matching for qualifications, pay ranges (annual/hourly), and descriptions.
- **Data Cleaning**: Removes duplicates, formats text with proper spacing and headings.
- **Excel Output**: Structured spreadsheet with truncated fields for compatibility (e.g., descriptions limited to 10,000 characters).
- **Error Handling**: Skips problematic files and logs issues.

## Notes

- Pay extraction identifies ranges and units (e.g., "$87,520 - $117,941 a year", "$28.76 - $48.96 an hour").
- Qualifications include degrees, experience, skills, etc., from various page sections.
- Date field may be "N/A" if not found.
- For large datasets, process in batches if needed.

## Troubleshooting

- If parsing fails, check HTML file integrity.
- Excel errors: Ensure file is closed; cell limits are enforced.
- Update selectors in `parse_html.js` if Indeed changes layout.

## Future Enhancements

- Add more job sites.
- Integrate with APIs for direct scraping (if allowed).
- Automate HTML saving with browser scripts.