#!/usr/bin/env python3

"""
Simplified Education Filter for Healthcare Admin Jobs
====================================================
Two simple criteria:
1. Bachelor's degree mentioned anywhere (required OR preferred)
2. No more than 3 years experience required
"""

import re
from typing import Dict

def meets_simplified_education_requirement(job_description: str, qualifications: str = "") -> bool:
    """
    Simplified education filter with one key criterion.
    
    CRITERIA:
    1. Bachelor's degree mentioned anywhere (required, preferred, desired, etc.)
    
    Args:
        job_description: The full job description text
        qualifications: Extracted qualifications text (may be empty)
        
    Returns:
        True if job should be included
    """
    # Combine all text for analysis
    full_text = f"{job_description} {qualifications}".lower()
    
    # CRITERIA 1: Check for bachelor's degree mention (any context) - EXPANDED PATTERNS
    bachelor_patterns = [
        # Traditional patterns
        r"bachelor'?s? degree",
        r"bachelors degree", 
        r"bachelor degree",
        r"baccalaureate degree",
        r"undergraduate degree",
        
        # Abbreviations with periods
        r"b\.a\.",
        r"b\.s\.",
        r"b\.b\.a\.",
        r"b\.s\.c\.",
        
        # Abbreviations without periods
        r"\bbs\b",
        r"\bba\b", 
        r"\bbba\b",
        r"\bbsc\b",
        r"\bbph\b",
        r"\bbha\b",
        
        # Degree with abbreviations
        r"ba degree",
        r"bs degree", 
        r"bba degree",
        r"bsc degree",
        r"bph degree",
        r"bha degree",
        
        # Full degree names
        r"bachelor of science",
        r"bachelor of arts",
        r"bachelor of business administration",
        r"bachelor of public health",
        r"bachelor of health administration",
        r"bachelor of health science",
        r"bachelor of healthcare administration",
        
        # Year-based descriptions
        r"four.year degree",
        r"4.year degree",
        r"four-year degree",
        r"4-year degree",
        
        # Generic university terms
        r"university degree",
        r"college degree",
        r"undergraduate",
        
        # Context patterns
        r"college graduate",
        r"university graduate",
        r"degree from.*university",
        r"degree from.*college",
        
        # More inclusive contextual patterns
        r"preferred.*bachelor",
        r"bachelor.*preferred",
        r"desired.*bachelor", 
        r"bachelor.*desired",
        r"plus.*bachelor",
        r"bachelor.*plus",
        r"advantage.*bachelor",
        r"bachelor.*advantage",
        r"helpful.*bachelor",
        r"bachelor.*helpful",
        r"ideal.*bachelor",
        r"bachelor.*ideal",
        
        # Degree in any context
        r"degree.*preferred",
        r"preferred.*degree",
        r"education.*bachelor",
        r"bachelor.*education",
        r"college.*bachelor",
        r"bachelor.*college",
        r"university.*bachelor",
        r"bachelor.*university",
        
        # Very broad degree patterns to catch edge cases
        r"degree.*required",
        r"required.*degree",
        r"college.*required",
        r"required.*college",
        r"university.*required", 
        r"required.*university",
        r"post.*secondary",
        r"higher.*education",
        r"college.*education",
        r"university.*education"
    ]
    
    has_bachelors = False
    for pattern in bachelor_patterns:
        if re.search(pattern, full_text, re.IGNORECASE):
            has_bachelors = True
            break
    
    # Return true if bachelor's degree is mentioned
    return has_bachelors


def analyze_simplified_education_requirements(job_description: str, qualifications: str = "") -> Dict:
    """
    Analyze education requirements with simplified logic.
    
    Returns:
        Dictionary with analysis results
    """
    full_text = f"{job_description} {qualifications}".lower()
    
    # Check for bachelor's degree - VERY INCLUSIVE PATTERNS with broad degree mentions
    has_bachelors = bool(re.search(r"bachelor'?s? degree|bachelors degree|bachelor degree|baccalaureate degree|undergraduate degree|b\.a\.|b\.s\.|b\.b\.a\.|b\.s\.c\.|\bbs\b|\bba\b|\bbba\b|\bbsc\b|\bbph\b|\bbha\b|ba degree|bs degree|bba degree|bsc degree|bph degree|bha degree|bachelor of science|bachelor of arts|bachelor of business administration|bachelor of public health|bachelor of health administration|bachelor of health science|bachelor of healthcare administration|four.year degree|4.year degree|four-year degree|4-year degree|university degree|college degree|undergraduate|college graduate|university graduate|degree from.*university|degree from.*college|preferred.*bachelor|bachelor.*preferred|desired.*bachelor|bachelor.*desired|plus.*bachelor|bachelor.*plus|advantage.*bachelor|bachelor.*advantage|helpful.*bachelor|bachelor.*helpful|ideal.*bachelor|bachelor.*ideal|degree.*preferred|preferred.*degree|education.*bachelor|bachelor.*education|college.*bachelor|bachelor.*college|university.*bachelor|bachelor.*university|degree.*required|required.*degree|college.*required|required.*college|university.*required|required.*university|post.*secondary|higher.*education|college.*education|university.*education", full_text, re.IGNORECASE))
    
    should_include = has_bachelors
    
    # Generate reasoning
    if has_bachelors:
        reasoning = "Bachelor's degree mentioned"
    else:
        reasoning = "No bachelor's degree mentioned"
    
    return {
        'should_include': should_include,
        'has_bachelors': has_bachelors,
        'reasoning': reasoning
    }

# For backwards compatibility
meets_bachelors_requirement = meets_simplified_education_requirement
analyze_education_requirements = analyze_simplified_education_requirements