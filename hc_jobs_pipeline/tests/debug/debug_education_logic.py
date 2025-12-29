#!/usr/bin/env python3
"""
Interactive Education Filter Debugging
======================================
Debug utility for testing education filtering logic interactively.
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from education_filters import analyze_education_requirements, meets_bachelors_requirement

def test_predefined_cases():
    """Test with predefined test cases"""
    print("🎓 PREDEFINED EDUCATION FILTER TESTS")
    print("=" * 50)
    
    test_cases = [
        "Bachelor's degree required in healthcare administration",
        "High school diploma required, bachelor's preferred", 
        "Master's degree in healthcare management required",
        "Associates degree in medical administration required",
        "Bachelor's degree preferred but not required",
        "Entry-level position, bachelor's degree required",
        "PhD in healthcare administration required",
        "No degree required, experience preferred"
    ]
    
    for i, test in enumerate(test_cases, 1):
        print(f"\nTest {i}: {test}")
        analysis = analyze_education_requirements(test, "")
        print(f"  ✅ Include: {analysis['should_include']}")
        print(f"  📊 Score: {analysis['score']}")  
        print(f"  💭 Reasoning: {analysis['reasoning']}")
        print(f"  🔍 Matches: {analysis['matches']}")

def interactive_testing():
    """Interactive testing mode"""
    print("\n🔧 INTERACTIVE EDUCATION FILTER TESTING")
    print("=" * 50)
    print("Enter job descriptions to test education filtering.")
    print("Type 'quit' to exit, 'help' for commands.\n")
    
    while True:
        try:
            user_input = input("📝 Enter job description: ").strip()
            
            if user_input.lower() == 'quit':
                print("👋 Exiting debug mode...")
                break
            elif user_input.lower() == 'help':
                print("\nCommands:")
                print("  quit - Exit interactive mode")
                print("  help - Show this help")  
                print("  clear - Clear screen")
                print("  examples - Show example descriptions")
                continue
            elif user_input.lower() == 'clear':
                os.system('cls' if os.name == 'nt' else 'clear')
                continue
            elif user_input.lower() == 'examples':
                show_examples()
                continue
            elif not user_input:
                continue
            
            # Analyze the input
            print(f"\n🔍 ANALYZING: {user_input[:60]}...")
            analysis = analyze_education_requirements(user_input, "")
            
            print(f"📊 RESULT:")
            print(f"  Should Include: {'✅ YES' if analysis['should_include'] else '❌ NO'}")
            print(f"  Score: {analysis['score']}")
            print(f"  Reasoning: {analysis['reasoning']}")
            print(f"  Detailed Matches:")
            
            for category, matches in analysis['matches'].items():
                if matches:
                    print(f"    {category}: {matches}")
            
            print()
            
        except KeyboardInterrupt:
            print("\n\n👋 Exiting debug mode...")
            break
        except Exception as e:
            print(f"💥 Error: {e}")

def show_examples():
    """Show example job descriptions"""
    print("\n📚 EXAMPLE JOB DESCRIPTIONS:")
    print("-" * 40)
    examples = [
        "Bachelor's degree in healthcare administration required",
        "High school diploma required",
        "Master's degree preferred", 
        "Bachelor's degree or equivalent experience",
        "Entry-level position, bachelor's degree required",
        "Associates degree in medical assisting required"
    ]
    
    for i, example in enumerate(examples, 1):
        print(f"{i}. {example}")

def pattern_testing():
    """Test specific regex patterns"""
    print("\n🔍 PATTERN TESTING MODE")
    print("=" * 35)
    
    from education_filters import (
        BACHELORS_PATTERNS, HIGH_SCHOOL_PATTERNS, 
        BACHELORS_PREFERRED_PATTERNS, ADVANCED_DEGREE_PATTERNS
    )
    import re
    
    pattern_groups = {
        "Bachelor's Patterns": BACHELORS_PATTERNS,
        "High School Patterns": HIGH_SCHOOL_PATTERNS,
        "Bachelor's Preferred": BACHELORS_PREFERRED_PATTERNS,
        "Advanced Degree": ADVANCED_DEGREE_PATTERNS
    }
    
    test_text = input("Enter text to test against patterns: ").strip().lower()
    
    for group_name, patterns in pattern_groups.items():
        matches = []
        for pattern in patterns:
            if re.search(pattern, test_text, re.IGNORECASE):
                matches.append(pattern)
        
        if matches:
            print(f"\n{group_name} matches:")
            for match in matches:
                print(f"  - {match}")
        else:
            print(f"\n{group_name}: No matches")

def main():
    """Main debug menu"""
    while True:
        print("\n🐛 EDUCATION FILTER DEBUG UTILITY")
        print("=" * 40)
        print("1. Test predefined cases")
        print("2. Interactive testing")
        print("3. Pattern testing")
        print("4. Exit")
        
        try:
            choice = input("\nSelect option (1-4): ").strip()
            
            if choice == "1":
                test_predefined_cases()
            elif choice == "2":
                interactive_testing()
            elif choice == "3":
                pattern_testing()
            elif choice == "4":
                print("👋 Goodbye!")
                break
            else:
                print("Invalid choice. Please select 1-4.")
                
        except KeyboardInterrupt:
            print("\n\n👋 Goodbye!")
            break
        except Exception as e:
            print(f"💥 Error: {e}")

if __name__ == "__main__":
    main()