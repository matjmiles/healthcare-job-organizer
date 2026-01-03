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
from simplified_education_filters import meets_simplified_education_requirement
from enhanced_qualifications import QualificationsExtractor

def meets_entry_level_requirement(job_description: str, title: str, qualifications: str = "") -> bool:
    """
    Entry-level focused filtering for recent graduates with healthcare admin degrees.

    INCLUDES:
    - Jobs explicitly marked as entry-level
    - Jobs requiring 0-2 years experience
    - Jobs where bachelor's degree is preferred (not required)
    - Jobs with internship/trainee/coordinator titles
    - Healthcare admin roles with reasonable experience requirements

    EXCLUDES:
    - Jobs requiring advanced degrees (Master's/PhD)
    - Jobs requiring 3+ years experience
    - Senior/executive positions
    - Clinical roles (RN, NP, etc.)
    """
    full_text = f"{job_description} {qualifications}".lower()
    title_lower = (title or "").lower()

    # EXCLUDE: Advanced degree requirements
    advanced_degree_patterns = [
        r"master'?s? degree.{0,20}required",
        r"masters? required",
        r"mba required",
        r"mha required",
        r"mph required",
        r"doctoral? degree required",
        r"ph\.?d\.? required",
        r"doctorate required"
    ]

    for pattern in advanced_degree_patterns:
        if re.search(pattern, full_text, re.IGNORECASE):
            return False

    # EXCLUDE: High experience requirements (3+ years)
    # Recent graduates typically have 0-2 years experience max
    high_exp_patterns = [
        r"3\+? years? experience",
        r"4\+? years? experience",
        r"5\+? years? experience",
        r"6\+? years? experience",
        r"7\+? years? experience",
        r"8\+? years? experience",
        r"9\+? years? experience",
        r"10\+? years? experience"
    ]

    for pattern in high_exp_patterns:
        if re.search(pattern, full_text, re.IGNORECASE):
            return False

    # EXCLUDE: Senior/executive positions
    senior_patterns = [
        r"\bdirector\b",
        r"\bsenior director\b",
        r"\bvp\b",
        r"vice president",
        r"\bchief\b",
        r"\bcfo\b",
        r"\bcoo\b",
        r"\bceo\b",
        r"senior manager",
        r"sr manager",
        r"principal"
    ]

    for pattern in senior_patterns:
        if re.search(pattern, title_lower):
            return False

    # INCLUDE: Entry-level indicators (focused on recent graduates)
    entry_level_indicators = [
        # Experience patterns (0-2 years max)
        r"\bentry[-\s]?level\b",
        r"\b0\s?[-–]\s?1\s?year\b",
        r"\b0\s?[-–]\s?2\s?years?\b",
        r"\b1\s?[-–]\s?2\s?years?\b",
        r"\bno experience required\b",
        r"\bno prior experience\b",
        r"\bexperience preferred\b",
        r"\blittle experience\b",
        r"\bsome experience\b",
        r"\binternship\b",
        r"\bintern\b",
        r"\btrainee\b",
        r"\bgraduate\b",
        r"\brecent graduate\b",
        r"\bnew graduate\b",

        # Title patterns (entry-level roles)
        r"\bcoordinator\b",
        r"\brepresentative\b",
        r"\bspecialist\b",
        r"\bassistant\b",
        r"\bassociate\b",
        r"\bclerk\b",
        r"\bscheduler\b",
        r"\bscheduling\b",
        r"\bpatient access\b",
        r"\bregistration\b",
        r"\bfront desk\b",
        r"\bmedical receptionist\b",
        r"\badmin\b",
        r"\badministrator in training\b",
        r"\bait\b"
    ]

    for pattern in entry_level_indicators:
        if re.search(pattern, full_text, re.IGNORECASE) or re.search(pattern, title_lower):
            return True

    # INCLUDE: Bachelor's preferred (not required)
    bachelors_preferred_patterns = [
        r"bachelor.{0,20}preferred",
        r"preferred.{0,20}bachelor",
        r"bachelor.{0,20}a plus",
        r"bachelor.{0,20}plus",
        r"bachelor.{0,20}helpful",
        r"bachelor.{0,20}desirable"
    ]

    for pattern in bachelors_preferred_patterns:
        if re.search(pattern, full_text, re.IGNORECASE):
            return True

    # INCLUDE: Healthcare admin roles with reasonable requirements
    if re.search(r"healthcare administration|health care administration|hospital administration|medical administration|patient access|registration|scheduler|billing|revenue cycle", full_text, re.IGNORECASE):
        # Check if experience is reasonable (not explicitly requiring 3+ years)
        if not re.search(r"minimum.{0,10}3.{0,5}years?|at least.{0,10}3.{0,5}years?", full_text, re.IGNORECASE):
            return True

    # DEFAULT: If bachelor's is mentioned in any context, include it
    if re.search(r"bachelor'?s? degree", full_text, re.IGNORECASE):
        return True

    # If no clear indicators either way, be conservative and exclude
    return False

