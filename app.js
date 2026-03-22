"use strict";

// Rechenfunktionen werden aus calculator.js geladen (globale Funktionen via <script>-Tag)

// ═══════════════════════════════════════════════════════════════════════════════
// KONSTANTEN & DOM-REFERENZEN
// ═══════════════════════════════════════════════════════════════════════════════

// localStorage-Schlüssel
const STORAGE_KEY       = "mfcalc_favorites_v1";
const STORAGE_AB_KEY    = "mfcalc_arbeitsbreite"; // gespeicherte Standard-Arbeitsbreite
const STORAGE_THEME_KEY = "mfcalc_theme";

const $ = (id) => document.getElementById(id);

// Slider-Inputs
const sliders = {
  arbeitsbreite:       $("arbeitsbreite"),
  ausbringmenge:       $("ausbringmenge"),
  fahrgeschwindigkeit: $("fahrgeschwindigkeit"),
  mengenkorrektur:     $("mengenkorrektur"),
};

// Wertanzeigen neben den Slidern
const displays = {
  arbeitsbreite:       $("arbeitsbreiteVal"),
  ausbringmenge:       $("ausbringmengeVal"),
  fahrgeschwindigkeit: $("fahrgeschwindigkeitVal"),
  mengenkorrektur:     $("mengenkorrekturVal"),
};

// Ergebnisbereich
const resultBox      = $("resultBox");
const faktorOut      = $("faktorOut");
const massenstromOut = $("massenstromOut");
const resultHint     = $("resultHint");

// Dark-Mode-Toggle
const darkBtn  = $("darkBtn");
const iconSun  = $("iconSun");
const iconMoon = $("iconMoon");

// Favoriten-Drawer
const favBtn          = $("favBtn");
const favDrawer       = $("favDrawer");
const closeDrawer     = $("closeDrawer");
const overlay         = $("overlay");
const favList         = $("favList");
const favEmpty        = $("favEmpty");
const defaultAbDisplay = $("defaultAbDisplay");
const setDefaultAbBtn  = $("setDefaultAbBtn");

// Speichern-Formular (auf der Hauptseite)
const favName    = $("favName");
const confirmSave = $("confirmSave");

// Name des aktuell geladenen Favoriten (null = kein Favorit aktiv)
let activeFavName = null;

// ═══════════════════════════════════════════════════════════════════════════════
// SLIDER & ANZEIGE
// ═══════════════════════════════════════════════════════════════════════════════

function getSliderValues() {
  return {
    arbeitsbreite:       parseFloat(sliders.arbeitsbreite.value),
    ausbringmenge:       parseFloat(sliders.ausbringmenge.value),
    fahrgeschwindigkeit: parseFloat(sliders.fahrgeschwindigkeit.value),
    mengenkorrektur:     parseInt(sliders.mengenkorrektur.value, 10),
  };
}

function formatLabel(key, value) {
  switch (key) {
    case "arbeitsbreite":       return `${value.toFixed(1)} m`;
    case "ausbringmenge":       return `${value} kg/ha`;
    case "fahrgeschwindigkeit": return `${value.toFixed(1)} km/h`;
    case "mengenkorrektur":     return `${value} %`;
  }
}

// Setzt den aktiven Favoriten: füllt das Namensfeld vor und passt den Button-Text an.
// null = kein Favorit aktiv → leeres Feld + "Speichern"
function setActiveFav(name) {
  activeFavName        = name ?? null;
  favName.value        = name ?? "";
  confirmSave.textContent = name ? "Aktualisieren" : "Speichern";
}

