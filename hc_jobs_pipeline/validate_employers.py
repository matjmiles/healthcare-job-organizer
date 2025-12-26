#!/usr/bin/env python3
"""
Validate employers.json entries by testing API endpoints.
Identifies and fixes problematic entries, especially short slugs and encoded URLs.
"""

import json
import httpx
import asyncio
from typing import List, Dict, Tuple
import urllib.parse

async def test_lever_endpoint(slug: str, client: httpx.AsyncClient) -> Tuple[bool, str, int]:
    """Test a Lever API endpoint."""
    url = f"https://jobs.lever.co/{slug}"
    try:
        response = await client.get(url, timeout=10)
        job_count = 0
        if response.status_code == 200:
            data = response.json()
            job_count = len(data) if isinstance(data, list) else 0
        return response.status_code == 200, f"HTTP {response.status_code}", job_count
    except Exception as e:
        return False, f"Error: {str(e)}", 0

async def test_greenhouse_endpoint(slug: str, client: httpx.AsyncClient) -> Tuple[bool, str, int]:
    """Test a Greenhouse API endpoint."""
    url = f"https://boards-api.greenhouse.io/v1/boards/{slug}/jobs"
    try:
        response = await client.get(url, timeout=10)
        job_count = 0
        if response.status_code == 200:
            data = response.json()
            job_count = len(data.get('jobs', [])) if isinstance(data, dict) else 0
        return response.status_code == 200, f"HTTP {response.status_code}", job_count
    except Exception as e:
        return False, f"Error: {str(e)}", 0

async def validate_employer(employer: Dict, client: httpx.AsyncClient) -> Dict:
    """Validate a single employer entry."""
    company = employer.get('company', 'Unknown')
    platform = employer.get('platform', '')
    slug = employer.get('slug', '')
    
    print(f"Testing {company} ({platform}: {slug})...")
    
    if platform == 'lever':
        success, status, job_count = await test_lever_endpoint(slug, client)
    elif platform == 'greenhouse':
        success, status, job_count = await test_greenhouse_endpoint(slug, client)
    else:
        success, status, job_count = False, "Unknown platform", 0
    
    result = employer.copy()
    result['validation'] = {
        'ok': success,
        'status': status,
        'job_count': job_count,
        'tested_url': f"https://jobs.lever.co/{slug}" if platform == 'lever' else f"https://boards-api.greenhouse.io/v1/boards/{slug}/jobs"
    }
    
    # Special handling for problematic entries
    if not success:
        if slug == 'find':
            print(f"  ❌ SHORT SLUG ISSUE: '{slug}' failed - may need to find correct company slug")
        elif '%' in slug:
            print(f"  ❌ ENCODED SLUG ISSUE: '{slug}' has URL encoding - may need correction")
            # Try decoding the slug
            try:
                decoded_slug = urllib.parse.unquote(slug)
                print(f"  🔧 Decoded slug would be: '{decoded_slug}'")
                if decoded_slug != slug:
                    print(f"  ℹ️  Testing decoded version...")
                    if platform == 'lever':
                        decode_success, decode_status, decode_count = await test_lever_endpoint(decoded_slug, client)
                    else:
                        decode_success, decode_status, decode_count = await test_greenhouse_endpoint(decoded_slug, client)
                    
                    if decode_success:
                        print(f"  ✅ Decoded slug works! Should update to: '{decoded_slug}'")
                        result['suggested_slug'] = decoded_slug
                        result['validation']['decoded_test'] = {
                            'ok': True,
                            'status': decode_status,
                            'job_count': decode_count
                        }
            except Exception as e:
                print(f"  ⚠️  Could not decode slug: {e}")
    
    status_icon = "✅" if success else "❌"
    print(f"  {status_icon} {status} - {job_count} jobs")
    
    return result

async def main():
    """Main validation function."""
    print("🔍 Validating employers.json entries...")
    print("=" * 60)
    
    # Load employers
    try:
        with open('employers.json', 'r') as f:
            employers = json.load(f)
    except Exception as e:
        print(f"❌ Error loading employers.json: {e}")
        return
    
    print(f"Found {len(employers)} employers to validate\n")
    
    # Test all employers
    validated_employers = []
    failed_employers = []
    
    async with httpx.AsyncClient() as client:
        for employer in employers:
            try:
                result = await validate_employer(employer, client)
                validated_employers.append(result)
                
                if not result['validation']['ok']:
                    failed_employers.append(result)
                    
            except Exception as e:
                print(f"❌ Exception testing {employer.get('company', 'Unknown')}: {e}")
                result = employer.copy()
                result['validation'] = {'ok': False, 'status': f'Exception: {e}', 'job_count': 0}
                validated_employers.append(result)
                failed_employers.append(result)
            
            # Small delay to be respectful to APIs
            await asyncio.sleep(0.5)
    
    # Summary
    print("\n" + "=" * 60)
    print("📊 VALIDATION SUMMARY")
    print("=" * 60)
    
    successful = len(employers) - len(failed_employers)
    print(f"✅ Successful: {successful}/{len(employers)}")
    print(f"❌ Failed: {len(failed_employers)}/{len(employers)}")
    
    if failed_employers:
        print(f"\n🚨 FAILED EMPLOYERS:")
        for emp in failed_employers:
            company = emp.get('company', 'Unknown')
            slug = emp.get('slug', '')
            status = emp['validation']['status']
            print(f"  - {company} ({slug}): {status}")
            
            # Check for suggested fixes
            if 'suggested_slug' in emp:
                print(f"    💡 Suggested fix: Change slug to '{emp['suggested_slug']}'")
    
    # Save validation results
    with open('employers_validation_results.json', 'w') as f:
        json.dump(validated_employers, f, indent=2)
    
    print(f"\n📄 Full validation results saved to: employers_validation_results.json")
    
    # Create cleaned employers.json with fixes
    cleaned_employers = []
    for emp in validated_employers:
        if emp['validation']['ok']:
            # Keep successful entries, remove validation data
            clean_emp = {k: v for k, v in emp.items() if k != 'validation'}
            cleaned_employers.append(clean_emp)
        elif 'suggested_slug' in emp and emp['validation'].get('decoded_test', {}).get('ok', False):
            # Apply suggested fix for decoded slugs
            clean_emp = {k: v for k, v in emp.items() if k not in ['validation', 'suggested_slug']}
            clean_emp['slug'] = emp['suggested_slug']
            cleaned_employers.append(clean_emp)
            print(f"🔧 FIXED: Updated {emp['company']} slug to '{emp['suggested_slug']}'")
        else:
            print(f"🗑️  REMOVED: {emp['company']} ({emp['slug']}) - endpoint failed")
    
    # Save cleaned file
    if len(cleaned_employers) != len(employers):
        print(f"\n💾 Saving cleaned employers.json with {len(cleaned_employers)} working entries...")
        with open('employers_cleaned.json', 'w') as f:
            json.dump(cleaned_employers, f, indent=2)
        print("📄 Cleaned file saved as: employers_cleaned.json")
        print("🔄 Review the cleaned file, then replace employers.json if satisfied")
    else:
        print(f"\n✅ All employers validated successfully - no cleanup needed!")

if __name__ == "__main__":
    asyncio.run(main())