import json
import re
from pathlib import Path

PAY_PATTERNS = [
    # hourly patterns
    re.compile(r"\$\s?(\d+(?:\.\d+)?)\s?[-–]\s?\$\s?(\d+(?:\.\d+)?)\s?(?:per\s?hour|/hr|hr)\b", re.I),
    re.compile(r"\$\s?(\d+(?:\.\d+)?)\s?(?:per\s?hour|/hr|hr)\b", re.I),
    # annual patterns with decimal support and broader matching
    re.compile(r"\$\s?(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s?(?:and|\s?[-–]\s?)\s?\$\s?(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s?(?:per\s?year|/yr|annually|a\s?year)\b", re.I),
    re.compile(r"\$\s?(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s?(?:per\s?year|/yr|annually|a\s?year)\b", re.I),
    # catch "between $X and $Y per year" patterns
    re.compile(r"between\s+\$\s?(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s+and\s+\$\s?(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s+per\s+year", re.I),
    # Additional patterns for better coverage
    re.compile(r"salary\s+(?:range\s+)?\$\s?(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s?[-–]\s?\$\s?(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s?(?:per\s?year|/yr|annually)", re.I),
    re.compile(r"starting\s+(?:at\s+)?\$\s?(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s?(?:per\s?hour|/hr|hr)", re.I),
    re.compile(r"up\s+to\s+\$\s?(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s?(?:per\s?hour|/hr|hr)", re.I),
]

def normalize_pay_to_hourly(text: str) -> tuple[float | None, dict | None]:
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

def update_pay_in_json():
    # Load the existing JSON
    input_file = Path("output/healthcare_admin_jobs_us_nationwide.json")
    if not input_file.exists():
        print("Input file not found")
        return

    with open(input_file, 'r', encoding='utf-8') as f:
        jobs = json.load(f)

    updated_count = 0
    for job in jobs:
        if job.get("pay") == "N/A":
            # Try to extract pay from jobDescription
            desc = job.get("jobDescription", "")
            title = job.get("jobTitle", "")
            loc = f"{job.get('city', '')} {job.get('state', '')}".strip()
            full_text = f"{title}\n{loc}\n{desc}".strip()

            pay_hr, pay_raw = normalize_pay_to_hourly(full_text)
            if pay_hr:
                job["pay"] = f"${pay_hr}/hr"
                updated_count += 1
                print(f"Updated pay for: {title[:50]}... to ${pay_hr}/hr")

    # Save the updated JSON
    with open(input_file, 'w', encoding='utf-8') as f:
        json.dump(jobs, f, indent=2, ensure_ascii=False)

    print(f"Updated pay for {updated_count} jobs out of {len(jobs)} total jobs")

if __name__ == "__main__":
    update_pay_in_json()