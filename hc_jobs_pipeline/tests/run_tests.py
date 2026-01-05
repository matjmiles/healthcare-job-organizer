#!/usr/bin/env python3
"""
Comprehensive Test Runner for Healthcare Admin Jobs Pipeline
===========================================================
Industry-standard test execution with reporting and coverage analysis.
"""

import sys
import argparse
import subprocess
import time
from pathlib import Path
from typing import List, Dict, Any

def run_unit_tests() -> Dict[str, Any]:
    """Run all unit tests and return results"""
    print("🧪 Running Unit Tests")
    print("=" * 40)
    
    unit_dir = Path(__file__).parent / "unit"
    results = {"passed": 0, "failed": 0, "tests": []}
    
    for test_file in unit_dir.glob("test_*.py"):
        print(f"\n📋 Running {test_file.name}...")
        try:
            result = subprocess.run([
                sys.executable, str(test_file)
            ], capture_output=True, text=True, timeout=30)
            
            if result.returncode == 0:
                results["passed"] += 1
                print(f"  ✅ PASSED")
            else:
                results["failed"] += 1
                print(f"  ❌ FAILED")
                print(f"  Error: {result.stderr}")
                
            results["tests"].append({
                "name": test_file.name,
                "status": "PASSED" if result.returncode == 0 else "FAILED",
                "output": result.stdout,
                "error": result.stderr
            })
            
        except subprocess.TimeoutExpired:
            results["failed"] += 1
            print(f"  ⏰ TIMEOUT")
            
        except Exception as e:
            results["failed"] += 1
            print(f"  💥 ERROR: {e}")
    
    return results

def run_integration_tests() -> Dict[str, Any]:
    """Run integration tests"""
    print("\n🔗 Running Integration Tests") 
    print("=" * 40)
    
    integration_dir = Path(__file__).parent / "integration"
    results = {"passed": 0, "failed": 0, "tests": []}
    
    for test_file in integration_dir.glob("test_*.py"):
        print(f"\n📋 Running {test_file.name}...")
        try:
            result = subprocess.run([
                sys.executable, str(test_file)
            ], capture_output=True, text=True, timeout=60)
            
            if result.returncode == 0:
                results["passed"] += 1
                print(f"  ✅ PASSED")
            else:
                results["failed"] += 1
                print(f"  ❌ FAILED")
                print(f"  Error: {result.stderr}")
                
            results["tests"].append({
                "name": test_file.name,
                "status": "PASSED" if result.returncode == 0 else "FAILED",
                "output": result.stdout,
                "error": result.stderr
            })
            
        except subprocess.TimeoutExpired:
            results["failed"] += 1
            print(f"  ⏰ TIMEOUT")
            
        except Exception as e:
            results["failed"] += 1
            print(f"  💥 ERROR: {e}")
    
    return results

def show_debug_menu():
    """Show debug utilities menu"""
    print("\n🐛 Debug Utilities")
    print("=" * 30)
    
    debug_dir = Path(__file__).parent / "debug"
    debug_files = list(debug_dir.glob("debug_*.py"))
    
    if not debug_files:
        print("No debug utilities found.")
        return
        
    for i, debug_file in enumerate(debug_files, 1):
        name = debug_file.stem.replace("debug_", "").replace("_", " ").title()
        print(f"{i}. {name}")
    
    try:
        choice = int(input(f"\nSelect debug utility (1-{len(debug_files)}): ")) - 1
        if 0 <= choice < len(debug_files):
            selected_file = debug_files[choice]
            print(f"\n🚀 Running {selected_file.name}...")
            subprocess.run([sys.executable, str(selected_file)])
        else:
            print("Invalid selection")
    except (ValueError, KeyboardInterrupt):
        print("Debug menu cancelled")

def print_test_summary(unit_results: Dict, integration_results: Dict):
    """Print comprehensive test summary"""
    total_passed = unit_results["passed"] + integration_results["passed"]
    total_failed = unit_results["failed"] + integration_results["failed"]
    total_tests = total_passed + total_failed
    
    print("\n" + "=" * 60)
    print("📊 TEST SUMMARY")
    print("=" * 60)
    print(f"Total Tests: {total_tests}")
    print(f"✅ Passed: {total_passed}")
    print(f"❌ Failed: {total_failed}")
    print(f"Success Rate: {(total_passed/total_tests)*100:.1f}%" if total_tests > 0 else "No tests run")
    
    if unit_results["tests"]:
        print(f"\n📋 Unit Tests: {unit_results['passed']}/{len(unit_results['tests'])} passed")
        for test in unit_results["tests"]:
            status_icon = "✅" if test["status"] == "PASSED" else "❌"
            print(f"  {status_icon} {test['name']}")
    
    if integration_results["tests"]:
        print(f"\n🔗 Integration Tests: {integration_results['passed']}/{len(integration_results['tests'])} passed")
        for test in integration_results["tests"]:
            status_icon = "✅" if test["status"] == "PASSED" else "❌"
            print(f"  {status_icon} {test['name']}")

def main():
    parser = argparse.ArgumentParser(description="Healthcare Admin Jobs Pipeline Test Runner")
    parser.add_argument("--unit", action="store_true", help="Run only unit tests")
    parser.add_argument("--integration", action="store_true", help="Run only integration tests")
    parser.add_argument("--debug", action="store_true", help="Show debug utilities menu")
    parser.add_argument("--verbose", "-v", action="store_true", help="Verbose output")
    
    args = parser.parse_args()
    
    start_time = time.time()
    
    print("Healthcare Admin Jobs Pipeline - Test Suite")
    print("=" * 60)
    
    unit_results = {"passed": 0, "failed": 0, "tests": []}
    integration_results = {"passed": 0, "failed": 0, "tests": []}
    
    if args.debug:
        show_debug_menu()
        return
    
    if args.unit or (not args.integration):
        unit_results = run_unit_tests()
    
    if args.integration or (not args.unit):
        integration_results = run_integration_tests()
    
    elapsed = time.time() - start_time
    print(f"\n⏱️  Total execution time: {elapsed:.2f}s")
    
    print_test_summary(unit_results, integration_results)
    
    # Exit with error code if any tests failed
    if unit_results["failed"] > 0 or integration_results["failed"] > 0:
        sys.exit(1)

if __name__ == "__main__":
    main()