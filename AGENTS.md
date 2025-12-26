# Agent Commands and Tasks

This file documents commands and tasks for opencode to remember across sessions.

## Main Commands

- **Run job scraper**: `cd hc_jobs_pipeline && python run_collect.py`
- **Enhance pay extraction**: `cd hc_jobs_pipeline && python update_pay_from_urls.py`
- **Generate Excel**: `npm run json-to-excel`

## Key Tasks Completed

1. **Job Scraping Setup**: Implemented scraping from Lever and Greenhouse APIs with employer list
2. **Education Filtering**: Added filtering for jobs requiring bachelor's degree or higher
3. **Pay Extraction**: Enhanced pay parsing with multiple patterns and HTML scraping
4. **Excel Formatting**:
   - Qualifications with bullet points and line breaks
   - Hyperlinked source URLs (styled blue/underline)
   - Date formatting (MM-DD-YYYY)
   - Pay normalization and filtering (<$10/hr excluded)
5. **Data Quality**: Added validation and error handling

## Current State

- Jobs filtered to ~49 entries meeting education criteria
- Pay data enhanced for 8+ additional jobs
- Excel fully formatted with all requirements

## Notes for Future Sessions

- Pay extraction prioritizes full HTML scraping over API descriptions
- Education filtering uses both strict and relaxed criteria
- Excel uses xlsx-populate for advanced styling
- Low pay values (<$10/hr) are filtered as likely errors