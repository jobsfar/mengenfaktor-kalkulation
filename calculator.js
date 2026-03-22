"use strict";

// Mengenfaktor-Tabelle aus dem Gerätedokument (Abschnitt 4.10.8).
// Zeilen = Massenstrom in kg/min, Spalten = gewünschte Mengenkorrektur in %.
// Nicht alle Kombinationen sind vorhanden — höherer Massenstrom bedeutet
// weniger verfügbare Korrekturstufen.
const LOOKUP_TABLE = {
   20: { 3: 1,  4: 1,  5: 1,  6: 1,  7: 2,  8: 2,  9: 2,  10: 2 },
   30: { 3: 1,  4: 1,  5: 2,  6: 2,  7: 2,  8: 3,  9: 3,  10: 3 },
   40: { 3: 1,  4: 2,  5: 2,  6: 3,  7: 3,  8: 3,  9: 4,  10: 4 },
   50: { 3: 2,  4: 2,  5: 3,  6: 3,  7: 4,  8: 4,  9: 5,  10: 5 },
   80: { 3: 2,  4: 3,  5: 4,  6: 5,  7: 6,  8: 7,  9: 8,  10: 9 },
  100: { 3: 3,  4: 4,  5: 5,  6: 6,  7: 8,  8: 9,  9: 10, 10: 11 },
  125: { 3: 4,  4: 5,  5: 7,  6: 8,  7: 9,  8: 11, 9: 12, 10: 14 },
  150: { 3: 5,  4: 6,  5: 8,  6: 10, 7: 11, 8: 13, 9: 15 },
  175: { 3: 5,  4: 7,  5: 9,  6: 11, 7: 13, 8: 15, 9: 17 },
  200: { 3: 6,  4: 8,  5: 11, 6: 13, 7: 15, 8: 17 },
  250: { 3: 8,  4: 10, 5: 13, 6: 16, 7: 19, 8: 22 },
  300: { 3: 9,  4: 13, 5: 16, 6: 19, 7: 23 },
  350: { 3: 11, 4: 15, 5: 18, 6: 22 },
};

const MASSENSTROM_ROWS = Object.keys(LOOKUP_TABLE).map(Number).sort((a, b) => a - b);
const MASSENSTROM_MIN  = MASSENSTROM_ROWS[0];
const MASSENSTROM_MAX  = MASSENSTROM_ROWS[MASSENSTROM_ROWS.length - 1];

// Massenstrom (kg/min) = Arbeitsbreite × Ausbringmenge × Geschwindigkeit / 600
// Faktor 600 aus Einheitenumrechnung: 1 ha = 10.000 m², 1 km/h = 1000 m/3600 s
function calcMassenstrom(arbeitsbreite, ausbringmenge, fahrgeschwindigkeit) {
  return (arbeitsbreite * ausbringmenge * fahrgeschwindigkeit) / 600;
}

// Liefert die zwei umgebenden Tabellenzeilen für die Interpolation
function findSurroundingRows(massenstrom) {
  if (massenstrom <= MASSENSTROM_MIN) {
    return { lower: MASSENSTROM_MIN, upper: MASSENSTROM_MIN, exact: true };
  }
  if (massenstrom >= MASSENSTROM_MAX) {
    return { lower: MASSENSTROM_MAX, upper: MASSENSTROM_MAX, exact: true };
  }
  for (let i = 0; i < MASSENSTROM_ROWS.length - 1; i++) {
    if (MASSENSTROM_ROWS[i] === massenstrom) {
      return { lower: massenstrom, upper: massenstrom, exact: true };
    }
    if (MASSENSTROM_ROWS[i] < massenstrom && MASSENSTROM_ROWS[i + 1] > massenstrom) {
      return { lower: MASSENSTROM_ROWS[i], upper: MASSENSTROM_ROWS[i + 1], exact: false };
    }
  }
  return { lower: MASSENSTROM_MAX, upper: MASSENSTROM_MAX, exact: true };
}

// Liest den Mengenfaktor aus der Tabelle, mit linearer Interpolation zwischen Zeilen.
// outOfRange = true wenn die Mengenkorrektur für diesen Massenstrom nicht existiert.
function lookupMengenfaktor(massenstrom, mengenkorrektur) {
  const mk      = Math.round(mengenkorrektur);
  const { lower, upper, exact } = findSurroundingRows(massenstrom);
  const clamped = Math.min(Math.max(massenstrom, MASSENSTROM_MIN), MASSENSTROM_MAX);

  const valLower = LOOKUP_TABLE[lower]?.[mk] ?? null;
  const valUpper = LOOKUP_TABLE[upper]?.[mk] ?? null;

  if (valLower === null || valUpper === null) {
    return { faktor: null, outOfRange: true, clampedMassenstrom: clamped };
  }

  const faktor = (exact || lower === upper)
    ? valLower
    : Math.round(valLower + ((massenstrom - lower) / (upper - lower)) * (valUpper - valLower));

  return { faktor, outOfRange: false, clampedMassenstrom: clamped };
}

// Im Browser werden die Funktionen global verfügbar (über <script>-Tag geladen).
// In Node.js (Tests) werden sie via require() exportiert.
if (typeof module !== "undefined") {
  module.exports = { calcMassenstrom, lookupMengenfaktor };
}
