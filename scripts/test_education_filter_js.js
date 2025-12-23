// Test the JavaScript education filtering logic
const { meetsBachelorsRequirement, analyzeEducationRequirements } = require('./education_filter_js');

const testCases = [
    {
        name: "Bachelor's in Healthcare Admin (SHOULD INCLUDE)",
        description: "Bachelor's degree in healthcare administration, information technology, business, or a related field. 2+ years of experience in healthcare IT implementations.",
        expected: true
    },
    {
        name: "High School Diploma (SHOULD EXCLUDE)", 
        description: "High school diploma required; customer service experience preferred; medical terminology helpful.",
        expected: false
    },
    {
        name: "Bachelor's Required (SHOULD INCLUDE)",
        description: "Bachelor's degree required. 3+ years experience in healthcare operations.",
        expected: true
    },
    {
        name: "Associates Degree (SHOULD EXCLUDE)",
        description: "Associate's degree in business or healthcare preferred. 2+ years experience in medical office setting.",
        expected: false
    }
];

console.log("🧪 Testing JavaScript Education Filtering Logic");
console.log("=".repeat(50));

let passed = 0;
let failed = 0;

testCases.forEach((test, index) => {
    console.log(`\nTest ${index + 1}: ${test.name}`);
    console.log("-".repeat(60));
    
    const result = meetsBachelorsRequirement(test.description);
    const analysis = analyzeEducationRequirements(test.description);
    
    const status = result === test.expected ? "✅ PASSED" : "❌ FAILED";
    if (result === test.expected) passed++; else failed++;
    
    console.log(`Expected: ${test.expected}, Got: ${result} - ${status}`);
    console.log(`Score: ${analysis.score}`);
    console.log(`Reasoning: ${analysis.reasoning}`);
});

console.log("\n" + "=".repeat(50));
console.log(`📊 Results: ${passed} passed, ${failed} failed`);

if (failed > 0) {
    console.log("❌ Some tests failed - review the filtering logic");
    process.exit(1);
} else {
    console.log("✅ All tests passed - JavaScript filtering logic working correctly!");
    process.exit(0);
}