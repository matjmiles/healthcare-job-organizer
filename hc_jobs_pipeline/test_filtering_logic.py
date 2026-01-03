#!/usr/bin/env python3

"""
Test Education Filtering Logic
Test cases for jobs that should be EXCLUDED
"""

from education_filters import meets_bachelors_requirement, analyze_education_requirements

# Test cases that should be EXCLUDED
test_cases = [
    {
        "title": "Healthcare Operations Director", 
        "description": "Master's degree in Healthcare Administration required. 10+ years of experience in healthcare operations.",
        "should_include": False,
        "reason": "Master's degree required"
    },
    {
        "title": "Senior Healthcare Analyst",
        "description": "Bachelor's degree preferred. 10+ years of experience in healthcare technology.",
        "should_include": False,
        "reason": "10+ years experience (overqualified)"
    },
    {
        "title": "Healthcare Coordinator",
        "description": "Bachelor's degree required. 1-3 years experience in healthcare operations.",
        "should_include": False,
        "reason": "1-3 years experience range (exceeds 2 years)"
    },
    {
        "title": "Medical Office Coordinator",
        "description": "Bachelor's degree preferred. 2-4 years experience preferred.",
        "should_include": False,
        "reason": "2-4 years experience range (exceeds 2 years)"
    },
    {
        "title": "Healthcare Admin Assistant",
        "description": "Bachelor's degree required. Minimum 2 years experience.",
        "should_include": False,
        "reason": "Minimum 2 years (entry-level should be 0-1 years)"
    },
    {
        "title": "Medical Office Manager",
        "description": "Bachelor's degree preferred. 5-7 years experience in healthcare administration.",
        "should_include": False,
        "reason": "5-7 years experience (not entry-level)"
    },
    {
        "title": "Program Management Lead", 
        "description": "10+ years of program management, project management or product management experience and a track record of building solutions that create value.",
        "should_include": False,
        "reason": "10+ years experience (overqualified)"
    },
    {
        "title": "Executive Healthcare Administrator",
        "description": "Master's degree or other advanced degree(s) in business, health administration and/or public policy, or other relevant fields.",
        "should_include": False,
        "reason": "Advanced degree required"
    },
    {
        "title": "Healthcare Coordinator",
        "description": "High School Diploma required. No experience necessary.",
        "should_include": False,
        "reason": "Only high school required"
    }
]

# Test cases that should be INCLUDED (entry-level positions)
include_cases = [
    {
        "title": "Healthcare Admin Assistant",
        "description": "Bachelor's degree in Healthcare Administration required. 0-2 years experience preferred.",
        "should_include": True,
        "reason": "Bachelor's required, entry-level experience"
    },
    {
        "title": "Medical Office Coordinator", 
        "description": "Bachelor's degree preferred but not required. No experience required, entry-level position.",
        "should_include": True,
        "reason": "Bachelor's preferred, entry-level"
    },
    {
        "title": "Healthcare Operations Coordinator",
        "description": "Bachelor's degree in Accounting, Finance, or a related field. 1-2 years experience preferred.",
        "should_include": True,
        "reason": "Bachelor's required, entry-level experience"
    },
    {
        "title": "Entry-Level Healthcare Admin",
        "description": "Bachelor's degree required. 1-2 years experience preferred.",
        "should_include": True,
        "reason": "Bachelor's required, acceptable experience range (1-2 years)"
    },
    {
        "title": "Healthcare Coordinator - New Grad",
        "description": "Bachelor's degree required. 0-1 years experience, will train.",
        "should_include": True,
        "reason": "Bachelor's required, perfect entry-level range (0-1 years)"
    },
]

print("Testing jobs that should be EXCLUDED:")
print("=" * 50)
for i, case in enumerate(test_cases, 1):
    title = case["title"]
    description = case["description"] 
    expected = case["should_include"]
    reason = case["reason"]
    
    result = meets_bachelors_requirement(title + "\n" + description)
    analysis = analyze_education_requirements(title + "\n" + description)
    
    status = "✅ PASS" if result == expected else "❌ FAIL"
    print(f"\n{i}. {title}")
    print(f"   Expected: {expected} ({reason})")
    print(f"   Got: {result} - {status}")
    print(f"   Analysis: {analysis['reasoning']}")

print("\n\nTesting jobs that should be INCLUDED:")
print("=" * 50)
for i, case in enumerate(include_cases, 1):
    title = case["title"]
    description = case["description"]
    expected = case["should_include"]
    reason = case["reason"]
    
    result = meets_bachelors_requirement(title + "\n" + description)
    analysis = analyze_education_requirements(title + "\n" + description)
    
    status = "✅ PASS" if result == expected else "❌ FAIL"
    print(f"\n{i}. {title}")
    print(f"   Expected: {expected} ({reason})")
    print(f"   Got: {result} - {status}")
    print(f"   Analysis: {analysis['reasoning']}")