#!/usr/bin/env python3
"""Quick test of current education filtering"""

from education_filters import analyze_education_requirements, meets_bachelors_requirement

# Test cases that should PASS (be included)
test_cases = [
    ("Healthcare Operations Coordinator with Bachelor's degree required", True),
    ("Medical Billing Specialist with Bachelor's preferred", True), 
    ("Practice Administrator - Bachelor's degree desired", True),
    ("Business Operations Manager - Bachelor's degree or equivalent", True),
    ("Quality Manager - Bachelor's in healthcare administration", True)
]

print("🎓 TESTING CURRENT EDUCATION FILTERING LOGIC:")
print("=" * 60)

for description, expected in test_cases:
    result = meets_bachelors_requirement(description, "")
    analysis = analyze_education_requirements(description, "")
    
    status = "✅ PASS" if result == expected else "❌ FAIL"
    print(f"{status}: {description[:50]}...")
    print(f"   Expected: {expected}, Got: {result}")
    print(f"   Score: {analysis['score']}")  
    print(f"   Reasoning: {analysis['reasoning']}")
    print()