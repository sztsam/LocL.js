import { initLocL } from "../src/index.js";
import { createLocLServer, getTranslator, getTranslations, getSyncTranslator, runWithLocale, runWithTranslator, getLocale, setLocale, setServerTranslator, getServerTranslator } from "../src/server/index.js";

describe("Server Components & Async Request Isolation (locl-js/server)", () => {
  const resources = {
    en: {
      title: "Dashboard",
      welcome: "Welcome, {name}!",
      items: {
        one: "1 item",
        other: "{count} items"
      },
      dashboard: {
        title: "Server Dashboard",
        metrics: "Metrics"
      },
      auth: {
        login: "Log In"
      }
    },
    de: {
      title: "Übersicht",
      welcome: "Willkommen, {name}!",
      items: {
        one: "1 Artikel",
        other: "{count} Artikel"
      },
      dashboard: {
        title: "Server Übersicht",
        metrics: "Metriken"
      },
      auth: {
        login: "Anmelden"
      }
    }
  } as const;

  // MUST run first: tests standalone functions BEFORE any defaultServerInstance is set
  it("should handle standalone functions before defaultServerInstance is configured", async () => {
    expect(getServerTranslator()).toBeNull();
    expect(getLocale()).toBe("en");
    const localeFromRun = runWithLocale("es", () => {
      return getLocale();
    });
    expect(localeFromRun).toBe("es");

    const dummyTranslator = initLocL({ resources, fallbackLanguage: "en", language: "de" });
    const transLocale = runWithTranslator(dummyTranslator, () => {
      return getLocale();
    });
    expect(transLocale).toBe("de");

    expect(() => getSyncTranslator()).toThrow(
      "[LocL/server] No server translator configured. Call `setServerTranslator(translator)` or use `createLocLServer(translator)`."
    );
    await expect(getTranslator()).rejects.toThrow(
      "[LocL/server] No server translator configured. Call `setServerTranslator(translator)` or use `createLocLServer(translator)`."
    );
    await expect(getTranslations()).rejects.toThrow(
      "[LocL/server] No server translator configured. Call `setServerTranslator(translator)` or use `createLocLServer(translator)`."
    );
  });

  it("should isolate concurrent requests using runWithLocale", async () => {
    const translator = initLocL({ resources, fallbackLanguage: "en" });
    const { getTranslator: serverGetTranslator, runWithLocale: serverRunWithLocale } = createLocLServer(translator);

    const request1 = serverRunWithLocale("en", async () => {
      await new Promise((resolve) => setTimeout(resolve, 20));
      const t = await serverGetTranslator();
      return {
        title: t("title"),
        lang: t.language
      };
    });

    const request2 = serverRunWithLocale("de", async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
      const t = await serverGetTranslator();
      return {
        title: t("title"),
        lang: t.language
      };
    });

    const [res1, res2] = await Promise.all([request1, request2]);

    expect(res1).toEqual({ title: "Dashboard", lang: "en" });
    expect(res2).toEqual({ title: "Übersicht", lang: "de" });
  });

  it("should support t as a callable function and as a destructurable object", async () => {
    const translator = initLocL({ resources, fallbackLanguage: "en" });
    const { getTranslator: serverGetTranslator, runWithLocale: serverRunWithLocale } = createLocLServer(translator);

    await serverRunWithLocale("en", async () => {
      // Calling t directly as a function
      const t = await serverGetTranslator();
      expect(t("title")).toBe("Dashboard");
      expect(t("welcome", { name: "Alice" })).toBe("Welcome, Alice!");

      // @ts-expect-error Missing required parameter 'name'
      t("welcome");

      // Destructuring t
      const { t: destructuredT } = await serverGetTranslator();
      expect(destructuredT("title")).toBe("Dashboard");

      // Attached methods and properties
      expect(t.plural("items", { count: 1 })).toBe("1 item");
      expect(t.plural("items", { count: 3 })).toBe("3 items");
      expect(t.language).toBe("en");
      expect(t.direction).toBe("ltr");
      expect(t.isRTL()).toBe(false);
      expect(t.getMetadata()).toEqual({ language: "en", direction: "ltr", isRTL: false });
      expect(t.format("100", "currency", ["USD"])).toContain("100");
      expect(t.rich("title", {})).toEqual(["Dashboard"]);
      expect(t.tt("title")).toBe("Dashboard");
      expect(t.get("title")).toBe("Dashboard");
      expect(t.getObj("dashboard")).toEqual(resources.en.dashboard);
      expect(t.translator).toBeDefined();
    });
  });

  it("should support scoping on the server with string and array scopes", async () => {
    const translator = initLocL({ resources, fallbackLanguage: "en" });
    const { getTranslator: serverGetTranslator, runWithLocale: serverRunWithLocale } = createLocLServer(translator);

    await serverRunWithLocale("de", async () => {
      // String scope
      const tDash = await serverGetTranslator("dashboard");
      expect(tDash("title")).toBe("Server Übersicht");
      expect(tDash("metrics")).toBe("Metriken");

      // Array scope
      const tMulti = await serverGetTranslator(["dashboard", "auth"]);
      expect(tMulti("dashboard.title")).toBe("Server Übersicht");
      expect(tMulti("auth.login")).toBe("Anmelden");

      // Options object with explicit locale override
      const tExplicit = await serverGetTranslator({ scope: "dashboard", locale: "en" });
      expect(tExplicit("title")).toBe("Server Dashboard");

      // Scope argument with explicit locale override
      const tArgExplicit = await serverGetTranslator("dashboard", { locale: "en" });
      expect(tArgExplicit("title")).toBe("Server Dashboard");

      // Options with only locale (root scope)
      const tFallbackLocale = await serverGetTranslator({ locale: "en" });
      expect(tFallbackLocale("title")).toBe("Dashboard");
    });
  });

  it("should auto-load async namespaces if a loader is configured", async () => {
    const loadedScopes: string[] = [];
    const translator = initLocL({
      resources: { en: {}, de: {} },
      fallbackLanguage: "en",
      loader: async (lang, ns) => {
        loadedScopes.push(`${lang}::${ns}`);
        return {
          analytics: {
            views: `Views in ${lang}`
          }
        };
      }
    });

    const server = createLocLServer(translator);

    await server.runWithLocale("de", async () => {
      const t = await server.getTranslator("analytics");
      expect(loadedScopes).toContain("de::analytics");
      expect(t("views")).toBe("Views in de");

      // loadTasks.length === 0 branch (already loaded)
      const tCached = await server.getTranslator("analytics");
      expect(tCached("views")).toBe("Views in de");
    });

    // autoLoad: false branch
    const serverNoAuto = createLocLServer(translator, { autoLoad: false });
    await serverNoAuto.runWithLocale("de", async () => {
      const tNoAuto = await serverNoAuto.getTranslator("analytics");
      expect(tNoAuto).toBeDefined();
    });
  });

  it("should support custom getLocale resolver function and fallback to active language when unconfigured", async () => {
    let mockCookieLocale = "de";
    const translator = initLocL({ resources, fallbackLanguage: "en" });

    const { getTranslator: serverGetTranslator } = createLocLServer(translator, {
      getLocale: async () => mockCookieLocale
    });

    const t1 = await serverGetTranslator();
    expect(t1.language).toBe("de");
    expect(t1("title")).toBe("Übersicht");

    mockCookieLocale = "en";
    const t2 = await serverGetTranslator();
    expect(t2.language).toBe("en");
    expect(t2("title")).toBe("Dashboard");

    // calling getTranslator outside runWithLocale on server WITHOUT getLocale option
    const plainServer = createLocLServer(translator);
    const tPlain = await plainServer.getTranslator();
    expect(tPlain.language).toBe("en");
    expect(tPlain("title")).toBe("Dashboard");
  });

  it("should provide synchronous translator via getSyncTranslator", () => {
    const translator = initLocL({ resources, fallbackLanguage: "en" });
    const server = createLocLServer(translator);

    server.runWithLocale("de", () => {
      const t = server.getSyncTranslator();
      expect(t("title")).toBe("Übersicht");

      const tScoped = server.getSyncTranslator("dashboard");
      expect(tScoped("title")).toBe("Server Übersicht");

      const tExplicit = server.getSyncTranslator({ locale: "en" });
      expect(tExplicit("title")).toBe("Dashboard");
    });

    // getSyncTranslator called outside runWithLocale and without explicit locale
    const tSyncOutside = server.getSyncTranslator();
    expect(tSyncOutside.language).toBe("en");
    expect(tSyncOutside("title")).toBe("Dashboard");
  });

  it("should support runWithTranslator, getLocale, setLocale, and edge cases", () => {
    const translatorEn = initLocL({ resources, fallbackLanguage: "en" });
    const translatorDe = initLocL({ resources, fallbackLanguage: "de", language: "de" });
    const server = createLocLServer(translatorEn);

    // Default locale outside any run
    expect(server.getLocale()).toBe("en");

    server.runWithLocale("en", () => {
      expect(server.getLocale()).toBe("en");
      server.setLocale("de");
      expect(server.getLocale()).toBe("de");
    });

    // server.setLocale called outside runWithLocale (store is undefined)
    server.setLocale("fr");
    expect(server.getLocale()).toBe("en");

    // runWithTranslator accepts translatorDe with different fallbackLanguage ("de")
    server.runWithTranslator(translatorDe, () => {
      expect(server.getLocale()).toBe("de");
      const t = server.getSyncTranslator();
      expect(t("title")).toBe("Übersicht");
    });
  });

  it("should support standalone module-level singleton functions once configured", async () => {
    const translator = initLocL({ resources, fallbackLanguage: "en" });
    setServerTranslator(translator);

    // getServerTranslator() returns the configured translator
    expect(getServerTranslator()).toBe(translator);

    // getLocale() outside runWithLocale falls back to defaultServerInstance.getLocale()
    expect(getLocale()).toBe("en");

    // standalone setLocale outside runWithLocale (store is undefined)
    setLocale("fr");
    expect(getLocale()).toBe("en");

    // standalone runWithLocale delegates to defaultServerInstance.runWithLocale
    await runWithLocale("de", async () => {
      expect(getLocale()).toBe("de");
      setLocale("de");
      const t = await getTranslator();
      expect(t("title")).toBe("Übersicht");

      const tAlias = await getTranslations();
      expect(tAlias("title")).toBe("Übersicht");

      const sync = getSyncTranslator();
      expect(sync("title")).toBe("Übersicht");
    });

    // standalone runWithTranslator delegates to defaultServerInstance.runWithTranslator
    const custom = initLocL({ resources, fallbackLanguage: "en", language: "en" });
    runWithTranslator(custom, () => {
      expect(getLocale()).toBe("en");
    });
  });

  it("should initialize server instance with options object and handle error cases", () => {
    const translator = initLocL({ resources, fallbackLanguage: "en" });

    // opts.translator in options object
    const serverFromOpts = createLocLServer({ translator });
    expect(serverFromOpts.translator).toBe(translator);
    expect(serverFromOpts.getLocale()).toBe("en");

    // Inline initialization with resources & fallbackLanguage
    const serverInline = createLocLServer({
      resources,
      fallbackLanguage: "en"
    });
    expect(serverInline.getLocale()).toBe("en");

    // Invalid configs throw errors
    expect(() => createLocLServer({})).toThrow(
      "[LocL/server] `createLocLServer` requires a LocL instance or resources configuration."
    );
    expect(() => createLocLServer(undefined as any)).toThrow(
      "[LocL/server] `createLocLServer` requires a LocL instance or resources configuration."
    );
  });
});