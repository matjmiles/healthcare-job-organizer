# Education Requirement Thesauruses for Healthcare Admin Job Filtering
# Based on analysis of healthcare job postings in the western states

import re
from typing import Dict, List, Tuple

# === EXCLUSION PATTERNS (High School / Associates Degree) ===
# These patterns indicate jobs we want to EXCLUDE (too low education level)

HIGH_SCHOOL_PATTERNS = [
    # Direct high school references
    r"high school diploma",
    r"high school graduate", 
    r"high school graduation",
    r"high school degree",
    r"hs diploma",
    r"h\.s\. diploma",
    
    # GED references
    r"ged",
    r"general education development",
    r"general educational development",
    
    # Associates degree variations
    r"associate'?s? degree",
    r"associates degree", 
    r"associate degree",
    r"aa degree",
    r"as degree", 
    r"aas degree",
    r"a\.a\. degree",
    r"a\.s\. degree",
    r"a\.a\.s\. degree",
    
    # Two-year college references
    r"two.year degree",
    r"2.year degree",
    r"two.year college",
    r"2.year college",
    r"community college degree",
    
    # Certificate programs (when no bachelor's mentioned)
    r"certificate program",
    r"certification program", 
    r"diploma program",
    r"technical certificate",
    r"vocational certificate",
    
    # Experience in lieu of degree (red flags)
    r"experience in lieu of degree",
    r"experience may substitute",
    r"equivalent experience",
    r"or equivalent experience",
    
    # No degree required indicators
    r"no degree required",
    r"education not required",
    r"degree preferred but not required"
]

# === INCLUSION PATTERNS (Bachelor's Degree) ===
# These patterns indicate jobs we want to INCLUDE (bachelor's level)

BACHELORS_PATTERNS = [
    # Standard bachelor's degree terms
    r"bachelor'?s? degree",
    r"bachelors degree",
    r"bachelor degree",
    r"baccalaureate degree",
    r"undergraduate degree",
    
    # Common bachelor's abbreviations
    r"b\.a\.",
    r"b\.s\.",
    r"ba degree",
    r"bs degree",
    r"ba/bs",
    r"bs/ba",
    
    # Four-year degree references
    r"four.year degree",
    r"4.year degree", 
    r"four.year college",
    r"4.year college",
    r"four.year university",
    r"4.year university",
    
    # University/college degree (when clearly bachelor's level)
    r"university degree",
    r"college degree",
    
    # Professional bachelor's degrees
    r"bba",  # Bachelor of Business Administration
    r"bsn",  # Bachelor of Science in Nursing
    r"bha",  # Bachelor of Healthcare Administration
    r"bhsa", # Bachelor of Health Services Administration
    
    # Required degree language
    r"degree required",
    r"bachelor.{0,20}required",
    r"required.{0,20}bachelor"
]

# === HEALTHCARE ADMINISTRATION SPECIFIC PATTERNS ===
# These are high-priority matches for healthcare admin bachelor's degrees

HEALTHCARE_ADMIN_BACHELORS = [
    # Healthcare Administration variations
    r"healthcare administration",
    r"health care administration", 
    r"health administration",
    r"hospital administration",
    r"medical administration",
    
    # Health Services/Management
    r"health services administration",
    r"health service administration",
    r"healthcare management", 
    r"health care management",
    r"health management",
    r"hospital management",
    r"medical management",
    
    # Health Information Management
    r"health information management",
    r"healthcare information management",
    r"health information administration",
    r"him",  # Common abbreviation
    
    # Public Health Administration  
    r"public health administration",
    r"public health",
    r"mph",  # Master of Public Health (higher than bachelor's but relevant)
    r"mha",  # Master of Healthcare Administration (higher than bachelor's)
    
    # Business/Management with Healthcare context
    r"business administration.{0,50}healthcare",
    r"healthcare.{0,50}business administration",
    r"management.{0,50}healthcare",
    r"healthcare.{0,50}management",
    
    # Long-term care specific
    r"long.term care administration",
    r"nursing home administration", 
    r"assisted living administration",
    r"skilled nursing administration"
]

# === ADVANCED DEGREE PATTERNS (Also Include) ===
# These indicate higher education than bachelor's - should definitely include

