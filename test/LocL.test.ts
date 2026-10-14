import { initLocL, LocL, defineResources, defineStrictResources, flattenDictionary, defineFastResources } from '../src/index';
import { FlattenKeys, PreFlattened } from "../src/types";

describe('initLocL', () => {
  const resources = {
    en: {
      greeting: 'Hello, {name}!',
      messages: {
        one: 'You have one message.',
        other: 'You have {count} messages.',
      },
      nested: {
        a: {
          b: 'Nested value',
        },
      },
      select: '{gender, select, male {He} female {She} other {They}} is a person.',
      "a.b.c": "Dotted Key",
      a: { b: { c: "Nested Key" } },
      pluralObj: {
        one: "One item",
        other: "{count} items",
      },
      pluralObjOnlyOther: {
        other: "Something else",
      },
      pluralObjNoOther: {
        one: "Only one",
      },
      apples_one: "one apple",
      apples_other: "{count} apples",
      suffixOnlyOther_other: "other items",
      suffixNoOther_one: "one item",
      date_fmt: "Date: {d}",
      num_fmt: "Number: {n}",
      formatted: "Upper: {v | upper}"
    },
    de: {
      greeting: 'Hallo, {name}!',
    },
    hu: {
      simple: "Egyszerű",
    }
  } as const;

  type Resources = typeof resources;
  const getResources = () => JSON.parse(JSON.stringify(resources));

  it('should create a new LocL instance and handle constructor errors', () => {
    const translator = initLocL({
      resources,
      fallbackLanguage: 'en',
    });
    expect(translator).toBeDefined();

    // @ts-expect-error
    expect(() => initLocL({})).toThrow('[LocL] `resources` is required');
    // @ts-expect-error
    expect(() => initLocL({ resources })).toThrow('[LocL] `fallbackLanguage` is required');
  });

  it('should translate a key and handle interpolation', () => {
    const translator = initLocL({
      resources,
      fallbackLanguage: 'en',
    });
    expect(translator.t('greeting', { name: 'World' })).toBe('Hello, World!');
    // Placeholder if value missing
    // @ts-expect-error
    expect(translator.t('greeting')).toBe('Hello, {name}!');
    // Date interpolation (first call creates cache entry, second hits cache)
    expect(translator.t('date_fmt', { d: new Date() })).toContain('/');
    expect(translator.t('date_fmt', { d: new Date() })).toContain('/');
    // Number interpolation (first call creates cache entry, second hits cache)
    expect(translator.t('num_fmt', { n: 123 })).toContain('123');
    expect(translator.t('num_fmt', { n: 456 })).toContain('456');
    // Formatter interpolation
    expect(translator.t('formatted', { v: 'world' })).toBe('Upper: WORLD');
  });

  it('should handle tt and format methods', () => {
    const translator = initLocL({
      resources,
      fallbackLanguage: 'en',
    });
    expect(translator.tt('greeting', { name: 'World' })).toBe('Hello, World!');
    expect(translator.tt()).toEqual(resources.en);
    expect(translator.format('123', 'number')).toBe('123');

    // t with format
    expect(translator.t('greeting', { name: 'world' }, { formatter: 'upper' })).toBe('HELLO, WORLD!');
  });

  it('should handle pluralization edge cases', () => {
    const translator = initLocL({
      resources,
      fallbackLanguage: 'en',
      devMode: true
    });
    const warnSpy = jest.spyOn(console, "warn").mockImplementation();

    // category "one"
    expect(translator.plural('pluralObj', { count: 1 })).toBe('One item');

    // category missing, other present
    expect(translator.plural('pluralObjOnlyOther', { count: 1 })).toBe('Something else');
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('Missing plural'));

    // everything missing
    expect(translator.plural('pluralObjNoOther', { count: 5 })).toBe('pluralObjNoOther');

    // non-object plural
    expect(translator.plural('apples', { count: 1 })).toBe('one apple');

    // suffix plural: category missing, other present
    expect(translator.plural('suffixOnlyOther', { count: 1 })).toBe('other items');
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('Missing plural: "suffixOnlyOther" in "en"'));

    // suffix plural: category missing, other present via t()
    expect(translator.t('suffixOnlyOther', { count: 1 })).toBe('other items');
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('Missing plural: "suffixOnlyOther" in "en"'));

    // suffix plural: other missing
    expect(translator.plural('suffixNoOther', { count: 5 })).toBe('suffixNoOther');
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('Missing plural: "suffixNoOther" in "en"'));

    // formatting in plural
    expect(translator.plural('apples', { count: 1 }, { formatter: 'upper' })).toBe('ONE APPLE');

    warnSpy.mockRestore();
  });

  it('should handle clone and changeLanguage', () => {
    const translator = initLocL({
      resources,
      fallbackLanguage: 'en',
    });
    const cloned = translator.clone('de');
    expect(cloned.t('greeting', { name: 'Welt' })).toBe('Hallo, Welt!');

    translator.changeLanguage('de');

    // @ts-expect-error
    expect(translator.language).toBe('de');
    expect(translator.t('greeting', { name: 'Welt' })).toBe('Hallo, Welt!');
  });

  it('should handle scopes and buildScopedTranslationObject variations', () => {
    // Array scope
    const translator = initLocL({
      resources,
      fallbackLanguage: 'en',
      // @ts-expect-error
      scope: ['a.b.c']
    });
    expect(translator.get('a.b.c')).toBe('Nested Key');

    // Cache hit
    translator.get();
    translator.get();

    // String scope
    const translatorStr = initLocL({
      resources,
      fallbackLanguage: 'en',
      scope: 'nested',
      devMode: true
    });
    expect(translatorStr.t('a.b')).toBe('Nested value');

    // Invalid scope warning
    const warnSpy = jest.spyOn(console, "warn").mockImplementation();
    const translatorInvalid = initLocL({
      resources,
      fallbackLanguage: 'en',
      // @ts-expect-error
      scope: 'nonexistent',
      devMode: true,
      useCache: true
    });
    expect(translatorInvalid.get()).toBeUndefined();
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('Missing namespace'));

    // Trigger cache hit for undefined namespace
    expect(translatorInvalid.get()).toBeUndefined();

    warnSpy.mockRestore();
  });

  it('should handle findNestedValue and lookupKeyWithFallback branches', () => {
    const translator = initLocL({
      resources,
      fallbackLanguage: 'en',
      devMode: true
    });
    const warnSpy = jest.spyOn(console, "warn").mockImplementation();

    // Dotted key priority
    expect(translator.t('a.b.c')).toBe('Dotted Key');

    // Missing key warning
    // @ts-expect-error
    translator.t('missing');
    expect(warnSpy).toHaveBeenCalled();

    warnSpy.mockRestore();
  });

  it('should cover proxy traps in withConfig and makeReadOnly', () => {
    const translator = initLocL({
      resources,
      fallbackLanguage: 'en',
    });

    // withConfig cache and proxy
    const p1 = translator.withConfig({ language: 'hu' });
    const p2 = translator.withConfig({ language: 'hu' });
    expect(p1).toBe(p2);
    // @ts-expect-error
    expect(p1.language).toBe('hu');
    // @ts-expect-error
    expect(p1.scope).toBeUndefined();

    // Trigger (target[prop])
    expect(p1.getObj).toBeDefined();

    // Proxy getDirection, isRTL, and getMetadata
    expect(p1.getDirection()).toBe('ltr');
    expect(p1.getDirection('ar')).toBe('rtl');
    expect(p1.isRTL()).toBe(false);
    expect(p1.isRTL('ar')).toBe(true);
    expect(p1.getMetadata()).toEqual({ language: 'hu', direction: 'ltr', isRTL: false });
    expect(p1.getMetadata('ar')).toEqual({ language: 'ar', direction: 'rtl', isRTL: true });

    // Proxy WITHOUT language exercises `?? target.language` fallback
    const pNoLang = translator.withConfig({ scope: 'nested' });
    expect(pNoLang.isRTL()).toBe(false);
    expect(pNoLang.getMetadata()).toEqual({ language: 'en', direction: 'ltr', isRTL: false });

    // makeReadOnly traps
    const res = translator.get();
    // @ts-expect-error
    expect(() => { res.greeting = 'new'; }).toThrow();
    // @ts-expect-error
    expect(() => { delete res.greeting; }).toThrow();
    expect(() => Object.defineProperty(res, 'newProp', { value: 1 })).toThrow();
    expect(() => Object.setPrototypeOf(res, {})).toThrow();
  });

  it('should cover rootInstance and fixed-language subscribe traps in withConfig', () => {
    const translator = initLocL({
      resources,
      fallbackLanguage: 'en',
    });

    const proxy = translator.withConfig({ scope: 'nested' });
    // Direct property access
    // @ts-expect-error
    expect((proxy).rootInstance).toBe(translator);
    // Chained withConfig access (calls this.rootInstance internally)
    const chainedProxy = proxy.withConfig({ language: 'de' });
    // @ts-expect-error
    expect((chainedProxy).rootInstance).toBe(translator);
    // @ts-expect-error
    expect((chainedProxy).language).toBe('de');

    // prop === "subscribe" on fixed language proxy
    const deProxy = translator.withConfig({ language: 'de' });
    let receivedLang = '';
    const unsub = deProxy.subscribe((lang) => {
      receivedLang = lang;
    });
    expect(receivedLang).toBe('de');
    expect(typeof unsub).toBe('function');
    unsub();

    // catch block when fixed language subscriber throws
    const errSpy = jest.spyOn(console, 'error').mockImplementation();
    deProxy.subscribe(() => {
      throw new Error('Fixed subscriber failure');
    });
    expect(errSpy).toHaveBeenCalledWith(
      expect.stringContaining('[LocL] Error in subscriber:'),
      expect.any(Error)
    );
    errSpy.mockRestore();
  });

  it('should handle validateSupportedLanguage and resolvePluralKey branches', () => {
    const translator = initLocL({
      resources,
      fallbackLanguage: 'en',
    });
    // @ts-expect-error
    expect(translator.validateSupportedLanguage('en-US')).toBe('en');
    // @ts-expect-error
    expect(translator.validateSupportedLanguage('')).toBe(null);
    expect(translator.t('apples', { count: 1 })).toBe('one apple');

    // Direction & RTL utilities
    expect(translator.getDirection()).toBe('ltr');
    expect(translator.getDirection('')).toBe('ltr');
    expect(translator.isRTL()).toBe(false);
    expect(translator.isRTL('ar')).toBe(true);
    expect(translator.getMetadata()).toEqual({ language: 'en', direction: 'ltr', isRTL: false });
    expect(translator.getMetadata('ar')).toEqual({ language: 'ar', direction: 'rtl', isRTL: true });

    // Fallback subtag and script heuristics when Intl.Locale is bypassed/throws
    // @ts-expect-error
    const mockLocale = jest.spyOn(Intl, 'Locale').mockImplementation((tag) => {
      if (tag === 'ar') return { getTextInfo: () => ({ direction: 'rtl' }) };
      if (tag === 'en') return { textInfo: { direction: 'ltr' } };
      if (tag === 'und') return { textInfo: { direction: 'unknown' } }; // Exercises else path on if (info && ...)
      throw new Error('Fallback to subtag parsing');
    });

    expect(translator.getDirection('ar')).toBe('rtl');
    expect(translator.getDirection('en')).toBe('ltr');
    expect(translator.getDirection('und')).toBe('ltr');
    expect(translator.getDirection('az-Arab')).toBe('rtl');
    expect(translator.getDirection('az-Latn')).toBe('ltr');
    expect(translator.getDirection('fa')).toBe('rtl');
    expect(translator.getDirection('fr')).toBe('ltr');

    mockLocale.mockRestore();
  });

  it('should apply custom formatters and handle missing ones', () => {
    // Missing formatter - need devMode on the config
    const translator = initLocL({
      resources: { en: { test: '{v | missing}' } },
      fallbackLanguage: 'en',
      devMode: true
    });
    const warnSpy = jest.spyOn(console, "warn").mockImplementation();
    // @ts-expect-error
    expect(translator.t('test', { v: 'val' }, { formatter: 'missing' })).toBe('val');
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('not found'));
    warnSpy.mockRestore();
  });

  it('should handle missing key in fallback language', () => {
    const translator = initLocL({
      resources: { en: {}, de: {} },
      fallbackLanguage: 'en',
      devMode: true
    });
    const warnSpy = jest.spyOn(console, "warn").mockImplementation();
    // @ts-expect-error
    expect(translator.t('missing')).toBe('missing');
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it('should cover findNestedValue early returns', () => {
    const translator = initLocL({
      resources,
      fallbackLanguage: 'en',
    });
    // @ts-expect-error
    expect(translator.findNestedValue(['a'], null)).toBeUndefined();
    // @ts-expect-error
    expect(translator.findNestedValue(['a'], 'string')).toBeUndefined();
    // @ts-expect-error
    expect(translator.findNestedValue(['missing'], {})).toBeUndefined();

    // findNestedValue loops - reached via empty array
    // @ts-expect-error
    expect(translator.findNestedValue([], { a: 1 })).toEqual({ a: 1 });
  });

  it('should cover applyNamedFormatter missing formatter warning', () => {
    const translator = initLocL({
      resources,
      fallbackLanguage: 'en',
      devMode: true
    });
    const warnSpy = jest.spyOn(console, "warn").mockImplementation();

    // @ts-expect-error
    translator.format('val', 'missing');
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('not found'));
    warnSpy.mockRestore();
  });

  it('should handle getObj method', () => {
    const translator = initLocL({
      resources,
      fallbackLanguage: 'en',
    });
    expect(translator.getObj('nested')).toEqual(resources.en.nested);
  });

  it('should cover interpolate select branches', () => {
    const translator = initLocL({
      resources,
      fallbackLanguage: 'en',
    });
    expect(translator.t('select', { gender: 'male' })).toBe('He is a person.');
    expect(translator.t('select', { gender: 'female' })).toBe('She is a person.');
    expect(translator.t('select', { gender: 'other' })).toBe('They is a person.');
    expect(translator.t('select', { gender: 'unknown' })).toBe('They is a person.');
  
    // Unmatched closing brace (depth === 0)
    const tUnmatched = initLocL({
      resources: { en: { unmatched: 'Hello } World' } },
      fallbackLanguage: 'en'
    });
    expect(tUnmatched.t('unmatched')).toBe('Hello } World');
  });

  it("should export LocL class", () => {
    expect(LocL).toBeDefined();
  });

  it("should handle subscriber errors gracefully in initial call and changeLanguage", () => {
    const translator = initLocL({ resources, fallbackLanguage: "en" });
    const errSpy = jest.spyOn(console, "error").mockImplementation();

    // Initial call throws
    translator.subscribe(() => {
      throw new Error("Initial subscriber exploded");
    });
    expect(errSpy).toHaveBeenCalledWith(
      expect.stringContaining("Error in initial subscriber call:"),
      expect.any(Error)
    );

    // Change language subscriber throws
    translator.subscribe((_newLang, prevLang) => {
      if (prevLang) {
        throw new Error("Update subscriber exploded");
      }
    });
    translator.changeLanguage("de");
    expect(errSpy).toHaveBeenCalledWith(
      expect.stringContaining("Error in subscriber:"),
      expect.any(Error)
    );

    errSpy.mockRestore();
  });

  it("should cover addResource with new language and prototype pollution guards", () => {
    const translator = initLocL({ resources: getResources(), fallbackLanguage: "en" });

    // New language not previously present
    translator.addResource("fr", "welcome", "Bienvenue");
    expect(translator.tt("welcome")).toBe("welcome"); // in en
    translator.changeLanguage("fr");
    expect(translator.getLanguage()).toBe("fr");
    expect(translator.tt("welcome")).toBe("Bienvenue");

    // Deep dotted path creation in new language
    translator.addResource("it", "a.b.c", "Profondo");
    translator.changeLanguage("it");
    expect(translator.tt("a.b.c")).toBe("Profondo");

    // Prototype pollution guards
    translator.addResource("en", "__proto__.polluted", "bad");
    translator.addResource("en", "constructor.polluted", "bad");
    translator.addResource("en", "prototype.polluted", "bad");
    translator.addResource("en", "safe.__proto__", "bad");
    // @ts-expect-error
    expect(({}).polluted).toBeUndefined();

    // Prototype pollution guards on lang
    translator.addResource("__proto__", "key", "bad");
    // @ts-expect-error
    expect(({}).key).toBeUndefined();
  });

  it("should cover addResources deep merging, new languages, and proto guards", () => {
    const translator = initLocL({ resources: getResources(), fallbackLanguage: "en" });

    // Add resources to brand new language
    translator.addResources("es", {
      greeting: "Hola!",
      nested: { val: "Anidado" }
    });
    translator.changeLanguage("es");
    expect(translator.tt("greeting")).toBe("Hola!");
    expect(translator.tt("nested.val")).toBe("Anidado");

    // Merge over non-object and prototype pollution
    translator.addResources("es", {
      __proto__: { polluted: true },
      constructor: { polluted: true },
      prototype: { polluted: true },
      nested: { extra: "Extra" }
    });
    expect(translator.tt("nested.extra")).toBe("Extra");
    // @ts-expect-error
    expect(({}).polluted).toBeUndefined();

    // Prototype pollution guards on lang
    translator.addResources("__proto__", { key: "bad" });
    // @ts-expect-error
    expect(({}).key).toBeUndefined();
  });

  it("should invalidate cache only for affected language with multi-language cache", () => {
    const translator = initLocL({
      resources: getResources(),
      fallbackLanguage: "en",
      scope: "nested",
      useCache: true
    });

    // Warm cache for multiple languages
    expect(translator.get("a.b")).toBe("Nested value");
    translator.changeLanguage("de");
    translator.get("a.b");
    translator.changeLanguage("en");

    // Add resource triggers invalidateCacheForLang, checking prefix matches and non-matches
    translator.addResource("en", "nested.a.b", "Updated nested");
    expect(translator.get("a.b")).toBe("Updated nested");
  });

  it("should cover withConfig options, array scopes, cache toggling", () => {
    const translator = initLocL({
      resources: getResources(),
      fallbackLanguage: "en",
      useCache: false
    });

    // Array scope in withConfig
    const proxy = translator.withConfig({ scope: ["nested.a"], language: "de" });
    // @ts-expect-error
    expect((proxy).language).toBe("de");
    // @ts-expect-error
    expect((proxy).scope).toEqual(["nested.a"]);

    // withConfig with scope property access
    const proxy2 = translator.withConfig({ scope: "nested" });
    // @ts-expect-error
    expect((proxy2).scope).toBe("nested");
  });

  it("should cover clone with default language and custom scope", () => {
    const translator = initLocL({ resources: getResources(), fallbackLanguage: "en" });
    const cloned = translator.clone(undefined, "nested");
    expect(cloned.getLanguage()).toBe("en");
    expect(cloned.get("a.b")).toBe("Nested value");

    // Default arguments
    const clonedDefault = translator.clone();
    expect(clonedDefault.getLanguage()).toBe("en");
  });

  it("should cover validateSupportedLanguage returning null for unrecognized language and prefix", () => {
    const translator = initLocL({ resources, fallbackLanguage: "en" });
    // @ts-expect-error
    expect(translator.validateSupportedLanguage("xx-YY")).toBeNull();
    // changeLanguage with invalid language does nothing
    // @ts-expect-error
    translator.changeLanguage("xx-YY");
    expect(translator.getLanguage()).toBe("en");
  });

  it("should cover constructor useDefaultFormatters false branches", () => {
    const tNoDef = initLocL({
      resources,
      fallbackLanguage: "en",
      useDefaultFormatters: false
    });
    expect(tNoDef.t("greeting", { name: "World" })).toBe("Hello, World!");

    const tCustomOnly = initLocL({
      resources,
      fallbackLanguage: "en",
      useDefaultFormatters: false,
      formatters: {
        custom: (v: any) => `custom:${v}`
      }
    });
    expect(tCustomOnly.format("test", "custom")).toBe("custom:test");

    // autoSyncDocument: false
    const tNoSync = initLocL({
      resources,
      fallbackLanguage: "en",
      autoSyncDocument: false
    });
    expect(tNoSync).toBeDefined();

    // Browser document synchronization when document is defined
    const mockElement = { setAttribute: jest.fn() };
    // @ts-expect-error
    (global).document = { documentElement: mockElement };
    const tSync = initLocL({ resources, fallbackLanguage: "en" });
    expect(mockElement.setAttribute).toHaveBeenCalledWith("dir", "ltr");
    expect(mockElement.setAttribute).toHaveBeenCalledWith("lang", "en");

    tSync.changeLanguage("de");
    expect(mockElement.setAttribute).toHaveBeenCalledWith("lang", "de");
    // @ts-expect-error
    delete (global).document;
  });

  it("should cover buildScopedTranslationObject non-string non-array scope warning and caching", () => {
    const warnSpy = jest.spyOn(console, "warn").mockImplementation();
    const translator = initLocL({
      resources,
      fallbackLanguage: "en",
      // @ts-expect-error
      scope: 12345,
      useCache: true,
      devMode: true
    });

    expect(translator.get()).toBeUndefined();
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("Missing namespace"));

    // Second access hits cached undefined
    expect(translator.get()).toBeUndefined();

    // Also without cache
    const translatorNoCache = initLocL({
      resources,
      fallbackLanguage: "en",
      // @ts-expect-error
      scope: 12345,
      useCache: false,
      devMode: true
    });
    expect(translatorNoCache.get()).toBeUndefined();

    warnSpy.mockRestore();
  });

  it("should cover buildScopedTranslationObject array scope with empty or missing entries", () => {
    const translator = initLocL({
      resources,
      fallbackLanguage: "en",
      // @ts-expect-error
      scope: ["nonexistent.path", "nested"]
    });

    expect(translator.get("nested.a.b")).toBe("Nested value");
  });

  it("should cover zero and exact plurals in resolvePluralKey for both object and suffix plurals", () => {
    const warnSpy = jest.spyOn(console, "warn").mockImplementation();
    const translator = initLocL({
      resources: {
        en: {
          zeroObj: { zero: "No items", one: "1 item", other: "{count} items" },
          exactObj: { "=0": "Zero exact items", "=1": "One exact item", other: "{count} items" },
          zeroSuffix_zero: "Zero apples",
          zeroSuffix_one: "1 apple",
          zeroSuffix_other: "{count} apples",
          "exactSuffix_=0": "Zero exact suffix",
          "exactSuffix_=1": "One exact suffix",
          exactSuffix_other: "{count} suffix items",
          suffixOnlyOther_other: "{count} cars"
        }
      },
      fallbackLanguage: "en",
      devMode: true
    });

    // Object plural zero
    expect(translator.t("zeroObj", { count: 0 })).toBe("No items");
    expect(translator.plural("zeroObj", { count: 0 })).toBe("No items");

    // Object plural exact values (=0, =1)
    expect(translator.t("exactObj", { count: 0 })).toBe("Zero exact items");
    expect(translator.t("exactObj", { count: 1 })).toBe("One exact item");
    expect(translator.plural("exactObj", { count: 0 })).toBe("Zero exact items");

    // Suffix plural zero (with explicit _zero)
    expect(translator.t("zeroSuffix", { count: 0 })).toBe("Zero apples");
    expect(translator.plural("zeroSuffix", { count: 0 })).toBe("Zero apples");

    // Suffix plural exact values (_=0, _=1)
    expect(translator.t("exactSuffix", { count: 0 })).toBe("Zero exact suffix");
    expect(translator.t("exactSuffix", { count: 1 })).toBe("One exact suffix");
    expect(translator.plural("exactSuffix", { count: 0 })).toBe("Zero exact suffix");

    // Suffix plural zero (without explicit _zero -> falls back to other)
    expect(translator.t("suffixOnlyOther", { count: 0 })).toBe("0 cars");
    expect(translator.plural("suffixOnlyOther", { count: 0 })).toBe("0 cars");
    warnSpy.mockRestore();
  });

  it("should cover rich() when translation is not a string, tag has no renderer, or tag covers entire string", () => {
    const translator = initLocL({
      resources: {
        en: {
          nested: { val: 123 },
          tagsWithUnmatched: "Click <custom>here</custom> to <bold>proceed</bold>.",
          tagOnly: "<bold>ExactTag</bold>",
          selfClosingTag: "Hello<br/>World",
          nonFuncTag: "Hello <bold>World</bold>"
        }
      },
      fallbackLanguage: "en"
    });

    // Non-string key returns array with value
    const nonStr = translator.rich("nested", {});
    expect(nonStr).toHaveLength(1);
    expect(typeof nonStr[0]).toBe("object");

    // Tag without renderer keeps raw tag
    const chunks = translator.rich("tagsWithUnmatched", {
      bold: (content) => `*${content}*`
    });
    expect(chunks.join("")).toBe("Click <custom>here</custom> to *proceed*.");

    // Tag covering entire string
    expect(translator.rich("tagOnly", { bold: (c) => `[${c}]` })).toEqual(["[ExactTag]"]);
  
    // Self-closing tag in rich() (exercises match[3], isSelfClosing, and content === "")
    const scChunks = translator.rich("selfClosingTag", {
      br: (c) => `[BR:${c}]`
    });
    expect(scChunks.join("")).toBe("Hello[BR:]World");

    // Defined non-function renderer in rich() (exercises renderer !== undefined branch)
    const nfChunks = translator.rich("nonFuncTag", {
      bold: "BOLDED"
    });
    expect(nfChunks.join("")).toBe("Hello BOLDED");
  });

  it("should cover ICU select with nested parameters, no other case, and trailing whitespace in casesBody", () => {
    const translator = initLocL({
      resources: {
        en: {
          selectNested: "{gender, select, male {He has {count} items} female {She has {count} items} other {They have {count} items}   }",
          selectNoOther: "{gender, select, male {He}}",
          badSelect: "{gender, select, male {He} trailingText}",
          emptyKeySelect: "{gender, select, {Bad} other {They}}"
        }
      },
      fallbackLanguage: "en"
    });
    expect(translator.t("selectNested", { gender: "male", count: 3 })).toBe("He has 3 items");
    expect(translator.t("selectNested", { gender: "female", count: 7 })).toBe("She has 7 items");
    expect(translator.t("selectNested", { gender: "other", count: 10 })).toBe("They have 10 items");

    // select without passing field (falls back to 'other')
    // @ts-expect-error
    expect(translator.t("selectNested", {})).toBe("They have {count} items");

    // select with values === undefined (exercises values ? ... : "other" false branch)
    // @ts-expect-error
    expect(translator.t("selectNested", undefined)).toBe("They have {count} items");

    // select with no 'other' and unmatched value returns empty string
    expect(translator.t("selectNoOther", { gender: "female" })).toBe("");

    // select trailing non-brace tokens and empty caseKey
    expect(translator.t("badSelect", { gender: "male" })).toBe("He");
    expect(translator.t("emptyKeySelect", { gender: "other" })).toBe("They");
  });

  it("should cover missing formatters with value and without value in interpolation", () => {
    const warnSpy = jest.spyOn(console, "warn").mockImplementation();
    const translator = initLocL({
      resources: {
        en: {
          missingFmtWithValue: "Val: {x | nonExistentFmt}",
          missingFmtNoValue: "Val: {missingX | nonExistentFmt}",
          unbound: "Value: {missing}",
          fmtWithArgs: "Trunc: {text | truncate:5, ...}"
        }
      },
      fallbackLanguage: "en",
      devMode: true
    });

    // missing formatter with value
    expect(translator.t("missingFmtWithValue", { x: "hello" })).toBe("Val: hello");
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('Formatter "nonExistentFmt" not found.'));

    // missing formatter without value
    // @ts-expect-error
    expect(translator.t("missingFmtNoValue", {})).toBe("Val: {missingX | nonExistentFmt}");

    // unbound variable without formatter
    // @ts-expect-error
    expect(translator.t("unbound", {})).toBe("Value: {missing}");

    // formatter with args
    expect(translator.t("fmtWithArgs", { text: "hello world" })).toBe("Trunc: hello...");

    warnSpy.mockRestore();
  });

  it("should cover findNestedValue returning undefined when intermediate property is null", () => {
    const translator = initLocL({
      resources: { en: { a: null, leaf: "val" } },
      fallbackLanguage: "en"
    });
    // @ts-expect-error
    expect(translator.get("a.b")).toBeUndefined();
  });

  it("should cover repeated identical tokens in template hitting processed.has branch", () => {
    const translator = initLocL({
      resources: { en: { repeat: "Hello, {name}! Good to see you, {name}." } },
      fallbackLanguage: "en"
    });
    expect(translator.t("repeat", { name: "Sam" })).toBe("Hello, Sam! Good to see you, Sam.");
  });

  it("should cover useCache: false with string scope and array scope", () => {
    const tStr = initLocL({ resources, fallbackLanguage: "en", useCache: false, scope: "nested" });
    expect(tStr.get("a.b")).toBe("Nested value");
    
    // Exercises evaluateTemplate when useCache: false
    const tNoCache = initLocL({ resources, fallbackLanguage: "en", useCache: false });
    expect(tNoCache.t("greeting", { name: "World" })).toBe("Hello, World!");

    const tArr = initLocL({ resources, fallbackLanguage: "en", useCache: false, scope: ["nested"] });
    expect(tArr.get("nested.a.b")).toBe("Nested value");
  });

  it("should cover BCP 47 multi-separator slicing and 2-letter fallback", () => {
    const translator = initLocL({
      resources: { en: { title: "Hi" } },
      fallbackLanguage: "en"
    });

    // Call without arguments to exercise default `lang = this.language` parameter
    expect(translator.getFallbackChain()).toEqual(["en"]);

    // multi-segment subtags with hyphens and underscores
    expect(translator.getFallbackChain("de-AT-Vienna")).toEqual([
      "de-AT-Vienna",
      "de-AT",
      "de",
      "en"
    ]);
    expect(translator.getFallbackChain("zh_Hans_CN")).toEqual([
      "zh_Hans_CN",
      "zh_Hans",
      "zh",
      "en"
    ]);

    // 2-letter prefix fallback without hyphen/underscore
    // @ts-expect-error
    expect((translator).validateSupportedLanguage("enUS")).toBe("en");
  });

  it("should cover pseudo-localization constructor, toggling, and options", () => {
    const tPseudo = initLocL({
      resources: { en: { welcome: "Welcome, {name}! <bold>Click</bold>" } },
      fallbackLanguage: "en",
      pseudoLocalization: true
    });

    const res1 = tPseudo.t("welcome", { name: "Alice" });
    expect(res1).toContain("Alice");
    expect(res1).toContain("<bold>");
    expect(res1).toContain("[!!! ");
    expect(res1).toContain(" !!!]");

    // setPseudoLocalization with boolean false
    tPseudo.setPseudoLocalization(false);
    expect(tPseudo.t("welcome", { name: "Alice" })).toBe("Welcome, Alice! <bold>Click</bold>");

    // setPseudoLocalization with boolean true
    tPseudo.setPseudoLocalization(true);
    expect(tPseudo.t("welcome", { name: "Alice" })).toContain("[!!! ");

    // setPseudoLocalization with object options: accents: false
    tPseudo.setPseudoLocalization({
      enabled: true,
      prefix: ">>> ",
      suffix: " <<<",
      accents: false
    });
    const resNoAccents = tPseudo.t("welcome", { name: "Alice" });
    expect(resNoAccents).toBe(">>> Welcome, Alice! <bold>Click</bold> <<<");

    // setPseudoLocalization with enabled: false
    tPseudo.setPseudoLocalization({ enabled: false });
    expect(tPseudo.t("welcome", { name: "Alice" })).toBe("Welcome, Alice! <bold>Click</bold>");
  });

  it("should cover formatter returning undefined fallback to token.raw", () => {
    // formatter returns undefined -> falls back to token.raw
    const tFmt = initLocL({
      resources: { en: { test: "Result: {val | returnsUndef}" } },
      fallbackLanguage: "en",
      formatters: {
        // @ts-expect-error
        returnsUndef: () => undefined
      }
    });
    expect(tFmt.t("test", { val: "hello" })).toBe("Result: {val | returnsUndef}");

    // intermediate formatter returns undefined before a missing formatter
    const tFmt2 = initLocL({
      resources: { en: { test: "Result: {val | returnsUndef | missingFormatter}" } },
      fallbackLanguage: "en",
      devMode: true,
      formatters: {
        // @ts-expect-error
        returnsUndef: () => undefined
      }
    });
    const warnSpy = jest.spyOn(console, "warn").mockImplementation();
    expect(tFmt2.t("test", { val: "hello" })).toBe("Result: {val | returnsUndef | missingFormatter}");
    warnSpy.mockRestore();
  });
});

