# Healthcare Admin Jobs Scraper and Excel Generator

This project scrapes healthcare administration job listings from platforms like Lever and Greenhouse, filters them based on education requirements (bachelor's degree or higher), and generates a formatted Excel file with job details.

## Features

- **Multi-Source Job Scraping**: 
  - Automated collection from Lever and Greenhouse APIs (414 jobs)
  - Manual Indeed job scraping with HTML extraction (24 jobs)
  - Combined dataset processing for comprehensive coverage
- **Flexible Education Filtering**: 
  - Pipeline data: Bachelor's degree requirement filtering
  - Manual selections: No filtering (hand-selected jobs)
  - Final Excel: 56 filtered jobs meeting education criteria
- **Pay Extraction**: Attempts to extract compensation from job descriptions and full HTML pages, normalized to hourly rates
- **Excel Formatting**:
  - Qualifications formatted with bullet points and line breaks
  - Hyperlinked source URLs (blue and underlined)
  - Dates formatted as MM-DD-YYYY
  - Professional formatting with xlsx-populate library

## Project Structure

- `hc_jobs_pipeline/`: Main pipeline directory
  - `run_collect.py`: Main scraper script
  - `update_pay_from_urls.py`: Script to enhance pay extraction by fetching full job pages
  - `enhanced_qualifications.py`: Qualifications extraction logic
  - `education_filters.py`: Education requirement filtering
  - `relaxed_education_filters.py`: Alternative filtering logic
  - `employers.json`: List of employers to scrape
  - `output/`: Generated JSON and Excel files
- `data/`: Manual job collection
  - `html/`: Indeed job postings in HTML format
  - `json/`: Converted JSON files from HTML processing
- `scripts/`: Processing scripts
  - `html_to_json.js`: Convert HTML files to JSON (no education filtering)
  - `json_to_excel.js`: Node.js script to convert JSON to formatted Excel
  - `education_filter_js.js`: Education filtering logic for HTML processing
- `output/`: Final Excel files with combined and filtered data
- `package.json`: Node.js dependencies

## Key Accomplishments

1. **Multi-Source Data Collection**: 
   - Automated pipeline: 414 jobs from Lever/Greenhouse APIs
   - Manual collection: 24 hand-selected Indeed jobs
   - Combined processing workflow
2. **Flexible Education Filtering**: 
   - Pipeline: Bachelor's degree requirement filtering
   - Manual: No filtering for hand-selected jobs
   - Excel: Combined approach with 56 final filtered jobs
3. **Advanced Pay Enhancement**: 
   - Pay extraction from job descriptions
   - Full HTML page scraping for missing compensation
   - Normalized hourly rate calculations
4. **Professional Excel Formatting**:
   - Bullet-pointed qualifications with proper line breaks
   - Clickable hyperlinks for job sources (blue styling)
   - MM-DD-YYYY date formatting
   - Advanced styling with xlsx-populate library
5. **Data Quality Controls**: 
   - Filters for erroneous low pay values (<$10/hr)
   - Duplicate detection and removal
   - Source tracking and metadata preservation

## Usage

### Automated Pipeline
1. Run main scraper: `cd hc_jobs_pipeline && python run_collect.py`
2. Enhance pay data: `cd hc_jobs_pipeline && python update_pay_from_urls.py`

### Manual Job Collection
1. Save Indeed job pages as HTML files in `data/html/`
2. Convert HTML to JSON: `node scripts/html_to_json.js`

### Excel Generation
1. Generate final Excel: `npm run json-to-excel`
   - Combines pipeline data (414 jobs) + HTML data (24 jobs)
   - Applies education filtering: 438 total → 56 final jobs
   - Creates formatted Excel with hyperlinks and styling

## Dependencies

- Python: httpx, beautifulsoup4, rapidfuzz, dateutil
- Node.js: xlsx, xlsx-populate