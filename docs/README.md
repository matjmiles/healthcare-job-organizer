# Healthcare Administration Job Postings Organizer

This project extracts job posting details from saved Indeed HTML files and organizes them into Word documents using a predefined template.

## Project Structure

- `docs/`: Documentation (this README).
- `scripts/`: JavaScript files for extraction and generation.
  - `extract_job.js`: Manual script for browser console (for single jobs).
  - `parse_html.js`: Node.js script to parse saved HTML files.
- `data/`: Input and output data.
  - `Healthcare Operations Coordinator.txt`: List of job titles and URLs.
  - `indeed Example.html`: Sample HTML for testing.
  - `jobs_data.json`: Extracted job data.
- `templates/`: Templates.
  - `Job Template.docx`: Word template with table.
- `output/`: Generated Word documents.
- `package.json`: Dependencies (Cheerio for HTML parsing).

## Setup

1. Ensure Node.js is installed (https://nodejs.org).
2. Run `npm install` to install Cheerio.
3. Place saved HTML files in `data/` (e.g., `data/job1.html`).

## Usage

### HTML Parsing for Bulk Jobs

1. For each Indeed job URL, open in browser, save as "Webpage, Complete" (.html file) in `data/`.
2. Edit `scripts/parse_html.js`: Update `const htmlFiles` to list your files, e.g., `['data/job1.html', 'data/job2.html']`.
3. Run `npm start`.
   - Parses HTML with Cheerio.
   - Extracts: Job Title, Company, Location, Description, Qualifications, Pay, Date.
   - Outputs to `data/jobs_data.json`.
4. Provide `data/jobs_data.json` for DOCX generation.

### Manual Extraction (Single Job)

1. Open job URL in browser.
2. Paste `scripts/extract_job.js` into console.
3. Copy JSON output to `data/jobs_data.json`.

### Generate Word Documents

After extraction, provide `data/jobs_data.json` for DOCX generation (fills template table).