ADVANCED_DEGREE_PATTERNS = [
    # Master's degrees
    r"master'?s? degree",
    r"masters degree",
    r"graduate degree", 
    r"m\.a\.",
    r"m\.s\.",
    r"mba",
    r"mha",  # Master of Healthcare Administration
    r"mph",  # Master of Public Health 
    r"mhsa", # Master of Health Services Administration
    
    # Doctoral degrees
    r"doctorate",
    r"doctoral degree",
    r"ph\.?d\.?",
    r"dha",  # Doctor of Healthcare Administration
    
    # Professional degrees
    r"jd",   # Juris Doctor
    r"md",   # Medical Doctor (though we're filtering admin roles)
    r"pharmd" # Doctor of Pharmacy
]

# === BACHELOR'S PREFERRED PATTERNS ===
# These are positive indicators where bachelor's degree is preferred but not required

BACHELORS_PREFERRED_PATTERNS = [
    r"bachelor.{0,20}preferred",
    r"preferred.{0,20}bachelor",
    r"bachelor.{0,20}desired",
    r"desired.{0,20}bachelor",
    r"bachelor.{0,20}a plus",
    r"bachelor.{0,20}plus"
]

# === CONTEXT EXCLUSIONS ===
# Phrases that might indicate we should still exclude despite bachelor's mention

CONTEXT_EXCLUSIONS = [
    # When it's clearly entry-level despite bachelor's requirement
    r"entry.level.{0,50}bachelor",
    r"bachelor.{0,50}entry.level"
]

# === SCORING WEIGHTS ===
# For nuanced decision making when multiple patterns match

PATTERN_WEIGHTS = {
    'healthcare_admin_bachelors': 10,  # Highest priority
    'advanced_degree': -8,            # Exclude - overqualified positions
    'bachelors_required': 6,          # Strong inclusion
    'bachelors_mentioned': 4,         # Moderate inclusion
    'bachelors_preferred': 5,         # Strong inclusion for preferred positions  
    'high_school_only': -10,          # Strong exclusion
    'associates_only': -8,            # Strong exclusion
    'context_exclusion': -3,          # Light exclusion (reduced impact)
    'no_degree_required': -6          # Strong exclusion
}


