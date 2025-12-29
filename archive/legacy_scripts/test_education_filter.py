#!/usr/bin/env python3
"""
Test script for education filtering logic.
Tests the education_filters module with sample job descriptions.
"""

import sys
from pathlib import Path

# Add the hc_jobs_pipeline directory to path
sys.path.insert(0, str(Path(__file__).parent))

from education_filters import analyze_education_requirements, meets_bachelors_requirement

# Test cases based on actual job descriptions from the data
test_cases = [
    {
        "name": "Bachelor's in Healthcare Admin (SHOULD INCLUDE)",
        "description": """
        Bachelor's degree in healthcare administration, information technology, business, or a related field.
        2+ years of experience in healthcare IT implementations, project coordination, or a relevant internship.
        """,
        "expected": True
    },
    {
        "name": "Bachelor's in Marketing/Sales (SHOULD INCLUDE)",
        "description": """
        Bachelor's degree in marketing, communications, sales, or business administration
        3+ years of experience in a sales or business development role
        """,
        "expected": True
    },
    {
        "name": "Bachelor's Required (SHOULD INCLUDE)",
        "description": """
        Bachelor's degree required
        3+ years experience in healthcare operations or clinical workforce management
        """,
        "expected": True
    },
    {
        "name": "High School Diploma (SHOULD EXCLUDE)",
        "description": """
        High school diploma or equivalent required
        Customer service experience preferred
        Medical terminology helpful
        """,
        "expected": False
    },
    {
        "name": "Associates Degree (SHOULD EXCLUDE)",
        "description": """
        Associate's degree in business or healthcare preferred
        2+ years experience in medical office setting
        """,
        "expected": False
    },
    {
        "name": "Bachelor's Preferred but Not Required (SHOULD EXCLUDE)",
        "description": """
        Bachelor's degree preferred or equivalent experience
        5+ years of relevant work experience may substitute for degree
        """,
        "expected": False
    },
    {
        "name": "Master's Degree (SHOULD EXCLUDE - OVERQUALIFIED)",
        "description": """
        Master's degree in Healthcare Administration (MHA) or related field
        5+ years of leadership experience in healthcare settings
        """,
        "expected": False
    },
    {
        "name": "No Clear Education Requirements (SHOULD EXCLUDE)",
        "description": """
        3+ years of experience in customer service
        Strong communication skills
        Ability to work in fast-paced environment
        """,
        "expected": False
    },
    {
        "name": "Experience in Lieu of Degree (SHOULD EXCLUDE)",
        "description": """
        Bachelor's degree or 5+ years equivalent experience in healthcare administration
        Knowledge of medical terminology preferred
        """,
        "expected": False
    },
    {
        "name": "Healthcare Admin Bachelor's (SHOULD INCLUDE - HIGH PRIORITY)",
        "description": """
        Bachelor's degree in Health Administration, Healthcare Management, or related field required
        Understanding of healthcare compliance and regulations
        """,
        "expected": True
    }
]

def run_tests():
    print("🧪 Testing Education Filtering Logic")
    print("=" * 50)
    
    passed = 0
    failed = 0
    
    for i, test in enumerate(test_cases, 1):
        print(f"\nTest {i}: {test['name']}")
        print("-" * 60)
        
        # Run analysis
        analysis = analyze_education_requirements(test['description'])
        result = meets_bachelors_requirement(test['description'])
        
        # Check result
        if result == test['expected']:
            status = "✅ PASSED"
            passed += 1
        else:
            status = "❌ FAILED"
            failed += 1
            
        print(f"Expected: {test['expected']}, Got: {result} - {status}")
        print(f"Score: {analysis['score']}")
        print(f"Reasoning: {analysis['reasoning']}")
        
        # Show matches for debugging
        for category, matches in analysis['matches'].items():
            if matches:
                print(f"  {category}: {matches}")
    
    print("\n" + "=" * 50)
    print(f"📊 Results: {passed} passed, {failed} failed")
    
    if failed > 0:
        print("❌ Some tests failed - review the filtering logic")
        return False
    else:
        print("✅ All tests passed - filtering logic working correctly!")
        return True

if __name__ == "__main__":
    success = run_tests()
    sys.exit(0 if success else 1)