describe("defineResources / defineStrictResources", () => {
  it("should return the exact resources object reference passed in", () => {
    const rawResources = {
      en: {
        greeting: "Hello, {name}!"
      }
    };
    const resources = defineResources(rawResources);
    expect(resources).toBe(rawResources);
  });

  it("should infer literal types and work seamlessly with initLocL and ICU placeholders", () => {
    // Declared without writing `as const`
    const resources = defineResources({
      en: {
        welcome: "Welcome, {name}!",
        items: "{gender, select, male {He has {count} items} female {She has {count} items} other {They have {count} items}}"
      },
      de: {
        welcome: "Willkommen, {name}!",
        items: "{gender, select, male {Er hat {count} Artikel} female {Sie hat {count} Artikel} other {Sie haben {count} Artikel}}"
      }
    });

    const translator = initLocL({
      resources,
      fallbackLanguage: "en"
    });

    // Simple placeholder
    expect(translator.t("welcome", { name: "Alice" })).toBe("Welcome, Alice!");

    // ICU select with nested placeholder
    expect(translator.t("items", { gender: "male", count: 3 })).toBe("He has 3 items");
    expect(translator.t("items", { gender: "female", count: 7 })).toBe("She has 7 items");
    expect(translator.t("items", { gender: "other", count: 10 })).toBe("They have 10 items");

    // Language switching
    translator.changeLanguage("de");
    expect(translator.t("welcome", { name: "Alice" })).toBe("Willkommen, Alice!");
    expect(translator.t("items", { gender: "female", count: 7 })).toBe("Sie hat 7 Artikel");
  });

  it("should cover defineStrictResources at runtime", () => {
    const res = defineStrictResources({
      en: { title: "Hello", save: "Save" },
      de: { title: "Hallo", save: "Speichern" }
    });
    expect(res.en.title).toBe("Hello");
    expect(res.de.save).toBe("Speichern");
  });
});

