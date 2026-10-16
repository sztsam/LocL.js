export interface RemoteLoaderStorage {
  getItem: (key: string) => string | null | Promise<string | null>;
  setItem: (key: string, value: string) => void | Promise<void>;
  removeItem?: (key: string) => void | Promise<void>;
}

export type StorageType = "localStorage" | "sessionStorage" | "memory" | RemoteLoaderStorage;

export interface RemoteLoaderOptions {
  /**
   * Remote endpoint URL template string or custom resolver function.
   * Supports `{lang}` and `{ns}` placeholders.
   *
   * @example
   * "https://cdn.example.com/locales/{lang}/{ns}.json"
   * (lang, ns) => `https://api.example.com/translations/${lang}${ns ? `?ns=${ns}` : ""}`
   */
  endpoint: string | ((lang: string, ns?: string) => string);

  /**
   * Cache storage: "localStorage" (default in browser), "sessionStorage", "memory", or custom storage object.
   */
  storage?: StorageType;

  /**
   * Storage key prefix. Defaults to "locl_ota_".
   */
  storagePrefix?: string;

  /**
   * Cache time-to-live in milliseconds. Defaults to 24 hours (86,400,000 ms).
   */
  maxAge?: number;

  /**
   * When true, immediately returns stale cached translations while fetching fresh translations in the background.
   * Defaults to true.
   */
  staleWhileRevalidate?: boolean;

  /**
   * Custom fetch implementation (defaults to global fetch).
   */
  fetch?: typeof fetch;

  /**
   * Custom HTTP headers or header resolver function.
   */
  headers?: Record<string, string> | (() => Record<string, string> | Promise<Record<string, string>>);

  /**
   * Callback fired when fresh translations are fetched from the remote source.
   */
  onSuccess?: (lang: string, ns: string | undefined, data: Record<string, any>) => void;

  /**
   * Callback fired when remote fetch fails.
   */
  onError?: (err: Error, lang: string, ns: string | undefined) => void;
}

export interface RemoteLoaderInstance {
  (lang: string, ns?: string): Promise<Record<string, any>>;
  clearCache: (lang?: string, ns?: string) => Promise<void>;
}

const memoryStore = new Map<string, string>();

function resolveStorage(type?: StorageType): RemoteLoaderStorage {
  if (type && typeof type === "object") {
    return type;
  }
  if (type === "sessionStorage" && typeof window !== "undefined" && window.sessionStorage) {
    return {
      getItem: (k) => window.sessionStorage.getItem(k),
      setItem: (k, v) => window.sessionStorage.setItem(k, v),
      removeItem: (k) => window.sessionStorage.removeItem(k)
    };
  }
  if ((type === "localStorage" || type === undefined) && typeof window !== "undefined" && window.localStorage) {
    return {
      getItem: (k) => window.localStorage.getItem(k),
      setItem: (k, v) => window.localStorage.setItem(k, v),
      removeItem: (k) => window.localStorage.removeItem(k)
    };
  }
  return {
    getItem: (k) => memoryStore.get(k) ?? null,
    setItem: (k, v) => { memoryStore.set(k, v); },
    removeItem: (k) => { memoryStore.delete(k); }
  };
}

/**
 * Creates an Over-The-Air (OTA) remote translation loader with Stale-While-Revalidate (SWR) caching.
 *
 * Provides instantaneous boot times from local storage cache, silent background updates,
 * and seamless offline fallback.
 *
 * @example
 * ```ts
 * const translator = initLocL({
 *   resources: bundledFallback,
 *   fallbackLanguage: "en",
 *   loader: createRemoteLoader({
 *     endpoint: "https://cdn.example.com/locales/{lang}/{ns}.json",
 *     maxAge: 1000 * 60 * 60 * 24, // 24 hours
 *     staleWhileRevalidate: true
 *   })
 * });
 * ```
 */
export function createRemoteLoader(options: RemoteLoaderOptions): RemoteLoaderInstance {
  const prefix = options.storagePrefix ?? "locl_ota_";
  const maxAge = options.maxAge ?? 86400000; // 24h
  const swr = options.staleWhileRevalidate !== false;
  const storage = resolveStorage(options.storage);
  const fetchFn = options.fetch ?? (typeof fetch !== "undefined" ? fetch : undefined);

  function getCacheKey(lang: string, ns?: string): string {
    return `${prefix}${lang}_${ns ?? "root"}`;
  }

  function resolveUrl(lang: string, ns?: string): string {
    if (typeof options.endpoint === "function") {
      return options.endpoint(lang, ns);
    }
    let url = options.endpoint.replace(/\{lang\}/g, encodeURIComponent(lang));
    if (ns) {
      url = url.replace(/\{ns\}/g, encodeURIComponent(ns));
    } else {
      url = url.replace(/\/?\{ns\}/g, "");
    }
    return url;
  }

  async function fetchFresh(lang: string, ns?: string): Promise<Record<string, any>> {
    if (!fetchFn) {
      throw new Error("[LocL/remoteLoader] No fetch implementation available.");
    }
    const url = resolveUrl(lang, ns);
    let headers: Record<string, string> = {};
    if (options.headers) {
      headers = typeof options.headers === "function" ? await options.headers() : options.headers;
    }

    const res = await fetchFn(url, { headers });
    if (!res.ok) {
      throw new Error(`[LocL/remoteLoader] HTTP ${res.status} ${res.statusText} fetching "${url}"`);
    }

    const data = await res.json();
    const payload = (data && typeof data === "object" && !Array.isArray(data)) ? data : {};

    await storage.setItem(getCacheKey(lang, ns), JSON.stringify({
      timestamp: Date.now(),
      data: payload
    }));

    options.onSuccess?.(lang, ns, payload);
    return payload;
  }

  const loader: RemoteLoaderInstance = async function load(lang: string, ns?: string): Promise<Record<string, any>> {
    const key = getCacheKey(lang, ns);
    let cachedRecord: { timestamp: number; data: Record<string, any> } | null = null;

    try {
      const raw = await storage.getItem(key);
      if (raw) {
        cachedRecord = JSON.parse(raw);
      }
    } catch {}

    if (cachedRecord && typeof cachedRecord.timestamp === "number" && cachedRecord.data) {
      const isExpired = Date.now() - cachedRecord.timestamp > maxAge;

      if (!isExpired) {
        return cachedRecord.data;
      }

      if (swr) {
        // Trigger background revalidation silently
        fetchFresh(lang, ns).catch((err) => {
          options.onError?.(err instanceof Error ? err : new Error(String(err)), lang, ns);
        });
        return cachedRecord.data;
      }
    }

    try {
      return await fetchFresh(lang, ns);
    } catch (err: any) {
      // Offline fallback to stale cache if available
      if (cachedRecord?.data) {
        return cachedRecord.data;
      }
      const error = err instanceof Error ? err : new Error(String(err));
      options.onError?.(error, lang, ns);
      throw error;
    }
  };

  loader.clearCache = async (lang?: string, ns?: string): Promise<void> => {
    if (lang) {
      await storage.removeItem?.(getCacheKey(lang, ns));
    } else {
      memoryStore.clear();
    }
  };

  return loader;
}