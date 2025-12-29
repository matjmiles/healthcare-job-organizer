#!/usr/bin/env python3

from education_filters import analyze_education_requirements, meets_bachelors_requirement

# Test cases for bachelor's preferred
test_cases = [
    "Bachelor's degree preferred but not required. 2+ years experience.",
    "Preferred qualifications: Bachelor's degree in business administration.",
    "High school diploma required. Bachelor's degree desired.",
    "Bachelor's degree required in healthcare administration.",
    "Associate's degree required.",
    "Bachelor's degree is a plus for this position.",
    "Bachelor's degree or equivalent experience required.",
    "Education: High school diploma. Bachelor's degree preferred."
]

print("Testing Bachelor's Degree Filtering Logic")
print("=" * 50)

for i, case in enumerate(test_cases, 1):
    result = analyze_education_requirements(case)
    should_include = meets_bachelors_requirement(case)
    
    print(f"Test {i}: {'INCLUDE' if should_include else 'EXCLUDE'}")
    print(f"   Text: \"{case[:60]}...\"")
    print(f"   Score: {result['score']}")
    print(f"   Reasoning: {result['reasoning']}")
    print(f"   Matches: {[k for k, v in result['matches'].items() if v]}")
    print()