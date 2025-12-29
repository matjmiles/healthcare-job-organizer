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

1. **Multi-Source Job Collection**: 
   - Automated: Lever and Greenhouse APIs (16 jobs after strict filtering)
   - Manual: Indeed job scraping with HTML extraction (24 jobs)
   - Combined processing workflow established

2. **Architectural Education Filtering Improvements**: 
   - **Fixed Architecture**: Education filtering moved from Excel script to Python pipeline
   - **Inclusive Bachelor's Logic**: Jobs included if bachelor's degree mentioned in ANY way (required, preferred, desired, plus, etc.)   - **Refined Filtering**: Removed counterproductive context exclusions (e.g., entry-level restrictions)   - **Pipeline Filtering**: Strict education filtering applied at data collection level (Python)
   - **Excel Script Simplification**: Removed education filtering, now handles only data combination and formatting

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
   - Geographic extraction with comprehensive US state/region mapping

6. **Test Infrastructure & Debugging**:
   - **Organized Test Suite**: Industry-standard test organization with unit/integration/debug separation
   - **VS Code Integration**: Full debugging support with step-through capabilities
   - **Comprehensive Coverage**: Education filters, health admin identification, qualification extraction
   - **Interactive Debug Tools**: Real-time testing and analysis utilities

## Current State (December 29, 2025)

- **Pipeline Jobs**: 17 (from 1,499 analyzed with refined inclusive bachelor's filtering)
- **Manual Jobs**: 24 (hand-selected from Indeed HTML)
- **Final Excel Output**: 41 jobs total (17 pipeline + 24 manual)
- **Latest Excel File**: `output/jobs_consolidated_2025-12-29_19-56-12.xlsx`
- **Data Sources**: 
  - Pipeline: `hc_jobs_pipeline/output/healthcare_admin_jobs_us_nationwide.json`
  - Manual: 24 individual JSON files in `data/json/`

## Workflow Notes

### Testing & Debugging (New Architecture)
- **Test Organization**: `hc_jobs_pipeline/tests/` with unit/integration/debug separation
  - **Unit Tests**: Individual component testing (education filters, health admin identification, qualification extraction)
  - **Integration Tests**: End-to-end pipeline testing with mocked data
  - **Debug Utilities**: Interactive testing and analysis tools
- **VS Code Integration**: Full debugging support with launch configurations
  - "Debug Pipeline": Step-by-step main pipeline debugging
  - "Debug Unit Tests": Individual test debugging
  - "Debug Education Logic": Interactive filter analysis
- **Test Runner**: `python tests/run_tests.py` with options for --unit, --integration, --debug
- **Interactive Debugging**: Step-through debugging for pipeline flow analysis
- **Test Coverage**: Comprehensive validation of filtering logic, job identification, and data quality

### Education Filtering Strategy (Updated Architecture)
- **Pipeline Jobs**: Inclusive bachelor's degree filtering applied in Python (`education_filters.py`)
  - INCLUDES: Bachelor's required, preferred, desired, mentioned, or "a plus"
  - EXCLUDES: Only high school/associates mentioned with NO bachelor's mention
  - EXCLUDES: Advanced degrees (overqualified positions)
  - REFINED: Removed context exclusions for entry-level bachelor's positions
- **Manual Jobs**: No filtering (hand-selected, curated positions)  
- **Excel Generation**: Simple data combination without additional filtering

### File Processing
- HTML files saved to `data/html/` directory
- `html_to_json.js` processes all HTML files with comprehensive geographic mapping
- `json_to_excel.js` combines pre-filtered pipeline + manual data for final output

### Key Architecture Fix
- **Before**: Education filtering incorrectly applied in Excel script to combined data
- **After**: Education filtering properly applied in Python pipeline before JSON generation
- **Result**: Clean separation of concerns and consistent filtering logic

## Notes for Future Sessions

- Education filtering happens once at pipeline level (Python) using `meets_bachelors_requirement()`
- Manual job collection bypasses education filtering due to hand-selection
- Excel generation focuses purely on data combination and professional formatting
- Geographic extraction includes all 50 US states across 4 Census regions
- Pay extraction prioritizes full HTML scraping over API descriptions
- xlsx-populate library enables advanced Excel styling and hyperlinks

### Testing & Quality Assurance
- Comprehensive test suite available in `hc_jobs_pipeline/tests/`
- Use `python tests/run_tests.py` for full test execution
- VS Code debugging configurations ready for step-by-step analysis
- Interactive debugging tools available for filter logic analysis
- Test coverage includes unit tests, integration tests, and debug utilities
- All major components (education filters, health admin identification, qualification extraction) have dedicated test files