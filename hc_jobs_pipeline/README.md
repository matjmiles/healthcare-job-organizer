# Healthcare Admin Job Collector (No-bot-blocker strategy)

This collector pulls postings from public ATS APIs:
- Lever: https://api.lever.co/v0/postings/{slug}?mode=json
- Greenhouse: https://boards-api.greenhouse.io/v1/boards/{slug}/jobs?content=true

## Filtering Logic

**Geographic Filtering**: ID, WA, OR, UT, WY, MT, CO, AZ

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
- output/healthcare_admin_jobs_west_100plus.json
- output/errors.json

## Notes
- Most ATS APIs do not provide closing dates. `date` is null.
- `payHourly` is derived only when pay text is present. No guessing.
