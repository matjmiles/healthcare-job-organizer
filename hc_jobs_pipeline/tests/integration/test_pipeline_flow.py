#!/usr/bin/env python3
"""
Integration Test for Complete Pipeline Flow
==========================================
Tests the end-to-end pipeline execution with mock data.
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

import json
import asyncio
from pathlib import Path
from unittest.mock import Mock, AsyncMock, patch

class TestPipelineIntegration:
    """Integration test for complete pipeline"""
    
    def __init__(self):
        self.passed = 0
        self.failed = 0
        
    def create_mock_job_data(self):
        """Create mock job data for testing"""
        return [
            {
                "text": "Healthcare Operations Coordinator",
                "hostedUrl": "https://example.com/job1",
                "categories": {"location": "California, US"},
                "description": "<p>We seek a Healthcare Operations Coordinator. Requirements: Bachelor's degree in Healthcare Administration required. 3+ years experience.</p>",
                "lists": []
            },
            {
                "text": "Software Engineer", 
                "hostedUrl": "https://example.com/job2",
                "categories": {"location": "New York, US"},
                "description": "<p>Build web applications. Requirements: Computer Science degree, Python experience.</p>",
                "lists": []
            },
            {
                "text": "Medical Billing Specialist",
                "hostedUrl": "https://example.com/job3", 
                "categories": {"location": "Texas, US"},
                "description": "<p>Process medical billing and insurance claims. Requirements: High school diploma required, bachelor's preferred.</p>",
                "lists": []
            }
        ]
    
    async def test_pipeline_filtering(self):
        """Test that pipeline correctly filters jobs"""
        print("🔗 Testing Pipeline Filtering Logic")
        
        try:
            from run_collect import looks_like_health_admin, meets_bachelors_requirement
            from enhanced_qualifications import QualificationsExtractor
            
            mock_jobs = self.create_mock_job_data()
            extractor = QualificationsExtractor()
            filtered_jobs = []
            
            for job in mock_jobs:
                title = job["text"]
                desc = job["description"].replace("<p>", "").replace("</p>", "")
                
                # Apply same filtering as pipeline
                admin_check, admin_reason = looks_like_health_admin(title, desc)
                if admin_check:
                    education_check = meets_bachelors_requirement(desc, "")
                    if education_check:
                        quals = extractor.extract_comprehensive_qualifications(f"{title}\n{desc}")
                        filtered_jobs.append({
                            "title": title,
                            "qualifications": quals,
                            "admin_reason": admin_reason
                        })
            
            # Verify filtering results
            expected_count = 1  # Only Healthcare Operations Coordinator should pass
            if len(filtered_jobs) == expected_count:
                print(f"✅ PASS: Pipeline filtered to {len(filtered_jobs)} job(s) as expected")
                print(f"   Included job: {filtered_jobs[0]['title']}")
                self.passed += 1
                
                # Verify qualification extraction
                if len(filtered_jobs[0]['qualifications']) > 0:
                    print("✅ PASS: Qualifications extracted for filtered job")
                    self.passed += 1
                else:
                    print("❌ FAIL: No qualifications extracted")
                    self.failed += 1
            else:
                print(f"❌ FAIL: Expected {expected_count} job(s), got {len(filtered_jobs)}")
                for job in filtered_jobs:
                    print(f"   - {job['title']}")
                self.failed += 1
                
        except Exception as e:
            print(f"💥 ERROR: Pipeline filtering test failed: {e}")
            self.failed += 1
    
    async def test_api_mock_integration(self):
        """Test integration with mocked API calls"""
        print("\n🌐 Testing API Integration (Mocked)")
        
        try:
            # Mock the API response
            mock_response = Mock()
            mock_response.json.return_value = self.create_mock_job_data()
            mock_response.raise_for_status.return_value = None
            
            # Mock the HTTP client
            mock_client = AsyncMock()
            mock_client.get.return_value = mock_response
            
            from run_collect import fetch_lever
            
            # Test API fetch
            result = await fetch_lever(mock_client, "test-company")
            
            if len(result) == 3:  # Should return our 3 mock jobs
                print(f"✅ PASS: API fetch returned {len(result)} jobs")
                print(f"   Sample job: {result[0]['text']}")
                self.passed += 1
            else:
                print(f"❌ FAIL: Expected 3 jobs, got {len(result)}")
                self.failed += 1
                
        except Exception as e:
            print(f"💥 ERROR: API integration test failed: {e}")
            self.failed += 1
    
    def test_data_structure_validation(self):
        """Test that pipeline output has correct data structure"""
        print("\n📊 Testing Output Data Structure")
        
        try:
            # Check if pipeline has run and produced output
            output_file = Path(__file__).parent.parent / "output" / "healthcare_admin_jobs_us_nationwide.json"
            
            if output_file.exists():
                data = json.loads(output_file.read_text(encoding="utf-8"))
                
                if isinstance(data, list) and len(data) > 0:
                    print(f"✅ PASS: Output file contains {len(data)} jobs")
                    
                    # Validate structure of first job
                    first_job = data[0]
                    required_fields = ["title", "company", "location", "url", "qualifications"]
                    
                    missing_fields = [field for field in required_fields if field not in first_job]
                    
                    if not missing_fields:
                        print("✅ PASS: All required fields present in job data")
                        self.passed += 1
                    else:
                        print(f"❌ FAIL: Missing fields: {missing_fields}")
                        self.failed += 1
                        
                    self.passed += 1
                else:
                    print("❌ FAIL: Output file is empty or invalid format")
                    self.failed += 1
            else:
                print("⚠️  SKIP: No output file found (run pipeline first)")
                # Don't count as failure since this is optional
                
        except Exception as e:
            print(f"💥 ERROR: Data structure validation failed: {e}")
            self.failed += 1
    
    async def run_all_tests(self):
        """Run all integration tests"""
        print("🔗 INTEGRATION TESTS: Complete Pipeline")
        print("=" * 50)
        
        await self.test_pipeline_filtering()
        await self.test_api_mock_integration()
        self.test_data_structure_validation()
        
        self.print_summary()
    
    def print_summary(self):
        """Print test results summary"""
        total = self.passed + self.failed
        success_rate = (self.passed / total * 100) if total > 0 else 0
        
        print("\n" + "=" * 50)
        print(f"📊 Integration Test Results")
        print(f"Total Tests: {total}")
        print(f"✅ Passed: {self.passed}")
        print(f"❌ Failed: {self.failed}")
        print(f"Success Rate: {success_rate:.1f}%")
        
        if self.failed == 0:
            print("🎉 All integration tests passed!")
        else:
            print(f"⚠️  {self.failed} test(s) failed - review integration issues")

async def main():
    """Main test execution"""
    tester = TestPipelineIntegration()
    await tester.run_all_tests()
    
    if tester.failed == 0:
        print("\n🎉 ALL INTEGRATION TESTS PASSED!")
        return 0
    else:
        print(f"\n💥 SOME TESTS FAILED - Review integration logic")
        return 1

if __name__ == "__main__":
    exit_code = asyncio.run(main())
    sys.exit(exit_code)