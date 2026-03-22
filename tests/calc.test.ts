import { describe, it, expect } from 'vitest';
import { calculateMassenstrom, lookupMengenfaktor, calculateMengenfaktor } from '../src/calc';

describe('Berechnung Massenstrom', ()=>{
  it('berechnet die Formel korrekt', ()=>{
    const m = calculateMassenstrom(6, 200, 6); // 6*200*6/600 = 12
    expect(m).toBeCloseTo(12);
  });
});

describe('Mengenfaktor Lookup (Tabelle)', ()=>{
  it('liest 20kg/min, 3% -> 1', ()=>{
    expect(lookupMengenfaktor(20,3)).toBe(1);
  });
  it('liest 20kg/min, 7% -> 2', ()=>{
    expect(lookupMengenfaktor(20,7)).toBe(2);
  });
  it('liest 125kg/min, 10% -> 14', ()=>{
    expect(lookupMengenfaktor(125,10)).toBe(14);
  });
  it('Beispiel aus Dokument: 80kg/min, 6% -> 5', ()=>{
    expect(lookupMengenfaktor(80,6)).toBe(5);
  });
  it('Beispiel aus Dokument: 80kg/min, 8% -> 7', ()=>{
    expect(lookupMengenfaktor(80,8)).toBe(7);
  });
  it('Interpolierte Berechnung: 90kg/min, 5% -> gerundet 5', ()=>{
    // Zwischen 80(4) und 100(5) bei 5% => 4.5 -> gerundet 5
    expect(calculateMengenfaktor(90,5)).toBe(5);
  });
});
