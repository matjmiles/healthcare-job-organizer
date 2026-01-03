# HTML to JSON Extraction Logic Documentation

## Overview
This document describes the supported HTML patterns, header/label variants, and extraction strategies implemented in `scripts/html_to_json.js` as of January 2, 2026. The extraction logic has been refactored to robustly handle all major job posting formats encountered in the project.

## Supported Patterns

### 1. Table-Based (DOCX/Word or Similar)
- **Detection:** Looks for tables with headers matching job fields (e.g., Company, Job Title, Description, Qualifications, Pay, Date).
- **Header Matching:** Flexible, case-insensitive, ignores non-alphabetic characters, supports variants (e.g., "Job Title" or "Title").
- **Extraction:** Maps columns to fields by header, extracts from the first data row.
- **Strategy Tag:** `table-based`

### 2. Web/Indeed-Style
- **Detection:** Looks for meta tags (e.g., `indeed-share-message`, `og:title`, `og:description`) and main content blocks.
- **Extraction:**
  - Job title and company from meta tags or title.
  - Location parsed from title or meta.
  - Description: Longest text block in `<div>`, `<section>`, or `<p>`.
  - Pay and date: Regex search in description.
- **Strategy Tag:** `web-indeed`

### 3. Section-Based (Labeled Fields)
- **Detection:** Looks for fields labeled in `<strong>`, `<b>`, `<p>`, or as section headers (e.g., "Company:", "Location:").
- **Extraction:**
  - Job title from `<h1>` or `<title>`.
  - Company, location, pay, date from labeled elements.
  - Description from "Job Summary"/"Position Summary" section or largest `<p>`.
  - Qualifications from "Qualifications" section or `<ul>` after header.
- **Strategy Tag:** `section-based`

### 4. Outlier/Non-Job Pages
- **Detection:** If no job-relevant fields are found, marks as `unknown`.
- **Extraction:** All fields set to 'N/A' or null.
- **Strategy Tag:** `none`

## Header/Label Variants
- **Company:** "Company", "Employer"
- **Job Title:** "Job Title", "Title"
- **Description:** "Job Description", "Description", "Position Summary"
- **Qualifications:** "Qualifications", "Requirements"
- **Pay:** "Pay", "Compensation", "Salary", "Wage"
- **Date:** "Date", "Date Posted", "Posting Date"

## Extraction Strategy Logging
- Each JSON output includes `_extractionStrategy` indicating which logic path was used.
- Missing or suspect fields are set to 'N/A' or null for validation.

## Maintenance Notes
- Extraction logic is format-aware and robust to header/label variations.
- New patterns should be added by extending the detection and extraction blocks in `html_to_json.js`.
- For troubleshooting, check the `_extractionStrategy` and field values in the output JSON.

---
Last updated: January 2, 2026
