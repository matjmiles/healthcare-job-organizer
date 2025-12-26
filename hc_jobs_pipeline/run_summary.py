#!/usr/bin/env python3
"""
Generate run summary statistics from collected job data.
Provides counts by employer, state, job title, and other key metrics.
Saves results as timestamped Markdown files for historical tracking.
"""

import json
import os
from collections import Counter, defaultdict
from pathlib import Path
from datetime import datetime

def load_job_data():
    """Load job data from both pipeline output and HTML processing."""
    jobs = []
    
    # Load from pipeline output
    pipeline_file = "output/healthcare_admin_jobs_west_100plus.json"
    if os.path.exists(pipeline_file):
        try:
            with open(pipeline_file, 'r', encoding='utf-8') as f:
                pipeline_jobs = json.load(f)
                if isinstance(pipeline_jobs, list):
                    jobs.extend(pipeline_jobs)
                    print(f"✅ Loaded {len(pipeline_jobs)} jobs from pipeline output")
                else:
                    print(f"⚠️  Pipeline file format unexpected: {type(pipeline_jobs)}")
        except Exception as e:
            print(f"❌ Error loading pipeline jobs: {e}")
    
    # Load from HTML processing (check main data directory)
    html_data_dir = "../data/json"
    if os.path.exists(html_data_dir):
        html_jobs_loaded = 0
        for file in os.listdir(html_data_dir):
            if file.endswith('.json') and not file.startswith('healthcare_admin_jobs'):
                try:
                    filepath = os.path.join(html_data_dir, file)
                    with open(filepath, 'r', encoding='utf-8') as f:
                        job_data = json.load(f)
                        if isinstance(job_data, dict):
                            jobs.append(job_data)
                            html_jobs_loaded += 1
                        elif isinstance(job_data, list):
                            jobs.extend(job_data)
                            html_jobs_loaded += len(job_data)
                except Exception as e:
                    print(f"⚠️  Error loading {file}: {e}")
        
        if html_jobs_loaded > 0:
            print(f"✅ Loaded {html_jobs_loaded} jobs from HTML processing files")
    
    return jobs

