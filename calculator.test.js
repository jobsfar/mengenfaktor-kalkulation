"use strict";

const { calcMassenstrom, lookupMengenfaktor } = require("./calculator.js");

// Minimales Test-Framework ohne externe Abhängigkeiten
let passed = 0;
let failed = 0;

function test(description, fn) {
  try {
    fn();
    console.log(`  ✅  ${description}`);
    passed++;
  } catch (e) {
    console.error(`  ❌  ${description}`);
    console.error(`       ${e.message}`);
    failed++;
  }
}

function assertEqual(actual, expected, tolerance = 0) {
  if (Math.abs(actual - expected) > tolerance) {
    throw new Error(`Erwartet ${expected}, erhalten ${actual}`);
  }
}

// ── calcMassenstrom ────────────────────────────────────────────────────────────

console.log("\n📐 calcMassenstrom");

test("24m × 200kg/ha × 10km/h = 80 kg/min", () => {
  assertEqual(calcMassenstrom(24, 200, 10), 80);
});

test("18m × 150kg/ha × 8km/h = 36 kg/min", () => {
  assertEqual(calcMassenstrom(18, 150, 8), 36);
});

test("Geschwindigkeit 0 → Massenstrom 0", () => {
  assertEqual(calcMassenstrom(24, 200, 0), 0);
});

// ── lookupMengenfaktor – exakte Tabellenwerte ──────────────────────────────────

console.log("\n📋 lookupMengenfaktor – exakte Tabellenwerte");

const exactTests = [
  // [massenstrom, mengenkorrektur, expectedFaktor]
  [  20, 3,  1], [  20, 7,  2], [  20, 10,  2],
  [  30, 5,  2], [  30, 8,  3], [  30, 10,  3],
  [  40, 4,  2], [  40, 9,  4],
  [  50, 3,  2], [  50, 10,  5],
  [  80, 3,  2], [  80, 5,  4], [  80, 8,  7], [  80, 10,  9],
  [ 100, 3,  3], [ 100, 6,  6], [ 100, 10, 11],
  [ 125, 4,  5], [ 125, 8, 11], [ 125, 10, 14],
  [ 150, 3,  5], [ 150, 6, 10], [ 150, 9,  15],
  [ 175, 3,  5], [ 175, 8, 15], [ 175, 9,  17],
  [ 200, 3,  6], [ 200, 8, 17],
  [ 250, 3,  8], [ 250, 8, 22],
  [ 300, 3,  9], [ 300, 7, 23],
  [ 350, 3, 11], [ 350, 6, 22],
];

for (const [ms, mk, expected] of exactTests) {
  test(`Massenstrom=${ms} kg/min, Korrektur=${mk}% → Faktor ${expected}`, () => {
    const { faktor, outOfRange } = lookupMengenfaktor(ms, mk);
    if (outOfRange) throw new Error("Unerwartet außerhalb der Tabelle");
    assertEqual(faktor, expected);
  });
}

// ── lookupMengenfaktor – außerhalb der Tabelle ─────────────────────────────────

console.log("\n🚫 lookupMengenfaktor – außerhalb der Tabelle");

const outOfRangeTests = [
  [150, 10, "Korrektur 10% nicht für Massenstrom 150 verfügbar"],
  [200,  9, "Korrektur 9% nicht für Massenstrom 200 verfügbar"],
  [350,  7, "Korrektur 7% nicht für Massenstrom 350 verfügbar"],
];

for (const [ms, mk, label] of outOfRangeTests) {
  test(label, () => {
    const { outOfRange } = lookupMengenfaktor(ms, mk);
    if (!outOfRange) throw new Error("Hätte outOfRange sein sollen");
  });
}

// ── lookupMengenfaktor – Interpolation ────────────────────────────────────────

console.log("\n🔢 lookupMengenfaktor – Interpolation zwischen Zeilen");

test("Massenstrom=60 (zwischen 50 und 80), Korrektur=5% → Faktor 3", () => {
  // t = (60-50)/(80-50) = 0.333; 3 + 0.333*(4-3) = 3.33 → rundet auf 3
  const { faktor, outOfRange } = lookupMengenfaktor(60, 5);
  if (outOfRange) throw new Error("Unerwartet außerhalb der Tabelle");
  assertEqual(faktor, 3);
});

test("Massenstrom=90 (zwischen 80 und 100), Korrektur=6% → Faktor 6", () => {
  // t = (90-80)/(100-80) = 0.5; 5 + 0.5*(6-5) = 5.5 → rundet auf 6
  const { faktor, outOfRange } = lookupMengenfaktor(90, 6);
  if (outOfRange) throw new Error("Unerwartet außerhalb der Tabelle");
  assertEqual(faktor, 6);
});

test("Massenstrom=110 (zwischen 100 und 125), Korrektur=5% → Faktor 6", () => {
  // t = (110-100)/(125-100) = 0.4; 5 + 0.4*(7-5) = 5.8 → rundet auf 6
  const { faktor, outOfRange } = lookupMengenfaktor(110, 5);
  if (outOfRange) throw new Error("Unerwartet außerhalb der Tabelle");
  assertEqual(faktor, 6);
});

// ── lookupMengenfaktor – Randwerte (Clamping) ─────────────────────────────────

console.log("\n📏 lookupMengenfaktor – Randwerte");

test("Massenstrom unter Minimum (5) → clampedMassenstrom = 20", () => {
  const { clampedMassenstrom } = lookupMengenfaktor(5, 3);
  assertEqual(clampedMassenstrom, 20);
});

test("Massenstrom über Maximum (500) → clampedMassenstrom = 350", () => {
  const { clampedMassenstrom } = lookupMengenfaktor(500, 3);
  assertEqual(clampedMassenstrom, 350);
});

// ── Ergebnis ──────────────────────────────────────────────────────────────────

console.log(`\n${passed + failed} Tests: ${passed} bestanden, ${failed} fehlgeschlagen\n`);
if (failed > 0) process.exit(1);