# US Census Bureau regions and states
US_REGIONS = {
    "Northeast": {"ME", "NH", "VT", "MA", "RI", "CT", "NY", "NJ", "PA"},
    "Midwest": {"OH", "IN", "IL", "MI", "WI", "MN", "IA", "MO", "ND", "SD", "NE", "KS"},
    "South": {"DE", "MD", "DC", "VA", "WV", "NC", "SC", "GA", "FL", "KY", "TN", "AL", "MS", "AR", "LA", "OK", "TX"},
    "West": {"MT", "ID", "WY", "CO", "NM", "AZ", "UT", "NV", "WA", "OR", "CA", "AK", "HI"}
}

# All US states and territories for target filtering
TARGET_STATES = set()
for region_states in US_REGIONS.values():
    TARGET_STATES.update(region_states)

def get_state_region(state_code: str) -> str:
    """Get the US Census region for a given state code."""
    state_code = state_code.upper().strip()
    for region, states in US_REGIONS.items():
        if state_code in states:
            return region
    return "Unknown"

def extract_city_from_location(location: str) -> str:
    """Extract city name from location string (e.g. 'Nashville, TN' -> 'Nashville')."""
    if not location:
        return ""
    
    # Handle common location formats
    location = location.strip()
    
    # If location contains comma, take everything before the first comma as city
    if ',' in location:
        city = location.split(',')[0].strip()
        return city
    
    # If no comma, check if it's a remote/hybrid indicator
    location_lower = location.lower()
    if any(keyword in location_lower for keyword in ['remote', 'hybrid', 'work from home', 'nationwide']):
        return location  # Keep as-is for remote positions
    
    # Otherwise return the whole location as city
    return location

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
    # hourly patterns
    re.compile(r"\$\s?(\d+(?:\.\d+)?)\s?[-–]\s?\$\s?(\d+(?:\.\d+)?)\s?(?:per\s?hour|/hr|hr)\b", re.I),
    re.compile(r"\$\s?(\d+(?:\.\d+)?)\s?(?:per\s?hour|/hr|hr)\b", re.I),
    # annual patterns with decimal support and broader matching
    re.compile(r"\$\s?(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s?(?:and|\s?[-–]\s?)\s?\$\s?(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s?(?:per\s?year|/yr|annually|a\s?year)\b", re.I),
    re.compile(r"\$\s?(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s?(?:per\s?year|/yr|annually|a\s?year)\b", re.I),
    # catch "between $X and $Y per year" patterns
    re.compile(r"between\s+\$\s?(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s+and\s+\$\s?(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s+per\s+year", re.I),
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

def extract_pay_from_html(html: str) -> Tuple[Optional[float], Optional[Dict[str, Any]]]:
    """Extract pay from full HTML content."""
    if not html:
        return None, None

    soup = BeautifulSoup(html, "html.parser")
    text = soup.get_text(separator="\n", strip=True)
    return normalize_pay_to_hourly(text)

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

