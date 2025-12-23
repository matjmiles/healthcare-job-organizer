import json
import re
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

import httpx
from bs4 import BeautifulSoup
from dateutil import parser as dtparser
from rapidfuzz import fuzz

# Import our education filtering logic
from education_filters import meets_bachelors_requirement, analyze_education_requirements

TARGET_STATES = {"ID", "WA", "OR", "UT", "WY", "MT", "CO", "AZ"}

ENTRY_LEVEL_TITLE_HINTS = [
    "coordinator", "representative", "specialist", "assistant", "associate",
    "clerk", "scheduler", "scheduling", "patient access", "registration",
    "referral", "prior auth", "authorization", "front desk", "unit clerk",
    "medical receptionist", "office", "admin", "administrator in training", "ait"
]

EXCLUDE_TITLE_HINTS = [
    # avoid obviously non-entry admin tracks
    "director", "senior director", "vp", "vice president", "chief", "cfo", "coo",
    "manager, senior", "sr manager", "principal", "physician", "rn", "np", "pa-c"
]

CAREER_TRACK_RULES = [
    ("Long-Term Care Administration", [r"\bait\b", r"administrator in training", r"assisted living", r"skilled nursing", r"snf", r"memory care", r"long[-\s]?term care"]),
    ("Hospital Administration", [r"patient access", r"registration", r"scheduler", r"scheduling", r"clinic", r"front desk", r"revenue cycle", r"billing", r"referral", r"prior auth", r"authorization", r"him", r"health information"]),
]

QUAL_SECTIONS = [
    "Qualifications", "Required Qualifications", "Requirements", "Minimum Qualifications",
    "What you'll need", "What you bring", "Education and Experience", "Skills and Qualifications"
]

PAY_PATTERNS = [
    # hourly
    re.compile(r"\$\s?(\d+(?:\.\d+)?)\s?[-–]\s?\$\s?(\d+(?:\.\d+)?)\s?(?:per\s?hour|/hr|hr)\b", re.I),
    re.compile(r"\$\s?(\d+(?:\.\d+)?)\s?(?:per\s?hour|/hr|hr)\b", re.I),
    # annual
    re.compile(r"\$\s?(\d{2,3}(?:,\d{3})+)\s?[-–]\s?\$\s?(\d{2,3}(?:,\d{3})+)\s?(?:per\s?year|/yr|annually|a\s?year)\b", re.I),
    re.compile(r"\$\s?(\d{2,3}(?:,\d{3})+)\s?(?:per\s?year|/yr|annually|a\s?year)\b", re.I),
]

def strip_html(html: str) -> str:
    """Strip HTML tags and clean up text formatting."""
    if not html:
        return ""
    
    soup = BeautifulSoup(html or "", "html.parser")
    
    # Get text with some structure preserved
    text = soup.get_text(separator="\n", strip=True)
    
    # Clean up whitespace and formatting
    text = re.sub(r"\n{3,}", "\n\n", text)
    text = re.sub(r"\n\s*\n", "\n\n", text)  # Clean up empty lines with spaces
    
    # Remove any remaining HTML entities
    text = re.sub(r"&[a-zA-Z0-9#]+;", "", text)
    
    # Clean up extra whitespace within lines
    lines = text.split('\n')
    cleaned_lines = []
    for line in lines:
        cleaned_line = re.sub(r" {2,}", " ", line.strip())
        if cleaned_line:  # Only add non-empty lines
            cleaned_lines.append(cleaned_line)
    
    return '\n'.join(cleaned_lines)

def clean_text_field(text: str) -> str:
    """Clean any text field of HTML and normalize formatting."""
    if not text:
        return ""
    
    # Strip HTML if present
    cleaned = strip_html(text)
    
    # Remove any weird encoding artifacts
    cleaned = cleaned.replace('\xa0', ' ')  # non-breaking space
    cleaned = cleaned.replace('\u200b', '')  # zero-width space
    cleaned = cleaned.replace('\ufeff', '')  # byte order mark
    cleaned = cleaned.replace('\u00a0', ' ')  # another non-breaking space variant
    
    # Handle common HTML entities that might have been missed
    cleaned = cleaned.replace('&nbsp;', ' ')
    cleaned = cleaned.replace('&amp;', '&')
    cleaned = cleaned.replace('&lt;', '<')
    cleaned = cleaned.replace('&gt;', '>')
    cleaned = cleaned.replace('&quot;', '"')
    cleaned = cleaned.replace('&#39;', "'")
    
    # Normalize whitespace
    cleaned = ' '.join(cleaned.split())
    
    return cleaned.strip()

