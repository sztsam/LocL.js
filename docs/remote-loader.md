# Over-The-Air (OTA) Remote Loader (`createRemoteLoader`)

In modern continuous-delivery applications, marketing and product teams frequently update copy, translations, and promotional banners without triggering a full software deployment.

LocL.js provides `createRemoteLoader`, a production-grade Over-The-Air (OTA) translation loader featuring **Stale-While-Revalidate (SWR)** caching, offline fallback, and pluggable storage backends.

---

## How Stale-While-Revalidate (SWR) Works

Traditional network loaders force users to wait for remote requests on page boot or show blank loading states. `createRemoteLoader` eliminates this:

1. **Instant Startup**: On initial page load, translations are returned immediately from local storage cache (<1ms).
2. **Background Refresh**: If the cached bundle has exceeded `maxAge`, LocL asynchronously fetches the latest translations from your CDN/backend in the background.
3. **Silent Hot Update**: When the fresh translations arrive, LocL merges them into memory and notifies subscribers.
4. **Offline Resilience**: If the user is offline or your CDN is unreachable, LocL silently continues using the cached translations.

---

## Basic Setup

```typescript
import { initLocL, createRemoteLoader } from "locl-js";

// Bundled fallback for first-time visitors before anything is cached
import enFallback from "./locales/en.json";

const loader = createRemoteLoader({
  // URL template supporting {lang} and {ns} placeholders:
  endpoint: "https://cdn.example.com/translations/{lang}/{ns}.json",

  // Cache storage: "localStorage" (default), "sessionStorage", "memory", or custom
  storage: "localStorage",

  // Cache lifetime: 24 hours (default: 86,400,000 ms)
  maxAge: 1000 * 60 * 60 * 24,

  // Return stale cache while fetching fresh updates (default: true)
  staleWhileRevalidate: true,

  // Custom HTTP headers (or async token resolver)
  headers: () => ({
    "X-Client-Version": "2.5.0"
  }),

  onSuccess: (lang, ns, data) => {
    console.log(`[OTA] Fresh translations loaded for ${lang}/${ns ?? "root"}`);
  },
  onError: (err, lang, ns) => {
    console.warn(`[OTA] Network update failed for ${lang}:`, err.message);
  }
});

export const translator = initLocL({
  resources: { en: enFallback },
  fallbackLanguage: "en",
  loader
});
```

---

## Dynamic Endpoint Resolver

If your backend uses a querystring or custom API routing, supply a function:

```typescript
const loader = createRemoteLoader({
  endpoint: (lang, ns) => {
    const base = `https://api.example.com/v1/locales/${lang}`;
    return ns ? `${base}?namespace=${encodeURIComponent(ns)}` : base;
  }
});
```

---

## Storage Backends

`createRemoteLoader` supports four storage options:

1. **`"localStorage"`** *(Default)*: Persists across browser tabs and sessions. Ideal for single-page applications.
2. **`"sessionStorage"`**: Persists until the browser tab is closed. Ideal for multi-tenant apps or shared workstations.
3. **`"memory"`**: In-memory Map cache. Ideal for server-side environments or testing.
4. **Custom `RemoteLoaderStorage`**: Integrate with IndexedDB, React Native Async Storage, or Redis:

```typescript
const customStorage = {
  getItem: async (key: string) => await myDb.get(key),
  setItem: async (key: string, value: string) => await myDb.set(key, value),
  removeItem: async (key: string) => await myDb.delete(key)
};

const loader = createRemoteLoader({
  endpoint: "https://cdn.example.com/{lang}.json",
  storage: customStorage
});
```

---

## Cache Invalidation (`clearCache`)

Invalidate cached translations when users change tenants, log out, or trigger a manual refresh:

```typescript
// Clear entire translation cache:
await loader.clearCache();

// Clear cache for a specific language and namespace:
await loader.clearCache("de", "dashboard");
```

---

## Configuration Reference (`RemoteLoaderOptions`)

| Option | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `endpoint` | `string \| ((lang, ns?) => string)` | *Required* | URL template or resolver function. |
| `storage` | `StorageType` | `"localStorage"` | `"localStorage"`, `"sessionStorage"`, `"memory"`, or custom storage. |
| `storagePrefix` | `string` | `"locl_ota_"` | Prefix prepended to all storage keys. |
| `maxAge` | `number` | `86400000` (24h) | Time in milliseconds before cache is considered stale. |
| `staleWhileRevalidate` | `boolean` | `true` | When true, returns stale cache while fetching fresh updates. |
| `fetch` | `typeof fetch` | `globalThis.fetch` | Custom fetch polyfill. |
| `headers` | `Record<string, string> \| (() => ...)` | `undefined` | Custom request headers or async resolver. |
| `onSuccess` | `(lang, ns, data) => void` | `undefined` | Callback fired on successful remote fetch. |
| `onError` | `(err, lang, ns) => void` | `undefined` | Callback fired on remote fetch failure. |