def looks_like_health_admin(title: str, text: str) -> Tuple[bool, str]:
    """Check if job looks like health admin role suitable for recent graduates. Returns (passes, reason)."""
    # Include admin-support roles; exclude obviously clinical roles and software/engineering roles
    combined = (title + "\n" + (text or "")).lower()

    # Exclude clinical-heavy roles by keyword
    if re.search(r"\bregistered nurse\b|\brn\b|\bnurse practitioner\b|\bnp\b|\bphysician\b|\bmd\b|\bpharm\b|\btherapist\b", combined):
        return False, "clinical_roles"

    # Exclude software development/engineering roles by keyword
    software_patterns = [
        r"\bsoftware developer\b", r"\bsoftware engineer\b", r"\bdeveloper\b", r"\bengineer\b",
        r"\bprogrammer\b", r"\bdevops\b", r"\bfull stack\b", r"\bfront[- ]end\b", r"\bback[- ]end\b",
        r"\bcloud engineer\b", r"\bsecurity engineer\b", r"\bdata engineer\b", r"\bdata scientist\b",
        r"\bweb developer\b", r"\bapplication developer\b", r"\bmobile developer\b", r"\bqa engineer\b",
        r"\btest engineer\b", r"\barchitect\b.*\bsoftware\b", r"\bplatform engineer\b"
    ]

    for pattern in software_patterns:
        if re.search(pattern, combined):
            return False, "software_roles"

    # Require at least one admin-ish hint
    admin_hints = [
        "patient access", "registration", "scheduler", "scheduling", "clinic", "front desk",
        "administrative", "admin", "coordinator", "referral", "prior auth", "authorization",
        "billing", "revenue cycle", "unit clerk", "office", "medical receptionist", "him",
        "health information", "admissions", "intake", "case management assistant", "bed management", "ait"
    ]
    admin_check = any(h in combined for h in admin_hints)

    if not admin_check:
        return False, "no_admin_keywords"

    # NEW: Apply entry-level education filtering
    education_check = meets_entry_level_requirement(text, title, "")
    if not education_check:
        return False, "education_requirements"

    return True, "passes"