def infer_state(location: str) -> Optional[str]:
    if not location:
        return None
    m = re.search(r"\b([A-Z]{2})\b", location)
    if m and m.group(1) in TARGET_STATES:
        return m.group(1)
    return None

def infer_remote_flag(location: str) -> bool:
    if not location:
        return False
    return bool(re.search(r"\bremote\b|\bwork from home\b|\btelecommute\b", location, re.I))

def infer_career_track(text: str) -> str:
    t = (text or "").lower()
    for track, patterns in CAREER_TRACK_RULES:
        for p in patterns:
            if re.search(p, t, re.I):
                return track
    return "Hospital Administration"

def title_is_excluded(title: str) -> bool:
    t = (title or "").lower()
    return any(h in t for h in EXCLUDE_TITLE_HINTS)

def entry_level_flag(title: str, description: str) -> bool:
    t = (title or "").lower()
    if title_is_excluded(title):
        return False
    if any(h in t for h in ENTRY_LEVEL_TITLE_HINTS):
        return True

    # fallback: look for "0-1 years", "no experience required", etc.
    d = (description or "").lower()
    if re.search(r"\bno experience required\b|\b0\s?[-–]\s?1\s?year\b|\bentry[-\s]?level\b", d):
        return True
    # if explicitly requires 5+ years, treat as not entry
    if re.search(r"\b5\+\s?years\b|\bfive\+\s?years\b|\b7\+\s?years\b", d):
        return False
    return False

def extract_qualifications(full_text: str) -> str:
    if not full_text:
        return ""
    # Try to find a qualifications-like heading and capture a chunk after it.
    lines = full_text.splitlines()
    joined = "\n".join(lines)
    for heading in QUAL_SECTIONS:
        # capture up to ~1200 chars after heading
        m = re.search(rf"(^|\n)\s*{re.escape(heading)}\s*\n(.{{0,1200}})", joined, re.I)
        if m:
            block = m.group(2).strip()
            # stop at next "heading-ish" line
            block = re.split(r"\n[A-Z][A-Za-z \-/]{2,40}\n", block)[0].strip()
            return block
    # fallback: pull bullets that look like requirements
    bullets = [ln.strip("•*- ").strip() for ln in lines if re.match(r"^\s*[•*\-]\s+\S", ln)]
    # keep the most “requirement-like” bullets
    scored = []
    for b in bullets:
        score = 0
        if re.search(r"\brequired\b|\bmust\b|\bminimum\b|\bexperience\b|\bdegree\b|\bdiploma\b", b, re.I):
            score += 2
        if len(b) > 20:
            score += 1
        scored.append((score, b))
    scored.sort(reverse=True)
    top = [b for s, b in scored[:12] if s >= 2]
    return "\n".join(top)

def normalize_pay_to_hourly(text: str) -> Tuple[Optional[float], Optional[Dict[str, Any]]]:
    """
    Returns (payHourly_midpoint, payRaw_dict).
    payRaw_dict includes type/hourly/annual min/max when found.
    """
    if not text:
        return None, None

    for pat in PAY_PATTERNS:
        m = pat.search(text)
        if not m:
            continue

        groups = m.groups()
        # hourly range
        if len(groups) == 2 and pat.pattern.lower().find("hour") != -1:
            low = float(groups[0])
            high = float(groups[1])
            mid = round((low + high) / 2.0, 2)
            return mid, {"type": "hourly_range", "min": low, "max": high}
        # hourly single
        if len(groups) == 1 and pat.pattern.lower().find("hour") != -1:
            val = float(groups[0])
            return round(val, 2), {"type": "hourly", "value": val}

        # annual range
        if len(groups) == 2 and pat.pattern.lower().find("year") != -1:
            low = float(groups[0].replace(",", ""))
            high = float(groups[1].replace(",", ""))
            mid_annual = (low + high) / 2.0
            mid_hr = round(mid_annual / 2080.0, 2)
            return mid_hr, {"type": "annual_range", "min": low, "max": high, "annual_mid": mid_annual}

        # annual single
        if len(groups) == 1 and pat.pattern.lower().find("year") != -1:
            val = float(groups[0].replace(",", ""))
            hr = round(val / 2080.0, 2)
            return hr, {"type": "annual", "value": val}

    return None, None