describe("LocL Loader & Async Resolution", () => {
  it("should cover resolveRawBundle for all supported bundle types", async () => {
    const translator = initLocL({
      resources: { en: {} },
      fallbackLanguage: "en"
    });

    // 1. Fetch Response object
    if (typeof Response !== "undefined") {
      await translator.load(
        "en",
        "fromResponse",
        async () => new Response(JSON.stringify({ text: "From Response" }))
      );
      expect(translator.tt("fromResponse.text")).toBe("From Response");

      await expect(
        translator.load(
          "en",
          "fromFailedResponse",
          async () => new Response("Not Found", { status: 404, statusText: "Not Found" })
        )
      ).rejects.toThrow("[LocL] Failed to load resource: 404 Not Found");
    }

    // 2. Raw JSON string (valid and invalid fallback)
    await translator.load("en", "fromJsonStr", async () => JSON.stringify({ text: "From JSON String" }));
    expect(translator.tt("fromJsonStr.text")).toBe("From JSON String");

    await translator.load("en", "fromInvalidStr", async () => "not a valid json");
    expect(translator.isLoaded("en", "fromInvalidStr")).toBe(true);

    // 3. ES Module default export
    await translator.load("en", "fromDefault", async () => ({ default: { text: "From Default" } }));
    expect(translator.tt("fromDefault.text")).toBe("From Default");

    // 4. Function / factory export
    await translator.load("en", "fromFactory", async () => () => ({ text: "From Factory" }));
    expect(translator.tt("fromFactory.text")).toBe("From Factory");

    // 5. Named exports (translations, messages, resources, namespace key)
    await translator.load("en", "fromNamed", async () => ({ fromNamed: { text: "From Named NS" } }));
    expect(translator.tt("fromNamed.text")).toBe("From Named NS");

    await translator.load("en", "fromTrans", async () => ({ translations: { text: "From Translations" } }));
    expect(translator.tt("fromTrans.text")).toBe("From Translations");

    await translator.load("en", "fromMsgs", async () => ({ messages: { text: "From Messages" } }));
    expect(translator.tt("fromMsgs.text")).toBe("From Messages");

    await translator.load("en", "fromRes", async () => ({ resources: { text: "From Resources" } }));
    expect(translator.tt("fromRes.text")).toBe("From Resources");

    // 6. Non-object / array fallback
    await translator.load("en", "fromArray", async () => [1, 2, 3]);
    expect(translator.isLoaded("en", "fromArray")).toBe(true);
  });

  it("should cover isLoaded and load variations (monolithic, nested dots, aliases, errors)", async () => {
    const translator = initLocL({
      resources: {
        en: {
          common: { title: "Title" }
        }
      },
      fallbackLanguage: "en",
      loader: async (lang, ns) => {
        if (ns === "failing") throw new Error("Load failed");
        return ns ? { val: `${ns} loaded` } : { full: `Full ${lang}` };
      }
    });

    // isLoaded branches
    expect(translator.isLoaded("en", "common")).toBe(true);
    expect(translator.isLoaded("en", "missingNs")).toBe(false);
    expect(translator.isLoaded("en")).toBe(true);
    expect(translator.isLoaded("fr")).toBe(false);

    // Monolithic language load (no namespace)
    await translator.loadLanguage("fr");
    expect(translator.isLoaded("fr")).toBe(true);
    // @ts-expect-error
    translator.changeLanguage("fr");
    // @ts-expect-error
    expect(translator.t("full")).toBe("Full fr");

    // Nested dot namespace load
    await translator.loadNamespace("admin.settings");
    // @ts-expect-error
    expect(translator.t("admin.settings.val")).toBe("admin.settings loaded");

    // Calling load when already loaded returns immediately
    const loadSpy = jest.fn();
    await translator.load("en", "common", loadSpy);
    expect(loadSpy).not.toHaveBeenCalled();

    // Calling load without loader throws
    const noLoaderT = initLocL({ resources: { en: {} }, fallbackLanguage: "en" });
    await expect(noLoaderT.load("en", "test")).rejects.toThrow(/No loader configured/);

    // Loader failure removes from in-flight cache and throws
    await expect(translator.load("en", "failing")).rejects.toThrow("Load failed");
    expect(translator.isLoaded("en", "failing")).toBe(false);

    // Settled callback when in-flight promise was replaced in map
    let resolvePending: any;
    const pendingBundle = new Promise<any>((resolve) => {
      resolvePending = resolve;
    });
    const loadTask = translator.load("en", "replacedTaskNs", () => pendingBundle);
    // @ts-expect-error
    (translator).loadingPromises.set("en::replacedTaskNs", Promise.resolve());
    resolvePending({ data: "ok" });
    await loadTask;
  });

  it("should catch errors in notifySubscribers", async () => {
    const translator = initLocL({
      resources: { en: {} },
      fallbackLanguage: "en",
      loader: async () => ({ val: "test" })
    });

    const errSpy = jest.spyOn(console, "error").mockImplementation();
    translator.subscribe(() => {
      throw new Error("Subscriber notify error");
    });

    await translator.load("en", "triggerNotify");

    expect(errSpy).toHaveBeenCalledWith(
      expect.stringContaining("[LocL] Error in subscriber:"),
      expect.any(Error)
    );
    errSpy.mockRestore();
  });

  it("should cover addResource overwrite and isLoaded edge cases", async () => {
    const translator = initLocL({
      resources: { en: {} },
      fallbackLanguage: "en",
      loader: async () => ({ loaded: "yes" })
    });

    // 1. Initially "en" is empty, so isLoaded() with default lang is false
    expect(translator.isLoaded()).toBe(false);

    // 2. Load "en" using default lang argument
    await translator.load();
    expect(translator.isLoaded()).toBe(true);

    // 3. Overwrite existing string primitive with a nested object path
    translator.addResource("en", "nonObj", "stringValue");
    translator.addResource("en", "nonObj.nested", "nestedValue");
    //@ts-expect-error
    expect(translator.t("nonObj.nested")).toBe("nestedValue");

    // 4. isLoaded with non-existent language & dotted path
    expect(translator.isLoaded("nonExistentLang", "someNs")).toBe(false);
    expect(translator.isLoaded("nonExistentLang")).toBe(false);
    expect(translator.isLoaded("en", "nonexistent.dotted.path")).toBe(false);

    // 5. Monolithic load when already loaded returns immediately
    const noopSpy = jest.fn();
    await translator.load("en", undefined, noopSpy);
    expect(noopSpy).not.toHaveBeenCalled();

    // 6. Call load without namespace on translator with no loader (covers `: ""` branch)
    const noLoaderT = initLocL({ resources: { en: {} }, fallbackLanguage: "en" });
    await expect(noLoaderT.load("en")).rejects.toThrow(
      '[LocL] No loader configured to load translations for "en".'
    );

    // 7. resolveBundle with named namespace having a primitive string
    await translator.load("en", "primitiveNs", async () => ({ primitiveNs: "stringData" }));
    expect(translator.isLoaded("en", "primitiveNs")).toBe(true);
  });
});


