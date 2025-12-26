// Education filtering logic for JavaScript (ported from Python)
// Filters jobs to include only those requiring bachelor's degrees

// Exclusion patterns - jobs to exclude
const HIGH_SCHOOL_PATTERNS = [
    /high school diploma/i,
    /high school graduate/i,
    /high school graduation/i,
    /high school degree/i,
    /hs diploma/i,
    /h\.s\. diploma/i,
    /ged/i,
    /general education development/i,
    /general educational development/i,
    /associate'?s? degree/i,
    /associates degree/i,
    /associate degree/i,
    /aa degree/i,
    /as degree/i,
    /aas degree/i,
    /a\.a\. degree/i,
    /a\.s\. degree/i,
    /a\.a\.s\. degree/i,
    /two.year degree/i,
    /2.year degree/i,
    /two.year college/i,
    /2.year college/i,
    /community college degree/i,
    /certificate program/i,
    /certification program/i,
    /diploma program/i,
    /technical certificate/i,
    /vocational certificate/i,
    /experience in lieu of degree/i,
    /experience may substitute/i,
    /equivalent experience/i,
    /or equivalent experience/i,
    /no degree required/i,
    /education not required/i,
    /degree preferred but not required/i
];

// Inclusion patterns - bachelor's degrees
const BACHELORS_PATTERNS = [
    /bachelor'?s? degree/i,
    /bachelors degree/i,
    /bachelor degree/i,
    /baccalaureate degree/i,
    /undergraduate degree/i,
    /b\.a\./i,
    /b\.s\./i,
    /ba degree/i,
    /bs degree/i,
    /ba\/bs/i,
    /bs\/ba/i,
    /four.year degree/i,
    /4.year degree/i,
    /four.year college/i,
    /4.year college/i,
    /four.year university/i,
    /4.year university/i,
    /university degree/i,
    /college degree/i,
    /bba/i,
    /bsn/i,
    /bha/i,
    /bhsa/i,
    /degree required/i,
    /bachelor.{0,20}required/i,
    /required.{0,20}bachelor/i
];

// Healthcare administration specific patterns
const HEALTHCARE_ADMIN_BACHELORS = [
    /healthcare administration/i,
    /health care administration/i,
    /health administration/i,
    /hospital administration/i,
    /medical administration/i,
    /health services administration/i,
    /health service administration/i,
    /healthcare management/i,
    /health care management/i,
    /health management/i,
    /hospital management/i,
    /medical management/i,
    /health information management/i,
    /healthcare information management/i,
    /health information administration/i,
    /him/i,
    /public health administration/i,
    /public health/i,
    /mph/i,
    /mha/i,
    /business administration.{0,50}healthcare/i,
    /healthcare.{0,50}business administration/i,
    /management.{0,50}healthcare/i,
    /healthcare.{0,50}management/i,
    /long.term care administration/i,
    /nursing home administration/i,
    /assisted living administration/i,
    /skilled nursing administration/i
];

// Advanced degree patterns
const ADVANCED_DEGREE_PATTERNS = [
    /master'?s? degree/i,
    /masters degree/i,
    /graduate degree/i,
    /m\.a\./i,
    /m\.s\./i,
    /mba/i,
    /mha/i,
    /mph/i,
    /mhsa/i,
    /doctorate/i,
    /doctoral degree/i,
    /ph\.?d\.?/i,
    /dha/i,
    /jd/i,
    /md/i,
    /pharmd/i
];

// Context exclusion patterns
const CONTEXT_EXCLUSIONS = [
    /bachelor.{0,20}preferred/i,
    /preferred.{0,20}bachelor/i,
    /bachelor.{0,20}plus/i,
    /bachelor.{0,20}or equivalent/i,
    /bachelor.{0,50}or.{0,20}experience/i,
    /experience.{0,20}or.{0,20}bachelor/i,
    /bachelor.{0,50}equivalent experience/i,
    /entry.level.{0,50}bachelor/i,
    /bachelor.{0,50}entry.level/i
];

// Pattern weights for scoring
const PATTERN_WEIGHTS = {
    healthcare_admin_bachelors: 10,
    advanced_degree: -8,              // Exclude - overqualified positions
    bachelors_required: 6,
    bachelors_mentioned: 4,
    high_school_only: -10,
    associates_only: -8,
    context_exclusion: -5,
    no_degree_required: -6
};

