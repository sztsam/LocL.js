import { initLocL, LocL, defineResources } from '../src/index';

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

    // @ts-ignore
    expect(() => initLocL({})).toThrow('[LocL] `resources` is required');
    // @ts-ignore
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
    // Date interpolation
    expect(translator.t('date_fmt', { d: new Date() })).toContain('/');
    // Number interpolation
    expect(translator.t('num_fmt', { n: 123 })).toContain('123');
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
    // @ts-ignore
    expect(translator.plural('pluralObj', { count: 1 })).toBe('One item');

    // category missing, other present
    // @ts-ignore
    expect(translator.plural('pluralObjOnlyOther', { count: 1 })).toBe('Something else');
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('Missing plural'));

    // everything missing
    // @ts-ignore
    expect(translator.plural('pluralObjNoOther', { count: 5 })).toBe('pluralObjNoOther');

    // non-object plural
    // @ts-ignore
    expect(translator.plural('apples', { count: 1 })).toBe('one apple');

    // suffix plural: category missing, other present
    // @ts-ignore
    expect(translator.plural('suffixOnlyOther', { count: 1 })).toBe('other items');
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('Missing plural: "suffixOnlyOther" in "en"'));

    // suffix plural: category missing, other present via t()
    // @ts-ignore
    expect(translator.t('suffixOnlyOther', { count: 1 })).toBe('other items');
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('Missing plural: "suffixOnlyOther" in "en"'));

    // suffix plural: other missing
    // @ts-ignore
    expect(translator.plural('suffixNoOther', { count: 5 })).toBe('suffixNoOther');
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('Missing plural: "suffixNoOther" in "en"'));

    // formatting in plural
    // @ts-ignore
    expect(translator.plural('apples', { count: 1 }, { formatter: 'upper' })).toBe('ONE APPLE');

    warnSpy.mockRestore();
  });

  it('should handle clone and changeLanguage', () => {
    const translator = initLocL({
      resources,
      fallbackLanguage: 'en',
    });
    // @ts-ignore
    const cloned = translator.clone('de');
    expect(cloned.t('greeting', { name: 'Welt' })).toBe('Hallo, Welt!');

    translator.changeLanguage('de');

    // @ts-ignore
    expect(translator.language).toBe('de');
    expect(translator.t('greeting', { name: 'Welt' })).toBe('Hallo, Welt!');
  });

  it('should handle scopes and buildTranslationObject variations', () => {
    // Array scope
    const translator = initLocL({
      resources,
      fallbackLanguage: 'en',
      // @ts-ignore
      scope: ['a.b.c']
    });
    // @ts-ignore
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
      // @ts-ignore
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

  it('should handle findTranslation and lookupWithFallback branches', () => {
    const translator = initLocL({
      resources,
      fallbackLanguage: 'en',
      devMode: true
    });
    const warnSpy = jest.spyOn(console, "warn").mockImplementation();

    // Dotted key priority
    expect(translator.t('a.b.c')).toBe('Dotted Key');

    // Missing key warning
    // @ts-ignore
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
    // @ts-ignore
    expect(p1.language).toBe('hu');
    // @ts-ignore
    expect(p1.scope).toBeUndefined();

    // Trigger line 108 (target[prop])
    // @ts-ignore
    expect((p1).getObj).toBeDefined();

    // makeReadOnly traps
    const res = translator.get();
    // @ts-ignore
    expect(() => { (res).greeting = 'new'; }).toThrow();
    // @ts-ignore
    expect(() => { delete (res).greeting; }).toThrow();
    // @ts-ignore
    expect(() => Object.defineProperty(res, 'newProp', { value: 1 })).toThrow();
    // @ts-ignore
    expect(() => Object.setPrototypeOf(res, {})).toThrow();
  });

  it('should cover rootInstance and fixed-language subscribe traps in withConfig', () => {
    const translator = initLocL({
      resources,
      fallbackLanguage: 'en',
    });

    const proxy = translator.withConfig({ scope: 'nested' as any });
    // Direct property access
    expect((proxy as any).rootInstance).toBe(translator);
    // Chained withConfig access (calls this.rootInstance internally)
    const chainedProxy = proxy.withConfig({ language: 'de' });
    expect((chainedProxy as any).rootInstance).toBe(translator);
    expect((chainedProxy as any).language).toBe('de');

    // prop === "subscribe" on fixed language proxy
    const deProxy = translator.withConfig({ language: 'de' });
    let receivedLang = '';
    const unsub = deProxy.subscribe((lang) => {
      receivedLang = lang;
    });
    expect(receivedLang).toBe('de');
    expect(typeof unsub).toBe('function');
    unsub(); // calls the return () => {}

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

  it('should handle isLanguage and checkPlural branches', () => {
    const translator = initLocL({
      resources,
      fallbackLanguage: 'en',
    });
    // @ts-ignore
    expect(translator.isLanguage('en-US')).toBe('en');

    // @ts-ignore
    expect(translator.isLanguage('')).toBe(null);

    // checkPlural trigger via t()
    // @ts-ignore
    expect(translator.t('apples', { count: 1 })).toBe('one apple');
  });

  it('should apply custom formatters and handle missing ones', () => {
    // Missing formatter - need devMode on the config
    const translator = initLocL({
      resources: { en: { test: '{v | missing}' } },
      fallbackLanguage: 'en',
      devMode: true
    });
    const warnSpy = jest.spyOn(console, "warn").mockImplementation();
    // @ts-ignore
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
    // @ts-ignore
    expect(translator.t('missing')).toBe('missing');
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it('should cover findTranslation early returns', () => {
    const translator = initLocL({
      resources,
      fallbackLanguage: 'en',
    });

    // @ts-ignore
    expect(translator.findTranslation(['a'], null)).toBeUndefined();

    // @ts-ignore
    expect(translator.findTranslation(['a'], 'string')).toBeUndefined();

    // @ts-ignore
    expect(translator.findTranslation(['missing'], {})).toBeUndefined();

    // findTranslation loops - reached via empty array
    // @ts-ignore
    expect(translator.findTranslation([], { a: 1 })).toEqual({ a: 1 });
  });

  it('should cover applyFormat missing formatter warning', () => {
    const translator = initLocL({
      resources,
      fallbackLanguage: 'en',
      devMode: true
    });
    const warnSpy = jest.spyOn(console, "warn").mockImplementation();

    // @ts-ignore
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
    translator.changeLanguage("fr" as any);
    expect(translator.getLanguage()).toBe("fr");
    expect(translator.tt("welcome")).toBe("Bienvenue");

    // Deep dotted path creation in new language
    translator.addResource("it", "a.b.c", "Profondo");
    translator.changeLanguage("it" as any);
    expect(translator.tt("a.b.c")).toBe("Profondo");

    // Prototype pollution guards
    translator.addResource("en", "__proto__.polluted", "bad");
    translator.addResource("en", "constructor.polluted", "bad");
    translator.addResource("en", "prototype.polluted", "bad");
    translator.addResource("en", "safe.__proto__", "bad");
    expect(({} as any).polluted).toBeUndefined();

    // Prototype pollution guards on lang
    translator.addResource("__proto__", "key", "bad");
    expect(({} as any).key).toBeUndefined();
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
    expect(({} as any).polluted).toBeUndefined();

    // Prototype pollution guards on lang
    translator.addResources("__proto__", { key: "bad" });
    expect(({} as any).key).toBeUndefined();
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
    const proxy = translator.withConfig({ scope: ["nested.a"] as any, language: "de" });
    expect((proxy as any).language).toBe("de");
    expect((proxy as any).scope).toEqual(["nested.a"]);

    // withConfig with scope property access
    const proxy2 = translator.withConfig({ scope: "nested" as any });
    expect((proxy2 as any).scope).toBe("nested");
  });

  it("should cover clone with default language and custom scope", () => {
    const translator = initLocL({ resources: getResources(), fallbackLanguage: "en" });
    const cloned = translator.clone(undefined, "nested" as any);
    expect(cloned.getLanguage()).toBe("en");
    expect(cloned.get("a.b")).toBe("Nested value");
  });

  it("should cover isLanguage returning null for unrecognized language and prefix", () => {
    const translator = initLocL({ resources, fallbackLanguage: "en" });
    // @ts-ignore
    expect(translator.isLanguage("xx-YY")).toBeNull();
    // changeLanguage with invalid language does nothing
    // @ts-ignore
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
  });

  it("should cover buildTranslationObject non-string non-array scope warning and caching", () => {
    const warnSpy = jest.spyOn(console, "warn").mockImplementation();
    const translator = initLocL({
      resources,
      fallbackLanguage: "en",
      // @ts-ignore
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
      // @ts-ignore
      scope: 12345,
      useCache: false,
      devMode: true
    });
    expect(translatorNoCache.get()).toBeUndefined();

    warnSpy.mockRestore();
  });

  it("should cover buildTranslationObject array scope with empty or missing entries", () => {
    const translator = initLocL({
      resources,
      fallbackLanguage: "en",
      // @ts-ignore
      scope: ["nonexistent.path", "nested"]
    });

    // @ts-ignore
    expect(translator.get("nested.a.b")).toBe("Nested value");
  });

  it("should cover zero plurals in checkPlural for both object and suffix plurals", () => {
    const warnSpy = jest.spyOn(console, "warn").mockImplementation();
    const translator = initLocL({
      resources: {
        en: {
          zeroObj: { zero: "No items", one: "1 item", other: "{count} items" },
          zeroSuffix_zero: "Zero apples",
          zeroSuffix_one: "1 apple",
          zeroSuffix_other: "{count} apples",
          suffixOnlyOther_other: "{count} cars"
        }
      },
      fallbackLanguage: "en",
      devMode: true
    });

    // Object plural zero
    expect(translator.t("zeroObj", { count: 0 })).toBe("No items");
    expect(translator.plural("zeroObj" as any, { count: 0 })).toBe("No items");

    // Suffix plural zero (with explicit _zero)
    expect(translator.t("zeroSuffix", { count: 0 })).toBe("Zero apples");
    expect(translator.plural("zeroSuffix" as any, { count: 0 })).toBe("Zero apples");

    // Suffix plural zero (without explicit _zero -> falls back to other)
    expect(translator.t("suffixOnlyOther", { count: 0 })).toBe("0 cars");
    expect(translator.plural("suffixOnlyOther" as any, { count: 0 })).toBe("0 cars");
    warnSpy.mockRestore();
  });

  it("should cover rich() when translation is not a string, tag has no renderer, or tag covers entire string", () => {
    const translator = initLocL({
      resources: {
        en: {
          nested: { val: 123 },
          tagsWithUnmatched: "Click <custom>here</custom> to <bold>proceed</bold>.",
          tagOnly: "<bold>ExactTag</bold>"
        }
      },
      fallbackLanguage: "en"
    });

    // Non-string key returns array with value
    const nonStr = translator.rich("nested" as any, {});
    expect(nonStr).toHaveLength(1);
    expect(typeof nonStr[0]).toBe("object");

    // Tag without renderer keeps raw tag
    const chunks = translator.rich("tagsWithUnmatched", {
      bold: (content) => `*${content}*`
    });
    expect(chunks.join("")).toBe("Click <custom>here</custom> to *proceed*.");

    // Tag covering entire string
    expect(translator.rich("tagOnly", { bold: (c) => `[${c}]` })).toEqual(["[ExactTag]"]);
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
    // @ts-ignore
    expect(translator.t("selectNested", {})).toBe("They have {count} items");

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
    // @ts-ignore
    expect(translator.t("missingFmtNoValue", {})).toBe("Val: {missingX | nonExistentFmt}");

    // unbound variable without formatter
    // @ts-ignore
    expect(translator.t("unbound", {})).toBe("Value: {missing}");

    // formatter with args
    expect(translator.t("fmtWithArgs", { text: "hello world" })).toBe("Trunc: hello...");

    warnSpy.mockRestore();
  });

  it("should cover findTranslation returning undefined when intermediate property is null", () => {
    const translator = initLocL({
      resources: { en: { a: null, leaf: "val" } },
      fallbackLanguage: "en"
    });
    // @ts-ignore
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

    const tArr = initLocL({ resources, fallbackLanguage: "en", useCache: false, scope: ["nested"] });
    expect(tArr.get("nested.a.b")).toBe("Nested value");
  });
});

describe("defineResources", () => {
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
});