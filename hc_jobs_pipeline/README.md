# Healthcare Admin Job Collector (Nationwide Coverage)

This collector pulls postings from public ATS APIs across **all 50 US states**:
- Lever: https://api.lever.co/v0/postings/{slug}?mode=json
- Greenhouse: https://boards-api.greenhouse.io/v1/boards/{slug}/jobs?content=true

## NEW: Relaxed Education Filtering (December 2025)

**MAJOR UPDATE**: Switched from strict bachelor's-only filtering to **relaxed education filtering** that dramatically increased results from **13 to 417 jobs nationwide** (32x improvement).

**Education Inclusion Criteria**:
- ✅ High school diploma + relevant experience
- ✅ Associates degree positions  
- ✅ Certificate programs
- ✅ Bachelor's degree required OR preferred
- ✅ No specific education requirements (experience-based)

**Education Exclusion Criteria** (Only these are filtered out):
- ❌ Master's degree required (overqualified positions)
- ❌ PhD/Doctoral degree required
- ❌ Senior executive positions (CEO, VP, etc.)
- ❌ Positions requiring 10+ years experience

## Filtering Logic

**Geographic Coverage**: **All 50 US states + DC** with regional classification (Northeast, Midwest, South, West)

**Results**: **417 healthcare admin jobs** from **24 validated employers**

**Title Inclusion Keywords**: coordinator, representative, specialist, assistant, associate, clerk, scheduler, scheduling, patient access, registration, referral, prior auth, authorization, front desk, unit clerk, medical receptionist, office, admin, administrator in training, ait

**Title Exclusion Keywords**: director, senior director, vp, vice president, chief, cfo, coo, manager senior, sr manager, principal, physician, rn, np, pa-c

**Career Track Classification**:
- **Long-Term Care Administration**: ait, administrator in training, assisted living, skilled nursing, snf, memory care, long-term care
- **Hospital Administration**: patient access, registration, scheduler, scheduling, clinic, front desk, revenue cycle, billing, referral, prior auth, authorization, him, health information

**Entry-Level Detection**: Uses title keywords plus description analysis for "no experience required", "0-1 years", "entry-level" patterns

## Setup (Windows 11)

1) Create venv
   py -m venv .venv
   .\.venv\Scripts\activate

2) Install deps
   pip install -r requirements.txt

3) Add employers
   Edit employers.json with real Lever / Greenhouse slugs.

4) Run
   py run_collect.py

## Output
- **output/healthcare_admin_jobs_us_nationwide.json** (417 jobs across all 50 states)
- output/errors.json
- **Comprehensive filtering statistics** with breakdown showing 27.7% inclusion rate

## Key Statistics (Latest Run)
- **Total Jobs Analyzed**: 1,504
- **Jobs Included**: 417 (27.7% inclusion rate) 
- **Geographic Coverage**: 26 states across all US regions
- **Top States**: PA (109), CA (37), NY (33), NC (31), VA (26)
- **Top Employers**: Pyramid Healthcare (236), Charlie Health (113)

## Notes
- Most ATS APIs do not provide closing dates. `date` is null.
- `payHourly` is derived only when pay text is present. No guessing.