def parse_date(val: Optional[str]) -> Optional[str]:
    if not val:
        return None
    try:
        dt = dtparser.parse(val)
        return dt.date().isoformat()
    except Exception:
        return None

async def fetch_lever(client: httpx.AsyncClient, slug: str) -> List[Dict[str, Any]]:
    url = f"https://api.lever.co/v0/postings/{slug}?mode=json"
    r = await client.get(url, timeout=30)
    r.raise_for_status()
    return r.json()

async def fetch_greenhouse(client: httpx.AsyncClient, slug: str) -> List[Dict[str, Any]]:
    # public GH job board endpoint
    url = f"https://boards-api.greenhouse.io/v1/boards/{slug}/jobs?content=true"
    r = await client.get(url, timeout=30)
    r.raise_for_status()
    payload = r.json()
    return payload.get("jobs", [])

def gh_location(job: Dict[str, Any]) -> str:
    loc = job.get("location", {}) or {}
    return loc.get("name") or ""

def gh_description(job: Dict[str, Any]) -> str:
    # GH returns HTML in 'content'
    return strip_html(job.get("content") or "")

def lever_location(job: Dict[str, Any]) -> str:
    return (job.get("categories", {}) or {}).get("location") or job.get("location") or ""

def lever_description(job: Dict[str, Any]) -> str:
    # Lever returns structured lists; description often in 'description' as HTML
    html = job.get("description") or ""
    # append lists if present
    lists = job.get("lists") or []
    extra = []
    for lst in lists:
        name = lst.get("text") or ""
        items = lst.get("content") or ""
        extra.append(f"\n{name}\n{strip_html(items)}")
    return strip_html(html) + ("\n\n" + "\n\n".join(extra) if extra else "")

def choose_company_name(seed_company: str, job_company: Optional[str]) -> str:
    return job_company or seed_company

def in_scope_state(location: str) -> bool:
    st = infer_state(location or "")
    # allow remote postings without explicit state (you can tighten this later)
    if infer_remote_flag(location or ""):
        return True
    return st in TARGET_STATES

def looks_like_health_admin(title: str, text: str) -> bool:
    # Include admin-support roles; exclude obviously clinical roles
    combined = (title + "\n" + (text or "")).lower()

    # Exclude clinical-heavy roles by keyword
    if re.search(r"\bregistered nurse\b|\brn\b|\bnurse practitioner\b|\bnp\b|\bphysician\b|\bmd\b|\bpharm\b|\btherapist\b", combined):
        return False

    # Require at least one admin-ish hint
    admin_hints = [
        "patient access", "registration", "scheduler", "scheduling", "clinic", "front desk",
        "administrative", "admin", "coordinator", "referral", "prior auth", "authorization",
        "billing", "revenue cycle", "unit clerk", "office", "medical receptionist", "him",
        "health information", "admissions", "intake", "case management assistant", "bed management", "ait"
    ]
    admin_check = any(h in combined for h in admin_hints)
    
    if not admin_check:
        return False
    
    # NEW: Check education requirements - must require bachelor's degree
    education_check = meets_bachelors_requirement(text or "")
    
    return education_check

