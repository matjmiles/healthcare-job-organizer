#!/usr/bin/env python3

"""
Enhanced Qualifications Extraction for Healthcare Admin Jobs
============================================================
Comprehensive extraction of qualification information from job descriptions.
"""

import re
from typing import List, Dict, Tuple, Optional

class QualificationsExtractor:
    """
    Enhanced qualifications extractor that captures comprehensive qualification information
    from job descriptions, including education, experience, skills, and certifications.
    """
    
    def __init__(self):
        # Qualification section headings (ordered by priority)
        self.QUAL_SECTIONS = [
            "Required Qualifications",
            "Qualifications", 
            "Requirements",
            "Minimum Qualifications", 
            "Minimum Requirements",
            "Job Requirements",
            "Required Skills",
            "What you'll need",
            "What You'll Need", 
            "What you need",
            "What you bring",
            "What You Bring",
            "Education and Experience",
            "Education & Experience", 
            "Skills and Qualifications",
            "Skills & Qualifications",
            "Desired Qualifications",
            "Preferred Qualifications",
            "Additional Requirements",
            "Experience Required",
            "Must Have",
            "You Have",
            "Candidate Profile",
            "Ideal Candidate",
            "We're Looking For"
        ]
        
        # Education-related keywords (highest priority)
        self.EDUCATION_KEYWORDS = [
            "bachelor", "bachelors", "ba", "bs", "b.a.", "b.s.", "degree", 
            "master", "masters", "mba", "mha", "mph", "m.a.", "m.s.",
            "associate", "associates", "aa", "as", "a.a.", "a.s.",
            "high school", "diploma", "ged", "education", "university", "college",
            "certification", "certificate", "certified", "license", "licensed"
        ]
        
        # Experience-related keywords
        self.EXPERIENCE_KEYWORDS = [
            "experience", "years", "background", "history", "work", "employment",
            "previous", "prior", "minimum", "required experience", "demonstrated"
        ]
        
        # Skills and competencies keywords  
        self.SKILLS_KEYWORDS = [
            "skills", "abilities", "competencies", "proficiency", "knowledge",
            "expertise", "familiar", "understanding", "capability", "proficient"
        ]
        
        # Healthcare-specific qualifications
        self.HEALTHCARE_KEYWORDS = [
            "hipaa", "healthcare", "medical", "clinical", "hospital", "patient",
            "epic", "cerner", "emr", "ehr", "icd", "cpt", "billing", "coding"
        ]
    
    def extract_comprehensive_qualifications(self, job_description: str) -> str:
        """
        Extract comprehensive qualifications from job description.
        
        Returns formatted qualifications string with education first, then other requirements.
        """
        if not job_description:
            return "N/A"
        
        # First try structured section extraction
        structured_quals = self._extract_from_sections(job_description)
        if structured_quals:
            return self._format_qualifications(structured_quals)
        
        # Fallback to pattern-based extraction
        pattern_quals = self._extract_from_patterns(job_description)
        if pattern_quals:
            return self._format_qualifications(pattern_quals)
        
        # Last resort: extract key qualification sentences
        sentence_quals = self._extract_qualification_sentences(job_description)
        if sentence_quals:
            return self._format_qualifications(sentence_quals)
        
        return "N/A"
    
    def _extract_from_sections(self, text: str) -> List[str]:
        """Extract qualifications from structured sections with headings."""
        qualifications = []
        lines = text.splitlines()
        joined_text = "\n".join(lines)
        
        for heading in self.QUAL_SECTIONS:
            # Look for heading followed by content
            pattern = rf"(^|\n)\s*{re.escape(heading)}\s*:?\s*\n(.{{0,2000}}?)(?=\n\s*[A-Z][A-Za-z \-/]{{10,50}}\s*:?\s*\n|\n\s*$|$)"
            match = re.search(pattern, joined_text, re.IGNORECASE | re.MULTILINE)
            
            if match:
                content = match.group(2).strip()
                if content:
                    # Clean up and extract meaningful qualifications
                    cleaned_quals = self._parse_qualification_content(content)
                    qualifications.extend(cleaned_quals)
                    break  # Use first matching section
        
        return qualifications
    
    def _extract_from_patterns(self, text: str) -> List[str]:
        """Extract qualifications using pattern matching for bullet points and requirements."""
        qualifications = []
        lines = text.splitlines()
        
        for line in lines:
            line = line.strip()
            if not line:
                continue
            
            # Look for bullet points or numbered lists
            if re.match(r'^\s*[-•*·▪▫◦‣⁃]\s+', line) or re.match(r'^\s*\d+\.\s+', line):
                cleaned_line = re.sub(r'^\s*[-•*·▪▫◦‣⁃\d+\.\s]+', '', line).strip()
                if self._is_qualification_line(cleaned_line):
                    qualifications.append(cleaned_line)
            
            # Look for sentences that start with qualification indicators
            elif re.match(r'^\s*(Required?|Must|Need|Should|Minimum|Preferred)[\s:]', line, re.IGNORECASE):
                if self._is_qualification_line(line):
                    qualifications.append(line.strip())
        
        return qualifications[:15]  # Limit to prevent overwhelming output
    
    def _extract_qualification_sentences(self, text: str) -> List[str]:
        """Extract sentences that contain qualification-related keywords."""
        qualifications = []
        
        # Split into sentences
        sentences = re.split(r'[.!?]+', text)
        
        for sentence in sentences:
            sentence = sentence.strip()
            if len(sentence) < 20 or len(sentence) > 300:  # Skip very short or very long sentences
                continue
            
            # Check if sentence contains qualification keywords
            if self._contains_qualification_keywords(sentence):
                # Clean up the sentence
                cleaned = re.sub(r'\s+', ' ', sentence).strip()
                if cleaned and not cleaned.lower().startswith(('we are', 'our team', 'the company')):
                    qualifications.append(cleaned)
        
        return qualifications[:10]  # Limit to prevent overwhelming output
    
    def _parse_qualification_content(self, content: str) -> List[str]:
        """Parse qualification content and extract individual requirements."""
        qualifications = []
        
        # First try to split by bullet points or numbered items
        items = re.split(r'\n\s*[-•*·▪▫◦‣⁃]\s*|\n\s*\d+\.\s*', content)
        
        if len(items) > 1:
            for item in items[1:]:  # Skip first empty item
                item = item.strip()
                if item and len(item) > 10:
                    # Clean up multi-line items
                    cleaned = re.sub(r'\n+', ' ', item)
                    cleaned = re.sub(r'\s+', ' ', cleaned).strip()
                    if cleaned:
                        qualifications.append(cleaned)
        else:
            # No clear bullet structure, split by sentences or lines
            lines = [line.strip() for line in content.split('\n') if line.strip()]
            for line in lines[:10]:  # Limit lines
                if len(line) > 15 and self._is_qualification_line(line):
                    qualifications.append(line)
        
        return qualifications
    
    def _is_qualification_line(self, line: str) -> bool:
        """Determine if a line contains qualification information."""
        line_lower = line.lower()
        
        # Must contain at least one qualification-related keyword
        has_qualification_keyword = any(keyword in line_lower for keyword in 
                                      self.EDUCATION_KEYWORDS + self.EXPERIENCE_KEYWORDS + 
                                      self.SKILLS_KEYWORDS + self.HEALTHCARE_KEYWORDS)
        
        # Skip lines that are obviously not qualifications
        skip_patterns = [
            r'^\s*(about|our|we|the company|the role|this position|you will|responsibilities)',
            r'^\s*(benefits|salary|compensation|location)',
            r'^\s*(apply|contact|send|email)',
            r'^\s*http[s]?://',
            r'^\s*equal opportunity',
            r'^\s*(monday|tuesday|wednesday|thursday|friday|saturday|sunday)',
        ]
        
        should_skip = any(re.match(pattern, line_lower) for pattern in skip_patterns)
        
        return has_qualification_keyword and not should_skip and len(line) > 10
    
    def _contains_qualification_keywords(self, text: str) -> bool:
        """Check if text contains qualification-related keywords."""
        text_lower = text.lower()
        
        # High-priority qualification indicators
        qualification_indicators = [
            'required', 'must have', 'minimum', 'preferred', 'desired',
            'bachelor', 'degree', 'experience', 'years', 'certification',
            'license', 'skills', 'knowledge', 'ability to', 'proficient',
            'familiar with', 'understanding of'
        ]
        
        return any(indicator in text_lower for indicator in qualification_indicators)
    
    def _format_qualifications(self, qualifications: List[str]) -> str:
        """Format qualifications list into a readable string with education first."""
        if not qualifications:
            return "N/A"
        
        # Separate education/certification from other qualifications
        education_quals = []
        experience_quals = []
        skill_quals = []
        other_quals = []
        
        for qual in qualifications:
            qual_lower = qual.lower()
            
            if any(keyword in qual_lower for keyword in ['bachelor', 'degree', 'master', 'associate', 'certification', 'certificate', 'license', 'diploma', 'education']):
                education_quals.append(qual)
            elif any(keyword in qual_lower for keyword in ['experience', 'years', 'background', 'history', 'previous', 'prior']):
                experience_quals.append(qual)
            elif any(keyword in qual_lower for keyword in ['skills', 'ability', 'knowledge', 'proficient', 'familiar', 'understanding']):
                skill_quals.append(qual)
            else:
                other_quals.append(qual)
        
        # Format with priorities: Education -> Experience -> Skills -> Other
        formatted_parts = []
        
        if education_quals:
            formatted_parts.extend(education_quals)
        if experience_quals:
            formatted_parts.extend(experience_quals)
        if skill_quals:
            formatted_parts.extend(skill_quals)
        if other_quals:
            formatted_parts.extend(other_quals)
        
        # Join with bullet points and clean up - use \r\n for Excel compatibility
        result = '\r\n\r\n• '.join(formatted_parts)
        if result and not result.startswith('•'):
            result = '• ' + result
        
        return result

if __name__ == "__main__":
    # Test the extractor
    extractor = QualificationsExtractor()
    
    test_job = """
    Responsibilities:
    - Manage patient intake process
    - Coordinate with healthcare teams
    
    Qualifications:
    • Bachelor's degree in Healthcare Administration or related field
    • 2+ years of experience in healthcare administration
    • Knowledge of HIPAA regulations
    • Proficient in Epic or similar EHR systems
    • Strong communication skills
    • Ability to work in fast-paced environment
    
    Benefits:
    - Health insurance
    - 401k matching
    """
    
    result = extractor.extract_comprehensive_qualifications(test_job)
    print("Extracted Qualifications:")
    print(result)