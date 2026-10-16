import { defaultFormatters } from '../src/formatters';

describe('defaultFormatters', () => {
  it('should convert a string to uppercase', () => {
    expect(defaultFormatters.upper('hello')).toBe('HELLO');
  });

  it('should convert a string to lowercase', () => {
    expect(defaultFormatters.lower('HELLO')).toBe('hello');
  });

  it('should capitalize the first letter of a string', () => {
    expect(defaultFormatters.capitalize('hello')).toBe('Hello');
  });

  it('should trim whitespace from a string', () => {
    expect(defaultFormatters.trim('  hello  ')).toBe('hello');
  });

  describe('truncate', () => {
    it('should truncate a string', () => {
      expect(defaultFormatters.truncate('hello world', ['5'])).toBe('hello...');
    });

    it('should not truncate a string if it is shorter than the specified length', () => {
      expect(defaultFormatters.truncate('hello', ['5'])).toBe('hello');
    });

    it('should use a custom suffix', () => {
      expect(defaultFormatters.truncate('hello world', ['5', '!'])).toBe('hello!');
    });

    it('should use default values when args are missing', () => {
      expect(defaultFormatters.truncate('this is a very long string')).toBe('this is a ...');
      expect(defaultFormatters.truncate('short')).toBe('short');
    });
  });

  describe('number', () => {
    it('should format a number with locale and style', () => {
      expect(defaultFormatters.number(123456.789, ['en-US', 'decimal'])).toBe('123,456.789');
    });

    it('should format a number with default args', () => {
      expect(defaultFormatters.number(123456.789)).toContain('123');
    });

    it('should return original value as string when value is not a valid number', () => {
      expect(defaultFormatters.number('not-a-number')).toBe('not-a-number');
    });
  });

  describe('currency', () => {
    it('should format a currency with currency code and locale', () => {
      expect(defaultFormatters.currency(123456.789, ['USD', 'en-US'])).toBe('$123,456.79');
    });

    it('should format a currency with default args', () => {
      expect(defaultFormatters.currency(123456.789)).toContain('123');
      expect(defaultFormatters.currency(123456.789)).toMatch(/USD|\$/);
    });

    it('should format with custom currency and default locale', () => {
      expect(defaultFormatters.currency(100, ['GBP'])).toMatch(/£100|100.*GBP/);
    });

    it('should return original value as string when value is not a valid number', () => {
      expect(defaultFormatters.currency('not-a-number')).toBe('not-a-number');
    });
  });

  describe('date', () => {
    const date = new Date('2025-01-01T00:00:00.000Z');

    it('should format a date with locale and style', () => {
      expect(defaultFormatters.date(date, ['en-US', 'short'])).toBe('1/1/25');
    });

    it('should format a date with default args', () => {
      expect(defaultFormatters.date(date)).toBeDefined();
    });

    it('should return original value as string when value is an invalid date', () => {
      expect(defaultFormatters.date('invalid-date')).toBe('invalid-date');
    });
  });

  describe('relativeDate', () => {
    beforeAll(() => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2025-01-01T00:00:00.000Z'));
    });

    afterAll(() => {
      jest.useRealTimers();
    });

    it('should format seconds', () => {
      const date = new Date(Date.now() - 10 * 1000);
      expect(defaultFormatters.relativeDate(date, ['en-US'])).toBe('10 seconds ago');
    });

    it('should format minutes', () => {
      const date = new Date(Date.now() - 120 * 1000);
      expect(defaultFormatters.relativeDate(date, ['en-US'])).toBe('2 minutes ago');
    });

    it('should format hours', () => {
      const date = new Date(Date.now() - 3600 * 1000);
      expect(defaultFormatters.relativeDate(date, ['en-US'])).toBe('1 hour ago');
    });

    it('should format days', () => {
      const date = new Date(Date.now() - 86400 * 2 * 1000);
      expect(defaultFormatters.relativeDate(date, ['en-US'])).toBe('2 days ago');
    });

    it('should format a relative date in the future', () => {
      const date = new Date(Date.now() + 3600 * 1000);
      expect(defaultFormatters.relativeDate(date, ['en-US'])).toBe('in 1 hour');
    });

    it('should work with default args', () => {
      const date = new Date(Date.now() - 10 * 1000);
      expect(defaultFormatters.relativeDate(date)).toBeDefined();
    });

    it('should return original value as string when value is an invalid date', () => {
      expect(defaultFormatters.relativeDate('invalid-date')).toBe('invalid-date');
    });
  });

  it('should convert a value to a JSON string', () => {
    expect(defaultFormatters.json({ a: 1 })).toBe(`{
  "a": 1
}`);
  });

  describe('yesNo', () => {
    it('should convert a boolean to a "Yes" or "No" string', () => {
      expect(defaultFormatters.yesNo(true)).toBe('Yes');
      expect(defaultFormatters.yesNo(false)).toBe('No');
    });

    it('should use custom labels', () => {
      expect(defaultFormatters.yesNo(true, ['Y', 'N'])).toBe('Y');
      expect(defaultFormatters.yesNo(false, ['Y', 'N'])).toBe('N');
    });

    it('should handle fallback branches and partial/null args', () => {
      expect(defaultFormatters.yesNo(false, ["Y"])).toBe("No");
      expect(defaultFormatters.yesNo(true, ["", "N"])).toBe("Yes");
      // @ts-expect-error
      expect(defaultFormatters.yesNo(true, null)).toBe("Yes");
      // @ts-expect-error
      expect(defaultFormatters.yesNo(false, null)).toBe("No");
    });
  });

  describe('boolean', () => {
    it('should convert a boolean to a "true" or "false" string', () => {
      expect(defaultFormatters.boolean(true)).toBe('true');
      expect(defaultFormatters.boolean(false)).toBe('false');
    });

    it('should use custom labels', () => {
      expect(defaultFormatters.boolean(true, ['1', '0'])).toBe('1');
      expect(defaultFormatters.boolean(false, ['1', '0'])).toBe('0');
    });

    it('should handle fallback branches and partial/null args', () => {
      expect(defaultFormatters.boolean(false, ["trueVal"])).toBe("false");
      expect(defaultFormatters.boolean(true, ["", "falseVal"])).toBe("true");
      // @ts-expect-error
      expect(defaultFormatters.boolean(true, null)).toBe("true");
      // @ts-expect-error
      expect(defaultFormatters.boolean(false, null)).toBe("false");
    });
  });

  describe('padStart', () => {
    it('should pad the start of a string', () => {
      expect(defaultFormatters.padStart('hello', ['10', '*'])).toBe('*****hello');
    });

    it('should work with default args', () => {
      expect(defaultFormatters.padStart('1')).toBe('1');
    });
  });

  describe('padEnd', () => {
    it('should pad the end of a string', () => {
      expect(defaultFormatters.padEnd('hello', ['10', '*'])).toBe('hello*****');
    });

    it('should work with default args', () => {
      expect(defaultFormatters.padEnd('1')).toBe('1');
    });
  });

  describe('list', () => {
    it('should format arrays using conjunction by default', () => {
      expect(defaultFormatters.list(['Alice', 'Bob', 'Charlie'], ['en-US'])).toBe('Alice, Bob, and Charlie');
      expect(defaultFormatters.list(['Alice', 'Bob', 'Charlie'], ['de-DE'])).toBe('Alice, Bob und Charlie');
    });

    it('should support disjunction and unit types', () => {
      expect(defaultFormatters.list(['Apple', 'Banana'], ['en-US', 'disjunction'])).toBe('Apple or Banana');
    });

    it('should handle single elements and non-array input', () => {
      expect(defaultFormatters.list('Alice', ['en-US'])).toBe('Alice');
    });
  });

  describe('display names (languageName, regionName, currencyName, displayName)', () => {
    it('should format language names', () => {
      expect(defaultFormatters.languageName('de', ['en-US'])).toBe('German');
      expect(defaultFormatters.languageName('de', ['de-DE'])).toBe('Deutsch');
      expect(defaultFormatters.languageName('invalid_code')).toBe('invalid_code');
    });

    it('should format region names', () => {
      expect(defaultFormatters.regionName('US', ['en-US'])).toBe('United States');
      expect(defaultFormatters.regionName('DE', ['en-US'])).toBe('Germany');
      expect(defaultFormatters.regionName('invalid')).toBe('invalid');
    });

    it('should format currency names', () => {
      expect(defaultFormatters.currencyName('USD', ['en-US'])).toBe('US Dollar');
      expect(defaultFormatters.currencyName('EUR', ['en-US'])).toBe('Euro');
      expect(defaultFormatters.currencyName('invalid')).toBe('invalid');
    });

    it('should support generalized displayName formatter', () => {
      expect(defaultFormatters.displayName('fr', ['language', 'en-US'])).toBe('French');
      expect(defaultFormatters.displayName('FR', ['region', 'en-US'])).toBe('France');
    });
  });

  describe("formatters default args, caching, and fallback branches", () => {
    it("should cover list default args, custom parameters, and cache hit", () => {
      expect(defaultFormatters.list(["A", "B"])).toBeDefined();
      expect(defaultFormatters.list(["A", "B"])).toBeDefined(); // cache hit
      expect(defaultFormatters.list(["A", "B"], ["en-US"])).toBeDefined();
      expect(defaultFormatters.list(["A", "B"], ["en-US", "unit"])).toBeDefined();
      expect(defaultFormatters.list(["A", "B"], ["en-US", "unit", "narrow"])).toBeDefined();
    });

    it("should cover languageName, regionName, currencyName, and displayName default args and cache hits", () => {
      // languageName cache miss and hit
      expect(defaultFormatters.languageName("it")).toBeDefined();
      expect(defaultFormatters.languageName("it")).toBeDefined();

      // regionName cache miss and hit
      expect(defaultFormatters.regionName("IT")).toBeDefined();
      expect(defaultFormatters.regionName("IT")).toBeDefined();

      // currencyName cache miss and hit
      expect(defaultFormatters.currencyName("EUR")).toBeDefined();
      expect(defaultFormatters.currencyName("EUR")).toBeDefined();

      // displayName default args and custom type cache miss/hit
      expect(defaultFormatters.displayName("it")).toBeDefined();
      expect(defaultFormatters.displayName("Latn", ["script", "en-US"])).toBe("Latin");
      expect(defaultFormatters.displayName("Latn", ["script", "en-US"])).toBe("Latin"); // cache hit
    });

    it("should catch errors in display names with invalid types and locales", () => {
      expect(defaultFormatters.displayName("de", ["invalid_type"])).toBe("de");
      expect(defaultFormatters.languageName("de", ["invalid_locale_#$@!"])).toBe("de");
      expect(defaultFormatters.regionName("US", ["invalid_locale_#$@!"])).toBe("US");
      expect(defaultFormatters.currencyName("USD", ["invalid_locale_#$@!"])).toBe("USD");
    });

    it("should cover || code fallback branch when dn.of returns undefined", () => {
      const ofSpy = jest.spyOn(Intl.DisplayNames.prototype, "of").mockReturnValue(undefined);
      expect(defaultFormatters.languageName("de", ["en-GB"])).toBe("de");
      expect(defaultFormatters.regionName("GB", ["en-GB"])).toBe("GB");
      expect(defaultFormatters.currencyName("GBP", ["en-GB"])).toBe("GBP");
      expect(defaultFormatters.displayName("de", ["language", "en-GB"])).toBe("de");
      ofSpy.mockRestore();
    });
  });
});