async def collect() -> None:
    root = Path(__file__).resolve().parent
    employers_path = root / "employers.json"
    out_dir = root / "output"
    out_dir.mkdir(exist_ok=True)

    employers = json.loads(employers_path.read_text(encoding="utf-8"))
    
    # Initialize enhanced qualifications extractor
    quals_extractor = QualificationsExtractor()

    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) JobResearchCollector/1.0"
    }

    results: List[Dict[str, Any]] = []
    errors: List[Dict[str, Any]] = []
    
    # Track filtering statistics
    filtering_stats = {
        "total_jobs_analyzed": 0,
        "filtered_out": {
            "clinical_roles": 0,
            "no_admin_keywords": 0,
            "education_requirements": 0,
            "non_us_locations": 0
        },
        "final_jobs_included": 0,
        "duplicates_removed": 0,
        "timestamp": datetime.utcnow().isoformat(timespec="seconds") + "Z"
    }

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

                         # Track all jobs analyzed
                         filtering_stats["total_jobs_analyzed"] += 1

                         admin_check, reason = looks_like_health_admin(title, desc)
                         if not admin_check:
                             filtering_stats["filtered_out"][reason] += 1
                             continue

                         # Check education requirements - simplified filter
                         education_check = meets_simplified_education_requirement(title + "\n" + desc)
                         if not education_check:
                             filtering_stats["filtered_out"]["education_requirements"] += 1
                             continue

                         # Check if job is in US (allow all US states, filter international)
                         state = infer_state(loc)
                         if not state or state not in TARGET_STATES:
                             filtering_stats["filtered_out"]["non_us_locations"] += 1
                             continue

                         full_text_for_pay = (title + "\n" + loc + "\n" + desc).strip()
                         pay_hr, pay_raw = normalize_pay_to_hourly(full_text_for_pay)
                         track = infer_career_track(title + "\n" + desc)
                         entry = entry_level_flag(title, desc)

                         full_text = (title + "\n" + loc + "\n" + desc).strip()
                         quals = quals_extractor.extract_comprehensive_qualifications(full_text)

                         # This job passed all filters
                         filtering_stats["final_jobs_included"] += 1

                         state = infer_state(loc)
                         city = extract_city_from_location(loc)
                         results.append({
                            "jobTitle": clean_text_field(title),
                            "company": clean_text_field(company),
                            "city": clean_text_field(city),
                            "state": state,
                            "region": get_state_region(state) if state else "Unknown",
                            "remoteFlag": infer_remote_flag(loc),
                            "jobDescription": clean_text_field(desc),  # Apply HTML cleaning to job description
                            "qualifications": clean_text_field(quals),
                            "pay": f"${pay_hr}/hr" if pay_hr else "N/A",
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

                         # Track all jobs analyzed
                         filtering_stats["total_jobs_analyzed"] += 1

                         admin_check, reason = looks_like_health_admin(title, desc)
                         if not admin_check:
                             filtering_stats["filtered_out"][reason] += 1
                             continue

                         # Check education requirements - simplified filter
                         education_check = meets_simplified_education_requirement(title + "\n" + desc)
                         if not education_check:
                             filtering_stats["filtered_out"]["education_requirements"] += 1
                             continue

                         # Check if job is in US (allow all US states, filter international)
                         state = infer_state(loc)
                         if not state or state not in TARGET_STATES:
                             filtering_stats["filtered_out"]["non_us_locations"] += 1
                             continue

                         full_text_for_pay = (title + "\n" + loc + "\n" + desc).strip()
                         pay_hr, pay_raw = normalize_pay_to_hourly(full_text_for_pay)
                         track = infer_career_track(title + "\n" + desc)
                         entry = entry_level_flag(title, desc)

                         full_text = (title + "\n" + loc + "\n" + desc).strip()
                         quals = quals_extractor.extract_comprehensive_qualifications(full_text)

                         # GH provides updated_at / created_at but not close date
                         created = parse_date(j.get("created_at"))
                         updated = parse_date(j.get("updated_at"))

                         # This job passed all filters
                         filtering_stats["final_jobs_included"] += 1

                         state = infer_state(loc)
                         city = extract_city_from_location(loc)
                         results.append({
                            "jobTitle": clean_text_field(title),
                            "company": clean_text_field(company),
                            "city": clean_text_field(city),
                            "state": state,
                            "region": get_state_region(state) if state else "Unknown",
                            "remoteFlag": infer_remote_flag(loc),
                            "jobDescription": clean_text_field(desc),  # Apply HTML cleaning to job description
                            "qualifications": clean_text_field(quals),
                            "pay": f"${pay_hr}/hr" if pay_hr else "N/A",
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

    # Update final stats after deduplication
    filtering_stats["final_jobs_included"] = len(final)
    filtering_stats["duplicates_removed"] = len(results) - len(final)

    # Write outputs
    out_json = out_dir / "healthcare_admin_jobs_us_nationwide.json"
    out_json.write_text(json.dumps(final, indent=2, ensure_ascii=False), encoding="utf-8")

    out_err = out_dir / "errors.json"
    out_err.write_text(json.dumps(errors, indent=2, ensure_ascii=False), encoding="utf-8")
    
    # Write filtering statistics
    out_stats = out_dir / "filtering_stats.json"
    out_stats.write_text(json.dumps(filtering_stats, indent=2, ensure_ascii=False), encoding="utf-8")

    print(f"Saved {len(final)} jobs to: {out_json}")
    print(f"Filtering stats: {filtering_stats['total_jobs_analyzed']} analyzed, {len(final)} included")
    if errors:
        print(f"Encountered {len(errors)} employer errors. See: {out_err}")

if __name__ == "__main__":
    import asyncio
    asyncio.run(collect())
