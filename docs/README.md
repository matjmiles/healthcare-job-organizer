# Healthcare Administration Job Postings Organizer

This project extracts job posting details from saved Indeed HTML files and organizes them into Word documents using a predefined template.

## Project Structure

- `docs/`: Documentation (this README).
- `scripts/`: JavaScript files for extraction and generation.
  - `extract_job.js`: Manual script for browser console (for single jobs).
  - `parse_html.js`: Node.js script to parse saved HTML files.
  - `generate_excel.js`: Script to create Excel file from job data.
- `data/`: Input and output data.
  - `Healthcare Operations Coordinator.txt`: List of job titles and URLs.
  - `indeed Example.html`: Sample HTML for testing.
  - `jobs_data.json`: Extracted job data.
- `output/`: Generated Excel files.
- `package.json`: Dependencies (Cheerio for HTML parsing, xlsx for Excel generation).

## Setup

1. Ensure Node.js is installed (https://nodejs.org).
2. Run `npm install` to install Cheerio.
3. Place saved HTML files in `data/` (e.g., `data/job1.html`).

## Usage

### HTML Parsing for Bulk Jobs

1. For each Indeed job URL, open in browser, save as "Webpage, Complete" (.html file) in `data/`.
2. The script automatically detects all `.html` files in `data/`.
3. Run `npm start`.
   - Parses HTML with Cheerio.
   - Extracts: Job Title, Company, Location, Description, Qualifications, Pay, Date.
   - Outputs to `data/jobs_data.json`.

### Generate Excel File

4. Run `npm run excel`.
   - Creates `output/jobs.xlsx` with job data in spreadsheet format (columns: Job Title, Company, Location, Job Description, Qualifications, Pay, Date).

### Manual Extraction (Single Job)

1. Open job URL in browser.
2. Paste `scripts/extract_job.js` into console.
3. Copy JSON output to `data/jobs_data.json`.
4. Run `npm run excel` to generate Excel.