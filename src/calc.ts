export function calculateMassenstrom(workWidthM: number, ausbringungKgPerHa: number, speedKmH: number): number {
  // Formel: (Arbeitsbreite(m) * Ausbringmenge(kg/ha) * Fahrgeschw.(km/h)) / 600
  return (workWidthM * ausbringungKgPerHa * speedKmH) / 600;
}

// Table-driven lookup for Mengenfaktor. Table rows keyed by massenstrom (kg/min)
// Embedded table to avoid JSON module import issues in the browser.
const tableData: Record<string, Record<string, number>> = {
  "20": {"3":1,"4":1,"5":1,"6":1,"7":2,"8":2,"9":2,"10":2},
  "30": {"3":1,"4":1,"5":2,"6":2,"7":2,"8":3,"9":3,"10":3},
  "40": {"3":1,"4":2,"5":2,"6":3,"7":3,"8":4,"9":4,"10":4},
  "50": {"3":2,"4":2,"5":3,"6":3,"7":4,"8":4,"9":5,"10":5},
  "80": {"3":2,"4":3,"5":4,"6":5,"7":6,"8":7,"9":8,"10":9},
  "100": {"3":3,"4":4,"5":5,"6":6,"7":8,"8":9,"9":10,"10":11},
  "125": {"3":4,"4":5,"5":7,"6":8,"7":9,"8":11,"9":12,"10":14},
  "150": {"3":5,"4":6,"5":8,"6":10,"7":11,"8":13,"9":15,"10":17},
  "175": {"3":5,"4":7,"5":9,"6":11,"7":13,"8":15,"9":17,"10":19},
  "200": {"3":6,"4":8,"5":11,"6":13,"7":15,"8":17,"9":19,"10":21},
  "250": {"3":8,"4":10,"5":13,"6":16,"7":19,"8":22,"9":25,"10":28},
  "300": {"3":9,"4":13,"5":16,"6":19,"7":23,"8":26,"9":29,"10":32},
  "350": {"3":11,"4":15,"5":18,"6":22,"7":25,"8":28,"9":31,"10":34}
};

export function lookupMengenfaktor(massenstrom: number, percent: number): number | null {
  // find nearest row <= massenstrom, or exact match
  const rows = Object.keys(tableData).map(k => Number(k)).sort((a,b)=>a-b);
  let chosen = rows[0];
  for (const r of rows) {
    if (massenstrom >= r) chosen = r;
    else break;
  }
  const row = (tableData as any)[String(chosen)];
  const key = String(percent);
  if (!row || row[key] === undefined) return null;
  return row[key];
}

export function calculateMengenfaktor(massenstrom: number, percent: number): number | null {
  // Bilinear interpolation over table rows (massenstrom) and percent columns
  const rows = Object.keys(tableData).map(k => Number(k)).sort((a,b)=>a-b);
  const percents = Object.keys((tableData as any)[String(rows[0])]).map(k=>Number(k)).sort((a,b)=>a-b);

  // clamp percent
  const pMin = percents[0];
  const pMax = percents[percents.length-1];
  if (percent < pMin) percent = pMin;
  if (percent > pMax) percent = pMax;

  // find surrounding percent indices
  let p0 = percents[0], p1 = percents[percents.length-1];
  for (let i=0;i<percents.length;i++){
    if (percent === percents[i]) { p0 = p1 = percents[i]; break; }
    if (percent < percents[i]) { p1 = percents[i]; p0 = percents[i-1] ?? percents[i]; break; }
  }

  // find surrounding rows
  let r0 = rows[0], r1 = rows[rows.length-1];
  for (let i=0;i<rows.length;i++){
    if (massenstrom === rows[i]) { r0 = r1 = rows[i]; break; }
    if (massenstrom < rows[i]) { r1 = rows[i]; r0 = rows[i-1] ?? rows[i]; break; }
  }

  const row0 = (tableData as any)[String(r0)];
  const row1 = (tableData as any)[String(r1)];
  if (!row0 || !row1) return null;

  const v00 = Number(row0[String(p0)]);
  const v01 = Number(row0[String(p1)]);
  const v10 = Number(row1[String(p0)]);
  const v11 = Number(row1[String(p1)]);

  const lerp = (a:number,b:number,t:number)=> a + (b-a)*t;

  const tp = (p1===p0) ? 0 : ((percent - p0) / (p1 - p0));
  const tr = (r1===r0) ? 0 : ((massenstrom - r0) / (r1 - r0));

  const valRow0 = lerp(v00, v01, tp);
  const valRow1 = lerp(v10, v11, tp);
  const val = lerp(valRow0, valRow1, tr);

  return Math.round(val);
}
