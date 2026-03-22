import { describe, it, expect } from 'vitest';
import { calculateMassenstrom, lookupMengenfaktor } from '../src/calc';
describe('Berechnung Massenstrom', () => {
    it('berechnet die Formel korrekt', () => {
        const m = calculateMassenstrom(6, 200, 6); // 6*200*6/600 = 12
        expect(m).toBeCloseTo(12);
    });
});
describe('Mengenfaktor Lookup (Tabelle)', () => {
    it('liest 20kg/min, 3% -> 1', () => {
        expect(lookupMengenfaktor(20, 3)).toBe(1);
    });
    it('liest 20kg/min, 7% -> 2', () => {
        expect(lookupMengenfaktor(20, 7)).toBe(2);
    });
    it('liest 125kg/min, 10% -> 14', () => {
        expect(lookupMengenfaktor(125, 10)).toBe(14);
    });
    it('Beispiel aus Dokument: 80kg/min, 6% -> 5', () => {
        expect(lookupMengenfaktor(80, 6)).toBe(5);
    });
    it('Beispiel aus Dokument: 80kg/min, 8% -> 7', () => {
        expect(lookupMengenfaktor(80, 8)).toBe(7);
    });
    it('Werte oberhalb nächster Stufe nutzen größte <= row (e.g. 90 -> 80 row)', () => {
        expect(lookupMengenfaktor(90, 5)).toBe(4);
    });
});
