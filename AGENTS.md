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