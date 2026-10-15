
import { LangWithPlurals } from '../src/types';

describe('LangWithPlurals Type', () => {
  it('should correctly type-check valid language structures', () => {
    expect(true).toBe(true);
  });
  interface RawLang {
    simple: string;
    nested: {
      key1: string;
      key2: string;
    };
    plurals: {
      apple: {
        one: string;
        other: string;
      };
      banana: {
        one: string;
        other: string;
        zero?: string;
      }
    };
    suffix_plurals: {
      car_one: string;
      car_other: string;
      boat_one: string;
      boat_other: string;
      boat_many?: string;
    };
    mixed: {
      plain: string;
      nested_plural: {
        item_one: string;
        item_other: string;
      }
    },
    primitive_number: number;
    primitive_boolean: boolean;
    primitive_null: null;
    items: {
      name: string;
      value_one: string;
      value_other: string;
    }[];
  }

  // Apply LangWithPlurals to the raw type (default language, requires one & other)
  const validLang: LangWithPlurals<RawLang> = {
    simple: 'A simple string',
    nested: {
      key1: 'Nested key 1',
      key2: 'Nested key 2',
    },
    plurals: {
      apple: {
        one: 'one apple',
        other: 'many apples',
      },
      banana: {
        one: 'one banana',
        other: 'many bananas',
        zero: 'no bananas',
      }
    },
    suffix_plurals: {
      car_one: '1 car',
      car_other: 'some cars',
      boat_one: '1 boat',
      boat_other: 'some boats',
      boat_many: 'many boats',
    },
    mixed: {
      plain: 'A plain string in a mixed object',
      nested_plural: {
        item_one: '1 item',
        item_other: 'some items',
      }
    },
    primitive_number: 123,
    primitive_boolean: true,
    primitive_null: null,
    items: [
      { name: 'First Item', value_one: '1 value', value_other: 'many values' },
      { name: 'Second Item', value_one: '1 value', value_other: 'many values' },
    ]
  };

  // Language-Aware Plural Verification: Japanese ("ja") requires only `other`
  const validJaLang: LangWithPlurals<RawLang, "ja"> = {
    simple: 'A simple string',
    nested: {
      key1: 'Nested key 1',
      key2: 'Nested key 2',
    },
    plurals: {
      apple: {
        other: 'りんご', // No 'one' required!
      },
      banana: {
        other: 'バナナ',
      }
    },
    suffix_plurals: {
      car_other: '車', // No 'car_one' required!
      boat_other: 'ボート',
    },
    mixed: {
      plain: 'A plain string in a mixed object',
      nested_plural: {
        item_other: 'アイテム',
      }
    },
    primitive_number: 123,
    primitive_boolean: true,
    primitive_null: null,
    items: [
      { name: 'First Item', value_other: 'many values' }
    ]
  };

  expect(validLang.plurals.apple.one).toBe('one apple');
  expect(validJaLang.plurals.apple.other).toBe('りんご');


  /*
  // --- INVALID TEST CASES ---
  // Uncommenting these lines should cause a TypeScript compilation error.

  // Example of a missing 'other' in an object plural
  const invalidPluralObject: LangWithPlurals<RawLang> = {
    ...validLang,
    plurals: {
      ...validLang.plurals,
      apple: {
        one: 'one apple', // ERROR: 'other' is missing
      },
    },
  };

  // Example of a missing '_other' in a suffix plural
  const invalidSuffixPlural: LangWithPlurals<RawLang> = {
    ...validLang,
    suffix_plurals: {
      car_one: '1 car', // ERROR: 'car_other' is missing
      boat_one: '1 boat',
      boat_other: 'some boats',
      boat_many: 'many boats'
    },
  };

  // Example of providing a string where a namespace is expected
  const invalidNamespace: LangWithPlurals<RawLang> = {
    ...validLang,
    nested: 'this should be an object', // ERROR
  };
  */
});