def load_filtering_stats():
    """Load filtering statistics from pipeline output."""
    stats_file = "output/filtering_stats.json"
    if os.path.exists(stats_file):
        try:
            with open(stats_file, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception as e:
            print(f"⚠️  Error loading filtering stats: {e}")
    return None

def add_filtering_analysis(output_lines):
    """Add filtering statistics analysis to the report."""
    stats = load_filtering_stats()
    if not stats:
        output_lines.append("⚠️  No filtering statistics available")
        return
    
    total_analyzed = stats.get('total_jobs_analyzed', 0)
    final_included = stats.get('final_jobs_included', 0)
    duplicates = stats.get('duplicates_removed', 0)
    filtered_out = stats.get('filtered_out', {})
    
    output_lines.append("## 🔍 Filtering Analysis")
    output_lines.append("")
    output_lines.append(f"### 📊 Job Processing Summary")
    output_lines.append(f"- **Total Jobs Analyzed**: {total_analyzed:,}")
    output_lines.append(f"- **Final Jobs Included**: {final_included:,}")
    output_lines.append(f"- **Duplicates Removed**: {duplicates:,}")
    
    total_filtered = sum(filtered_out.values())
    output_lines.append(f"- **Total Filtered Out**: {total_filtered:,}")
    
    if total_analyzed > 0:
        inclusion_rate = (final_included / total_analyzed) * 100
        output_lines.append(f"- **Inclusion Rate**: {inclusion_rate:.1f}%")
    
    output_lines.append("")
    
    # Filtering breakdown
    if filtered_out:
        output_lines.append(f"### 🚫 Filtering Breakdown")
        output_lines.append("| Reason | Count | % of Total |")
        output_lines.append("|--------|-------|-----------|")
        
        filter_names = {
            'clinical_roles': 'Clinical Roles (RN, MD, etc.)',
            'no_admin_keywords': 'No Admin Keywords',
            'education_requirements': 'Education Requirements',
            'out_of_scope_states': 'Out of Scope States'
        }
        
        for reason, count in filtered_out.items():
            if count > 0:
                percentage = (count / total_analyzed * 100) if total_analyzed > 0 else 0
                display_name = filter_names.get(reason, reason.replace('_', ' ').title())
                output_lines.append(f"| {display_name} | {count:,} | {percentage:.1f}% |")
        
        output_lines.append("")
    
    # Add timestamp info
    if stats.get('timestamp'):
        output_lines.append(f"*Filtering stats from: {stats['timestamp']}*")
        output_lines.append("")

def analyze_jobs(jobs, output_lines):
    """Analyze job data and generate summary statistics."""
    if not jobs:
        output_lines.append("❌ No jobs found to analyze")
        return
    
    output_lines.append(f"## 🔍 Analysis of {len(jobs)} Jobs")
    output_lines.append("")
    
    # Basic counts
    output_lines.append(f"### 📊 Overview")
    output_lines.append(f"- **Total Jobs**: {len(jobs)}")
    output_lines.append("")
    
    # Count by employer/company
    companies = Counter()
    for job in jobs:
        company = job.get('company', 'Unknown')
        companies[company] += 1
    
    output_lines.append(f"### 🏢 Jobs by Employer")
    output_lines.append("| Employer | Count |")
    output_lines.append("|----------|-------|")
    for company, count in companies.most_common():
        output_lines.append(f"| {company} | {count} |")
    output_lines.append("")
    
    # Count by state
    states = Counter()
    remote_count = 0
    for job in jobs:
        if job.get('remoteFlag', False):
            remote_count += 1
            states['Remote'] += 1
        else:
            state = job.get('state') or job.get('location', '').split(',')[-1].strip()
            if state and len(state) <= 3:  # Likely a state abbreviation
                states[state] += 1
            elif 'Remote' in job.get('location', ''):
                remote_count += 1
                states['Remote'] += 1
            else:
                # Try to extract state from location string
                location = job.get('location', 'Unknown')
                if ',' in location:
                    potential_state = location.split(',')[-1].strip()
                    if len(potential_state) == 2:  # State abbreviation
                        states[potential_state.upper()] += 1
                    else:
                        states['Other'] += 1
                else:
                    states['Unknown'] += 1
    
    output_lines.append(f"### 🗺️ Jobs by State/Location")
    output_lines.append("| State/Location | Count |")
    output_lines.append("|----------------|-------|")
    for state, count in states.most_common():
        output_lines.append(f"| {state} | {count} |")
    output_lines.append("")
    
    # Count by job title (simplified)
    titles = Counter()
    for job in jobs:
        title = job.get('jobTitle', 'Unknown')
        # Simplify title by taking first few words or removing company-specific info
        simplified_title = title.split(' - ')[0]  # Remove location suffix
        simplified_title = simplified_title.split(' at ')[0]  # Remove "at Company"
        titles[simplified_title] += 1
    
    output_lines.append(f"### 📋 Jobs by Title")
    output_lines.append("| Job Title | Count |")
    output_lines.append("|-----------|-------|")
    for title, count in titles.most_common(15):  # Top 15 titles
        # Escape any pipe characters in titles for Markdown table
        escaped_title = title.replace('|', '\\|')
        output_lines.append(f"| {escaped_title} | {count} |")
    
    if len(titles) > 15:
        output_lines.append(f"| *... and {len(titles) - 15} other unique titles* | |")
    output_lines.append("")
    
    # Source platform analysis
    platforms = Counter()
    for job in jobs:
        platform = job.get('sourcePlatform', 'Unknown')
        platforms[platform] += 1
    
    output_lines.append(f"### 🔗 Jobs by Source Platform")
    output_lines.append("| Platform | Count |")
    output_lines.append("|----------|-------|")
    for platform, count in platforms.most_common():
        output_lines.append(f"| {platform} | {count} |")
    output_lines.append("")
    
    # Career track analysis
    tracks = Counter()
    for job in jobs:
        track = job.get('careerTrack', 'Unknown')
        tracks[track] += 1
    
    output_lines.append(f"### 🏥 Jobs by Career Track")
    output_lines.append("| Career Track | Count |")
    output_lines.append("|--------------|-------|")
    for track, count in tracks.most_common():
        output_lines.append(f"| {track} | {count} |")
    output_lines.append("")
    
    # Entry level analysis
    entry_level_count = sum(1 for job in jobs if job.get('entryLevelFlag', False))
    experienced_count = len(jobs) - entry_level_count
    
    output_lines.append(f"### 🎯 Experience Level")
    output_lines.append("| Level | Count |")
    output_lines.append("|-------|-------|")
    output_lines.append(f"| Entry Level | {entry_level_count} |")
    output_lines.append(f"| Experienced | {experienced_count} |")
    output_lines.append("")
    
    # Pay information analysis
    pay_available = sum(1 for job in jobs if job.get('pay') and job.get('pay') != 'N/A')
    pay_missing = len(jobs) - pay_available
    
    output_lines.append(f"### 💰 Pay Information")
    output_lines.append("| Pay Status | Count |")
    output_lines.append("|------------|-------|")
    output_lines.append(f"| With Pay Info | {pay_available} |")
    output_lines.append(f"| No Pay Info | {pay_missing} |")
    output_lines.append("")
    
    # Collection timestamp analysis
    collection_dates = []
    for job in jobs:
        collected_at = job.get('collectedAt')
        if collected_at:
            try:
                # Parse ISO timestamp
                dt = datetime.fromisoformat(collected_at.replace('Z', '+00:00'))
                collection_dates.append(dt)
            except:
                pass
    
    if collection_dates:
        latest = max(collection_dates)
        earliest = min(collection_dates)
        output_lines.append(f"### 📅 Collection Timeline")
        output_lines.append(f"- **Latest**: {latest.strftime('%Y-%m-%d %H:%M:%S UTC')}")
        output_lines.append(f"- **Earliest**: {earliest.strftime('%Y-%m-%d %H:%M:%S UTC')}")
        if len(set(dt.date() for dt in collection_dates)) > 1:
            output_lines.append(f"- **Duration**: Collection spanned {len(set(dt.date() for dt in collection_dates))} days")
        else:
            output_lines.append(f"- **Duration**: All jobs collected on same day")
        output_lines.append("")
    
    output_lines.append("---")
    output_lines.append(f"✅ **Analysis Complete** - {len(jobs)} jobs analyzed")
    output_lines.append("")

def main():
    """Main function to run job analysis and generate Markdown report."""
    # Create timestamp for filename and report
    timestamp = datetime.now()
    timestamp_str = timestamp.strftime("%Y-%m-%d_%H-%M-%S")
    readable_timestamp = timestamp.strftime("%Y-%m-%d %H:%M:%S")
    
    # Ensure reports directory exists at top level
    reports_dir = Path("../reports")
    reports_dir.mkdir(exist_ok=True)
    
    # Create output filename
    report_filename = f"job_summary_{timestamp_str}.md"
    report_path = reports_dir / report_filename
    
    print(f"📊 HEALTHCARE JOB COLLECTION - RUN SUMMARY")
    print(f"Generating report: {report_path}")
    print("=" * 60)
    
    # Initialize output lines for Markdown content
    output_lines = []
    
    # Add header to Markdown
    output_lines.append(f"# Healthcare Job Collection - Run Summary")
    output_lines.append(f"")
    output_lines.append(f"**Generated**: {readable_timestamp}")
    output_lines.append(f"**Report File**: `{report_filename}`")
    output_lines.append(f"")
    
    # Load job data from all sources
    jobs = load_job_data()
    
    # Add loading results to output
    pipeline_file = "output/healthcare_admin_jobs_west_100plus.json"
    html_data_dir = "../data/json"
    
    output_lines.append("## 📁 Data Sources")
    
    if os.path.exists(pipeline_file):
        try:
            with open(pipeline_file, 'r', encoding='utf-8') as f:
                pipeline_jobs = json.load(f)
                pipeline_count = len(pipeline_jobs) if isinstance(pipeline_jobs, list) else 0
                output_lines.append(f"- **ATS Pipeline**: {pipeline_count} jobs from `{pipeline_file}`")
        except:
            output_lines.append(f"- **ATS Pipeline**: Error loading from `{pipeline_file}`")
    else:
        output_lines.append(f"- **ATS Pipeline**: File not found `{pipeline_file}`")
    
    if os.path.exists(html_data_dir):
        html_files = [f for f in os.listdir(html_data_dir) if f.endswith('.json') and not f.startswith('healthcare_admin_jobs')]
        html_job_count = sum(1 for job in jobs if job.get('sourcePlatform') == 'html')
        output_lines.append(f"- **HTML Processing**: {html_job_count} jobs from {len(html_files)} files in `{html_data_dir}`")
    else:
        output_lines.append(f"- **HTML Processing**: Directory not found `{html_data_dir}`")
    
    output_lines.append("")
    
    # Add filtering analysis (most important for understanding pipeline effectiveness)
    add_filtering_analysis(output_lines)
    
    if not jobs:
        output_lines.append("## ❌ No Data Available")
        output_lines.append("")
        output_lines.append("No job data found. Run the collection pipeline first:")
        output_lines.append("```bash")
        output_lines.append("python run_collect.py")
        output_lines.append("```")
        output_lines.append("")
    else:
        # Analyze and add results to output
        analyze_jobs(jobs, output_lines)
    
    # Write Markdown file
    try:
        with open(report_path, 'w', encoding='utf-8') as f:
            f.write('\n'.join(output_lines))
        
        print(f"✅ Report saved: {report_path}")
        print(f"📄 Total jobs analyzed: {len(jobs) if jobs else 0}")
        
        # Also display summary to console
        if jobs:
            print(f"📊 Quick Summary:")
            print(f"  - Total Jobs: {len(jobs)}")
            companies = Counter(job.get('company', 'Unknown') for job in jobs)
            print(f"  - Top Employer: {companies.most_common(1)[0][0]} ({companies.most_common(1)[0][1]} jobs)")
            remote_count = sum(1 for job in jobs if job.get('remoteFlag', False))
            print(f"  - Remote Jobs: {remote_count}")
    
    except Exception as e:
        print(f"❌ Error writing report: {e}")

if __name__ == "__main__":
    main()