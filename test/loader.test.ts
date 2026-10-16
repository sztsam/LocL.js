import { createRemoteLoader } from "../src/index.js";
import { initLocL } from "../src/index.js";

describe("Over-The-Air (OTA) Remote Loader", () => {
  beforeEach(async () => {
    const dummy = createRemoteLoader({ endpoint: "https://example.com" });
    await dummy.clearCache();
  });

  it("should fetch, cache, and serve translations via SWR", async () => {
    let fetchCount = 0;
    const mockData = { title: "Remote Dashboard" };

    const mockFetch = jest.fn().mockImplementation(async () => {
      fetchCount++;
      return {
        ok: true,
        json: async () => mockData
      };
    });

    const memoryStore: Record<string, string> = {};
    const customStorage = {
      getItem: (k: string) => memoryStore[k] || null,
      setItem: (k: string, v: string) => { memoryStore[k] = v; },
      removeItem: (k: string) => { delete memoryStore[k]; }
    };

    const loader = createRemoteLoader({
      endpoint: "https://cdn.example.com/{lang}/{ns}.json",
      storage: customStorage,
      fetch: mockFetch,
      maxAge: 100 // 100ms TTL
    });

    // First load -> network fetch
    const res1 = await loader("de", "dashboard");
    expect(res1).toEqual(mockData);
    expect(fetchCount).toBe(1);

    // Immediate second load -> fresh cache hit, zero network call
    const res2 = await loader("de", "dashboard");
    expect(res2).toEqual(mockData);
    expect(fetchCount).toBe(1);

    // Fast-forward past maxAge -> SWR returns stale cache and triggers background fetch
    await new Promise((r) => setTimeout(r, 150));
    const res3 = await loader("de", "dashboard");
    expect(res3).toEqual(mockData);

    // Background fetch resolves
    await new Promise((r) => setTimeout(r, 20));
    expect(fetchCount).toBe(2);

    // Test clearCache
    await loader.clearCache("de", "dashboard");
    expect(customStorage.getItem("locl_ota_de_dashboard")).toBeNull();
  });

  it("should integrate seamlessly with initLocL and translator.load()", async () => {
    const loader = createRemoteLoader({
      endpoint: () => "https://cdn.example.com/locales/de.json",
      storage: "memory",
      fetch: (async () => ({
        ok: true,
        json: async () => ({ welcome: "Willkommen" })
      })) as any
    });

    const translator = initLocL({
      resources: { en: { welcome: "Welcome" } },
      fallbackLanguage: "en",
      loader
    });

    await translator.loadLanguage("de");
    expect(translator.isLoaded("de")).toBe(true);
    // @ts-expect-error
    translator.changeLanguage("de");
    expect(translator.t("welcome")).toBe("Willkommen");
  });

  it("should cover browser storage (sessionStorage and localStorage) with getItem, setItem, removeItem", async () => {
    const sessionMap = new Map<string, string>();
    const localMap = new Map<string, string>();

    (global as any).window = {
      sessionStorage: {
        getItem: (k: string) => sessionMap.get(k) ?? null,
        setItem: (k: string, v: string) => { sessionMap.set(k, v); },
        removeItem: (k: string) => { sessionMap.delete(k); }
      },
      localStorage: {
        getItem: (k: string) => localMap.get(k) ?? null,
        setItem: (k: string, v: string) => { localMap.set(k, v); },
        removeItem: (k: string) => { localMap.delete(k); }
      }
    };

    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ title: "Hello" })
    });

    const sessionLoader = createRemoteLoader({
      endpoint: "https://cdn.example.com/{lang}/{ns}.json",
      storage: "sessionStorage",
      storagePrefix: "sess_",
      fetch: mockFetch
    });
    await sessionLoader("en", "common");
    expect(sessionMap.size).toBe(1);
    await sessionLoader.clearCache("en", "common");
    expect(sessionMap.size).toBe(0);

    const localLoader = createRemoteLoader({
      endpoint: "https://cdn.example.com/{lang}/{ns}.json",
      storage: "localStorage",
      storagePrefix: "loc_",
      fetch: mockFetch
    });
    await localLoader("en", "common");
    expect(localMap.size).toBe(1);
    await localLoader.clearCache("en", "common");
    expect(localMap.size).toBe(0);

    // Default storage when window.localStorage is defined
    const defaultLoader = createRemoteLoader({
      endpoint: "https://cdn.example.com/{lang}/{ns}.json",
      storagePrefix: "win_def_",
      fetch: mockFetch
    });
    await defaultLoader("en", "common");
    expect(localMap.size).toBe(1);

    delete (global as any).window;
  });

  it("should cover endpoint URL resolution when ns is omitted", async () => {
    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ hello: "world" })
    });

    const loader = createRemoteLoader({
      endpoint: "https://cdn.example.com/locales/{lang}/{ns}.json",
      storage: "memory",
      storagePrefix: "no_ns_",
      fetch: mockFetch
    });

    await loader("en");
    expect(mockFetch).toHaveBeenCalledWith(
      "https://cdn.example.com/locales/en.json",
      expect.anything()
    );
  });

  it("should cover headers options (object, sync function, async function)", async () => {
    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true })
    });

    const l1 = createRemoteLoader({
      endpoint: "https://cdn.example.com/{lang}.json",
      storage: "memory",
      storagePrefix: "h_obj_",
      fetch: mockFetch,
      headers: { Authorization: "Bearer token1" }
    });
    await l1("en");
    expect(mockFetch).toHaveBeenCalledWith(expect.any(String), { headers: { Authorization: "Bearer token1" } });

    const l2 = createRemoteLoader({
      endpoint: "https://cdn.example.com/{lang}.json",
      storage: "memory",
      storagePrefix: "h_sync_",
      fetch: mockFetch,
      headers: () => ({ Authorization: "Bearer token2" })
    });
    await l2("en");
    expect(mockFetch).toHaveBeenCalledWith(expect.any(String), { headers: { Authorization: "Bearer token2" } });

    const l3 = createRemoteLoader({
      endpoint: "https://cdn.example.com/{lang}.json",
      storage: "memory",
      storagePrefix: "h_async_",
      fetch: mockFetch,
      headers: async () => ({ Authorization: "Bearer token3" })
    });
    await l3("en");
    expect(mockFetch).toHaveBeenCalledWith(expect.any(String), { headers: { Authorization: "Bearer token3" } });
  });

  it("should throw when fetch implementation is unavailable", async () => {
    const origFetch = global.fetch;
    delete (global as any).fetch;

    const loader = createRemoteLoader({
      endpoint: "https://cdn.example.com/{lang}.json",
      storage: "memory",
      storagePrefix: "no_fetch_"
    });

    await expect(loader("en")).rejects.toThrow("[LocL/remoteLoader] No fetch implementation available.");
    global.fetch = origFetch;
  });

  it("should throw HTTP error when res.ok is false", async () => {
    const mockFetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 404,
      statusText: "Not Found"
    });

    const loader = createRemoteLoader({
      endpoint: "https://cdn.example.com/{lang}.json",
      storage: "memory",
      storagePrefix: "http_err_",
      fetch: mockFetch
    });

    await expect(loader("en")).rejects.toThrow('[LocL/remoteLoader] HTTP 404 Not Found fetching "https://cdn.example.com/en.json"');
  });

  it("should fallback to empty object if response payload is not a plain object", async () => {
    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => [1, 2, 3]
    });

    const loader = createRemoteLoader({
      endpoint: "https://cdn.example.com/{lang}.json",
      storage: "memory",
      storagePrefix: "payload_arr_",
      fetch: mockFetch
    });

    const res = await loader("en");
    expect(res).toEqual({});
  });

  it("should handle SWR background revalidation error and onError callback", async () => {
    let callCount = 0;
    const onError = jest.fn();

    const mockFetch = jest.fn().mockImplementation(async () => {
      callCount++;
      if (callCount === 1) {
        return { ok: true, json: async () => ({ title: "Initial" }) };
      }
      throw new Error("Background failure");
    });

    const loader = createRemoteLoader({
      endpoint: "https://cdn.example.com/{lang}.json",
      storage: "memory",
      storagePrefix: "swr_err_",
      fetch: mockFetch,
      maxAge: 50,
      onError
    });

    await loader("en");
    await new Promise((r) => setTimeout(r, 60));

    const stale = await loader("en");
    expect(stale).toEqual({ title: "Initial" });

    await new Promise((r) => setTimeout(r, 20));
    expect(onError).toHaveBeenCalledWith(expect.any(Error), "en", undefined);

    const onErrorStr = jest.fn();
    let callCount2 = 0;
    const mockFetchStr = jest.fn().mockImplementation(async () => {
      callCount2++;
      if (callCount2 === 1) {
        return { ok: true, json: async () => ({ title: "Initial" }) };
      }
      throw "String error";
    });

    const loaderStr = createRemoteLoader({
      endpoint: "https://cdn.example.com/{lang}.json",
      storage: "memory",
      storagePrefix: "swr_str_err_",
      fetch: mockFetchStr,
      maxAge: 50,
      onError: onErrorStr
    });

    await loaderStr("en");
    await new Promise((r) => setTimeout(r, 60));
    await loaderStr("en");
    await new Promise((r) => setTimeout(r, 20));
    expect(onErrorStr).toHaveBeenCalledWith(expect.any(Error), "en", undefined);
  });

  it("should fallback to stale cache when fetchFresh fails and SWR is false", async () => {
    let callCount = 0;
    const mockFetch = jest.fn().mockImplementation(async () => {
      callCount++;
      if (callCount === 1) {
        return { ok: true, json: async () => ({ val: "Stale Value" }) };
      }
      throw new Error("Network Offline");
    });

    const loader = createRemoteLoader({
      endpoint: "https://cdn.example.com/{lang}.json",
      storage: "memory",
      storagePrefix: "swr_false_fallback_",
      fetch: mockFetch,
      maxAge: 50,
      staleWhileRevalidate: false
    });

    await loader("en");
    await new Promise((r) => setTimeout(r, 60));

    const fallbackVal = await loader("en");
    expect(fallbackVal).toEqual({ val: "Stale Value" });
  });

  it("should trigger onError and rethrow when initial fetch fails without cache", async () => {
    const onError = jest.fn();
    const mockFetch = jest.fn().mockRejectedValue("Fatal Error");

    const loader = createRemoteLoader({
      endpoint: "https://cdn.example.com/{lang}.json",
      storage: "memory",
      storagePrefix: "fatal_no_cache_",
      fetch: mockFetch,
      onError
    });

    await expect(loader("en")).rejects.toThrow("Fatal Error");
    expect(onError).toHaveBeenCalledWith(expect.any(Error), "en", undefined);
  });

  it("should clear all memory cache when clearCache is called without arguments", async () => {
    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ a: 1 })
    });

    const loader = createRemoteLoader({
      endpoint: "https://cdn.example.com/{lang}.json",
      storage: "memory",
      storagePrefix: "clear_all_",
      fetch: mockFetch
    });

    await loader("en");
    await loader("de");

    await loader.clearCache();

    await loader("en");
    expect(mockFetch).toHaveBeenCalledTimes(3);
  });

  it("should handle memoryStore removeItem and storage without removeItem in clearCache", async () => {
    const mockFetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ a: 1 }) });

    // Memory store removeItem
    const memLoader = createRemoteLoader({
      endpoint: "https://cdn.example.com/{lang}.json",
      storagePrefix: "mem_rem_",
      fetch: mockFetch
    });
    await memLoader("en", "common");
    await memLoader.clearCache("en", "common");

    // Storage without removeItem
    const storageWithoutRemove = {
      getItem: () => null,
      setItem: () => { }
    };
    const loaderWithoutRemove = createRemoteLoader({
      endpoint: "https://cdn.example.com/{lang}.json",
      storage: storageWithoutRemove,
      fetch: mockFetch
    });

    await expect(loaderWithoutRemove.clearCache("en")).resolves.toBeUndefined();
  });
});