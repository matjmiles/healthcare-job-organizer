# Code Review Analysis - December 29, 2025

## Executive Summary
After comprehensive codebase analysis, identified several legacy files and cleanup opportunities to streamline the project structure.

## Current Active Files (KEEP)

### Core Pipeline Scripts
- `hc_jobs_pipeline/run_collect.py` ✅ **ACTIVE** - Main scraper
- `hc_jobs_pipeline/update_pay_from_urls.py` ✅ **ACTIVE** - Pay enhancement
- `hc_jobs_pipeline/education_filters.py` ✅ **ACTIVE** - Used by run_collect.py
- `hc_jobs_pipeline/relaxed_education_filters.py` ✅ **ACTIVE** - Used by run_collect.py
- `hc_jobs_pipeline/enhanced_qualifications.py` ✅ **ACTIVE** - Used by run_collect.py
- `hc_jobs_pipeline/employers.json` ✅ **ACTIVE** - Employer configuration

### Processing Scripts
- `scripts/html_to_json.js` ✅ **ACTIVE** - HTML processing
- `scripts/json_to_excel.js` ✅ **ACTIVE** - Excel generation  
- `scripts/education_filter_js.js` ✅ **ACTIVE** - Used by html_to_json.js

### Configuration & Documentation
- `package.json` ✅ **ACTIVE** - NPM configuration
- `hc_jobs_pipeline/requirements.txt` ✅ **ACTIVE** - Python dependencies
- `README.md`, `AGENTS.md`, `STATUS_UPDATE.md` ✅ **ACTIVE** - Documentation

## Legacy/Unused Files (CLEANUP CANDIDATES)

### 1. Empty Directories 🗂️
- `templates/` - **REMOVE** - Completely empty, no references found

### 2. Standalone Python Scripts 🐍
- `hc_jobs_pipeline/update_pay.py` - **ARCHIVE** - Duplicate of update_pay_from_urls.py logic
- `hc_jobs_pipeline/run_summary.py` - **KEEP** - Generates useful reports (reports/ directory)
- `hc_jobs_pipeline/test_education_filter.py` - **ARCHIVE** - Test script, valuable for reference
- `hc_jobs_pipeline/validate_employers.py` - **ARCHIVE** - Utility script, may be useful later

### 3. Reference Files 📋
- `data/Healthcare Operations Coordinator.txt` - **ARCHIVE** - Original URL collection, historical value

### 4. Old Output Files 📊
- Multiple Excel files in `output/` - **CLEANUP** - Keep only latest 2-3 versions
- Old report files in `reports/` - **CLEANUP** - Keep only latest version

### 5. Package.json Issues 📦
- `"main": "extract_jobs_bulk.js"` - **FIX** - File doesn't exist, should reference active script

## Already Properly Archived ✅
- `archive/legacy_scripts/` contains properly archived old JavaScript files
- Good archive structure already in place

## Cleanup Actions Recommended

### HIGH PRIORITY
1. **Remove empty templates/ directory** 
2. **Fix package.json main entry** - update to reference active script
3. **Archive duplicate update_pay.py** - move to archive/legacy_scripts/

### MEDIUM PRIORITY  
4. **Clean old Excel files** - keep only latest 3 versions in output/
5. **Archive reference Healthcare Operations Coordinator.txt** 
6. **Archive test/utility scripts** - move validate_employers.py and test_education_filter.py

### LOW PRIORITY
7. **Clean old report files** - keep only latest version
8. **Update .gitignore** if needed after cleanup

## File Usage Matrix

| File | Used By | Status | Action |
|------|---------|--------|--------|
| run_collect.py | CLI | ACTIVE | KEEP |
| update_pay_from_urls.py | CLI | ACTIVE | KEEP |  
| html_to_json.js | npm script | ACTIVE | KEEP |
| json_to_excel.js | npm script | ACTIVE | KEEP |
| update_pay.py | None | LEGACY | ARCHIVE |
| templates/ | None | EMPTY | REMOVE |
| Healthcare Operations Coordinator.txt | None | REFERENCE | ARCHIVE |

## Benefits of Cleanup
- **Reduced confusion** - Clear distinction between active and legacy code
- **Faster development** - Less clutter when searching/navigating
- **Better maintenance** - Easier to identify what needs updates
- **Cleaner repository** - Professional appearance for future collaborators