import { initLocL } from "../src/index.js";
import { toI18next, createI18nextCompat } from "../src/compat/index.js";

describe("i18next Compatibility Adapter", () => {
  const resources = {
    en: {
      common: {
        hello: "Hello, {name}!",
        save: "Save"
      },
      messages: {
        one: "1 message",
        other: "{count} messages"
      }
    },
    es: {
      common: {
        hello: "Hola, {name}!",
        save: "Guardar"
      },
      messages: {
        one: "1 mensaje",
        other: "{count} mensajes"
      }
    }
  } as const;

  it("should support colon namespace syntax (common:hello)", () => {
    const locl = initLocL({ resources, fallbackLanguage: "en" });
    const i18n = toI18next(locl);

    expect(i18n.t("common:hello", { name: "Maria" })).toBe("Hello, Maria!");
    expect(i18n.t("common.save")).toBe("Save");
  });

  it("should support defaultValue fallback and 3-argument signature (Line 84 & 119)", () => {
    const locl = initLocL({ resources, fallbackLanguage: "en" });
    const i18n = toI18next(locl);

    // Signature 1: t(key, defaultValue)
    expect(i18n.t("missing.key", "Default String")).toBe("Default String");

    // Signature 2: t(key, defaultValue, options) -> exercises line 84 truthy branch
    expect(i18n.t("common:hello", "Default {name}", { name: "Maria" })).toBe("Hello, Maria!");
    expect(i18n.t("missing.key", "Default {name}", { name: "Maria" })).toBe("Default {name}");

    // Signature 2 with non-object arg2 -> exercises line 84 fallback branch
    expect(i18n.t("missing.key", "Default String", null as any)).toBe("Default String");

    // Signature 3: t(key, { defaultValue })
    expect(i18n.t("nonexistent", { defaultValue: "Fallback Text" })).toBe("Fallback Text");
  });

  it("should support language, languages, changeLanguage, and event listeners", async () => {
    const locl = initLocL({ resources, fallbackLanguage: "en" });
    const i18n = createI18nextCompat(locl);

    expect(i18n.language).toBe("en");
    expect(i18n.languages).toEqual(["en", "es"]);

    const events: string[] = [];
    const unsubscribe = i18n.on("languageChanged", (lang) => {
      events.push(lang);
    });

    await i18n.changeLanguage("es");
    expect(i18n.language).toBe("es");
    expect(i18n.t("common:hello", { name: "Maria" })).toBe("Hola, Maria!");
    expect(events).toContain("es");

    unsubscribe();
  });

  it("should support exists and addResourceBundle", () => {
    const locl = initLocL({ resources, fallbackLanguage: "en" });
    const i18n = toI18next(locl);

    expect(i18n.exists("common:save")).toBe(true);
    expect(i18n.exists("common.save")).toBe(true);
    expect(i18n.exists("unknown:key")).toBe(false);

    i18n.addResourceBundle("en", "dynamic", { title: "Title" });
    // @ts-expect-error
    expect(i18n.t("dynamic:title")).toBe("Title");
  });

  it("should cover compat adapter edge cases (off, unhandled events, options object, translator ref)", () => {
    const locl = initLocL({ resources, fallbackLanguage: "en" });
    const i18n = createI18nextCompat(locl);

    // off method no-op and typed off
    expect(typeof i18n.off).toBe("function");
    (i18n as any).off();
    const dummyListener = () => {};
    i18n.on("custom", dummyListener);
    i18n.off("custom", dummyListener);

    // unhandled event on() returns no-op unsubscribe
    const unbind = i18n.on("unknownEvent", () => {});
    expect(typeof unbind).toBe("function");
    unbind();

    // t with options object without defaultValue
    expect(i18n.t("common.save", { someOpt: true })).toBe("Save");

    // t with missing key and options object with defaultValue
    expect(i18n.t("nonExistent", { defaultValue: "Fallback Val" })).toBe("Fallback Val");

    // underlying translator property
    expect(i18n.translator).toBe(locl);
  });

  const extraResources = {
    en: {
      apple_one: "one apple",
      apple_other: "{count} apples",
      common: {
        login: "Log in",
        nested: { button: "Click" }
      }
    },
    de: {
      common: { login: "Anmelden" }
    }
  };

  it("should catch and log error when event listener throws (Line 66)", async () => {
    const translator = initLocL({ resources: extraResources, fallbackLanguage: "en" });
    const i18n = toI18next(translator);
    const errSpy = jest.spyOn(console, "error").mockImplementation();

    i18n.on("languageChanged", () => {
      throw new Error("Subscriber crash");
    });

    await i18n.changeLanguage("de");
    expect(errSpy).toHaveBeenCalledWith(
      expect.stringContaining('[LocL/compat] Error in event "languageChanged":'),
      expect.any(Error)
    );
    errSpy.mockRestore();
  });

  it("should cover options.count, options.ns, colon syntax, and defaultValue branches", () => {
    const translator = initLocL({ resources: extraResources, fallbackLanguage: "en" });
    const i18n = toI18next(translator);

    // options.count plural branch
    expect(i18n.t("apple", { count: 1 })).toBe("one apple");
    expect(i18n.t("apple", { count: 5 })).toBe("5 apples");

    // options.ns
    expect(i18n.t("login", { ns: "common" })).toBe("Log in");

    // Colon namespace syntax
    expect(i18n.t("common:login")).toBe("Log in");

    // defaultValue string argument
    expect(i18n.t("missingKey", "Default Fallback")).toBe("Default Fallback");

    // defaultValue inside options object
    expect(i18n.t("missingKey", { defaultValue: "Options Fallback" })).toBe("Options Fallback");

    // missing key without default returns key
    // @ts-expect-error
    expect(i18n.t("missingKey")).toBe("missingKey");

    // exists with colon and ns
    expect(i18n.exists("common:login")).toBe(true);
    expect(i18n.exists("login", { ns: "common" })).toBe(true);
    expect(i18n.exists("missing:key")).toBe(false);
  });

  it("should cover resource bundles, loadNamespaces, changeLanguage callback, and createI18nextCompat", async () => {
    const translator = initLocL({ resources: extraResources, fallbackLanguage: "en" });
    const i18n = toI18next(translator);

    // hasResourceBundle and getResourceBundle (with present and missing languages)
    expect(i18n.hasResourceBundle("en", "common")).toBe(true);
    expect(i18n.hasResourceBundle("en", "nonexistent")).toBe(false);
    expect(i18n.hasResourceBundle("nonexistentLang", "common")).toBe(false);
    expect(i18n.getResourceBundle("en", "common")).toEqual(extraResources.en.common);
    expect(i18n.getResourceBundle("nonexistentLang", "common")).toBeUndefined();

    // addResource & addResources
    i18n.addResource("en", "common", "extra", "Extra Value");
    // @ts-expect-error
    expect(i18n.t("common:extra")).toBe("Extra Value");

    i18n.addResources("en", "common", { another: "Another Value" });
    // @ts-expect-error
    expect(i18n.t("common:another")).toBe("Another Value");

    i18n.addResourceBundle("en", "newNs", { item: "Item Value" });
    // @ts-expect-error
    expect(i18n.t("newNs:item")).toBe("Item Value");

    // loadNamespaces with and without callback
    let nsLoaded = false;
    await i18n.loadNamespaces("common", () => {
      nsLoaded = true;
    });
    expect(nsLoaded).toBe(true);
    await i18n.loadNamespaces(["common", "newNs"]);

    // changeLanguage with callback
    let cbFired = false;
    await i18n.changeLanguage("de", (err, t) => {
      expect(err).toBeNull();
      expect(typeof t).toBe("function");
      cbFired = true;
    });
    expect(cbFired).toBe(true);

    // createI18nextCompat export
    const compat2 = createI18nextCompat(translator);
    expect(compat2).toBeDefined();
  });

  it("should cover missing resources fallback and undefined result fallback (Lines 119 and 144)", () => {
    const translator = initLocL({ resources, fallbackLanguage: "en" });

    // 1. Line 144: Exercise languages when translator.resources is undefined
    const dummyLocL = {
      ...translator,
      resources: undefined,
      getLanguage: () => "en",
      subscribe: () => () => {}
    };
    const i18nWithoutRes = toI18next(dummyLocL as any);
    expect(i18nWithoutRes.languages).toEqual([]);

    // 2. Line 119: Exercise return fallback when translator.t returns undefined
    const mockUndefinedT = {
      ...translator,
      t: () => undefined as any,
      get: () => undefined,
      getLanguage: () => "en",
      subscribe: () => () => {}
    };
    const i18nUndefined = toI18next(mockUndefinedT as any);
    // @ts-expect-error
    expect(i18nUndefined.t("someKey")).toBe("someKey");
    expect(i18nUndefined.t("someKey", "Custom Default")).toBe("Custom Default");
  });
});