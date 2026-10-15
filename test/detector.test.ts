import { initLocL } from "../src/index.js";
import { parseAcceptLanguage, getAcceptedLanguages, matchLanguage, detectBrowserLanguage, detectAndMatch, persistLanguage, attachDetector } from "../src/detector/index.js";

describe("Universal Language Detector (locl-js/detector)", () => {
  describe("RFC 7231 Accept-Language Header Parser", () => {
    it("should parse standard weighted Accept-Language header in descending order", () => {
      const header = "en-US,en;q=0.9,de;q=0.8,fr;q=0.7";
      const parsed = parseAcceptLanguage(header);

      expect(parsed).toEqual([
        { lang: "en-US", q: 1.0 },
        { lang: "en", q: 0.9 },
        { lang: "de", q: 0.8 },
        { lang: "fr", q: 0.7 }
      ]);

      expect(getAcceptedLanguages(header)).toEqual(["en-US", "en", "de", "fr"]);
    });

    it("should handle arbitrary whitespace, out-of-order q-values, and default weights", () => {
      const header = " fr ; q=0.5 ,  es , de;q=0.9 ";
      const parsed = parseAcceptLanguage(header);

      expect(parsed).toEqual([
        { lang: "es", q: 1.0 },
        { lang: "de", q: 0.9 },
        { lang: "fr", q: 0.5 }
      ]);
    });

    it("should clamp invalid q-values and handle malformed segments gracefully", () => {
      expect(parseAcceptLanguage("")).toEqual([]);
      expect(parseAcceptLanguage(null)).toEqual([]);
      expect(parseAcceptLanguage(undefined)).toEqual([]);

      const header = "en;q=1.8,de;q=-0.5,it;q=invalid,;;;,es";
      const parsed = parseAcceptLanguage(header);
      expect(parsed).toEqual([
        { lang: "en", q: 1.0 },
        { lang: "it", q: 1.0 },
        { lang: "es", q: 1.0 },
        { lang: "de", q: 0.0 }
      ]);
    });

    it("should handle non-string headers and malformed q-factor values", () => {
      // @ts-expect-error
      expect(parseAcceptLanguage(123)).toEqual([]);
      expect(parseAcceptLanguage("en, , fr")).toEqual([
        { lang: "en", q: 1.0 },
        { lang: "fr", q: 1.0 }
      ]);
      expect(parseAcceptLanguage("en, ;q=0.8")).toEqual([
        { lang: "en", q: 1.0 }
      ]);
      expect(parseAcceptLanguage("en;q=.")).toEqual([
        { lang: "en", q: 1.0 }
      ]);
    });
  });

  describe("Language Negotiation & BCP 47 Matching", () => {
    const supported = ["en", "en-US", "de-DE", "de", "es", "fr-CA"];

    it("should match exact language tags (case-insensitive)", () => {
      expect(matchLanguage("de-de", supported, "en")).toBe("de-DE");
      expect(matchLanguage("ES", supported, "en")).toBe("es");
      expect(matchLanguage("en-us", supported, "en")).toBe("en-US");
    });

    it("should match via BCP 47 subtag truncation", () => {
      // de-AT-Vienna -> de-AT -> de
      expect(matchLanguage("de-AT-Vienna", supported, "en")).toBe("de");
      expect(matchLanguage("fr-CA-Quebec", supported, "en")).toBe("fr-CA");
    });

    it("should match primary subtag prefix when regional variant is supported", () => {
      // fr matches fr-CA when only fr-CA is supported
      expect(matchLanguage("fr", supported, "en")).toBe("fr-CA");
    });

    it("should handle wildcard and fallback correctly", () => {
      expect(matchLanguage("*", supported, "en")).toBe("en");
      expect(matchLanguage("ja-JP", supported, "en")).toBe("en");
      expect(matchLanguage("", supported, "en")).toBe("en");
      expect(matchLanguage(null, supported, "en")).toBe("en");
      expect(matchLanguage("de", [], "fallback")).toBe("fallback");
    });

    it("should negotiate from raw header string and array inputs with q sorting", () => {
      expect(matchLanguage("ja,es;q=0.9", supported, "en")).toBe("es");
      expect(matchLanguage([{ lang: "it" }, { lang: "de" }], supported, "en")).toBe("de");
      expect(matchLanguage([{ lang: "it", q: 0.5 }, { lang: "de", q: 0.9 }], supported, "en")).toBe("de");
    });

    it("should negotiate language from string array, empty array, and empty candidate", () => {
      expect(matchLanguage(["de", "en"], supported, "en")).toBe("de");
      expect(matchLanguage([], supported, "en")).toBe("en");
      expect(matchLanguage("*", [], "fallback")).toBe("fallback");
      expect(matchLanguage(["  ", "de"], supported, "en")).toBe("de");
    });
  });

  describe("Browser Detection Pipeline", () => {
    afterEach(() => {
      delete (global as any).window;
      delete (global as any).document;
      delete (global as any).navigator;
    });

    it("should detect language from URL query string", () => {
      const detected = detectBrowserLanguage({
        url: "https://example.com/page?lang=de",
        order: ["querystring"]
      });
      expect(detected).toBe("de");

      // Multiple query param support
      const detectedLocale = detectBrowserLanguage({
        url: "https://example.com/page?locale=es",
        queryParam: ["lang", "locale"],
        order: ["querystring"]
      });
      expect(detectedLocale).toBe("es");
    });

    it("should detect language from cookie string or document.cookie", () => {
      const fromString = detectBrowserLanguage({
        cookieString: "foo=bar; NEXT_LOCALE=fr; theme=dark",
        order: ["cookie"]
      });
      expect(fromString).toBe("fr");

      (global as any).document = {
        cookie: "other=1; locale=de"
      };
      const fromDoc = detectBrowserLanguage({
        cookieName: ["NEXT_LOCALE", "locale"],
        order: ["cookie"]
      });
      expect(fromDoc).toBe("de");
    });

    it("should detect language from localStorage and sessionStorage", () => {
      const localStore: Record<string, string> = { locl_language: "it" };
      const sessionStore: Record<string, string> = { locl_language: "pt" };

      (global as any).window = {
        localStorage: { getItem: (k: string) => localStore[k] || null },
        sessionStorage: { getItem: (k: string) => sessionStore[k] || null }
      };

      expect(detectBrowserLanguage({ order: ["localStorage"] })).toBe("it");
      expect(detectBrowserLanguage({ order: ["sessionStorage"] })).toBe("pt");
    });

    it("should detect language from navigator.languages and HTML lang tag", () => {
      (global as any).navigator = {
        languages: ["es-ES", "es", "en"],
        language: "es-ES"
      };
      expect(detectBrowserLanguage({ order: ["navigator"] })).toBe("es-ES");

      (global as any).navigator = {
        language: "es-ES"
      };
      expect(detectBrowserLanguage({ order: ["navigator"] })).toBe("es-ES");

      (global as any).document = {
        documentElement: {
          getAttribute: (attr: string) => (attr === "lang" ? "ja" : null),
          lang: "ja"
        }
      };
      expect(detectBrowserLanguage({ order: ["htmlTag"] })).toBe("ja");
    });

    it("should support custom detectors and pipeline fallback to null", () => {
      const detected = detectBrowserLanguage({
        order: ["customDetector", "anotherDetector"],
        customDetectors: {
          customDetector: () => null,
          anotherDetector: () => "de"
        }
      });
      expect(detected).toBe("de");

      // Non-browser environment returns null
      expect(detectBrowserLanguage({ order: ["navigator"] })).toBeNull();
    });

    it("should run detectAndMatch seamlessly", () => {
      const match = detectAndMatch(["en", "de", "fr"], "en", {
        url: "http://localhost/?lang=fr"
      });
      expect(match).toBe("fr");
    });

    it("should cover detector edge cases (URL object, invalid URL, malformed cookies, storage errors, navigator fallback, htmlTag property)", () => {
      expect(detectBrowserLanguage()).toBeNull();

      expect(detectBrowserLanguage({
        url: new URL("https://example.com/?lang=de"),
        order: ["querystring"]
      })).toBe("de");

      expect(detectBrowserLanguage({
        url: "http://[invalid",
        order: ["querystring"]
      })).toBeNull();

      expect(detectBrowserLanguage({
        cookieString: "NEXT_LOCALE=%",
        order: ["cookie"]
      })).toBe("%");

      expect(detectBrowserLanguage({
        cookieString: "NEXT_LOCALE=",
        order: ["cookie"]
      })).toBeNull();

      expect(detectBrowserLanguage({
        cookieString: "OTHER=value",
        order: ["cookie"]
      })).toBeNull();

      // localStorage & sessionStorage returning null
      (global as any).window = {
        localStorage: { getItem: () => null },
        sessionStorage: { getItem: () => null }
      };
      expect(detectBrowserLanguage({ order: ["localStorage"] })).toBeNull();
      expect(detectBrowserLanguage({ order: ["sessionStorage"] })).toBeNull();

      // localStorage & sessionStorage throwing
      (global as any).window = {
        localStorage: { getItem: () => { throw new Error("Blocked"); } },
        sessionStorage: { getItem: () => { throw new Error("Blocked"); } }
      };
      expect(detectBrowserLanguage({ order: ["localStorage"] })).toBeNull();
      expect(detectBrowserLanguage({ order: ["sessionStorage"] })).toBeNull();

      // navigator.languages empty array
      (global as any).navigator = {
        languages: [],
        language: "es"
      };
      expect(detectBrowserLanguage({ order: ["navigator"] })).toBe("es");

      // htmlTag when getAttribute is not a function
      (global as any).document = {
        documentElement: {
          getAttribute: null,
          lang: "fr"
        }
      };
      expect(detectBrowserLanguage({ order: ["htmlTag"] })).toBe("fr");

      // htmlTag when htmlLang is empty
      (global as any).document = {
        documentElement: {
          getAttribute: () => null,
          lang: ""
        }
      };
      expect(detectBrowserLanguage({ order: ["htmlTag"] })).toBeNull();

      // navigator.languages empty array and empty language string
      (global as any).navigator = {
        languages: [],
        language: ""
      };
      expect(detectBrowserLanguage({ order: ["navigator"] })).toBeNull();
    });
  });

  describe("Auto-Persistence & Translator Attachment", () => {
    afterEach(() => {
      delete (global as any).window;
      delete (global as any).document;
    });

    it("should persist language to document.cookie, storage, and html element", () => {
      let setCookieStr = "";
      const setAttrMock = jest.fn();
      const localStore: Record<string, string> = {};
      const sessionStore: Record<string, string> = {};

      (global as any).document = {
        documentElement: { setAttribute: setAttrMock },
        set cookie(val: string) { setCookieStr = val; },
        get cookie() { return setCookieStr; }
      };
      (global as any).window = {
        localStorage: { setItem: (k: string, v: string) => { localStore[k] = v; } },
        sessionStorage: { setItem: (k: string, v: string) => { sessionStore[k] = v; } }
      };

      persistLanguage("de", {
        cookie: { name: "NEXT_LOCALE", maxAge: 86400 },
        localStorage: "locl_language",
        sessionStorage: "locl_language",
        htmlTag: true
      });

      expect(setCookieStr).toContain("NEXT_LOCALE=de");
      expect(setCookieStr).toContain("Max-Age=86400");
      expect(localStore.locl_language).toBe("de");
      expect(sessionStore.locl_language).toBe("de");
      expect(setAttrMock).toHaveBeenCalledWith("lang", "de");
    });

    it("should attach detector to LocL instance and persist on changeLanguage", () => {
      const translator = initLocL({
        resources: { en: { title: "Hello" }, de: { title: "Hallo" } },
        fallbackLanguage: "en"
      });

      let cookieValue = "";
      (global as any).document = {
        documentElement: {
          setAttribute: jest.fn(),
          getAttribute: jest.fn(() => null),
          lang: "en"
        },
        set cookie(val: string) { cookieValue = val; },
        get cookie() { return cookieValue; }
      };

      const unsub = attachDetector(translator, {
        cookie: { name: "NEXT_LOCALE" }
      });

      translator.changeLanguage("de");
      expect(cookieValue).toContain("NEXT_LOCALE=de");

      unsub();
      translator.changeLanguage("en");
      // Detached, cookie shouldn't change to en
      expect(cookieValue).toContain("NEXT_LOCALE=de");
    });

    it("should support attachDetector with autoDetect: true", () => {
      (global as any).window = {
        location: { search: "?lang=de" }
      };
      (global as any).document = {
        documentElement: {
          setAttribute: jest.fn(),
          getAttribute: jest.fn(() => null),
          lang: "en"
        }
      };

      const translator = initLocL({
        resources: { en: { title: "Hello" }, de: { title: "Hallo" } },
        fallbackLanguage: "en"
      });

      attachDetector(translator, {
        order: ["querystring"],
        autoDetect: true
      });

      expect(translator.getLanguage()).toBe("de");
    });

    it("should cover persistLanguage and attachDetector options and edge cases", () => {
      persistLanguage("");
      persistLanguage("en");

      persistLanguage("en", { cookie: false });
      // @ts-expect-error
      persistLanguage("en", { cookie: true });
      // @ts-expect-error
      persistLanguage("en", { cookie: null });

      persistLanguage("en", {
        cookie: { secure: true, domain: "example.com" }
      });

      persistLanguage("en", {
        localStorage: false,
        sessionStorage: true,
        htmlTag: false
      });

      const translator = initLocL({
        resources: { en: { title: "Hello" }, de: { title: "Hallo" } },
        fallbackLanguage: "en"
      });

      const unsubDef = attachDetector(translator);
      unsubDef();

      const unsubNoAuto = attachDetector(translator, { autoDetect: false });
      unsubNoAuto();

      (global as any).window = {
        location: { search: "?lang=en" }
      };
      (global as any).document = {
        documentElement: {
          setAttribute: jest.fn(),
          getAttribute: jest.fn(() => null),
          lang: "en"
        }
      };
      const unsubSame = attachDetector(translator, { order: ["querystring"], autoDetect: true });
      expect(translator.getLanguage()).toBe("en");
      unsubSame();

      const emptyTrans = {
        ...translator,
        resources: undefined,
        getLanguage: () => "en",
        subscribe: () => () => { }
      };
      // @ts-expect-error
      const unsubEmpty = attachDetector(emptyTrans);
      unsubEmpty();
    });
  });
});