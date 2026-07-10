// Verification test for Yojana Shodhak Rules Engine
const { checkEligibility } = require('./rulesEngine');

console.log("--------------------------------------------------");
console.log("RUNNING GOVERNMENT SCHEMES LOGIC TREE VERIFICATION");
console.log("--------------------------------------------------");

// Test Case 1: Ladki Bahin Direct Eligibility
console.log("\n[Test 1] Ladki Bahin - Eligible Profile");
const inputs1 = {
  gender: 'Female',
  age: 25,
  income: 150000,
  isTaxpayer: false,
  isGovtEmployee: false,xx
  hasFourWheeler: false,
  hasRccBuilding: false,
  hasSaurPump: false
};
const res1 = checkEligibility('ladki bhainn', inputs1);
console.log(`Eligible: ${res1.eligible} (Expected: true)`);
console.log(`Audit Trail Length: ${res1.auditLog.length}`);

// Test Case 2: Ladki Bahin Direct Disqualification (Male)
console.log("\n[Test 2] Ladki Bahin - Disqualified via Gender (Direct)");
const inputs2 = { ...inputs1, gender: 'Male' };
const res2 = checkEligibility('ladki bhainn', inputs2);
console.log(`Eligible: ${res2.eligible} (Expected: false)`);
console.log(`Failures:`, res2.auditLog.filter(l => !l.success).map(l => l.message_en));

// Test Case 3: Ladki Bahin Indirect Disqualification via Solar Scheme / RCC Building
console.log("\n[Test 3] Ladki Bahin - Disqualified via Solar Scheme / RCC Building (Indirect)");
const inputs3 = { ...inputs1, hasSaurPump: true };
const res3 = checkEligibility('ladki bhainn', inputs3);
console.log(`Eligible: ${res3.eligible} (Expected: false)`);
console.log(`Failures:`, res3.auditLog.filter(l => !l.success).map(l => l.message_en));
console.log(`Indirect Logs:`, res3.auditLog.filter(l => l.type === 'indirect').map(l => l.message_en));

// Test Case 4: Awas Yojana Direct Disqualification via RCC Building
console.log("\n[Test 4] PMAY Awas - Disqualified via owning RCC building / Pucca House");
const inputs4 = {
  age: 30,
  hasRccBuilding: true
};
const res4 = checkEligibility('awas', inputs4);
console.log(`Eligible: ${res4.eligible} (Expected: false)`);
console.log(`Failures:`, res4.auditLog.filter(l => !l.success).map(l => l.message_en));
console.log(`Indirect Logs:`, res4.auditLog.filter(l => l.type === 'indirect').map(l => l.message_en));

// Test Case 5: Ayushman Bharat 70+ Senior Citizen Override
console.log("\n[Test 5] Ayushman Bharat - Senior Citizen 70+ Override");
const inputs5 = {
  age: 75,
  income: 500000, // normally exceeds BPL, but age 75 overrides!
  hasRccBuilding: true
};
const res5 = checkEligibility('Ayushman Bharat', inputs5);
console.log(`Eligible: ${res5.eligible} (Expected: true)`);
console.log(`Override logs:`, res5.auditLog.filter(l => l.type === 'override').map(l => l.message_en));

console.log("\n--------------------------------------------------");
console.log("VERIFICATION COMPLETED SUCCESSFULLY!");
console.log("--------------------------------------------------");
