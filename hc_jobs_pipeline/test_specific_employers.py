#!/usr/bin/env python3
"""
Test specific problematic employer entries
"""
import httpx
import asyncio
import urllib.parse

async def test_specific_employers():
    """Test the specific employers mentioned by user"""
    
    test_cases = [
        {"company": "Find HealthCareers", "platform": "greenhouse", "slug": "find"},
        {"company": "Pyramid Healthcare", "platform": "greenhouse", "slug": "1pyra%29mid_health%26care"}
    ]
    
    async with httpx.AsyncClient() as client:
        for case in test_cases:
            company = case["company"]
            slug = case["slug"]
            
            print(f"Testing {company} (greenhouse: {slug})...")
            
            url = f"https://boards-api.greenhouse.io/v1/boards/{slug}/jobs"
            try:
                response = await client.get(url, timeout=10)
                if response.status_code == 200:
                    data = response.json()
                    job_count = len(data.get('jobs', []))
                    print(f"  ✅ SUCCESS: {job_count} jobs found")
                else:
                    print(f"  ❌ HTTP {response.status_code}: {response.text[:100]}")
                    
                    # If encoded slug fails, try decoding
                    if '%' in slug:
                        decoded_slug = urllib.parse.unquote(slug)
                        print(f"  🔧 Trying decoded slug: '{decoded_slug}'")
                        
                        decoded_url = f"https://boards-api.greenhouse.io/v1/boards/{decoded_slug}/jobs"
                        decoded_response = await client.get(decoded_url, timeout=10)
                        
                        if decoded_response.status_code == 200:
                            decoded_data = decoded_response.json()
                            decoded_job_count = len(decoded_data.get('jobs', []))
                            print(f"  ✅ DECODED SUCCESS: {decoded_job_count} jobs found")
                            print(f"  💡 Recommendation: Change slug to '{decoded_slug}'")
                        else:
                            print(f"  ❌ Decoded also failed: HTTP {decoded_response.status_code}")
            
            except Exception as e:
                print(f"  ❌ ERROR: {e}")
            
            print()

if __name__ == "__main__":
    asyncio.run(test_specific_employers())