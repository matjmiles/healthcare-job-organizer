# Healthcare Admin Jobs Scraper and Excel Generator

This project scrapes healthcare administration job listings from platforms like Lever and Greenhouse, filters them based on education requirements (bachelor's degree or higher), and generates a formatted Excel file with job details.

## Features

- **Multi-Source Job Scraping**:
  - Automated collection from Lever and Greenhouse APIs (865 jobs analyzed → 18 filtered)
  - Manual collections: 103 human-curated jobs (no additional filtering)
  - Combined dataset processing for maximum relevance
- **Maximum Restrictiveness Filtering**:
  - Pipeline data: REQUIRES bachelor's degree mention + entry-level criteria
  - Manual selections: Human-filtered (preserved as-is)
  - Final Excel: 121 total jobs (18 pipeline + 103 manual)
- **Pay Extraction**: Attempts to extract compensation from job descriptions and full HTML pages, normalized to hourly rates
- **Excel Formatting**:
  - Qualifications formatted with bullet points and line breaks
  - Hyperlinked source URLs (blue and underlined)
  - Dates formatted as MM-DD-YYYY
  - Professional formatting with xlsx-populate library

## Testing

The project includes a comprehensive test suite organized according to industry best practices:

### Test Structure
```
hc_jobs_pipeline/tests/
├── unit/                           # Unit tests for individual components
│   ├── test_education_filters.py   # Education requirement filtering
│   ├── test_health_admin_filters.py # Healthcare admin job identification
│   └── test_qualifications_extractor.py # Qualification text extraction
├── integration/                    # Integration tests for workflows
│   └── test_pipeline_flow.py      # End-to-end pipeline testing
├── debug/                          # Interactive debugging utilities
│   └── debug_education_logic.py   # Interactive filter testing
├── run_tests.py                   # Comprehensive test runner
└── README.md                      # Detailed testing guide
```

### Running Tests

**Run All Tests:**
```bash
cd hc_jobs_pipeline
python tests/run_tests.py
```

**Run Specific Categories:**
```bash
python tests/run_tests.py --unit          # Unit tests only
python tests/run_tests.py --integration   # Integration tests only
python tests/run_tests.py --debug         # Interactive debugging
```

**Individual Test Files:**
```bash
python tests/unit/test_education_filters.py      # Education filtering
python tests/unit/test_health_admin_filters.py   # Health admin identification
python tests/integration/test_pipeline_flow.py   # Full pipeline testing
```

### VS Code Debugging

The project includes VS Code debug configurations:
- **"Debug Pipeline"**: Step through main pipeline execution
- **"Debug Unit Tests"**: Debug unit tests with breakpoints
- **"Debug Integration Tests"**: Debug integration workflows
- **"Debug Education Logic"**: Interactive education filter debugging

Use F5 to start debugging, set breakpoints, and step through code execution.

### Test Coverage

- **Education Filtering**: Comprehensive test cases for bachelor's degree requirements
- **Health Admin Identification**: Job classification and keyword detection
- **Qualification Extraction**: Text parsing and structured output
- **Pipeline Integration**: End-to-end workflow validation
- **Interactive Debugging**: Real-time filter analysis

## Project Structure

- `hc_jobs_pipeline/`: Main pipeline directory
  - `run_collect.py`: Main scraper script with integrated filtering
  - `update_pay_from_urls.py`: Script to enhance pay extraction by fetching full job pages
  - `enhanced_qualifications.py`: Qualifications extraction logic
  - `education_filters.py`: Comprehensive education requirement filtering
  - `employers.json`: List of employers to scrape
  - `tests/`: Comprehensive test suite with unit/integration/debug tests
- `data/json/`: Organized JSON file storage
  - `webScrape/`: Pipeline-generated jobs (filtered through bachelor's degree criteria)
  - `manual/`: Manually curated jobs (pre-filtered by humans)
- `scripts/`: Processing scripts
  - `json_to_excel.js`: Combined Excel generation (webScrape + manual)
  - `json_to_excel_webScrape.js`: Excel from webScrape jobs only
  - `json_to_excel_manual.js`: Excel from manual jobs only
  - `json_to_excel_all.js`: Alternative combined processing
  - `html_to_json.js`: Convert HTML files to JSON
- `output/`: Final Excel files with professional formatting
- `package.json`: Node.js dependencies and scripts

## Key Accomplishments

1. **Maximum Restrictiveness Filtering System**:
   - 98% of scraped jobs filtered out for quality control
   - REQUIRES bachelor's degree mention in job postings
   - Excludes 3+ years experience and advanced degree requirements
   - Excludes senior/executive positions
2. **Dual-Source Integration**:
   - Automated pipeline: 865 jobs analyzed → 18 highly filtered positions
   - Manual collections: 103 human-curated jobs preserved as-is
   - Combined processing for comprehensive coverage
3. **Advanced Pay Data Enhancement**:
   - Pay extraction from job descriptions and full HTML pages
   - Normalized hourly rate calculations
   - Filters for erroneous low pay values (<$10/hr)
4. **Professional Excel Output**:
   - Bullet-pointed qualifications with proper line breaks
   - Active hyperlinks (blue, underlined) to job applications
   - MM-DD-YYYY date formatting
   - Optimal column widths and professional styling
5. **Comprehensive Testing Framework**:
   - 100% pass rate for core filtering logic
   - Unit, integration, and interactive debugging tests
   - VS Code debugging configurations included
6. **Data Quality Assurance**:
   - Source tracking and metadata preservation
   - Duplicate detection and removal
   - Consistent formatting across all outputs

## Usage

### Automated Pipeline
1. Run main scraper: `cd hc_jobs_pipeline && python run_collect.py`
   - Analyzes ~865 jobs from APIs
   - Applies strict bachelor's degree + entry-level filtering
   - Outputs ~18 highly relevant positions

2. Enhance pay data: `cd hc_jobs_pipeline && python update_pay_from_urls.py`
   - Fetches full job pages for pay extraction
   - Updates existing JSON with enhanced compensation data

### Manual Job Collection
- Manual collections are pre-filtered by humans
- Stored in `data/json/` directory
- Loaded as-is during Excel generation (no additional filtering)

### Excel Generation
Choose from multiple processing options:

1. **Combined Excel** (`npm run json-to-excel`):
   - Combines webScrape data (~18 filtered jobs) + manual data (~125 curated jobs)
   - Total: ~143 jobs with professional formatting

2. **Pipeline Only** (`npm run json-to-excel-webscrape`):
   - Processes only webScrape directory jobs
   - Shows results from automated filtering pipeline

3. **Manual Only** (`npm run json-to-excel-manual`):
   - Processes only manually curated jobs
   - Shows human-selected positions without additional filtering

All options include hyperlinks, bullet-pointed qualifications, and professional styling.

## Dependencies

- Python: httpx, beautifulsoup4, rapidfuzz, dateutil
- Node.js: xlsx, xlsx-populate