/* Local storage layer. Mirrors the small db / assets / downloads API the app uses,
   so the same app code runs without a server:
   - products: public/products.json (shared, in the repo) + the user's own additions in localStorage
   - designs (saved versions): localStorage
   - product photos the user uploads: IndexedDB (this browser only)
   - downloads: a normal browser download */

const PK = 'reno-products-user';
const VK = 'reno-studio-v3-versions';
let base = {};
const photos = {};
const listeners = { products: [], designs: [] };

const readLS = (k, def) => { try { const v = JSON.parse(localStorage.getItem(k)); return v == null ? def : v; } catch (e) { return def; } };
const writeLS = (k, v) => {
  try { localStorage.setItem(k, JSON.stringify(v)); }
  catch (e) { const err = new Error('quota'); err.code = 'quota_exceeded'; throw err; }
};

/* ---------- IndexedDB for photos ---------- */
let dbp = null;
function idb() {
  if (!dbp) dbp = new Promise((res, rej) => {
    const r = indexedDB.open('reno-studio', 1);
    r.onupgradeneeded = () => r.result.createObjectStore('photos');
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
  return dbp;
}
async function idbAll() {
  const d = await idb();
  return new Promise(res => {
    const out = {}, rq = d.transaction('photos').objectStore('photos').openCursor();
    rq.onsuccess = () => { const c = rq.result; if (c) { out[c.key] = c.value; c.continue(); } else res(out); };
    rq.onerror = () => res(out);
  });
}
async function idbPut(k, v) {
  const d = await idb();
  return new Promise((res, rej) => {
    const tx = d.transaction('photos', 'readwrite');
    tx.objectStore('photos').put(v, k);
    tx.oncomplete = () => res();
    tx.onerror = () => rej(tx.error);
  });
}

/* ---------- collections ---------- */
function productsMap() {
  const user = readLS(PK, {}), m = {};
  for (const id in base) m[id] = Object.assign({}, base[id]);
  for (const id in user) {
    if (user[id] === null) delete m[id];
    else m[id] = Object.assign({}, m[id] || {}, user[id]);
  }
  return m;
}
const snap = n => n === 'products'
  ? { docs: Object.entries(productsMap()).map(([id, d]) => ({ id, data: () => d })) }
  : { docs: readLS(VK, []).map(v => ({ id: v.id, data: () => v })) };
const emit = n => { const s = snap(n); listeners[n].forEach(f => f(s)); };

function collection(n) {
  const q = {
    orderBy: () => q,
    limit: () => q,
    onSnapshot(cb) { listeners[n].push(cb); cb(snap(n)); return () => { listeners[n] = listeners[n].filter(f => f !== cb); }; },
    async add(rec) {
      const L = readLS(VK, []), id = 'l' + Date.now().toString(36);
      L.unshift(Object.assign({ id }, rec)); writeLS(VK, L.slice(0, 40)); emit(n); return { id };
    },
    doc: id => ({
      async set(d) { if (n === 'products') { const u = readLS(PK, {}); u[id] = d; writeLS(PK, u); } emit(n); },
      async update(d) { if (n === 'products') { const u = readLS(PK, {}); u[id] = Object.assign({}, u[id] || {}, d); writeLS(PK, u); } emit(n); },
      async delete() {
        if (n === 'products') { const u = readLS(PK, {}); if (base[id]) u[id] = null; else delete u[id]; writeLS(PK, u); }
        else writeLS(VK, readLS(VK, []).filter(v => v.id !== id));
        emit(n);
      }
    })
  };
  return q;
}

/* products that arrive inside a shared link are added to this browser's library if missing */
export function mergeProducts(list) {
  if (!list || !list.length) return;
  const u = readLS(PK, {}), have = productsMap();
  let changed = false;
  list.forEach(p => { if (p && p.id && !have[p.id]) { const d = Object.assign({}, p); delete d.id; delete d.photoId; u[p.id] = d; changed = true; } });
  if (changed) { try { writeLS(PK, u); } catch (e) {} emit('products'); }
}

export const photoURL = id => photos[id] || null;

export async function init() {
  try { const r = await fetch('/products.json', { cache: 'no-cache' }); const arr = await r.json(); arr.forEach(p => { base[p.id] = p; }); } catch (e) { base = {}; }
  try { const all = await idbAll(); for (const k in all) photos[k] = URL.createObjectURL(all[k]); } catch (e) {}
  const assets = {
    async upload(blob) { const id = 'p' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5); await idbPut(id, blob); photos[id] = URL.createObjectURL(blob); return { id }; }
  };
  const downloads = {
    async save({ filename, data }) {
      const blob = data instanceof Blob ? data : new Blob([data], { type: 'application/json' });
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = filename;
      document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    }
  };
  return { db: { collection }, assets, downloads };
}
