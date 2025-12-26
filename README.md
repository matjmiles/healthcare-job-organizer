# Healthcare Admin Jobs Scraper and Excel Generator

This project scrapes healthcare administration job listings from platforms like Lever and Greenhouse, filters them based on education requirements (bachelor's degree or higher), and generates a formatted Excel file with job details.

## Features

- **Job Scraping**: Collects jobs from specified employers on Lever and Greenhouse platforms
- **Education Filtering**: Only includes jobs requiring bachelor's degree or higher; excludes roles needing only high school or associate's degrees
- **Pay Extraction**: Attempts to extract compensation from job descriptions and full HTML pages, normalized to hourly rates
- **Excel Formatting**:
  - Qualifications formatted with bullet points and line breaks
  - Hyperlinked source URLs (blue and underlined)
  - Dates formatted as MM-DD-YYYY
  - Filtered to show only relevant jobs

## Project Structure

- `hc_jobs_pipeline/`: Main pipeline directory
  - `run_collect.py`: Main scraper script
  - `update_pay_from_urls.py`: Script to enhance pay extraction by fetching full job pages
  - `enhanced_qualifications.py`: Qualifications extraction logic
  - `education_filters.py`: Education requirement filtering
  - `relaxed_education_filters.py`: Alternative filtering logic
  - `employers.json`: List of employers to scrape
  - `output/`: Generated JSON and Excel files
- `scripts/json_to_excel.js`: Node.js script to convert JSON to formatted Excel
- `package.json`: Node.js dependencies

## Key Accomplishments

1. **Initial Setup**: Scraped jobs from Lever and Greenhouse APIs
2. **Education Filtering**: Implemented bachelor's degree requirement filtering to focus on appropriate roles
3. **Pay Enhancement**: Added pay extraction from descriptions and full HTML scraping
4. **Excel Formatting**:
   - Bullet-pointed qualifications with proper line breaks
   - Active hyperlinks for job sources
   - Consistent date formatting
5. **Data Quality**: Added filters to prevent erroneous low pay values (<$10/hr)

## Usage

1. Run scraper: `cd hc_jobs_pipeline && python run_collect.py`
2. Enhance pay data: `cd hc_jobs_pipeline && python update_pay_from_urls.py`
3. Generate Excel: `npm run json-to-excel`

## Dependencies

- Python: httpx, beautifulsoup4, rapidfuzz, dateutil
- Node.js: xlsx, xlsx-populate