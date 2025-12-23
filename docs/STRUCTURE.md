# Mat Dixon Health Admin Jobs - Project Structure

## Overview
This project processes health administration job postings from HTML files and converts them to structured data formats.

## Directory Structure

```
project-root/
├── data/
│   ├── html/                 # HTML job posting files
│   ├── json/                 # Individual JSON files (one per job)
│   │   ├── 1-9_*.json        # Manual HTML processing outputs
│   │   ├── healthcare_admin_jobs_west_100plus.json  # Pipeline output
│   │   └── western_states.json  # Sample/test western states job data
│   └── Healthcare Operations Coordinator.txt  # Text file
├── docs/
│   └── README.md
├── hc_jobs_pipeline/         # Python job collection pipeline
│   ├── employers.json        # Employer ATS configurations
│   ├── README.md             # Pipeline documentation
│   ├── requirements.txt      # Python dependencies
│   ├── run_collect.py        # Main collection script
│   └── output/               # Generated JSON outputs
├── output/
│   └── jobs_consolidated.xlsx # Generated Excel file
├── scripts/
│   ├── extract_job.js        # Browser-based extraction script
│   ├── generate_excel.js     # Alternative Excel generation script
│   ├── html_to_json.js       # Processes HTML files to JSON
│   ├── json_to_excel.js      # Generates Excel from JSON files
│   ├── parse_html.js         # HTML parsing utilities
│   └── split_json.js         # Utility to split combined JSON
└── templates/
```

## Workflow

### Option 1: HTML Processing (Manual Collection)
1. Place HTML job posting files in `data/html/`
2. Run: `npm run html-to-json`
3. This creates individual JSON files in `data/json/` (one file per job posting)
4. Run: `npm run json-to-excel`
5. This reads all JSON files from `data/json/` and creates `output/jobs_consolidated.xlsx`

### Option 2: ATS API Collection (Automated)
1. Navigate to `hc_jobs_pipeline/`
2. Follow setup: create venv, install requirements.txt, configure employers.json
3. Run: `py run_collect.py`
4. This collects jobs from ATS APIs and saves JSON arrays in `hc_jobs_pipeline/output/`
5. Pipeline output automatically appears in both locations:
   - `hc_jobs_pipeline/output/healthcare_admin_jobs_west_100plus.json` (pipeline output)
   - `data/json/healthcare_admin_jobs_west_100plus.json` (for Excel processing)
6. Run: `npm run json-to-excel` to generate Excel from all JSON files in `data/json/`

## Scripts

### html_to_json.js
- **Input**: HTML files in `data/html/`
- **Output**: Individual JSON files in `data/json/`
- Extracts job title, company, location, description, qualifications, pay, date, entryLevelFlag, and careerTrack

### generate_excel.js
- **Input**: All JSON files in `data/json/`
- **Output**: Alternative Excel generation method
- Handles both individual jobs and job arrays from pipeline

### parse_html.js
- HTML parsing utilities and selectors
- Handles varied Indeed page structures with fuzzy matching
- Used by html_to_json.js for robust extraction

### json_to_excel.js
- **Input**: All JSON files in `data/json/`
- **Output**: Excel file `output/jobs_consolidated.xlsx`
- Creates a consolidated spreadsheet with all job data

### extract_job.js
- Browser console script for manual extraction from job posting websites
- Copy and paste into browser console on a job posting page

### split_json.js
- Utility script to convert a single large JSON file into individual files
- Used for migration from old structure to new structure

## Benefits of New Structure

1. **Modular**: Each job is stored in its own JSON file
2. **Scalable**: Easy to add/remove individual jobs without affecting others  
3. **Organized**: Clear separation of HTML sources and JSON data
4. **Flexible**: Scripts can process any number of JSON files automatically
5. **Version Control Friendly**: Individual files create cleaner diffs

## Usage Examples

```bash
# Process new HTML files
npm run html-to-json

# Generate updated Excel file
npm run json-to-excel

# Both operations together
npm start
```