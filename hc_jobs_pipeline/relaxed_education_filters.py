#!/usr/bin/env python3

"""
RELAXED Education Filter for Healthcare Admin Jobs
==================================================
This version is more permissive to capture entry-level and experience-based positions.
"""

import re
from typing import Dict, List, Tuple

def meets_relaxed_education_requirement(job_description: str, qualifications: str = "") -> bool:
    """
    More permissive education filter for healthcare admin jobs.
    
    INCLUDES:
    - High school + relevant experience
    - Associates degree positions
    - Certificate programs
    - Bachelor's preferred (not required)
    - No specific degree mentioned (experience-based)
    
    EXCLUDES ONLY:
    - Advanced degrees required (Master's/PhD)
    - Highly specialized clinical roles
    - Senior executive positions requiring extensive experience
    
    Args:
        job_description: The full job description text
        qualifications: Extracted qualifications text (may be empty)
        
    Returns:
        True if job should be included
    """
    # Combine all text for analysis
    full_text = f"{job_description} {qualifications}".lower()
    
    # STRICT EXCLUSIONS - Advanced degree requirements
    advanced_required_patterns = [
        r"master'?s? degree.{0,20}required",
        r"master'?s? degree in",
        r"masters? required",
        r"mba required",
        r"mha required", 
        r"mph required",
        r"doctoral? degree required",
        r"ph\.?d\.? required",
        r"doctorate required"
    ]
    
    for pattern in advanced_required_patterns:
        if re.search(pattern, full_text, re.IGNORECASE):
            return False  # Exclude overqualified positions
    
    # STRICT EXCLUSIONS - Senior executive roles
    senior_exec_patterns = [
        r"chief executive officer",
        r"chief operating officer", 
        r"chief financial officer",
        r"vice president",
        r"senior vice president",
        r"executive vice president",
        r"10\+? years? experience",
        r"15\+? years? experience",
        r"20\+? years? experience"
    ]
    
    for pattern in senior_exec_patterns:
        if re.search(pattern, full_text, re.IGNORECASE):
            return False  # Exclude senior positions
    
    # EVERYTHING ELSE IS INCLUDED!
    # This includes:
    # - High school diploma jobs
    # - Associates degree jobs  
    # - Certificate programs
    # - Bachelor's preferred
    # - Experience-based positions
    # - No clear education requirements
    
    return True

def analyze_relaxed_education_requirements(job_description: str, qualifications: str = "") -> Dict:
    """
    Analyze education requirements with relaxed criteria.
    
    Returns:
        Dictionary with analysis results
    """
    full_text = f"{job_description} {qualifications}".lower()
    
    # Check for exclusion patterns
    exclusion_reasons = []
    
    # Advanced degree requirements
    if re.search(r"master'?s? degree.{0,20}required|master'?s? degree in|masters? required|mba required|mha required|mph required", full_text, re.IGNORECASE):
        exclusion_reasons.append("Advanced degree required")
    
    if re.search(r"doctoral? degree required|ph\.?d\.? required|doctorate required", full_text, re.IGNORECASE):
        exclusion_reasons.append("Doctoral degree required")
    
    # Senior executive roles
    if re.search(r"chief executive officer|chief operating officer|chief financial officer|vice president", full_text, re.IGNORECASE):
        exclusion_reasons.append("Senior executive position")
    
    if re.search(r"10\+? years? experience|15\+? years? experience|20\+? years? experience", full_text, re.IGNORECASE):
        exclusion_reasons.append("Extensive experience required")
    
    should_include = len(exclusion_reasons) == 0
    
    # Determine education level mentioned
    education_level = "Unknown"
    if re.search(r"high school|hs diploma|ged", full_text, re.IGNORECASE):
        education_level = "High School"
    elif re.search(r"associate'?s? degree|aa degree|as degree", full_text, re.IGNORECASE):
        education_level = "Associates"
    elif re.search(r"bachelor'?s? degree|ba degree|bs degree", full_text, re.IGNORECASE):
        education_level = "Bachelors"
    elif re.search(r"master'?s? degree|mba|mha|mph", full_text, re.IGNORECASE):
        education_level = "Masters"
    elif re.search(r"certificate|certification program", full_text, re.IGNORECASE):
        education_level = "Certificate"
    
    reasoning = f"Education level: {education_level}"
    if exclusion_reasons:
        reasoning += f"; Excluded because: {', '.join(exclusion_reasons)}"
    else:
        reasoning += "; Included - meets relaxed criteria"
    
    return {
        'should_include': should_include,
        'education_level': education_level,
        'exclusion_reasons': exclusion_reasons,
        'reasoning': reasoning
    }

if __name__ == "__main__":
    # Test the relaxed filter
    test_cases = [
        ("High school diploma required. Healthcare experience preferred.", "Should INCLUDE"),
        ("Associates degree in healthcare administration required.", "Should INCLUDE"),
        ("Bachelor's degree preferred. Will consider experience.", "Should INCLUDE"),
        ("Master's degree in healthcare administration required.", "Should EXCLUDE"),
        ("PhD required for this research position.", "Should EXCLUDE"),
        ("Chief Executive Officer position. 15+ years experience required.", "Should EXCLUDE"),
        ("No specific education requirements. On-the-job training provided.", "Should INCLUDE"),
        ("Medical receptionist position. High school diploma required.", "Should INCLUDE")
    ]
    
    print("🧪 TESTING RELAXED EDUCATION FILTER")
    print("=" * 40)
    
    for i, (description, expected) in enumerate(test_cases, 1):
        result = meets_relaxed_education_requirement(description)
        analysis = analyze_relaxed_education_requirements(description)
        
        status = "✅ CORRECT" if (result and "INCLUDE" in expected) or (not result and "EXCLUDE" in expected) else "❌ WRONG"
        
        print(f"Test {i}: {expected}")
        print(f"  Input: {description[:60]}...")
        print(f"  Result: {'INCLUDE' if result else 'EXCLUDE'} - {status}")
        print(f"  Analysis: {analysis['reasoning']}")
        print()