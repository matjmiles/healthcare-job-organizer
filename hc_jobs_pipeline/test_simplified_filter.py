#!/usr/bin/env python3

"""
Test Simplified Education Filtering Logic
"""

from simplified_education_filters import meets_simplified_education_requirement, analyze_simplified_education_requirements

# Test cases that should be EXCLUDED
test_cases = [
    {
        "title": "Healthcare Operations Director", 
        "description": "Bachelor's degree required. 5+ years of experience in healthcare operations.",
        "should_include": False,
        "reason": "5+ years experience (over 3 year limit)"
    },
    {
        "title": "Senior Healthcare Analyst",
        "description": "Bachelor's degree preferred. 10+ years of experience in healthcare technology.",
        "should_include": False,
        "reason": "10+ years experience (over 3 year limit)"
    },
    {
        "title": "Medical Office Manager",
        "description": "Bachelor's degree preferred. 4-6 years experience in healthcare administration.",
        "should_include": False,
        "reason": "4-6 years experience (over 3 year limit)"
    },
    {
        "title": "Healthcare Admin Coordinator",
        "description": "High school diploma required. 2 years experience preferred.",
        "should_include": False,
        "reason": "No bachelor's degree mentioned"
    }
]

# Test cases that should be INCLUDED
include_cases = [
    {
        "title": "Healthcare Admin Assistant",
        "description": "Bachelor's degree in Healthcare Administration required. 2-3 years experience preferred.",
        "should_include": True,
        "reason": "Bachelor's required + acceptable experience (2-3 years)"
    },
    {
        "title": "Medical Office Coordinator", 
        "description": "Bachelor's degree preferred but not required. 1-2 years experience.",
        "should_include": True,
        "reason": "Bachelor's preferred + acceptable experience (1-2 years)"
    },
    {
        "title": "Healthcare Operations Coordinator",
        "description": "Bachelor's degree required. Entry level position, 0-1 years experience.",
        "should_include": True,
        "reason": "Bachelor's required + entry-level experience"
    },
    {
        "title": "Junior Healthcare Analyst",
        "description": "Bachelor's degree required. New graduates welcome, will train.",
        "should_include": True,
        "reason": "Bachelor's required + new graduate friendly"
    },
    {
        "title": "Health Services Coordinator",
        "description": "Bachelor's degree preferred. 3 years experience maximum.",
        "should_include": True,
        "reason": "Bachelor's preferred + exactly at 3 year limit"
    }
]

print("SIMPLIFIED EDUCATION FILTER TESTS")
print("=" * 50)
print("Criteria: 1) Bachelor's degree mentioned, 2) ≤3 years experience\n")

print("Testing jobs that should be EXCLUDED:")
print("-" * 40)
for i, case in enumerate(test_cases, 1):
    title = case["title"]
    description = case["description"] 
    expected = case["should_include"]
    reason = case["reason"]
    
    result = meets_simplified_education_requirement(title + "\n" + description)
    analysis = analyze_simplified_education_requirements(title + "\n" + description)
    
    status = "✅ PASS" if result == expected else "❌ FAIL"
    print(f"\n{i}. {title}")
    print(f"   Expected: EXCLUDE ({reason})")
    print(f"   Got: {'EXCLUDE' if not result else 'INCLUDE'} - {status}")
    print(f"   Analysis: {analysis['reasoning']}")

print("\n\nTesting jobs that should be INCLUDED:")
print("-" * 40)
for i, case in enumerate(include_cases, 1):
    title = case["title"]
    description = case["description"]
    expected = case["should_include"]
    reason = case["reason"]
    
    result = meets_simplified_education_requirement(title + "\n" + description)
    analysis = analyze_simplified_education_requirements(title + "\n" + description)
    
    status = "✅ PASS" if result == expected else "❌ FAIL"
    print(f"\n{i}. {title}")
    print(f"   Expected: INCLUDE ({reason})")
    print(f"   Got: {'INCLUDE' if result else 'EXCLUDE'} - {status}")
    print(f"   Analysis: {analysis['reasoning']}")