import {
  STORAGE_KEY,
  STORAGE_META_KEY,
  normalizeParsedState,
  getInitialState,
  readLocalStorageRaw,
  readLocalStorageSavedAt,
} from "./constants";

const DB_NAME = "edtrak-persist";
const STORE = "snapshots";
const KEY = "main";

let dbPromise = null;

function openDb() {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, 1);
      req.onerror = () => reject(req.error);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE)) {
          db.createObjectStore(STORE, { keyPath: "id" });
        }
      };
      req.onsuccess = () => resolve(req.result);
    });
  }
  return dbPromise;
}

async function idbGet() {
  try {
    const db = await openDb();
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, "readonly");
      const r = tx.objectStore(STORE).get(KEY);
      r.onsuccess = () => resolve(r.result || null);
      r.onerror = () => reject(r.error);
    });
  } catch {
    return null;
  }
}

async function idbPut(record) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(record);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

let idbDebounceTimer = null;
let pendingPayload = null;

export function writeLocalStorageBundle(json, savedAt) {
  localStorage.setItem(STORAGE_KEY, json);
  localStorage.setItem(STORAGE_META_KEY, JSON.stringify({ savedAt }));
}

/** Debounced mirror to IndexedDB (larger quota than localStorage; survives some clears). */
export function scheduleIndexedDbMirror(json, savedAt) {
  pendingPayload = { json, savedAt };
  clearTimeout(idbDebounceTimer);
  idbDebounceTimer = setTimeout(() => {
    const p = pendingPayload;
    pendingPayload = null;
    if (p) {
      void idbPut({ id: KEY, json: p.json, savedAt: p.savedAt }).catch(() => {});
    }
  }, 400);
}

/** Flush pending debounced IDB write immediately (tab hide / unload). */
export async function saveToIndexedDbNow(json, savedAt) {
  clearTimeout(idbDebounceTimer);
  idbDebounceTimer = null;
  pendingPayload = null;
  try {
    await idbPut({ id: KEY, json, savedAt });
  } catch {
    /* ignore */
  }
}

/**
 * Pick newest valid copy between localStorage and IndexedDB; repair localStorage if IDB wins.
 */
export async function hydrateAll() {
  if (typeof navigator !== "undefined" && navigator.storage?.persist) {
    void navigator.storage.persist();
  }

  const idbRow = await idbGet();

  const lsRaw = readLocalStorageRaw();
  let lsState = null;
  const lsMetaTime = readLocalStorageSavedAt();
  /** Legacy installs had data but no meta key — treat as current so we do not lose data to an old IDB copy. */
  const effectiveLsTime = lsMetaTime > 0 ? lsMetaTime : lsRaw ? Date.now() : 0;

  try {
    if (lsRaw) {
      lsState = normalizeParsedState(JSON.parse(lsRaw));
    }
  } catch {
    lsState = null;
  }

  let idbState = null;
  let idbTime = 0;
  let idbJson = null;
  try {
    if (idbRow?.json && typeof idbRow.json === "string") {
      idbJson = idbRow.json;
      idbTime = typeof idbRow.savedAt === "number" && Number.isFinite(idbRow.savedAt) ? idbRow.savedAt : 0;
      idbState = normalizeParsedState(JSON.parse(idbJson));
    }
  } catch {
    idbState = null;
  }

  if (!lsState && !idbState) {
    return { state: getInitialState(), savedAt: Date.now(), source: "new" };
  }

  if (!lsState && idbState && idbJson) {
    try {
      writeLocalStorageBundle(idbJson, idbTime || Date.now());
    } catch {
      /* quota */
    }
    return { state: idbState, savedAt: idbTime || Date.now(), source: "indexeddb" };
  }

  if (lsState && (!idbState || effectiveLsTime >= idbTime)) {
    return { state: lsState, savedAt: effectiveLsTime || Date.now(), source: "localstorage" };
  }

  if (idbState && idbJson && idbTime > effectiveLsTime) {
    try {
      writeLocalStorageBundle(idbJson, idbTime);
    } catch {
      /* quota — still return idb state in memory */
    }
    return { state: idbState, savedAt: idbTime, source: "indexeddb" };
  }

  return { state: lsState, savedAt: effectiveLsTime || Date.now(), source: "localstorage" };
}
