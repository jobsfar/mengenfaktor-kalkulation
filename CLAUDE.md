# CLAUDE.md – Projektübersicht für Claude

## Was ist das?

Statische Web-App zur Berechnung des **Mengenfaktors** für Rauch MDS Zentrifugalstreuer mit Quatron Terminal. Kein Build-Schritt, keine Abhängigkeiten — reines HTML/CSS/JS.

**Disclaimer:** Unabhängiges Beispielprojekt, keine Verbindung zu Rauch Landmaschinenfabrik GmbH.

---

## Dateistruktur

```
calculator.js        Reine Rechenfunktionen (Massenstrom, Mengenfaktor-Lookup)
calculator.test.js   Unit-Tests für calculator.js (Node.js, keine Test-Runner-Deps)
app.js               UI-Logik: Slider, Favoriten, Dark Mode
index.html           Einzige HTML-Seite
style.css            Alle Styles, Light/Dark Mode via html.dark Klasse
favicon.svg          Düngerstreuer-Icon
.github/
  workflows/
    deploy.yml       CI: Tests → Deploy auf GitHub Pages
  dependabot.yml     Monatliche Updates für GitHub Actions
```

---

## Architektur

### Zwei-Schichten-Prinzip

**`calculator.js`** enthält nur pure Funktionen ohne Browser-Abhängigkeiten:
- Im Browser: per `<script>`-Tag geladen → globale Funktionen
- In Node.js: per `require('./calculator.js')` → CommonJS-Export am Dateiende

**`app.js`** enthält nur UI-Logik und setzt die globalen Funktionen aus `calculator.js` voraus.

### Dark Mode

Die Theme-Klasse (`html.dark` oder `html.light`) wird durch ein Inline-`<script>` im `<head>` gesetzt — **vor** dem CSS-Load, um Flash of Wrong Theme (FUWT) zu vermeiden. `app.js` liest/schreibt nur `localStorage`, das CSS reagiert ausschließlich auf die Klasse.

### Favoriten

Gespeichert in `localStorage` als JSON-Array unter dem Key `mfcalc_favorites_v1`. Jeder Eintrag enthält alle Slider-Werte plus den berechneten Mengenfaktor. Beim Speichern: gleicher Name → überschreiben, neuer Name → oben einfügen.

### Standard-Arbeitsbreite

Separat in `localStorage` unter `mfcalc_arbeitsbreite` gespeichert. Wird beim Seitenstart wiederhergestellt. Explizit über den Drawer gesetzt, nicht automatisch bei jeder Slider-Bewegung.

---

## Berechnung

```
Massenstrom (kg/min) = Arbeitsbreite (m) × Ausbringmenge (kg/ha) × Geschwindigkeit (km/h) / 600
```

Der Mengenfaktor wird aus `LOOKUP_TABLE` in `calculator.js` gelesen. Liegt der Massenstrom zwischen zwei Tabellenzeilen, wird **linear interpoliert**. Nicht alle Massenstrom/Mengenkorrektur-Kombinationen existieren in der Tabelle — solche Fälle werden als `outOfRange` markiert.

---

## Lokale Entwicklung

```bash
npm run dev   # startet serve auf http://localhost:3000
node calculator.test.js   # Tests ausführen
```

Die Seite funktioniert auch direkt per Doppelklick auf `index.html` — kein Server nötig, da kein `type="module"`.

---

## CI/CD

Push auf `main` → Tests laufen → bei Erfolg Deploy auf GitHub Pages.
In den Repo-Einstellungen unter **Settings → Pages → Source** muss **"GitHub Actions"** ausgewählt sein.

---

## Wichtige Konventionen

- **Kein Build-Schritt** — keine Transpilation, kein Bundling
- **Kein npm install nötig** — `serve` wird via `npx` on-demand geladen
- **XSS-Schutz**: Favoritennamen werden via `escapeHtml()` sanitized bevor sie per `innerHTML` eingefügt werden
- **CSS-Variablen**: Alle Farben in `:root` (Light) und `html.dark` — nie Hardcoded-Farben außerhalb dieser Blöcke verwenden
- **localStorage-Keys**: Alle Keys als Konstanten in `app.js` definiert (`STORAGE_KEY`, `STORAGE_AB_KEY`, `STORAGE_THEME_KEY`)
