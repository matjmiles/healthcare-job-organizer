"""
Debug script to test bachelor's degree pattern matching.
This helps identify jobs that should include bachelor's degrees but are being filtered out.
"""

import json
import re
from simplified_education_filters import meets_simplified_education_requirement

def test_bachelor_patterns():
    """Test various ways bachelor's degrees might be mentioned."""
    
    test_cases = [
        # Common patterns we should catch
        "Bachelor's degree required",
        "Bachelor degree preferred", 
        "Bachelors degree in healthcare administration",
        "BS in Health Information Management",
        "BA in Business Administration", 
        "BBA preferred",
        "B.S. in related field",
        "B.A. or equivalent",
        "Four-year degree required",
        "4-year degree from accredited university",
        "Undergraduate degree preferred",
        "College degree required",
        "University degree in healthcare",
        "College graduate preferred",
        "University graduate with healthcare experience",
        
        # Edge cases that might be missed
        "Bachelor of Science in Healthcare Administration",
        "Bachelor of Arts in Public Health", 
        "Bachelor of Business Administration (BBA)",
        "Bachelor of Health Science preferred",
        "Education: Bachelor's degree or equivalent experience",
        "Minimum Education: Bachelor's degree",
        "Required: BS/BA degree",
        "Qualifications: Bachelor's degree strongly preferred",
        "Degree from 4-year accredited college or university",
        "College education (Bachelor's preferred)",
        "Higher education: Bachelor's degree minimum",
        "Academic Requirements: Bachelor's degree",
        
        # Cases that should NOT match (for comparison)
        "High school diploma required",
        "Associates degree preferred", 
        "Master's degree required",
        "PhD in healthcare administration",
        "No education requirements specified"
    ]
    
    print("Testing Bachelor's Degree Pattern Matching:")
    print("=" * 60)
    
    matches = 0
    total = 0
    
    for case in test_cases:
        result = meets_simplified_education_requirement("Test Job", case)
        status = "✓ MATCH" if result else "✗ NO MATCH"
        print(f"{status:10} | {case}")
        
        if result:
            matches += 1
        total += 1
    
    print("=" * 60)
    print(f"Pattern Matching Summary: {matches}/{total} ({(matches/total)*100:.1f}%)")
    
    # Test some realistic job descriptions
    realistic_jobs = [
        {
            "title": "Patient Access Representative", 
            "description": """We are seeking a Patient Access Representative to join our team. 
            Requirements: High school diploma required, Bachelor's degree preferred. 
            Experience in healthcare registration preferred."""
        },
        {
            "title": "Healthcare Coordinator",
            "description": """Position requires strong organizational skills.
            Education: Bachelor's degree in healthcare administration, business, or related field.
            Must have 2+ years experience in healthcare setting."""
        },
        {
            "title": "Medical Office Assistant", 
            "description": """Looking for detail-oriented individual for front office role.
            Qualifications include: associate's degree or equivalent experience.
            Customer service experience preferred."""
        }
    ]
    
    print(f"\nTesting Realistic Job Descriptions:")
    print("=" * 60)
    
    for job in realistic_jobs:
        result = meets_simplified_education_requirement(job['description'], "")
        status = "✓ PASS" if result else "✗ FILTERED OUT"
        print(f"{status:15} | {job['title']}")
        print(f"                 | {job['description'][:100]}...")
        print()

if __name__ == "__main__":
    test_bachelor_patterns()