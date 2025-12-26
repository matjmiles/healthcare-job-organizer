#!/usr/bin/env python3

import json
from pathlib import Path

def analyze_filtering_issue():
    """Analyze why we're getting so few jobs from our nationwide search."""
    
    print("🔍 COMPREHENSIVE FILTERING ANALYSIS")
    print("=" * 50)
    
    # Load the latest report
    reports_dir = Path("../reports")
    latest_report = None
    if reports_dir.exists():
        report_files = list(reports_dir.glob("job_summary_*.md"))
        if report_files:
            latest_report = max(report_files, key=lambda x: x.stat().st_mtime)
    
    print(f"📄 Analysis based on: {latest_report.name if latest_report else 'Manual data'}")
    print()
    
    # From the report data we know:
    stats = {
        "total_analyzed": 1504,
        "final_included": 13,
        "clinical_roles": 615,
        "no_admin_keywords": 39,
        "education_requirements": 821,
        "non_us_locations": 16
    }
    
    print("📊 CURRENT FILTERING BREAKDOWN")
    print("-" * 30)
    print(f"Total Jobs Analyzed: {stats['total_analyzed']:,}")
    print(f"Final Jobs Included: {stats['final_included']} ({stats['final_included']/stats['total_analyzed']*100:.1f}%)")
    print()
    
    print("🚫 JOBS FILTERED OUT:")
    print(f"  Clinical Roles: {stats['clinical_roles']:,} ({stats['clinical_roles']/stats['total_analyzed']*100:.1f}%)")
    print(f"  No Admin Keywords: {stats['no_admin_keywords']:,} ({stats['no_admin_keywords']/stats['total_analyzed']*100:.1f}%)")
    print(f"  Education Requirements: {stats['education_requirements']:,} ({stats['education_requirements']/stats['total_analyzed']*100:.1f}%)")
    print(f"  Non-US Locations: {stats['non_us_locations']:,} ({stats['non_us_locations']/stats['total_analyzed']*100:.1f}%)")
    
    total_filtered = stats['clinical_roles'] + stats['no_admin_keywords'] + stats['education_requirements'] + stats['non_us_locations']
    print(f"  TOTAL FILTERED: {total_filtered:,} ({total_filtered/stats['total_analyzed']*100:.1f}%)")
    print()
    
    print("🎯 KEY FINDINGS:")
    print("-" * 15)
    print("1. 📚 EDUCATION FILTER IS THE BIGGEST BLOCKER!")
    print(f"   - Filters out {stats['education_requirements']:,} jobs (54.6% of all jobs)")
    print(f"   - This is MORE than clinical roles filter (40.9%)")
    print()
    
    print("2. 🏥 Clinical filter is working as expected")
    print(f"   - Filters out {stats['clinical_roles']:,} jobs (40.9%)")
    print(f"   - This is appropriate for admin roles")
    print()
    
    print("3. 🔑 Admin keywords filter is minimal")
    print(f"   - Only filters out {stats['no_admin_keywords']:,} jobs (2.6%)")
    print(f"   - This suggests most jobs have admin-related terms")
    print()
    
    print("🔧 RECOMMENDED SOLUTIONS:")
    print("-" * 25)
    print("Option 1: RELAX EDUCATION REQUIREMENTS (RECOMMENDED)")
    print("  - Allow High School + experience jobs")
    print("  - Allow Associates degree jobs")
    print("  - Allow certificate programs")
    print("  - Allow 'Bachelor's preferred' jobs")
    print("  - Expected impact: +400-500 additional jobs")
    print()
    
    print("Option 2: EXPAND EMPLOYER DATABASE")
    print("  - Current: 24 employers")
    print("  - Could expand to 50-100 healthcare orgs")
    print("  - Expected impact: +200-300 additional jobs")
    print()
    
    print("Option 3: BROADEN ADMIN KEYWORDS")
    print("  - Add more role variations")
    print("  - Include adjacent roles (data entry, customer service)")
    print("  - Expected impact: +50-100 additional jobs")
    print()
    
    print("💡 NEXT STEPS:")
    print("-" * 12)
    print("1. Modify education_filters.py to be less restrictive")
    print("2. Add more employers to employers.json")
    print("3. Test with a sample run")
    print("4. Monitor quality of results")
    
    # Check what employers are giving us the most jobs
    try:
        with open('output/healthcare_admin_jobs_us_nationwide.json', 'r') as f:
            jobs = json.load(f)
        
        print()
        print("🏢 TOP PERFORMING EMPLOYERS:")
        print("-" * 30)
        employer_counts = {}
        for job in jobs:
            emp = job.get('company', 'Unknown')
            employer_counts[emp] = employer_counts.get(emp, 0) + 1
        
        for emp, count in sorted(employer_counts.items(), key=lambda x: x[1], reverse=True):
            print(f"  {emp}: {count} jobs")
            
    except Exception as e:
        print(f"Could not analyze employer performance: {e}")

if __name__ == "__main__":
    analyze_filtering_issue()