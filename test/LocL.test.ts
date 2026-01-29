import { initLocL } from '../src/index';

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
  };

  type Resources = typeof resources;

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
});