function analyzeEducationRequirements(jobDescription, qualifications = "") {
    const fullText = `${jobDescription} ${qualifications}`.toLowerCase();
    
    const matches = {
        healthcare_admin_bachelors: [],
        advanced_degree: [],
        bachelors_required: [],
        bachelors_mentioned: [],
        high_school_only: [],
        associates_only: [],
        context_exclusion: [],
        no_degree_required: []
    };
    
    let score = 0;
    
    // STRICT CHECK: If high school is mentioned as primary requirement, exclude immediately
    const highSchoolPrimary = /high school.*required|high school diploma.*required|hs.*required|ged.*required/i.test(fullText);
    if (highSchoolPrimary) {
        return {
            score: -100,
            shouldInclude: false,
            matches: { high_school_only: ['high_school_primary_requirement'] },
            reasoning: "High school diploma listed as primary requirement"
        };
    }
    
    // STRICT CHECK: If associates degree is listed as primary requirement, exclude
    const associatesPrimary = /associate.?s? degree.*required|aa.*required|as.*required|aas.*required/i.test(fullText);
    if (associatesPrimary) {
        return {
            score: -100,
            shouldInclude: false,
            matches: { associates_only: ['associates_primary_requirement'] },
            reasoning: "Associates degree listed as primary requirement"
        };
    }
    
    // Check healthcare administration specific patterns
    HEALTHCARE_ADMIN_BACHELORS.forEach(pattern => {
        if (pattern.test(fullText)) {
            matches.healthcare_admin_bachelors.push(pattern.toString());
            score += PATTERN_WEIGHTS.healthcare_admin_bachelors;
        }
    });
    
    // Check advanced degrees
    ADVANCED_DEGREE_PATTERNS.forEach(pattern => {
        if (pattern.test(fullText)) {
            matches.advanced_degree.push(pattern.toString());
            score += PATTERN_WEIGHTS.advanced_degree;
        }
    });
    
    // Check bachelor's degree patterns
    BACHELORS_PATTERNS.forEach(pattern => {
        if (pattern.test(fullText)) {
            if (/required|degree required/.test(pattern.toString())) {
                matches.bachelors_required.push(pattern.toString());
                score += PATTERN_WEIGHTS.bachelors_required;
            } else {
                matches.bachelors_mentioned.push(pattern.toString());
                score += PATTERN_WEIGHTS.bachelors_mentioned;
            }
        }
    });
    
    // Check exclusion patterns (but not primary requirements - already handled above)
    HIGH_SCHOOL_PATTERNS.forEach(pattern => {
        if (!/required/.test(pattern.toString()) && pattern.test(fullText)) {
            if (/no degree|not required|preferred but/.test(pattern.toString())) {
                matches.no_degree_required.push(pattern.toString());
                score += PATTERN_WEIGHTS.no_degree_required;
            } else {
                matches.high_school_only.push(pattern.toString());
                score += PATTERN_WEIGHTS.high_school_only;
            }
        }
    });
    
    // Check context exclusions
    CONTEXT_EXCLUSIONS.forEach(pattern => {
        if (pattern.test(fullText)) {
            matches.context_exclusion.push(pattern.toString());
            score += PATTERN_WEIGHTS.context_exclusion;
        }
    });
    
    // FINAL CHECK: If no bachelor's mentioned but high school is, exclude
    const hasBachelors = matches.healthcare_admin_bachelors.length > 0 || 
                        matches.bachelors_required.length > 0 || 
                        matches.bachelors_mentioned.length > 0;
    const hasHighSchool = matches.high_school_only.length > 0;
    const hasAdvancedDegree = matches.advanced_degree.length > 0;
    
    if (hasHighSchool && !hasBachelors) {
        score = -100;
    }
    
    // STRICT EXCLUSION: If advanced degree is required, exclude regardless of other factors
    if (hasAdvancedDegree) {
        score = -100;
    }
    
    // Determine if we should include this job (must have positive score AND bachelor's mention AND no advanced degree)
    const shouldInclude = score > 0 && hasBachelors && !hasAdvancedDegree;
    
    // Generate reasoning
    const reasoningParts = [];
    if (matches.healthcare_admin_bachelors.length > 0) reasoningParts.push("Healthcare administration degree mentioned");
    if (matches.advanced_degree.length > 0) reasoningParts.push("Advanced degree required (overqualified)");
    if (matches.bachelors_required.length > 0) reasoningParts.push("Bachelor's degree explicitly required");
    if (matches.bachelors_mentioned.length > 0) reasoningParts.push("Bachelor's degree mentioned");
    if (matches.high_school_only.length > 0) reasoningParts.push("High school/Associates degree mentioned");
    if (matches.context_exclusion.length > 0) reasoningParts.push("Bachelor's only preferred or substitutable");
    if (matches.no_degree_required.length > 0) reasoningParts.push("No degree required");
    
    const reasoning = reasoningParts.length > 0 ? reasoningParts.join("; ") : "No clear education requirements found";
    
    return {
        score,
        shouldInclude,
        matches,
        reasoning
    };
}

function meetsBachelorsRequirement(jobDescription, qualifications = "") {
    const analysis = analyzeEducationRequirements(jobDescription, qualifications);
    return analysis.shouldInclude;
}

module.exports = {
    analyzeEducationRequirements,
    meetsBachelorsRequirement
};