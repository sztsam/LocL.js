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
  });

  describe('date', () => {
    const date = new Date('2025-01-01T00:00:00.000Z');

    it('should format a date with locale and style', () => {
      expect(defaultFormatters.date(date, ['en-US', 'short'])).toBe('1/1/25');
    });

    it('should format a date with default args', () => {
      expect(defaultFormatters.date(date)).toBeDefined();
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
});