def analyze_education_requirements(job_description: str, qualifications: str = "") -> Dict:
    """
    Analyze job text to determine education requirements and suitability.
    
    Args:
        job_description: The full job description text
        qualifications: Extracted qualifications text (may be empty)
        
    Returns:
        Dictionary with analysis results:
        {
            'score': int,           # Overall education score
            'should_include': bool, # True if job meets bachelor's requirement
            'matches': dict,        # What patterns were found
            'reasoning': str        # Human-readable explanation
        }
    """
    # Combine all text for analysis
    full_text = f"{job_description} {qualifications}".lower()
    
    matches = {
        'healthcare_admin_bachelors': [],
        'advanced_degree': [],
        'bachelors_required': [],
        'bachelors_mentioned': [],
        'bachelors_preferred': [],
        'high_school_only': [],
        'associates_only': [],
        'context_exclusion': [],
        'no_degree_required': []
    }
    
    score = 0
    
    # STRICT CHECK: If high school is mentioned as primary requirement, exclude immediately
    high_school_primary = re.search(r'high school.*required|high school diploma.*required|hs.*required|ged.*required', full_text, re.IGNORECASE)
    if high_school_primary:
        return {
            'score': -100,
            'should_include': False,
            'matches': {'high_school_only': ['high_school_primary_requirement']},
            'reasoning': "High school diploma listed as primary requirement"
        }
    
    # STRICT CHECK: If associates degree is listed as primary requirement, exclude
    associates_primary = re.search(r'associate.?s? degree.*required|aa.*required|as.*required|aas.*required', full_text, re.IGNORECASE)
    if associates_primary:
        return {
            'score': -100,
            'should_include': False,
            'matches': {'associates_only': ['associates_primary_requirement']},
            'reasoning': "Associates degree listed as primary requirement"
        }
    
    # Check healthcare administration specific patterns (highest priority)
    for pattern in HEALTHCARE_ADMIN_BACHELORS:
        if re.search(pattern, full_text, re.IGNORECASE):
            matches['healthcare_admin_bachelors'].append(pattern)
            score += PATTERN_WEIGHTS['healthcare_admin_bachelors']
    
    # Check advanced degrees
    for pattern in ADVANCED_DEGREE_PATTERNS:
        if re.search(pattern, full_text, re.IGNORECASE):
            matches['advanced_degree'].append(pattern)
            score += PATTERN_WEIGHTS['advanced_degree']
    
    # Check bachelor's degree patterns
    for pattern in BACHELORS_PATTERNS:
        if re.search(pattern, full_text, re.IGNORECASE):
            if any(req_word in pattern for req_word in ['required', 'degree required']):
                matches['bachelors_required'].append(pattern)
                score += PATTERN_WEIGHTS['bachelors_required']
            else:
                matches['bachelors_mentioned'].append(pattern)
                score += PATTERN_WEIGHTS['bachelors_mentioned']
    
    # Check bachelor's preferred patterns (should be included)
    for pattern in BACHELORS_PREFERRED_PATTERNS:
        if re.search(pattern, full_text, re.IGNORECASE):
            matches['bachelors_preferred'].append(pattern)
            score += PATTERN_WEIGHTS['bachelors_preferred']
    
    # Check exclusion patterns (but not primary requirements - already handled above)
    for pattern in HIGH_SCHOOL_PATTERNS:
        if not re.search(r'required', pattern, re.IGNORECASE):  # Skip "required" patterns (handled above)
            if re.search(pattern, full_text, re.IGNORECASE):
                if any(exclusion in pattern for exclusion in ['no degree', 'not required', 'preferred but']):
                    matches['no_degree_required'].append(pattern)
                    score += PATTERN_WEIGHTS['no_degree_required']
                else:
                    matches['high_school_only'].append(pattern)
                    score += PATTERN_WEIGHTS['high_school_only']
    
    # Check context exclusions
    for pattern in CONTEXT_EXCLUSIONS:
        if re.search(pattern, full_text, re.IGNORECASE):
            matches['context_exclusion'].append(pattern)
            score += PATTERN_WEIGHTS['context_exclusion']
    
    # FINAL INCLUSION LOGIC: If bachelor's is mentioned in ANY way, include it
    has_bachelors = (len(matches['healthcare_admin_bachelors']) > 0 or 
                     len(matches['bachelors_required']) > 0 or 
                     len(matches['bachelors_mentioned']) > 0 or
                     len(matches['bachelors_preferred']) > 0)
    has_high_school = len(matches['high_school_only']) > 0
    has_advanced_degree = len(matches['advanced_degree']) > 0
    
    # If bachelor's is mentioned, override any negative scoring from high school/associates
    if has_bachelors and score < 0:
        score = 5  # Ensure positive score for any bachelor's mention
    
    # Only exclude if high school/associates mentioned BUT no bachelor's mentioned at all
    if has_high_school and not has_bachelors:
        score = -100
    
    # STRICT EXCLUSION: If advanced degree is required, exclude regardless of other factors
    if has_advanced_degree:
        score = -100
    
    # Determine if we should include this job
    should_include = score > 0 and not has_advanced_degree
    
    # Generate reasoning
    reasoning_parts = []
    
    if matches['healthcare_admin_bachelors']:
        reasoning_parts.append("Healthcare administration degree mentioned")
    if matches['advanced_degree']:
        reasoning_parts.append("Advanced degree required (overqualified)")
    if matches['bachelors_required']:
        reasoning_parts.append("Bachelor's degree explicitly required")
    if matches['bachelors_mentioned']:
        reasoning_parts.append("Bachelor's degree mentioned")
    if matches['bachelors_preferred']:
        reasoning_parts.append("Bachelor's degree preferred but not required")
    if matches['high_school_only']:
        reasoning_parts.append("High school/Associates degree mentioned")
    if matches['context_exclusion']:
        reasoning_parts.append("Bachelor's only preferred or substitutable")
    if matches['no_degree_required']:
        reasoning_parts.append("No degree required")
    
    reasoning = "; ".join(reasoning_parts) if reasoning_parts else "No clear education requirements found"
    
    return {
        'score': score,
        'should_include': should_include,
        'matches': matches,
        'reasoning': reasoning
    }


def meets_bachelors_requirement(job_description: str, qualifications: str = "") -> bool:
    """
    Simple boolean check if job meets bachelor's degree requirement.
    
    Args:
        job_description: The full job description text
        qualifications: Extracted qualifications text (may be empty)
        
    Returns:
        True if job should be included (meets bachelor's requirement)
    """
    analysis = analyze_education_requirements(job_description, qualifications)
    return analysis['should_include']