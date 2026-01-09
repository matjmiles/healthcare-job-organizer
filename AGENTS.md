# Agent Commands and Tasks

This file documents commands and tasks for opencode to remember across sessions.

## Main Commands

### Automated Pipeline
- **Run job scraper**: `cd hc_jobs_pipeline && python run_collect.py`
- **Enhance pay extraction**: `cd hc_jobs_pipeline && python update_pay_from_urls.py`

### Manual Job Collection  
- **Convert HTML to JSON**: `node scripts/html_to_json.js`
- **Convert Word documents to JSON**: `node scripts/word_to_json.js`
- **Generate Excel (all sources)**: `npm run json-to-excel`
- **Generate Excel (word only)**: `node scripts/json_to_excel_word.js`
- **Interactive Excel menu**: `node scripts/run_excel_menu.js`
- **Analyze job market insights**: `npm run analyze-jobs`

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
   - Manual: 125 human-curated jobs (preserved as-is)
   - Word Document: 59 positions (converted from .docx files)
   - Combined Excel: 202 total positions

4. **Professional Excel Output**:
   - Bullet-pointed qualifications with line breaks
   - Active hyperlinks (blue, underlined)
   - MM-DD-YYYY date formatting
   - Optimal column widths and styling

5. **Advanced Pay Data Enhancement**:
   - HTML page scraping for compensation extraction
   - Normalized hourly rates (annual salaries ÷ 2080 hours/year)
   - Filters for erroneous values (<$10/hr)
   - All pay displayed as hourly for easy comparison

6. **Healthcare Administration Job Market Analysis**:
   - Comprehensive analysis of 202 job postings for entry-level insights
   - Identified top skills, certifications, and job categories for students
   - Generated detailed report with recommendations for healthcare admin graduates
   - Focus on customer service, communication, and technical skills development

7. **Data Quality Assurance**:
   - Source tracking and metadata preservation
   - Duplicate detection and removal
   - Consistent formatting across all outputs

8. **Word Document Extraction Improvements** (January 2026):
   - Table-based parsing using cell boundary detection (double/triple newlines)
   - Proper separation of job descriptions from qualifications
   - Unicode apostrophe handling (curly `'` U+2019 vs straight `'` U+0027)
   - Qualification detection via regex patterns for education/experience markers
   - Skills section identification to prevent bleeding into descriptions

9. **HTML Extraction Overhaul** (January 2026):
   - Multi-strategy extraction system supporting 5 HTML format types
   - 100% extraction success rate (up from 78% with 22 failed files)
   - Encoding cleanup: removes Â artifacts, â€™ smart quotes, Unicode issues
   - Company name normalization for consistent employer identification
   - Pay normalization: converts annual salaries to hourly (÷ 2080 hrs/year)
   - Extraction strategies: table-based, container-styled, indeed-meta, section-based

## Current State (January 10, 2026)

- **Pipeline Jobs**: ~18 (from ~865 analyzed with maximum restrictiveness filtering)
- **HTML Jobs**: ~103 (extracted from HTML job postings)
- **Word Document Jobs**: ~59 (converted from .docx files)
- **Final Excel Output**: ~180 jobs total (18 pipeline + 103 HTML + 59 Word)
- **Latest Excel File**: `output/jobs_consolidated_2026-01-05_22-49-22.xlsx`
- **Latest Word-Only Excel**: `output/jobs_word_only_2026-01-09_19-30-01.xlsx`
- **HTML Extraction Rate**: 100% success (all 103 files processed)
- **Test Coverage**: 100% pass rate for core filtering logic

## Workflow Notes

### Data Organization (New Directory Structure)
- **webScrape Directory** (`data/json/webScrape/`):
  - Pipeline-generated jobs from automated scraping
  - Filtered through maximum restrictiveness criteria
  - Requires explicit bachelor's degree mentions
  - Excludes 3+ years experience and advanced degrees

- **HTML Directory** (`data/json/html/`):
  - HTML-extracted job postings (renamed from manual/)
  - Multi-format support: table-based, container-styled, Indeed
  - 100% extraction success rate with encoding cleanup
  - Company name normalization and pay standardization

### Processing Options
- **Combined Processing** (`npm run json-to-excel`):
  - Loads from webScrape + html + word directories
  - Creates comprehensive Excel with all available jobs

- **Separate Processing**:
  - `npm run json-to-excel-webscrape`: Pipeline jobs only
  - `npm run json-to-excel-html`: HTML-extracted jobs only
  - `npm run word-to-json`: Convert Word documents to JSON

- **Multi-Source Support**: Handles HTML, JSON, and Word document inputs

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

- **Directory Structure**: `data/json/webScrape/` for pipeline, `data/json/html/` for HTML-extracted jobs
- **Filtering Logic**: Pipeline applies maximum restrictiveness; HTML jobs preserved as-is
- **Processing Flexibility**: Scripts available for combined or separate processing
- **Quality Control**: 98% filtering rate for pipeline jobs, human curation for HTML jobs
- **Test Coverage**: Comprehensive validation with 100% pass rate maintained