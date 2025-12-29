# Agent Commands and Tasks

This file documents commands and tasks for opencode to remember across sessions.

## Main Commands

### Automated Pipeline
- **Run job scraper**: `cd hc_jobs_pipeline && python run_collect.py`
- **Enhance pay extraction**: `cd hc_jobs_pipeline && python update_pay_from_urls.py`

### Manual Job Collection  
- **Convert HTML to JSON**: `node scripts/html_to_json.js`
- **Generate Excel**: `npm run json-to-excel`

## Key Tasks Completed

1. **Multi-Source Job Collection**: 
   - Automated: Lever and Greenhouse APIs (414 jobs)
   - Manual: Indeed job scraping with HTML extraction (24 jobs)
   - Combined processing workflow established
2. **Flexible Education Filtering**: 
   - Pipeline data: Bachelor's degree requirement filtering maintained
   - HTML files: No filtering applied (hand-selected jobs)
   - Excel output: Combined approach yielding 56 filtered jobs
3. **Enhanced Pay Extraction**: 
   - Multiple pay pattern recognition
   - Full HTML scraping for missing compensation
   - Hourly rate normalization
4. **Professional Excel Formatting**:
   - Bullet-pointed qualifications with proper line breaks
   - Clickable hyperlinked source URLs (blue styling)  
   - MM-DD-YYYY date formatting
   - Advanced styling via xlsx-populate library
5. **Data Quality & Processing**:
   - Validation and error handling
   - Low pay filtering (<$10/hr excluded)
   - Duplicate detection and source tracking

## Current State (December 29, 2025)

- **Total Jobs Collected**: 438 (414 pipeline + 24 manual)
- **Final Excel Output**: 56 jobs meeting education criteria
- **Latest Excel File**: `output/jobs_consolidated_2025-12-29_16-56-31.xlsx`
- **Data Sources**: 
  - Pipeline: `hc_jobs_pipeline/output/healthcare_admin_jobs_us_nationwide.json`
  - Manual: 24 individual JSON files in `data/json/`

## Workflow Notes

### Education Filtering Strategy
- **Pipeline Jobs**: Education filtering applied (bachelor's degree required)
- **Manual Jobs**: No filtering (hand-selected, curated positions)  
- **Excel Generation**: Combines both approaches for comprehensive results

### File Processing
- HTML files saved to `data/html/` directory
- `html_to_json.js` processes all HTML files without education requirements
- `json_to_excel.js` combines pipeline + manual data with filtering applied at Excel level

## Notes for Future Sessions

- Manual job collection bypasses education filtering due to hand-selection
- Pipeline maintains education filtering for automated quality control
- Excel generation provides final filtering and professional formatting
- Pay extraction prioritizes full HTML scraping over API descriptions
- xlsx-populate library enables advanced Excel styling and hyperlinks