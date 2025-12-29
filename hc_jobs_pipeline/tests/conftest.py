"""
Pytest configuration and shared fixtures for test suite
"""
import pytest
import sys
from pathlib import Path

# Add parent directory to path for imports
sys.path.append(str(Path(__file__).parent.parent))

@pytest.fixture
def sample_job_data():
    """Sample job data for testing"""
    return {
        "title": "Healthcare Operations Coordinator",
        "company": "Test Healthcare System", 
        "location": "California, US",
        "url": "https://example.com/job1",
        "description": "We are seeking a Healthcare Operations Coordinator. Requirements: Bachelor's degree in Healthcare Administration required. 3+ years of healthcare operations experience.",
        "qualifications": "Bachelor's degree in Healthcare Administration required; 3+ years of healthcare operations experience"
    }

@pytest.fixture
def education_test_cases():
    """Standard education filtering test cases"""
    return [
        ("Bachelor's degree required", True),
        ("High school diploma required", False),
        ("Master's degree required", False), 
        ("Bachelor's degree preferred", True),
        ("Associates degree required", False),
        ("PhD required", False)
    ]

@pytest.fixture
def health_admin_test_cases():
    """Health admin job identification test cases"""
    return [
        ("Healthcare Operations Coordinator", "Coordinate patient care operations", True),
        ("Software Engineer", "Build web applications", False),
        ("Medical Billing Specialist", "Process medical billing", True),
        ("Data Scientist", "Analyze marketing data", False)
    ]