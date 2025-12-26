#!/usr/bin/env python3
"""
Debug script to test Lever endpoints manually
"""
import asyncio
import httpx

failed_companies = [
    ("Nomi Health", "nomihealth"),
    ("Included Health", "includedhealth"), 
    ("Lyra Health", "lyrahealth"),
    ("Planned Parenthood Association of Utah", "ppau"),
    ("Clinical Health Network For Transformation", "ClinicalHealthNetworkForTransformation"),
    ("Everlywell", "everlywell"),
    ("myPlace Health", "myPlaceHealth")
]

async def debug_lever_endpoint(client: httpx.AsyncClient, company: str, slug: str):
    """Debug a single Lever endpoint"""
    print(f"\n🔍 Debugging {company} (slug: {slug})")
    
    base_url = f"https://api.lever.co/v0/postings/{slug}"
    urls_to_try = [
        f"{base_url}?mode=json",
        f"{base_url}",
        f"https://jobs.lever.co/{slug}",
        f"https://{slug}.lever.co/jobs",
    ]
    
    for url in urls_to_try:
        try:
            print(f"  Testing: {url}")
            r = await client.get(url, timeout=10)
            print(f"    Status: {r.status_code}")
            print(f"    Content-Type: {r.headers.get('content-type', 'unknown')}")
            
            if r.status_code == 200:
                content = r.text[:200]  # First 200 chars
                print(f"    Content preview: {content}")
                
                if r.headers.get('content-type', '').startswith('application/json'):
                    try:
                        data = r.json()
                        if isinstance(data, list):
                            print(f"    ✅ JSON array with {len(data)} jobs")
                            return True
                        else:
                            print(f"    ✅ JSON object: {type(data)}")
                    except Exception as e:
                        print(f"    ❌ JSON parse error: {e}")
            else:
                print(f"    ❌ HTTP {r.status_code}")
                
        except Exception as e:
            print(f"    ❌ Request error: {e}")
    
    return False

async def main():
    """Main debug function"""
    print("🔍 LEVER ENDPOINT DEBUGGING")
    print("=" * 50)
    
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) JobResearchCollector/1.0"
    }
    
    working_count = 0
    
    async with httpx.AsyncClient(headers=headers, follow_redirects=True) as client:
        for company, slug in failed_companies:
            success = await debug_lever_endpoint(client, company, slug)
            if success:
                working_count += 1
    
    print(f"\n📊 RESULTS: {working_count}/{len(failed_companies)} endpoints working")

if __name__ == "__main__":
    asyncio.run(main())