# Legacy Scripts Archive

This directory contains scripts that were part of earlier development phases but have been superseded by the current Python-based pipeline. They are preserved here for potential future use or reference.

## Archived Scripts:

### `extract_job.js`
- **Purpose**: Browser console script for manual job data extraction from Indeed pages
- **Usage**: Run in browser console on Indeed job posting pages
- **Value**: Useful for manual data collection when automated scraping fails or for testing new page structures

### `parse_html.js` 
- **Purpose**: Comprehensive HTML parsing using cheerio for job data extraction
- **Usage**: `node parse_html.js` with HTML files
- **Value**: Alternative JavaScript-based parsing approach, useful for processing saved HTML files

### `education_filter_js.js`
- **Purpose**: JavaScript implementation of education filtering logic (equivalent to Python version)
- **Usage**: Import functions for client-side filtering
- **Value**: Could be used for browser-based job analysis tools or client-side filtering

### `test_education_filter_js.js`
- **Purpose**: Unit tests for the JavaScript education filtering logic
- **Usage**: `node test_education_filter_js.js`
- **Value**: Testing framework for the education filter if ever needed again

## Removed Scripts:

### `generate_excel.js` - DELETED
- **Reason**: Completely superseded by `json_to_excel.js` with no unique functionality
- **Status**: Permanently removed

### `split_json.js` - DELETED  
- **Reason**: One-time utility for converting old data format, no longer needed
- **Status**: Permanently removed

## Current Active Scripts:

The following scripts remain in the main `/scripts` directory and are actively used:

- `html_to_json.js` - Used by `npm run html-to-json`
- `json_to_excel.js` - Used by `npm run json-to-excel`

---

*Last updated: December 26, 2025*