#!/usr/bin/env python3
"""
Unit Tests for Qualifications Extractor
=======================================
Tests the qualification text extraction and parsing functionality.
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from enhanced_qualifications import QualificationsExtractor

class TestQualificationsExtractor:
    """Test class for qualifications extraction"""
    
    def __init__(self):
        self.passed = 0
        self.failed = 0
        self.extractor = QualificationsExtractor()
    
    def test_basic_extraction(self):
        """Test basic qualification extraction"""
        print("📋 Testing Basic Qualification Extraction")
        
        sample_text = """
        Healthcare Operations Coordinator
        Remote
        
        We are seeking a Healthcare Operations Coordinator to join our team.
        
        Requirements:
        • Bachelor's degree in Healthcare Administration or related field
        • 3+ years of experience in healthcare operations
        • Strong analytical and communication skills
        • Experience with EMR systems preferred
        
        Preferred Qualifications:
        • Master's degree in Healthcare Administration
        • Project management certification
        """
        
        try:
            quals = self.extractor.extract_comprehensive_qualifications(sample_text)
            
            # Check that qualifications were extracted
            if len(quals) > 0:
                print("✅ PASS: Basic extraction successful")
                print(f"   Extracted {len(quals)} characters")
                print(f"   Preview: {quals[:100]}...")
                self.passed += 1
                
                # Check for key content
                if "Bachelor's degree" in quals and "experience" in quals:
                    print("✅ PASS: Key qualification content found")
                    self.passed += 1
                else:
                    print("❌ FAIL: Missing key qualification content")
                    self.failed += 1
            else:
                print("❌ FAIL: No qualifications extracted")
                self.failed += 1
                
        except Exception as e:
            print(f"💥 ERROR: Basic extraction failed with {e}")
            self.failed += 1
    
    def test_section_recognition(self):
        """Test recognition of different qualification section headings"""
        print("\n📋 Testing Section Recognition")
        
        test_sections = [
            ("Requirements:", "Basic requirements header"),
            ("Qualifications:", "Standard qualifications header"),
            ("What you'll need:", "Conversational header"),
            ("Minimum Requirements:", "Minimum requirements header"),
            ("Skills and Experience:", "Skills header"),
        ]
        
        for header, test_name in test_sections:
            test_text = f"""
            Job Title
            Location
            
            {header}
            • Bachelor's degree required
            • 2+ years experience
            """
            
            try:
                quals = self.extractor.extract_comprehensive_qualifications(test_text)
                if len(quals) > 0 and "Bachelor's degree" in quals:
                    print(f"✅ PASS: {test_name}")
                    self.passed += 1
                else:
                    print(f"❌ FAIL: {test_name}")
                    self.failed += 1
            except Exception as e:
                print(f"💥 ERROR: {test_name} failed with {e}")
                self.failed += 1
    
    def test_edge_cases(self):
        """Test edge cases and boundary conditions"""
        print("\n🔬 Testing Edge Cases")
        
        edge_cases = [
            ("", "Empty string"),
            ("Job Title\nLocation\nNo requirements section", "No qualification section"),
            ("Requirements:\n• \n• \n• ", "Empty bullet points"),
            ("Multiple Requirements: sections Requirements: should handle this Requirements: properly", "Multiple sections"),
        ]
        
        for text, test_name in edge_cases:
            try:
                quals = self.extractor.extract_comprehensive_qualifications(text)
                print(f"✅ PASS: {test_name} (handled gracefully)")
                self.passed += 1
            except Exception as e:
                print(f"❌ FAIL: {test_name} - Exception: {e}")
                self.failed += 1
    
    def run_all_tests(self):
        """Run all qualification extractor tests"""
        print("📋 UNIT TESTS: Qualifications Extractor")
        print("=" * 50)
        
        self.test_basic_extraction()
        self.test_section_recognition()
        self.test_edge_cases()
        
        self.print_summary()
    
    def print_summary(self):
        """Print test results summary"""
        total = self.passed + self.failed
        success_rate = (self.passed / total * 100) if total > 0 else 0
        
        print("\n" + "=" * 50)
        print(f"📊 Qualifications Extractor Test Results")
        print(f"Total Tests: {total}")
        print(f"✅ Passed: {self.passed}")
        print(f"❌ Failed: {self.failed}")
        print(f"Success Rate: {success_rate:.1f}%")
        
        if self.failed == 0:
            print("🎉 All qualification extractor tests passed!")
        else:
            print(f"⚠️  {self.failed} test(s) failed - review extraction logic")

def main():
    """Main test execution"""
    tester = TestQualificationsExtractor()
    tester.run_all_tests()
    
    if tester.failed == 0:
        print("\n🎉 ALL QUALIFICATION EXTRACTOR TESTS PASSED!")
        return 0
    else:
        print(f"\n💥 SOME TESTS FAILED - Review extraction logic")
        return 1

if __name__ == "__main__":
    exit_code = main()
    sys.exit(exit_code)