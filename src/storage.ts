const KEY = 'mengenfaktor:favorites';

export type Favorite = { name: string; workWidth: number; ausbringung: number; speed: number; percent: number };

export function loadFavorites(): Favorite[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Favorite[];
  } catch (e) { return []; }
}

export function saveFavorites(all: Favorite[]) {
  localStorage.setItem(KEY, JSON.stringify(all));
}

export function saveFavorite(f: Favorite) {
  const all = loadFavorites();
  all.push(f);
  saveFavorites(all);
}

export function removeFavorite(index: number) {
  const all = loadFavorites();
  if (index < 0 || index >= all.length) return;
  all.splice(index, 1);
  saveFavorites(all);
}

export function replaceFavorite(index: number, f: Favorite) {
  const all = loadFavorites();
  if (index < 0 || index >= all.length) return;
  all[index] = f;
  saveFavorites(all);
}
