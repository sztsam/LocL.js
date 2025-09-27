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
  });

  it('should format a number', () => {
    expect(defaultFormatters.number(123456.789, ['en-US', 'decimal'])).toBe('123,456.789');
  });

  it('should format a currency', () => {
    expect(defaultFormatters.currency(123456.789, ['USD', 'en-US'])).toBe('$123,456.79');
  });

  it('should format a date', () => {
    const date = new Date('2025-01-01T00:00:00.000Z');
    expect(defaultFormatters.date(date, ['en-US', 'short'])).toBe('1/1/25');
  });

  describe('relativeDate', () => {
    beforeAll(() => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2025-01-01T00:00:00.000Z'));
    });

    afterAll(() => {
      jest.useRealTimers();
    });

    it('should format a relative date in the past', () => {
      const date = new Date(Date.now() - 3600 * 1000);
      expect(defaultFormatters.relativeDate(date, ['en-US'])).toBe('1 hour ago');
    });

    it('should format a relative date in the future', () => {
      const date = new Date(Date.now() + 3600 * 1000);
      expect(defaultFormatters.relativeDate(date, ['en-US'])).toBe('in 1 hour');
    });
  });

  it('should convert a value to a JSON string', () => {
    expect(defaultFormatters.json({ a: 1 })).toBe(`{
  "a": 1
}`);
  });

  it('should convert a boolean to a "Yes" or "No" string', () => {
    expect(defaultFormatters.yesNo(true)).toBe('Yes');
    expect(defaultFormatters.yesNo(false)).toBe('No');
  });

  it('should convert a boolean to a "true" or "false" string', () => {
    expect(defaultFormatters.boolean(true)).toBe('true');
    expect(defaultFormatters.boolean(false)).toBe('false');
  });

  it('should pad the start of a string', () => {
    expect(defaultFormatters.padStart('hello', ['10', '*'])).toBe('*****hello');
  });

  it('should pad the end of a string', () => {
    expect(defaultFormatters.padEnd('hello', ['10', '*'])).toBe('hello*****');
  });
});