// Hauptfunktion: berechnet Massenstrom + Mengenfaktor und aktualisiert alle DOM-Elemente.
// Wird bei jeder Slider-Bewegung aufgerufen.
function update() {
  setActiveFav(null); // Slider-Bewegung bricht geladenen Favoriten ab
  const vals = getSliderValues();
  const { arbeitsbreite, ausbringmenge, fahrgeschwindigkeit, mengenkorrektur } = vals;

  for (const key of Object.keys(sliders)) {
    displays[key].textContent = formatLabel(key, vals[key]);
  }

  const massenstrom = calcMassenstrom(arbeitsbreite, ausbringmenge, fahrgeschwindigkeit);
  const { faktor, outOfRange, clampedMassenstrom } = lookupMengenfaktor(massenstrom, mengenkorrektur);

  massenstromOut.textContent = `${massenstrom.toFixed(1)} kg/min`;
  resultBox.classList.remove("out-of-range", "warn");
  resultHint.textContent = "";

  if (outOfRange) {
    resultBox.classList.add("out-of-range");
    faktorOut.textContent  = "–";
    resultHint.textContent = "Diese Kombination liegt außerhalb der Tabelle. Bitte Mengenkorrektur reduzieren oder Massenstrom anpassen.";
  } else {
    if (massenstrom !== clampedMassenstrom) {
      resultBox.classList.add("warn");
      resultHint.textContent = massenstrom < clampedMassenstrom
        ? `Massenstrom unter Tabellenminimum (${clampedMassenstrom} kg/min).`
        : `Massenstrom über Tabellenmaximum (${clampedMassenstrom} kg/min). Wert wurde begrenzt.`;
    }
    faktorOut.textContent = faktor;
  }
}

for (const slider of Object.values(sliders)) {
  slider.addEventListener("input", update);
}

// ═══════════════════════════════════════════════════════════════════════════════
// DARK MODE
// ═══════════════════════════════════════════════════════════════════════════════

// Zeigt Sonne- oder Mond-Icon je nach aktivem Modus
function updateDarkIcons() {
  const isDark    = document.documentElement.classList.contains("dark");
  iconSun.hidden  = !isDark;
  iconMoon.hidden = isDark;
}

darkBtn.addEventListener("click", () => {
  const html    = document.documentElement;
  const nowDark = html.classList.contains("dark");
  html.classList.toggle("dark",  !nowDark);
  html.classList.toggle("light",  nowDark);
  localStorage.setItem(STORAGE_THEME_KEY, nowDark ? "light" : "dark");
  updateDarkIcons();
});

updateDarkIcons();

// ═══════════════════════════════════════════════════════════════════════════════
// FAVORITEN – DATENHALTUNG
// ═══════════════════════════════════════════════════════════════════════════════

function loadFavorites() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
  catch { return []; }
}

function saveFavorites(favs) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(favs));
}

// Verhindert XSS beim Einfügen von Favoritennamen via innerHTML
function escapeHtml(str) {
  return str.replace(/[&<>"']/g, (c) => (
    { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]
  ));
}

// ═══════════════════════════════════════════════════════════════════════════════
// FAVORITEN – DRAWER
// ═══════════════════════════════════════════════════════════════════════════════

// Baut die Favoritenliste im Drawer neu auf.
// Nimmt ein optionales Array entgegen, um ein doppeltes Laden aus localStorage zu vermeiden.
function renderFavorites(favs = loadFavorites()) {
  favList.innerHTML  = "";
  favEmpty.hidden    = favs.length > 0;

  for (let i = 0; i < favs.length; i++) {
    const fav = favs[i];
    const li  = document.createElement("li");
    li.className  = "fav-item";
    li.innerHTML  = `
      <div class="fav-info">
        <div class="fav-name">${escapeHtml(fav.name)}</div>
        <div class="fav-meta">${fav.arbeitsbreite}m · ${fav.ausbringmenge}kg/ha · ${fav.fahrgeschwindigkeit}km/h · Korr. ${fav.mengenkorrektur}%</div>
      </div>
      <span class="fav-faktor">${fav.faktor ?? "–"}</span>
      <button class="fav-del" aria-label="Favorit löschen" data-index="${i}">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/>
        </svg>
      </button>
    `;
    li.addEventListener("click", (e) => {
      if (e.target.closest(".fav-del")) return;
      applyFavorite(fav);
      closeDrawerFn();
    });
    li.querySelector(".fav-del").addEventListener("click", (e) => {
      e.stopPropagation();
      deleteFavorite(i);
    });
    favList.appendChild(li);
  }
}

