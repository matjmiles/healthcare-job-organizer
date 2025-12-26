# Healthcare Administration Job Postings Organizer

An intelligent healthcare job collection and filtering system that automatically identifies healthcare administration positions from multiple sources across the entire United States. Features **relaxed education filtering** for broader entry-level coverage, pay normalization, unified data processing, regional analysis, and detailed filtering analytics.

## Key Features

- **🎓 Flexible Education Filtering**: **NEW RELAXED APPROACH** - Includes high school, associates, certificate, and bachelor's level positions while excluding only advanced degrees and senior executive roles (**27.7% inclusion rate** vs previous 0.9%)
- **🌎 Nationwide Coverage**: All 50 US states with US Census Bureau regional classification (Northeast, Midwest, South, West)
- **📊 Comprehensive Results**: **417 healthcare admin jobs** nationwide (vs. previous 13 jobs with strict filtering)
- **💰 Pay Normalization**: Converts all salary ranges to standardized hourly rates for easy comparison
- **🔗 Source Tracking**: Preserves original job URLs and tracks data source metadata
- **📈 Rich Metadata**: Includes state detection, regional classification, remote work flags, career track classification, and entry-level identification
- **📁 Dual Collection Methods**: Automated ATS API collection + manual HTML file processing
- **📋 Automated Reporting**: Timestamped Markdown reports with historical tracking and filtering effectiveness metrics

## Recent Major Enhancements (December 2025)

### Version 2.2 - Excel Enhancement Update
- **📎 Hyperlinked Source Files**: Source File column URLs now clickable with professional blue styling 
- **📦 xlsx-populate Integration**: Added second Excel library for advanced formatting capabilities
- **🎨 Enhanced Styling**: Improved cell formatting, text wrapping, and optimal column/row sizing
- **📅 Date Formatting**: Collected At dates now display in MM-DD-YYYY format for consistency
- **✨ Format Verification**: Built-in testing confirms hyperlinks, qualification formatting, and date formatting

