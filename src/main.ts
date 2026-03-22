import { calculateMassenstrom, calculateMengenfaktor } from './calc.js';
import { loadFavorites, saveFavorite, removeFavorite, replaceFavorite, Favorite } from './storage.js';

const form = document.getElementById('calc-form') as HTMLFormElement;
const result = document.getElementById('result')!;
const favList = document.getElementById('favorites')!;
const saveBtn = document.getElementById('save-fav')!;

function renderFavorites() {
  const favs = loadFavorites();
  favList.innerHTML = '';
  favs.forEach((f, i) => {
    const li = document.createElement('li');
    const name = document.createElement('div');
    name.className = 'name';
    name.textContent = f.name;

    const loadBtn = document.createElement('button');
    loadBtn.textContent = 'Load';
    loadBtn.addEventListener('click', ()=>{
      const setPair = (rangeId: string, numId: string, val: number) => {
        const r = document.getElementById(rangeId) as HTMLInputElement | null;
        const n = document.getElementById(numId) as HTMLInputElement | null;
        if (r) {
          r.value = String(val);
          r.dispatchEvent(new Event('input', { bubbles: true }));
        }
        if (n) {
          n.value = String(val);
          n.dispatchEvent(new Event('input', { bubbles: true }));
        }
      };
      setPair('workWidthRange','workWidth', f.workWidth);
      setPair('ausRange','ausbringung', f.ausbringung);
      setPair('speedRange','speed', f.speed);
      setPair('percentRange','percent', f.percent);
      renderResult();
      showToast('Favorit geladen');
    });

    const renameBtn = document.createElement('button');
    renameBtn.textContent = 'Rename';
    renameBtn.addEventListener('click', ()=>{
      const n = prompt('Neuer Name', f.name);
      if (n) {
        const nf: Favorite = { ...f, name: n };
        replaceFavorite(i, nf);
        renderFavorites();
      }
    });

    const delBtn = document.createElement('button');
    delBtn.textContent = 'Delete';
    delBtn.addEventListener('click', ()=>{
      if (confirm('Favorit löschen?')) {
        removeFavorite(i);
        renderFavorites();
      }
    });

    li.appendChild(name);
    li.appendChild(loadBtn);
    li.appendChild(renameBtn);
    li.appendChild(delBtn);
    favList.appendChild(li);
  });
}

function getValues() {
  const work = Number((document.getElementById('workWidth') as HTMLInputElement).value);
  const aus = Number((document.getElementById('ausbringung') as HTMLInputElement).value);
  const speed = Number((document.getElementById('speed') as HTMLInputElement).value);
  const percent = Number((document.getElementById('percent') as HTMLInputElement).value);
  return { work, aus, speed, percent };
}

function renderResult() {
  const { work, aus, speed, percent } = getValues();
  const mass = calculateMassenstrom(work, aus, speed);
  const factor = calculateMengenfaktor(mass, percent);
  result.textContent = `Massenstrom: ${mass.toFixed(2)} kg/min — Mengenfaktor: ${factor ?? 'n/a'}`;
}

// Sync slider <-> number inputs helper
function bindRangeNumber(rangeId: string, numId: string) {
  const r = document.getElementById(rangeId) as HTMLInputElement;
  const n = document.getElementById(numId) as HTMLInputElement;
  if (!r || !n) return;
  // init
  n.value = r.value;

  // create or reuse badge element near the range to show current value
  let badge = r.parentElement?.querySelector('.value-badge') as HTMLElement | null;
  if (!badge && r.parentElement) {
    badge = document.createElement('div');
    badge.className = 'value-badge';
    r.parentElement.appendChild(badge);
  }
  if (badge) badge.textContent = n.value;

  r.addEventListener('input', ()=>{ n.value = r.value; if (badge) badge.textContent = r.value; renderResult(); });
  n.addEventListener('input', ()=>{ r.value = n.value; if (badge) badge.textContent = n.value; renderResult(); });
}

bindRangeNumber('workWidthRange','workWidth');
bindRangeNumber('ausRange','ausbringung');
bindRangeNumber('speedRange','speed');
bindRangeNumber('percentRange','percent');

saveBtn.addEventListener('click', ()=>{
  const name = prompt('Name für Favorit') || 'Favorit';
  const { work, aus, speed, percent } = getValues();
  saveFavorite({ name, workWidth: work, ausbringung: aus, speed, percent });
  renderFavorites();
});

renderFavorites();
renderResult();

// toast helper
function showToast(msg: string, ms = 1600) {
  const t = document.createElement('div');
  t.className = 'toast';
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(()=>{ t.classList.add('hide'); t.remove(); }, ms);
}
