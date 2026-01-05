# Agent Commands and Tasks

This file documents commands and tasks for opencode to remember across sessions.

## Main Commands

### Automated Pipeline
- **Run job scraper**: `cd hc_jobs_pipeline && python run_collect.py`
- **Enhance pay extraction**: `cd hc_jobs_pipeline && python update_pay_from_urls.py`

### Manual Job Collection  
- **Convert HTML to JSON**: `node scripts/html_to_json.js`
- **Generate Excel**: `npm run json-to-excel`

### Testing & Quality Assurance
- **Run all tests**: `cd hc_jobs_pipeline && python tests/run_tests.py`
- **Unit tests only**: `cd hc_jobs_pipeline && python tests/run_tests.py --unit`
- **Integration tests**: `cd hc_jobs_pipeline && python tests/run_tests.py --integration`
- **Interactive debugging**: `cd hc_jobs_pipeline && python tests/debug/debug_education_logic.py`
- **VS Code debugging**: Use F5 with "Debug Pipeline" configuration

## Key Tasks Completed

1. **Maximum Restrictiveness Filtering System**:
   - REQUIRES explicit bachelor's degree mention in job postings
   - Excludes 3+ years experience requirements
   - Excludes advanced degree (Master's/PhD) positions
   - Excludes senior/executive roles
   - 98% filtering rate for quality control

2. **Comprehensive Testing Framework**:
   - Unit tests: 100% pass rate for core filtering logic
   - Integration tests: Full pipeline validation
   - Interactive debugging tools included
   - VS Code debugging configurations

3. **Dual-Source Data Integration**:
   - Pipeline: 865 jobs analyzed → 18 highly filtered positions
   - Manual: 103 human-curated jobs (preserved as-is)
   - Combined Excel: 121 total positions

4. **Professional Excel Output**:
   - Bullet-pointed qualifications with line breaks
   - Active hyperlinks (blue, underlined)
   - MM-DD-YYYY date formatting
   - Optimal column widths and styling

5. **Advanced Pay Data Enhancement**:
   - HTML page scraping for compensation extraction
   - Normalized hourly rates
   - Filters for erroneous values (<$10/hr)

6. **Data Quality Assurance**:
   - Source tracking and metadata preservation
   - Duplicate detection and removal
   - Consistent formatting across all outputs

## Current State (January 5, 2026)

- **Pipeline Jobs**: ~18 (from ~865 analyzed with maximum restrictiveness filtering)
- **Manual Jobs**: ~103 (human-curated collections)
- **Final Excel Output**: ~121 jobs total (18 pipeline + 103 manual)
- **Latest Excel File**: `output/jobs_consolidated_2026-01-05_17-30-59.xlsx`
- **Filtering Rate**: 98% of scraped jobs excluded for quality control
- **Test Coverage**: 100% pass rate for core filtering logic

## Workflow Notes

### Data Organization (New Directory Structure)
- **webScrape Directory** (`data/json/webScrape/`):
  - Pipeline-generated jobs from automated scraping
  - Filtered through maximum restrictiveness criteria
  - Requires explicit bachelor's degree mentions
  - Excludes 3+ years experience and advanced degrees

- **Manual Directory** (`data/json/manual/`):
  - Human-curated job collections
  - Pre-filtered by manual selection
  - No additional automated filtering applied
  - Preserved exactly as selected by users

### Processing Options
- **Combined Processing** (`npm run json-to-excel`):
  - Loads from both webScrape + manual directories
  - Creates comprehensive Excel with all available jobs

- **Separate Processing**:
  - `npm run json-to-excel-webscrape`: Pipeline jobs only
  - `npm run json-to-excel-manual`: Manual jobs only
  - Allows focused analysis of different data sources

### Testing & Debugging (New Architecture)
- **Test Organization**: `hc_jobs_pipeline/tests/` with unit/integration/debug separation
  - **Unit Tests**: Individual component testing (education filters, health admin identification, qualification extraction)
  - **Integration Tests**: End-to-end pipeline testing with mocked data
  - **Debug Utilities**: Interactive testing and analysis tools
- **VS Code Integration**: Full debugging support with launch configurations
- **Test Coverage**: 100% pass rate for core filtering logic

### Education Filtering Strategy (Maximum Restrictiveness)
- **Pipeline Jobs**: Strict bachelor's degree filtering applied in Python
  - REQUIRES: Bachelor's degree mentioned somewhere in job posting
  - EXCLUDES: Jobs without bachelor's degree mentions
  - EXCLUDES: 3+ years experience and advanced degree requirements
  - EXCLUDES: Senior/executive positions
- **Manual Jobs**: Human-filtered (no additional processing)
- **Excel Generation**: Reads from organized directory structure

## Notes for Future Sessions

- **Directory Structure**: `data/json/webScrape/` for pipeline, `data/json/manual/` for curated jobs
- **Filtering Logic**: Pipeline applies maximum restrictiveness; manual jobs preserved as-is
- **Processing Flexibility**: Scripts available for combined or separate processing
- **Quality Control**: 98% filtering rate for pipeline jobs, human curation for manual jobs
- **Test Coverage**: Comprehensive validation with 100% pass rate maintained