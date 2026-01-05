#!/usr/bin/env python3
"""
Unit Tests for Education Filtering Logic
=======================================
Tests the bachelor's degree requirement filtering with comprehensive test cases.
"""

import sys
import os

# Add the parent directory (hc_jobs_pipeline) to the path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../../')))

from education_filters import analyze_education_requirements, meets_bachelors_requirement

class TestEducationFilters:
    """Test class for education filtering functionality"""

    def __init__(self):
        self.passed = 0
        self.failed = 0
        self.test_cases = [
            # (description, expected_include, test_name)
            ("Bachelor's degree required in healthcare administration", True, "Healthcare admin bachelor's required"),
            ("High school diploma required, bachelor's preferred", False, "High school primary with bachelor's preferred"),
            ("Master's degree in healthcare management required", False, "Master's degree overqualified"),
            ("Associates degree required", False, "Associates degree only"),
            ("Bachelor's degree preferred but not required", True, "Bachelor's preferred"),
            ("Entry-level position, bachelor's degree required", True, "Entry-level with bachelor's required"),
            ("Bachelor's degree in business administration desired", True, "Bachelor's desired"),
            ("PhD in healthcare administration required", False, "PhD overqualified"),
            ("No degree required, experience preferred", False, "No degree required"),
            ("Bachelor's or equivalent experience", True, "Bachelor's or equivalent")
        ]

    def run_test(self, description: str, expected: bool, test_name: str) -> bool:
        """Run a single test case"""
        try:
            result = meets_bachelors_requirement(description, "")
            analysis = analyze_education_requirements(description, "")

            if result == expected:
                print(f"PASS: {test_name}")
                print(f"   Input: {description[:50]}...")
                print(f"   Expected: {expected}, Got: {result}")
                print(f"   Score: {analysis['score']}, Reason: {analysis['reasoning'][:60]}...")
                self.passed += 1
                return True
            else:
                print(f"FAIL: {test_name}")
                print(f"   Input: {description[:50]}...")
                print(f"   Expected: {expected}, Got: {result}")
                print(f"   Score: {analysis['score']}, Reason: {analysis['reasoning']}")
                print(f"   Matches: {analysis['matches']}")
                self.failed += 1
                return False

        except Exception as e:
            print(f"ERROR: {test_name}")
            print(f"   Exception: {e}")
            self.failed += 1
            return False

    def run_all_tests(self):
        """Run all education filter tests"""
        print("UNIT TESTS: Education Filters")
        print("=" * 50)

        for description, expected, test_name in self.test_cases:
            self.run_test(description, expected, test_name)
            print()

        self.print_summary()

    def print_summary(self):
        """Print test results summary"""
        total = self.passed + self.failed
        success_rate = (self.passed / total * 100) if total > 0 else 0

        print("=" * 50)
        print(f"Education Filter Test Results")
        print(f"Total Tests: {total}")
        print(f"Passed: {self.passed}")
        print(f"Failed: {self.failed}")
        print(f"Success Rate: {success_rate:.1f}%")

        if self.failed == 0:
            print("All education filter tests passed!")
        else:
            print(f"{self.failed} test(s) failed - review filtering logic")

def run_edge_case_tests():
    """Test edge cases and boundary conditions"""
    print("\nEDGE CASE TESTS")
    print("=" * 30)

    edge_cases = [
        ("", False, "Empty string"),
        ("bachelor", True, "Single word 'bachelor'"),
        ("BACHELOR'S DEGREE REQUIRED", True, "All caps"),
        ("bachelor's degree bachelor's degree", True, "Duplicate mentions"),
        ("High school required. Note: Bachelor's degree holders also welcome", True, "Mixed signals - bachelor's mentioned"),
        ("Must have college degree (4-year university)", True, "Implied bachelor's via 4-year"),
        ("Graduate degree preferred, bachelor's minimum", False, "Graduate preferred (overqualified)"),
    ]

    tester = TestEducationFilters()
    for description, expected, test_name in edge_cases:
        tester.run_test(description, expected, test_name)

    return tester.failed == 0

def debug_no_degree_case():
    """Debug the specific failing case"""
    print("\nDEBUGGING: 'No degree required' case")
    print("=" * 40)

    description = "No degree required, experience preferred"
    analysis = analyze_education_requirements(description, "")

    print(f"Input: {description}")
    print(f"Result: {analysis['should_include']} (expected: False)")
    print(f"Score: {analysis['score']}")
    print(f"Reasoning: {analysis['reasoning']}")
    print(f"Matches: {analysis['matches']}")

    # Check what patterns are matching
    from education_filters import HIGH_SCHOOL_PATTERNS
    import re

    print(f"\nPattern matches for 'high_school_only':")
    for pattern in HIGH_SCHOOL_PATTERNS:
        if re.search(pattern, description.lower(), re.IGNORECASE):
            print(f"  MATCH: {pattern}")

    return analysis['should_include'] == False

def main():
    """Main test execution"""
    # Debug the failing case first
    debug_success = debug_no_degree_case()

    # Run standard tests
    tester = TestEducationFilters()
    tester.run_all_tests()

    # Run edge case tests
    edge_success = run_edge_case_tests()

    # Overall result
    overall_success = tester.failed == 0 and edge_success and debug_success

    if overall_success:
        print("\nALL EDUCATION FILTER TESTS PASSED!")
        return 0
    else:
        print(f"\nSOME TESTS FAILED - Review filtering logic")
        return 1

if __name__ == "__main__":
    exit_code = main()
    sys.exit(exit_code)