describe("Safe Type Mode for Large Dictionaries (strictParams: false & Pre-Flattened)", () => {
  const largeResources = defineResources({
    en: {
      simple: "Simple text",
      greeting: "Hello, {name}!",
      complex: "{count, select, 0 {None} 1 {One} other {{count} items}} for {user}.",
      messages: {
        one: "1 message from {sender}",
        other: "{count} messages from {sender}"
      },
      nav: {
        home: "Home",
        settings: {
          profile: "Profile settings",
          security: "Security settings for {role}"
        }
      }
    },
    de: {
      simple: "Einfacher Text",
      greeting: "Hallo, {name}!",
      complex: "{count, select, 0 {Keine} 1 {Eins} other {{count} Artikel}} für {user}.",
      messages: {
        one: "1 Nachricht von {sender}",
        other: "{count} Nachrichten von {sender}"
      },
      nav: {
        home: "Startseite",
        settings: {
          profile: "Profileinstellungen",
          security: "Sicherheitseinstellungen für {role}"
        }
      }
    }
  });

  it("should enable Safe Type Mode via runtime config { strictParams: false } with automatic inference", () => {
    const translator = initLocL({
      resources: largeResources,
      fallbackLanguage: "en",
      strictParams: false
    });

    // Key autocomplete and key validation
    expect(translator.t("simple")).toBe("Simple text");
    expect(translator.t("nav.home")).toBe("Home");
    expect(translator.t("nav.settings.profile")).toBe("Profile settings");

    // Templates with parameters do NOT require values at compile time
    // (Bypasses recursive template string scanning in tsc)
    expect(translator.t("greeting")).toBe("Hello, {name}!");

    // Values can still be provided and are interpolated as expected
    expect(translator.t("greeting", { name: "Alice" })).toBe("Hello, Alice!");
    expect(translator.t("nav.settings.security", { role: "Admin" })).toBe("Security settings for Admin");

    // Plurals only require { count: number } & optional params
    expect(translator.plural("messages", { count: 1, sender: "Bob" })).toBe("1 message from Bob");
    expect(translator.t("messages", { count: 3, sender: "Bob" })).toBe("3 messages from Bob");

    // Invalid keys are still caught at compile time
    // @ts-expect-error Key does not exist in resources
    translator.t("nonExistentKey");
  });

  it("should contrast strictParams: true (default) vs strictParams: false", () => {
    // 1. Strict mode (default): enforces all template parameters at compile time
    const strictTranslator = initLocL({
      resources: largeResources,
      fallbackLanguage: "en"
      // strictParams defaults to true
    });

    // @ts-expect-error Missing required parameter '{ name: string }'
    strictTranslator.t("greeting");
    expect(strictTranslator.t("greeting", { name: "Alice" })).toBe("Hello, Alice!");

    // 2. Safe mode: template params are optional InterpolationOptions
    const safeTranslator = initLocL({
      resources: largeResources,
      fallbackLanguage: "en",
      strictParams: false
    });

    // Valid: parameters are optional, no compile error
    expect(safeTranslator.t("greeting")).toBe("Hello, {name}!");
    expect(safeTranslator.t("greeting", { name: "Alice" })).toBe("Hello, Alice!");
  });

  it("should support scoped translations with strictParams: false", () => {
    const scopedTranslator = initLocL({
      resources: largeResources,
      fallbackLanguage: "en",
      scope: "nav",
      strictParams: false
    });

    // Keys are strictly scoped to the 'nav' namespace
    expect(scopedTranslator.t("home")).toBe("Home");
    expect(scopedTranslator.t("settings.profile")).toBe("Profile settings");
    expect(scopedTranslator.t("settings.security", { role: "Editor" })).toBe("Security settings for Editor");

    // Keys outside the scope fail type checking
    // @ts-expect-error 'simple' is not in the 'nav' scope
    scopedTranslator.t("simple");
  });

  it("should allow explicit generic typing if manually specified", () => {
    // Clean generic layout: T, Fallback, S, F, UseDefaultFormatter, StrictParams
    const translator: LocL<typeof largeResources, "en", undefined, {}, true, false> = initLocL({
      resources: largeResources,
      fallbackLanguage: "en",
      strictParams: false
    });

    expect(translator.t("nav.settings.profile")).toBe("Profile settings");
    expect(translator.t("greeting", { name: "Sam" })).toBe("Hello, Sam!");

    // @ts-expect-error Invalid key
    translator.t("invalidKey");
  });

  it("should support FlattenKeys and PreFlattened type utilities", () => {
    type Keys = FlattenKeys<typeof largeResources.en>;

    const k1: Keys = "simple";
    const k2: Keys = "greeting";
    const k3: Keys = "nav.home";
    const k4: Keys = "nav.settings.profile";
    const k5: Keys = "messages"; // Plural object preserved as leaf key

    expect(k1).toBe("simple");
    expect(k2).toBe("greeting");
    expect(k3).toBe("nav.home");
    expect(k4).toBe("nav.settings.profile");
    expect(k5).toBe("messages");

    type FlatDict = PreFlattened<typeof largeResources.en>;
    const flatDict: Partial<FlatDict> = {
      "nav.home": "Home",
      "simple": "Simple text"
    };
    expect(flatDict["nav.home"]).toBe("Home");
  });

  it("should flatten dictionaries at runtime using flattenDictionary()", () => {
    const nested = {
      user: {
        name: "Name",
        profile: {
          bio: "Biography",
          title: "Title"
        }
      },
      messages: {
        one: "1 message",
        other: "{count} messages"
      },
      plain: "Plain"
    };

    const flat = flattenDictionary(nested);

    expect(flat).toEqual({
      "plain": "Plain",
      "user.name": "Name",
      "user.profile.bio": "Biography",
      "user.profile.title": "Title",
      // Plural objects are preserved for pluralization engine
      "messages": {
        one: "1 message",
        other: "{count} messages"
      }
    });

    // Edge cases
    // @ts-expect-error
    expect(flattenDictionary(null)).toEqual({});
    expect(flattenDictionary([])).toEqual({});
    // @ts-expect-error
    expect(flattenDictionary("string")).toEqual({});
  });

  it("should support defineFastResources helper", () => {
    const fastRes = defineFastResources(largeResources);
    expect(fastRes).toBe(largeResources);
  });

  it("should efficiently process 1,000+ keys in Safe Type Mode without lag", () => {
    const bigDict: Record<string, string> = {};
    for (let i = 0; i < 1000; i++) {
      bigDict[`key_${i}`] = `Template value {param_${i}}`;
    }

    const resources = {
      en: bigDict
    };

    const translator = initLocL({
      resources,
      fallbackLanguage: "en",
      strictParams: false
    });

    // Validates instantly without recursive template parsing
    expect(translator.t("key_0", { param_0: "Val" })).toBe("Template value Val");
    expect(translator.t("key_999", { param_999: "Val" })).toBe("Template value Val");
  });
});