### Version 2.1 - Education Filter Breakthrough
- **🎯 BREAKTHROUGH: Relaxed Education Filter** - Increased job results by **32x** (from 13 to 417 jobs)
- **📚 Education Inclusivity**: Now accepts high school + experience, associates degrees, certificates, and "bachelor's preferred" positions
- **🚫 Smart Exclusions**: Only filters out advanced degrees (Master's+) and senior executive positions requiring 10+ years experience
- **📊 Improved Filtering Stats**: Education requirements now filter only **1.8%** of jobs (vs previous 54.6%)
- **🏢 24 Validated Employers**: Expanded employer database with comprehensive validation system
- **🌎 True Nationwide Coverage**: 417 jobs across 26 states representing all major regions
- **✅ Enhanced Qualifications Display**: Fixed Excel bullet point formatting for improved readability of job requirements

## Project Structure

- `docs/`: Documentation including this README and project structure guide
- `scripts/`: JavaScript processing pipeline with education filtering
  - `html_to_json.js`: Processes HTML files with bachelor's degree filtering and URL extraction
  - `json_to_excel.js`: Generates comprehensive Excel files with 14 metadata columns
  - `education_filter_js.js`: Advanced education requirement analysis (JavaScript implementation)
  - `extract_job.js`: Manual browser console extraction for single jobs
- `hc_jobs_pipeline/`: Python-based automated job collection pipeline
  - `run_collect.py`: Main collection script with comprehensive filtering
  - `education_filters.py`: Sophisticated bachelor's degree requirement analysis
  - `employers.json`: Configured ATS endpoints for 14+ healthcare organizations
- `data/`: Structured data storage
  - `html/`: Saved Indeed job pages for manual processing
  - `json/`: Individual job files and consolidated datasets
- `output/`: Generated Excel files with timestamp-based naming
- `package.json`: Dependencies for HTML parsing, Excel generation (XLSX + xlsx-populate), and data processing

## Setup

### Prerequisites
1. **Node.js** (https://nodejs.org) for JavaScript processing
2. **Python 3.8+** for automated ATS collection pipeline

### Installation
```bash
# Install JavaScript dependencies
npm install

# Set up Python environment (for ATS pipeline)
cd hc_jobs_pipeline
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

## Usage

### 🚀 Automated ATS Collection (Recommended)

1. **Run the Python pipeline**: Automatically collects jobs from 24 healthcare organizations
   ```bash
   cd hc_jobs_pipeline
   python run_collect.py
   ```
   - Targets all 50 US states + DC with regional classification
   - Applies **relaxed education filtering** (typical result: **~417 qualified jobs** from 1,500+ total analyzed)
   - Includes high school, associates, certificate, and bachelor's level positions
   - Excludes only advanced degrees and senior executive roles
   - Outputs to `hc_jobs_pipeline/output/healthcare_admin_jobs_us_nationwide.json`
   - Generates detailed filtering statistics showing **27.7% inclusion rate**

2. **Generate comprehensive report**:
   ```bash
   cd hc_jobs_pipeline
   python run_summary.py
   ```
   - Creates timestamped Markdown report with filtering analytics
   - Shows breakdown of why jobs were excluded (clinical roles, education requirements, etc.)
   - Includes inclusion rates and processing statistics
   - Saves historical reports for trend analysis

3. **Generate Excel report** (optional):
   ```bash
   npm run json-to-excel
   ```
   Creates timestamped Excel file with all 14 metadata fields

### 📂 Manual HTML Processing

1. **Save job pages**: Download Indeed pages as "Webpage, Complete" (.html) to `data/html/`
2. **Process HTML files**:
   ```bash
   npm run html-to-json
   ```
   - Automatically extracts original job URLs from HTML metadata
   - Applies same bachelor's degree filtering as Python pipeline
   - Processes pay information and normalizes to hourly rates
3. **Generate Excel**: Same as automated method above

### 🎯 Education Filtering Results (NEW RELAXED APPROACH)
- **Filtering Effectiveness**: **27.7% inclusion rate** (417 jobs included from 1,504 analyzed)
- **Filtering Breakdown**:
  - Clinical Roles (RN, MD, etc.): ~40.9% of total jobs
  - **Education Requirements: ONLY 1.8%** (vs previous 54.6% - major improvement!)
  - No Admin Keywords: ~2.6% of total jobs  
  - Non-US Locations: ~27.0% of total jobs
- **Included Jobs**: High school + experience, associates degrees, certificates, bachelor's degrees, and "bachelor's preferred" positions
- **Excluded Jobs**: Only Master's/PhD requirements and senior executive positions (10+ years experience)
- **Geographic Distribution**: 417 jobs across 26 states in all US regions
- **Top Employers**: Pyramid Healthcare (236 jobs), Charlie Health (113 jobs), plus 22 other organizations

### 📊 Comprehensive Data Schema
- **Core Information**: `jobTitle`, `company`, `city`, `jobDescription`, `qualifications`
- **Normalized Pay**: Single `pay` field with hourly conversion (eliminates redundant fields)
- **Geographic Data**: `city` (extracted from location), `state`, `region` (US Census Bureau classification), `remoteFlag` (auto-detected)
- **Source Tracking**: `sourceFile` (original URLs), `sourcePlatform`, `collectedAt`
- **Classification**: `careerTrack`, `entryLevelFlag` (intelligent inference)

### 📈 Excel Output (14 Columns)
Generated files include: Job Title, Company, Location, Job Description, Qualifications, Pay, Date, State, Remote Flag, Source Platform, Career Track, Entry Level Flag, Collected At, Source File
**Enhanced Excel Features:**
- **Hyperlinked Source Files**: URLs in Source File column are clickable links with professional blue styling
- **Optimized Formatting**: Text wrapping, proper row heights (60px), and column widths for readability
- **Bullet Point Formatting**: Qualifications displayed with proper bullet points and line breaks
- **Date Standardization**: Collected At timestamps formatted as MM-DD-YYYY for consistency and readability
- **Dual Library Architecture**: Uses xlsx-populate for advanced styling with XLSX fallback for testing
- **Comprehensive Testing**: Built-in verification displays sample qualifications, hyperlinks, and date formatting
### Manual Extraction (Single Job)

1. Open job URL in browser.
2. Paste `scripts/extract_job.js` into console and run.
3. Copy the JSON output to `data/jobs_data.json`.
4. Run `npm run excel` to create the Excel file.

### Automated Job Collection from ATS APIs

1. Navigate to `hc_jobs_pipeline/` directory.
2. Follow setup instructions in `hc_jobs_pipeline/README.md` (create venv, install dependencies).
3. Edit `employers.json` with ATS slugs for target employers.
4. Run `py run_collect.py` to collect jobs from western states.
5. Pipeline automatically outputs to both `hc_jobs_pipeline/output/` and `data/json/` for seamless integration.

**Pipeline Features:**
- **Geographic Filtering**: ID, WA, OR, UT, WY, MT, CO, AZ
- **Smart Title Filtering**: Includes coordinator, specialist, assistant roles; excludes director, physician, senior roles
- **Career Track Classification**: Automatically categorizes as "Hospital Administration" or "Long-Term Care Administration"
- **Entry-Level Detection**: Identifies likely entry-level positions using title hints and description analysis
5. Output files will be in `hc_jobs_pipeline/output/` as JSON arrays compatible with the main processing pipeline.

## Advanced Features

### 🎓 Intelligent Education Filtering
- **Weighted Scoring System**: Analyzes job descriptions using pattern matching with contextual weights
- **Healthcare-Specific Recognition**: Prioritizes healthcare administration, health management, and HIM degrees
- **Exclusion Logic**: Automatically excludes high school/associate degree requirements and "experience in lieu" positions
- **Dual Implementation**: Consistent filtering logic in both Python and JavaScript codebases
- **Quality Assurance**: Comprehensive test suites with 97%+ accuracy on validation datasets

### 💰 Pay Normalization
- **Universal Hourly Conversion**: Converts annual salaries to hourly using standard 2080 hours/year
- **Range Processing**: Handles "$50,000 - $65,000 annually" → "$24.04 - $31.25/hour"
- **Format Standardization**: Consistent pay format across all data sources
- **Edge Case Handling**: Manages incomplete salary information gracefully

### 🔧 Data Processing Excellence
- **HTML Stripping**: Removes all HTML tags and artifacts from job descriptions
- **URL Extraction**: Recovers original job URLs from HTML metadata instead of local file paths
- **Schema Unification**: Identical data structure between Python ATS and HTML processing pipelines
- **Field Optimization**: Eliminated redundant pay fields while maintaining comprehensive metadata
- **Date Standardization**: Automatic conversion of timestamps to MM-DD-YYYY format for Excel consistency
- **Dual Excel Libraries**: xlsx-populate for advanced styling features with XLSX fallback for compatibility testing
- **Hyperlink Integration**: Automatic URL detection and styling for Source File column links

### 📊 Source Integration
- **ATS API Support**: Lever and Greenhouse platforms with 14+ configured employers
- **Geographic Filtering**: Western states focus with automatic state detection
- **Career Track Classification**: Hospital Administration vs. Long-Term Care Administration
- **Entry-Level Detection**: Identifies positions suitable for recent graduates

## Performance Metrics

- **Data Reduction**: 950+ jobs → 7-8 bachelor's-qualified positions (99% filtering)
- **Processing Speed**: Full pipeline execution in under 2 minutes
- **Accuracy**: 88.9% - 99% filtering effectiveness depending on data source
- **Coverage**: 12 validated healthcare organizations (all Greenhouse platform)
- **Employer Validation**: 100% functional endpoints after cleanup

## Troubleshooting

### Education Filtering Issues
- **False Positives**: Jobs with "bachelor's preferred" are correctly excluded
- **False Negatives**: Healthcare-specific degrees (MHA, HIM) are correctly included
- **Debugging**: Use test scripts in `hc_jobs_pipeline/test_education_filter.py` and `scripts/test_education_filter_js.js`

### Data Processing Issues
- **Missing URLs**: Ensure HTML files contain `<meta id="indeed-share-url">` tag
- **Pay Conversion Errors**: Check for non-standard salary formats in source data
- **Excel Generation**: Verify all JSON files are valid and close Excel before regenerating

### Pipeline Issues
- **API Failures**: Check internet connection and ATS endpoint availability
- **Empty Results**: Verify geographic and title filtering isn't too restrictive
- **Performance**: Large datasets may require batched processing

## Development & Testing

```bash
# Test education filtering (Python)
cd hc_jobs_pipeline && python test_education_filter.py

# Test education filtering (JavaScript) 
node scripts/test_education_filter_js.js

# Run full pipeline test
npm run test
```

## Recent Enhancements (Version 2.1)

- ✅ **Enhanced Qualifications Display**: Fixed Excel bullet point formatting for improved readability of job requirements
- ✅ **Advanced Degree Exclusion**: Now excludes Master's/PhD requirements (focus on bachelor's-level positions)
- ✅ **Employer Validation**: Added validation script, removed 4 broken Lever endpoints
- ✅ **Field Structure Optimization**: Simplified from 3 pay fields to 1 normalized field
- ✅ **URL Source Recovery**: Extract original job URLs from HTML metadata
- ✅ **Excel Enhancement**: Expanded to 14-column output with all metadata
- ✅ **Schema Consistency**: Unified data structure across all processing methods
- ✅ **Education Filtering**: 99% reduction in irrelevant job postings
- ✅ **Pay Normalization**: Standardized hourly rate conversion across all sources