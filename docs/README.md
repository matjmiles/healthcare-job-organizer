# Healthcare Administration Job Postings Organizer

This project extracts job posting details from saved Indeed HTML files and organizes them into an Excel spreadsheet for easy review and management.

## Project Structure

- `docs/`: Documentation (this README).
- `scripts/`: JavaScript files for extraction and generation.
  - `extract_job.js`: Manual script for browser console (for single jobs).
  - `html_to_json.js`: Node.js script to parse saved HTML files and extract data into JSON.
  - `json_to_excel.js`: Script to create Excel file from JSON data.
- `hc_jobs_pipeline/`: Python-based job collection pipeline.
  - Collects job listings from public ATS APIs (Lever, Greenhouse).
  - Filters to western states and healthcare admin roles.
  - Outputs structured JSON files ready for processing.
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

1. Save Indeed job pages: For each job URL, open in browser, save as "Webpage, Complete" (.html file) in `data/html/`.
2. Run `npm run html-to-json`: Parses all `.html` files in `data/html/`, extracts job details, and saves individual JSON files to `data/json/`.

**Enhanced Job Data Schema (from ATS Pipeline):**
- Core fields: `jobTitle`, `company`, `location`, `jobDescription`, `qualifications`
- Pay information: `payHourly`, `payRaw` (when available)
- Metadata: `date`, `entryLevelFlag`, `careerTrack`, `remoteFlag`, `state`
- Source tracking: `sourceFile`, `sourcePlatform`, `collectedAt`
3. Run `npm run json-to-excel`: Generates `output/jobs_consolidated.xlsx` with data in columns (Job Title, Company, Location, Job Description, Qualifications, Pay, Date, Entry Level Flag, Career Track) from all JSON files in `data/json/`.
4. Alternatively, run `npm start` to execute both steps sequentially.

### Manual Extraction (Single Job)

1. Open job URL in browser.
2. Paste `scripts/extract_job.js` into console and run.
3. Copy the JSON output to `data/jobs_data.json`.
4. Run `npm run excel` to create the Excel file.

### Automated Job Collection from ATS APIs

1. Navigate to `hc_jobs_pipeline/` directory.
2. Follow setup instructions in `hc_jobs_pipeline/README.md` (create venv, install dependencies).
3. Edit `employers.json` with ATS slugs for target employers.
4. Run `py run_collect.py` to collect jobs from western states.
5. Pipeline automatically outputs to both `hc_jobs_pipeline/output/` and `data/json/` for seamless integration.

**Pipeline Features:**
- **Geographic Filtering**: ID, WA, OR, UT, WY, MT, CO, AZ
- **Smart Title Filtering**: Includes coordinator, specialist, assistant roles; excludes director, physician, senior roles
- **Career Track Classification**: Automatically categorizes as "Hospital Administration" or "Long-Term Care Administration"
- **Entry-Level Detection**: Identifies likely entry-level positions using title hints and description analysis
5. Output files will be in `hc_jobs_pipeline/output/` as JSON arrays compatible with the main processing pipeline.

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