async def collect() -> None:
    root = Path(__file__).resolve().parent
    employers_path = root / "employers.json"
    out_dir = root / "output"
    out_dir.mkdir(exist_ok=True)

    employers = json.loads(employers_path.read_text(encoding="utf-8"))

    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) JobResearchCollector/1.0"
    }

    results: List[Dict[str, Any]] = []
    errors: List[Dict[str, Any]] = []

    async with httpx.AsyncClient(headers=headers, follow_redirects=True) as client:
        for emp in employers:
            company = emp["company"]
            platform = emp["platform"].lower().strip()
            slug = emp["slug"].strip()

            try:
                if platform == "lever":
                    jobs = await fetch_lever(client, slug)
                    for j in jobs:
                        title = j.get("text") or ""
                        url = j.get("hostedUrl") or ""
                        loc = lever_location(j)
                        desc = lever_description(j)
                        if not looks_like_health_admin(title, desc):
                            continue
                        if not in_scope_state(loc):
                            continue

                        pay_hr, pay_raw = normalize_pay_to_hourly(desc)
                        track = infer_career_track(title + "\n" + desc)
                        entry = entry_level_flag(title, desc)

                        full_text = (title + "\n" + loc + "\n" + desc).strip()
                        quals = extract_qualifications(full_text)

                        results.append({
                            "jobTitle": clean_text_field(title),
                            "company": clean_text_field(company),
                            "location": clean_text_field(loc),
                            "state": infer_state(loc),
                            "remoteFlag": infer_remote_flag(loc),
                            "jobDescription": clean_text_field(desc),  # Apply HTML cleaning to job description
                            "qualifications": clean_text_field(quals),
                            "payHourly": pay_hr,
                            "payRaw": pay_raw,
                            "date": None,  # most APIs don't provide closing dates
                            "sourceFile": url,
                            "sourcePlatform": "lever",
                            "careerTrack": track,
                            "entryLevelFlag": entry,
                            "collectedAt": datetime.utcnow().isoformat(timespec="seconds") + "Z"
                        })

                elif platform == "greenhouse":
                    jobs = await fetch_greenhouse(client, slug)
                    for j in jobs:
                        title = j.get("title") or ""
                        url = j.get("absolute_url") or ""
                        loc = gh_location(j)
                        desc = gh_description(j)
                        if not looks_like_health_admin(title, desc):
                            continue
                        if not in_scope_state(loc):
                            continue

                        pay_hr, pay_raw = normalize_pay_to_hourly(desc)
                        track = infer_career_track(title + "\n" + desc)
                        entry = entry_level_flag(title, desc)

                        full_text = (title + "\n" + loc + "\n" + desc).strip()
                        quals = extract_qualifications(full_text)

                        # GH provides updated_at / created_at but not close date
                        created = parse_date(j.get("created_at"))
                        updated = parse_date(j.get("updated_at"))

                        results.append({
                            "jobTitle": clean_text_field(title),
                            "company": clean_text_field(company),
                            "location": clean_text_field(loc),
                            "state": infer_state(loc),
                            "remoteFlag": infer_remote_flag(loc),
                            "jobDescription": clean_text_field(desc),  # Apply HTML cleaning to job description
                            "qualifications": clean_text_field(quals),
                            "payHourly": pay_hr,
                            "payRaw": pay_raw,
                            "date": None,
                            "sourceFile": url,
                            "sourcePlatform": "greenhouse",
                            "careerTrack": track,
                            "entryLevelFlag": entry,
                            "createdDate": created,
                            "updatedDate": updated,
                            "collectedAt": datetime.utcnow().isoformat(timespec="seconds") + "Z"
                        })
                else:
                    errors.append({"company": company, "platform": platform, "slug": slug, "error": "Unsupported platform"})
            except Exception as e:
                errors.append({"company": company, "platform": platform, "slug": slug, "error": str(e)})

    # Deduplicate by sourceFile (some feeds repeat)
    dedup = {}
    for r in results:
        key = r.get("sourceFile") or (r["company"] + "|" + r["jobTitle"] + "|" + (r.get("location") or ""))
        dedup[key] = r
    final = list(dedup.values())

    # Write outputs
    out_json = out_dir / "healthcare_admin_jobs_west_100plus.json"
    out_json.write_text(json.dumps(final, indent=2, ensure_ascii=False), encoding="utf-8")

    out_err = out_dir / "errors.json"
    out_err.write_text(json.dumps(errors, indent=2, ensure_ascii=False), encoding="utf-8")

    print(f"Saved {len(final)} jobs to: {out_json}")
    if errors:
        print(f"Encountered {len(errors)} employer errors. See: {out_err}")

if __name__ == "__main__":
    import asyncio
    asyncio.run(collect())
