
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
    },
    de: {
      greeting: 'Hallo, {name}!',
    },
  };

  it('should create a new LocL instance', () => {
    const translator = initLocL({
      resources,
      fallbackLanguage: 'en',
    });
    expect(translator).toBeDefined();
  });

  it('should translate a key', () => {
    const translator = initLocL({
      resources,
      fallbackLanguage: 'en',
    });
    expect(translator.t('greeting', { name: 'World' })).toBe('Hello, World!');
  });

  it('should translate a nested key', () => {
    const translator = initLocL({
      resources,
      fallbackLanguage: 'en',
    });
    expect(translator.t('nested.a.b')).toBe('Nested value');
  });

  it('should translate a key with a different language', () => {
    const translator = initLocL({
      resources,
      fallbackLanguage: 'en',
      language: 'de',
    });
    expect(translator.t('greeting', { name: 'Welt' })).toBe('Hallo, Welt!');
  });

  it('should handle pluralization', () => {
    const translator = initLocL({
      resources,
      fallbackLanguage: 'en',
    });
    expect(translator.plural('messages', { count: 1 })).toBe('You have one message.');
    expect(translator.plural('messages', { count: 2 })).toBe('You have 2 messages.');
  });

  it('should use fallback language for missing keys', () => {
    const translator = initLocL({
      resources,
      fallbackLanguage: 'en',
      language: 'de',
    });
    expect(translator.plural('messages', { count: 1 })).toBe('You have one message.');
  });

  it('should use custom formatters', () => {
    const translator = initLocL({
      resources: {
        en: { greeting: 'Hello, {name | upper}!' },
      },
      fallbackLanguage: 'en',
    });
    expect(translator.t('greeting', { name: 'world' })).toBe('Hello, WORLD!');
  });

  it('should work with scopes', () => {
    const translator = initLocL({
      resources,
      fallbackLanguage: 'en',
      scope: 'nested',
    });
    expect(translator.t('a.b')).toBe('Nested value');
  });

  it('should clone a translator', () => {
    const translator = initLocL({
      resources,
      fallbackLanguage: 'en',
    });
    const newTranslator = translator.clone('de');
    expect(newTranslator.t('greeting', { name: 'Welt' })).toBe('Hallo, Welt!');
  });

  it('should change the language', () => {
    const translator = initLocL({
      resources,
      fallbackLanguage: 'en',
    });
    translator.changeLanguage('de');
    expect(translator.t('greeting', { name: 'Welt' })).toBe('Hallo, Welt!');
  });

  it('should get a translation object', () => {
    const translator = initLocL({
      resources,
      fallbackLanguage: 'en',
    });
    const translations = translator.get();
    expect(translations.greeting).toBe('Hello, {name}!');
  });

  it('should get a nested translation object', () => {
    const translator = initLocL({
      resources,
      fallbackLanguage: 'en',
    });
    const nested = translator.get('nested');
    expect(nested?.a.b).toBe('Nested value');
  });

  it('should create a new proxy translator with withConfig', () => {
    const translator = initLocL({
      resources,
      fallbackLanguage: 'en',
    });
    const proxy: any = translator.withConfig({ language: 'de' });
    expect(proxy.t('greeting' as any, { name: 'Welt' })).toBe('Hallo, Welt!');
  });

  it('should handle select', () => {
    const translator = initLocL({
      resources,
      fallbackLanguage: 'en',
    });
    expect(translator.t('select', { gender: 'male' })).toBe('He is a person.');
    expect(translator.t('select', { gender: 'female' })).toBe('She is a person.');
    expect(translator.t('select', { gender: 'other' })).toBe('They is a person.');
  });

  it('should return the key if not found', () => {
    const translator = initLocL({
      resources,
      fallbackLanguage: 'en',
    });
    expect(translator.t('nonexistent.key' as any)).toBe('nonexistent.key');
  });

  it('should return the key with placeholders if interpolation values are missing', () => {
    const translator = initLocL({
      resources,
      fallbackLanguage: 'en',
    });
    expect(translator.t('greeting')).toBe('Hello, {name}!');
  });

  it('should handle pluralization with a count of 0', () => {
    const translator = initLocL({
      resources: {
        en: {
          messages: {
            one: 'You have one message.',
            other: 'You have {count} messages.',
          },
        },
      },
      fallbackLanguage: 'en',
    });
    expect(translator.plural('messages', { count: 0 })).toBe('You have 0 messages.');
  });

  it('should handle select when the variable is missing', () => {
    const translator = initLocL({
      resources,
      fallbackLanguage: 'en',
    });
    expect(translator.t('select')).toBe('{gender, select, male {He} female {She} other {They}} is a person.');
  });

  it('should return undefined when getting a non-existent nested object', () => {
    const translator = initLocL({
      resources,
      fallbackLanguage: 'en',
    });
    const nested = translator.get('nonexistent' as any);
    expect(nested).toBeUndefined();
  });

  it('should throw an error for invalid configuration', () => {
    expect(() => {
      // @ts-ignore
      initLocL({});
    }).toThrow('[LocL] `resources` is required');
  });

  it('should throw an error for invalid configuration', () => {
    expect(() => {
      // @ts-ignore
      initLocL({ resources });
    }).toThrow('[LocL] `fallbackLanguage` is required');
  });
});
