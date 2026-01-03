#!/usr/bin/env python3
"""Test health admin identification"""

from run_collect import looks_like_health_admin

# Test cases that should pass health admin check
test_cases = [
    ("Healthcare Operations Coordinator", "Coordinate patient care operations"),
    ("Medical Billing Specialist", "Process insurance claims and billing"),
    ("Practice Administrator", "Manage medical practice operations"),
    ("Quality Manager", "Healthcare quality improvement initiatives"),
    ("Business Operations Manager", "Healthcare business operations"),
    ("Revenue Cycle Analyst", "Analyze healthcare revenue processes"),
    ("Compliance Officer", "Ensure healthcare regulatory compliance"),
    ("Data Analyst", "Analyze healthcare data and metrics"),
    ("Project Manager", "Manage healthcare IT projects"),
    ("Operations Specialist", "Healthcare operations support"),
]

print("🏥 TESTING HEALTH ADMIN IDENTIFICATION:")
print("=" * 50)

for title, desc in test_cases:
    result, reason = looks_like_health_admin(title, desc)
    status = "✅ PASS" if result else "❌ FAIL"
    print(f"{status}: {title}")
    print(f"   Description: {desc[:40]}...")
    print(f"   Result: {result} ({reason})")
    print()