// Lädt einen Favoriten in die Slider und setzt ihn als aktiv
function applyFavorite(fav) {
  sliders.arbeitsbreite.value       = fav.arbeitsbreite;
  sliders.ausbringmenge.value       = fav.ausbringmenge;
  sliders.fahrgeschwindigkeit.value = fav.fahrgeschwindigkeit;
  sliders.mengenkorrektur.value     = fav.mengenkorrektur;
  // update() würde den Favoriten löschen, daher danach explizit neu setzen
  update();
  setActiveFav(fav.name);
}

function deleteFavorite(index) {
  const favs = loadFavorites();
  favs.splice(index, 1);
  saveFavorites(favs);
  renderFavorites(favs); // übergibt das bereits geladene Array, kein zweites localStorage-Read
  showToast("Favorit gelöscht");
}

// ═══════════════════════════════════════════════════════════════════════════════
// SPEICHERN (Hauptseite)
// ═══════════════════════════════════════════════════════════════════════════════

// Speichert die aktuellen Sliderwerte als Favorit.
// Existiert bereits ein Favorit mit gleichem Namen, wird er überschrieben.
function doSave() {
  const name = favName.value.trim();
  if (!name) {
    favName.focus();
    favName.style.borderColor = "var(--danger)";
    setTimeout(() => (favName.style.borderColor = ""), 800);
    return;
  }

  const { arbeitsbreite, ausbringmenge, fahrgeschwindigkeit, mengenkorrektur } = getSliderValues();
  const massenstrom = calcMassenstrom(arbeitsbreite, ausbringmenge, fahrgeschwindigkeit);
  const { faktor }  = lookupMengenfaktor(massenstrom, mengenkorrektur);
  const entry = { name, arbeitsbreite, ausbringmenge, fahrgeschwindigkeit, mengenkorrektur, faktor };

  const favs       = loadFavorites();
  const existingIdx = favs.findIndex(f => f.name === name);
  if (existingIdx !== -1) {
    favs[existingIdx] = entry; // überschreiben
  } else {
    favs.unshift(entry);       // neu oben einfügen
  }

  saveFavorites(favs);
  setActiveFav(name);
  renderFavorites(favs);
  showToast(`„${name}" gespeichert`);
}

confirmSave.addEventListener("click", doSave);
favName.addEventListener("keydown", (e) => { if (e.key === "Enter") doSave(); });

// ═══════════════════════════════════════════════════════════════════════════════
// STANDARD-ARBEITSBREITE (im Drawer)
// ═══════════════════════════════════════════════════════════════════════════════

function updateDefaultAbDisplay() {
  const saved = localStorage.getItem(STORAGE_AB_KEY);
  defaultAbDisplay.textContent = saved ? `${parseFloat(saved).toFixed(1)} m` : "—";
}

setDefaultAbBtn.addEventListener("click", () => {
  const val = sliders.arbeitsbreite.value;
  localStorage.setItem(STORAGE_AB_KEY, val);
  updateDefaultAbDisplay();
  showToast(`Standard: ${parseFloat(val).toFixed(1)} m gespeichert`);
});

// ═══════════════════════════════════════════════════════════════════════════════
// DRAWER ÖFFNEN / SCHLIESSEN
// ═══════════════════════════════════════════════════════════════════════════════

function openDrawerFn() {
  updateDefaultAbDisplay();
  renderFavorites();
  favDrawer.hidden = false;
  overlay.hidden   = false;
}

function closeDrawerFn() {
  favDrawer.hidden = true;
  overlay.hidden   = true;
}

favBtn.addEventListener("click", openDrawerFn);
closeDrawer.addEventListener("click", closeDrawerFn);
overlay.addEventListener("click", closeDrawerFn);

// ═══════════════════════════════════════════════════════════════════════════════
// TOAST-BENACHRICHTIGUNG
// ═══════════════════════════════════════════════════════════════════════════════

function showToast(msg) {
  const t = document.createElement("div");
  t.className   = "toast";
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 2100);
}

// ═══════════════════════════════════════════════════════════════════════════════
// INITIALISIERUNG
// ═══════════════════════════════════════════════════════════════════════════════

// Gespeicherte Standard-Arbeitsbreite wiederherstellen, dann initiale Berechnung
const savedAB = localStorage.getItem(STORAGE_AB_KEY);
if (savedAB) sliders.arbeitsbreite.value = savedAB;

update();
