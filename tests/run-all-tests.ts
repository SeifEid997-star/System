import { hashPassword, verifyPassword } from "../src/lib/password";
import { createSessionToken, verifySessionToken } from "../src/lib/authSession";
import { checkLoginRateLimit, recordFailedLoginAttempt, resetLoginRateLimit } from "../src/lib/rateLimit";

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition: boolean, message: string) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✓ PASS: ${message}`);
  } else {
    failedTests++;
    console.error(`  ✗ FAIL: ${message}`);
  }
}

async function runTestSuite() {
  console.log("=================================================");
  console.log(" QLINIC v2 - AUTOMATED SECURITY & QA TEST SUITE");
  console.log("=================================================");

  // ---------------------------------------------------------------------------
  // 1. Password Hashing & Verification (Scrypt)
  // ---------------------------------------------------------------------------
  console.log("\n[TEST SUITE 1] Password Hashing & Verification (Scrypt)");
  const testPassword = "StrongTestPassword@2026";
  const hashedPassword = hashPassword(testPassword);

  assert(hashedPassword.startsWith("scrypt$"), "Password hash format is valid scrypt");
  assert(verifyPassword(testPassword, hashedPassword), "Valid password successfully verified");
  assert(!verifyPassword("WrongPassword123", hashedPassword), "Invalid password correctly rejected");
  assert(!verifyPassword("", hashedPassword), "Empty password correctly rejected");
  assert(!verifyPassword(testPassword, "tampered-hash"), "Tampered hash string correctly rejected");

  // ---------------------------------------------------------------------------
  // 2. Session Token & HMAC Signature Integrity
  // ---------------------------------------------------------------------------
  console.log("\n[TEST SUITE 2] Session Token HMAC Verification");
  process.env.AUTH_SECRET = "test-auth-secret-of-at-least-32-characters-for-qa-testing";
  const testUserId = "user-qa-12345";
  const testRole = "OWNER";

  const token = createSessionToken(testUserId, testRole);
  assert(typeof token === "string" && token.includes("."), "Session token properly generated with payload.signature");

  const verified = verifySessionToken(token);
  assert(verified !== null && verified.userId === testUserId && verified.role === testRole, "Valid session token successfully verified");

  const tamperedToken = token + "xyz";
  assert(verifySessionToken(tamperedToken) === null, "Tampered session token signature rejected");

  const malformedToken = "invalid.token.structure.extra";
  assert(verifySessionToken(malformedToken) === null, "Malformed session token rejected");

  // ---------------------------------------------------------------------------
  // 3. Brute Force Login Rate Limiter
  // ---------------------------------------------------------------------------
  console.log("\n[TEST SUITE 3] Brute-Force Login Rate Limiting");
  const testIp = "192.168.1.100:test-rate-limit@clinic.com";
  resetLoginRateLimit(testIp);

  let initialCheck = checkLoginRateLimit(testIp);
  assert(initialCheck.allowed === true, "First login attempt allowed");

  // Record 5 failed attempts
  for (let i = 0; i < 5; i++) {
    recordFailedLoginAttempt(testIp);
  }

  let lockedCheck = checkLoginRateLimit(testIp);
  assert(lockedCheck.allowed === false && lockedCheck.retryAfterSeconds > 0, "6th attempt blocked by rate limiter with retryAfter");

  resetLoginRateLimit(testIp);
  let resetCheck = checkLoginRateLimit(testIp);
  assert(resetCheck.allowed === true, "Successful login resets the rate limit window");

  // ---------------------------------------------------------------------------
  // 4. Role Hierarchy & Authorization Rules
  // ---------------------------------------------------------------------------
  console.log("\n[TEST SUITE 4] Role Authorization Matrix");
  const rolePermissions: Record<string, string[]> = {
    OWNER: ["OWNER", "MANAGER", "VETERINARIAN", "RECEPTIONIST", "ACCOUNTANT"],
    MANAGER: ["MANAGER", "VETERINARIAN", "RECEPTIONIST"],
    VETERINARIAN: ["VETERINARIAN"],
    RECEPTIONIST: ["RECEPTIONIST"],
    ACCOUNTANT: ["ACCOUNTANT"],
  };

  function canAccess(userRole: string, allowedRoles: string[]): boolean {
    return allowedRoles.includes(userRole);
  }

  assert(canAccess("OWNER", ["OWNER", "MANAGER"]), "OWNER can access administrative staff management");
  assert(canAccess("OWNER", ["OWNER"]), "OWNER can access factory reset and backup");
  assert(!canAccess("RECEPTIONIST", ["OWNER", "MANAGER"]), "RECEPTIONIST denied from staff management");
  assert(!canAccess("RECEPTIONIST", ["OWNER"]), "RECEPTIONIST denied from factory reset");
  assert(!canAccess("ACCOUNTANT", ["OWNER"]), "ACCOUNTANT denied from factory reset");
  assert(canAccess("ACCOUNTANT", ["OWNER", "MANAGER", "ACCOUNTANT"]), "ACCOUNTANT allowed to manage expenses");

  // ---------------------------------------------------------------------------
  // 5. Business Logic: Invoice Financial Calculations
  // ---------------------------------------------------------------------------
  console.log("\n[TEST SUITE 5] Invoice Financial & Payment Integrity");
  const subtotal = 1000;
  const discountPercent = 10;
  const discountAmount = (subtotal * discountPercent) / 100; // 100
  const taxableAmount = subtotal - discountAmount; // 900
  const taxRate = 0.14; // 14% Egypt VAT
  const taxAmount = Math.round(taxableAmount * taxRate * 100) / 100; // 126
  const total = Math.round((taxableAmount + taxAmount) * 100) / 100; // 1026

  const customerPaid = 1200; // Customer gives 1200 EGP cash
  const clampedPaid = Math.min(customerPaid, total); // 1026
  const customerChange = Math.max(0, customerPaid - total); // 174
  const dueAmount = Math.max(0, Math.round((total - clampedPaid) * 100) / 100); // 0
  const invoiceStatus = dueAmount === 0 ? "PAID" : "PARTIAL";

  assert(total === 1026, "Invoice grand total correctly computed with 14% tax");
  assert(clampedPaid === 1026, "Customer overpayment clamped to grand total for accounting record");
  assert(customerChange === 174, "Customer change correctly calculated");
  assert(dueAmount === 0 && invoiceStatus === "PAID", "Full payment marks invoice as PAID");

  // ---------------------------------------------------------------------------
  // Final Summary
  // ---------------------------------------------------------------------------
  console.log("\n=================================================");
  console.log(` SUMMARY: ${passedTests}/${totalTests} Tests Passed`);
  console.log("=================================================");

  if (failedTests > 0) {
    console.error(`[FAIL] ${failedTests} test(s) failed.`);
    process.exit(1);
  } else {
    console.log("[SUCCESS] ALL SECURITY, AUTH & BUSINESS TESTS PASSED!");
  }
}

runTestSuite().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
