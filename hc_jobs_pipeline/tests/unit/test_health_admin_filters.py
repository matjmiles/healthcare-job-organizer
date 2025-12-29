#!/usr/bin/env python3
"""
Unit Tests for Health Admin Job Identification
==============================================
Tests the healthcare administration job filtering logic.
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from run_collect import looks_like_health_admin

class TestHealthAdminFilters:
    """Test class for health admin job identification"""
    
    def __init__(self):
        self.passed = 0
        self.failed = 0
        self.test_cases = [
            # (title, description, expected_include, reason_expected, test_name)
            ("Healthcare Operations Coordinator", "Coordinate patient care operations in hospital setting", True, "passes", "Healthcare operations role"),
            ("Medical Billing Specialist", "Process insurance claims and patient billing", True, "passes", "Medical billing role"),
            ("Practice Administrator", "Manage medical practice operations and staff", True, "passes", "Practice administration"),
            ("Health Information Manager", "Manage patient records and health information systems", True, "passes", "Health information management"),
            ("Software Engineer", "Build web applications using React and Node.js", False, "no_admin_keywords", "Non-healthcare software role"),
            ("Data Scientist", "Analyze customer behavior and marketing data", False, "no_admin_keywords", "Non-healthcare data role"),
            ("Registered Nurse", "Provide direct patient care in ICU setting", False, "clinical_roles", "Clinical nursing role"),
            ("Physical Therapist", "Provide rehabilitation services to patients", False, "clinical_roles", "Clinical therapy role"),
            ("Hospital Administrator", "Oversee hospital operations and strategic planning", True, "passes", "Hospital administration"),
            ("Medical Assistant", "Support physicians with clinical and administrative tasks", False, "clinical_roles", "Clinical support role"),
        ]
    
    def run_test(self, title: str, description: str, expected: bool, expected_reason: str, test_name: str) -> bool:
        """Run a single test case"""
        try:
            result, reason = looks_like_health_admin(title, description)
            
            if result == expected and (expected_reason == reason or expected_reason == "passes"):
                print(f"✅ PASS: {test_name}")
                print(f"   Title: {title}")
                print(f"   Expected: {expected}, Got: {result}")
                print(f"   Reason: {reason}")
                self.passed += 1
                return True
            else:
                print(f"❌ FAIL: {test_name}")
                print(f"   Title: {title}")
                print(f"   Description: {description[:50]}...")
                print(f"   Expected: {expected} ({expected_reason}), Got: {result} ({reason})")
                self.failed += 1
                return False
                
        except Exception as e:
            print(f"💥 ERROR: {test_name}")
            print(f"   Exception: {e}")
            self.failed += 1
            return False
    
    def run_all_tests(self):
        """Run all health admin filter tests"""
        print("🏥 UNIT TESTS: Health Admin Filters")
        print("=" * 50)
        
        for title, description, expected, expected_reason, test_name in self.test_cases:
            self.run_test(title, description, expected, expected_reason, test_name)
            print()
        
        self.print_summary()
    
    def print_summary(self):
        """Print test results summary"""
        total = self.passed + self.failed
        success_rate = (self.passed / total * 100) if total > 0 else 0
        
        print("=" * 50)
        print(f"📊 Health Admin Filter Test Results")
        print(f"Total Tests: {total}")
        print(f"✅ Passed: {self.passed}")
        print(f"❌ Failed: {self.failed}")
        print(f"Success Rate: {success_rate:.1f}%")
        
        if self.failed == 0:
            print("🎉 All health admin filter tests passed!")
        else:
            print(f"⚠️  {self.failed} test(s) failed - review filtering logic")

def test_keyword_detection():
    """Test specific keyword detection patterns"""
    print("\n🔍 KEYWORD DETECTION TESTS")
    print("=" * 35)
    
    keyword_tests = [
        ("Revenue Cycle Manager", "Manage revenue cycle operations", True, "Revenue cycle keyword"),
        ("Quality Assurance Specialist", "Healthcare quality improvement", True, "Quality assurance healthcare"),
        ("Compliance Officer", "Ensure regulatory compliance in healthcare", True, "Healthcare compliance"),
        ("Marketing Manager", "Digital marketing campaigns", False, "Non-healthcare marketing"),
        ("HR Business Partner", "Human resources support", False, "Non-healthcare HR"),
    ]
    
    tester = TestHealthAdminFilters()
    for title, desc, expected, test_name in keyword_tests:
        expected_reason = "passes" if expected else "no_admin_keywords"
        tester.run_test(title, desc, expected, expected_reason, test_name)
    
    return tester.failed == 0

def main():
    """Main test execution"""
    # Run standard tests
    tester = TestHealthAdminFilters()
    tester.run_all_tests()
    
    # Run keyword detection tests
    keyword_success = test_keyword_detection()
    
    # Overall result
    overall_success = tester.failed == 0 and keyword_success
    
    if overall_success:
        print("\n🎉 ALL HEALTH ADMIN FILTER TESTS PASSED!")
        return 0
    else:
        print(f"\n💥 SOME TESTS FAILED - Review filtering logic")
        return 1

if __name__ == "__main__":
    exit_code = main()
    sys.exit(exit_code)