# Pluralization & ICU Syntax

LocL.js provides complete support for all international pluralization paradigms: standard Unicode CLDR grammatical categories, exact quantity exceptions (`=0`, `=1`, `=N`), native ordinal numbers (`1st`, `2nd`), and standard inline **ICU MessageFormat** plural expressions with offsets and number formatting.

---

## 1. ICU Inline Plural Syntax

In LocL v2.5.0, you can express plurals directly within your translation strings using standard ICU syntax. LocL tokenizes and pre-compiles inline plurals into an optimized chunk execution plan for peak runtime throughput.

```typescript
const en = {
  cart: "{count, plural, =0 {Your cart is empty} =1 {You have 1 item} other {You have # items}}",
  users: "{count, plural, offset:1 =0 {No members} =1 {You} one {You and # other member} other {You and # other members}}",
  files: "{count, plural, one {{author} uploaded # document} other {{author} uploaded # documents}}"
};
```

### Exact Values & `#` Number Formatting

- **Exact Quantities (`=0`, `=1`, `=2`)**: Explicit numeric rules take precedence over language-specific grammatical rules.
- **The `#` Symbol**: Automatically replaced with `count` (or `count - offset`), formatted according to the active locale using native `Intl.NumberFormat`.
- **Escaping**: If you need a literal `#` in the string, escape it as `\#`.

```typescript
// English (en)
translator.t("cart", { count: 0 });    // => "Your cart is empty"
translator.t("cart", { count: 1 });    // => "You have 1 item"
translator.t("cart", { count: 2500 }); // => "You have 2,500 items" (formatted number!)

// German (de)
translator.changeLanguage("de");
// 2500 formatted with German grouping separator: "2.500"
```

### Offset Syntax (`offset:N`)

The `offset:N` modifier subtracts `N` from `count` prior to category evaluation and `#` substitution. This is the standard pattern for "You and N others" social feeds:

```typescript
translator.t("users", { count: 0 }); // => "No members"
translator.t("users", { count: 1 }); // => "You"
translator.t("users", { count: 2 }); // => "You and 1 other member"  (2 - 1 = 1 -> 'one', # is 1)
translator.t("users", { count: 8 }); // => "You and 7 other members" (8 - 1 = 7 -> 'other', # is 7)
```

### Nested Variables & Type Safety

Inline plural branches can include variable placeholders (`{author}`), formatters (`{date | date:short}`), and select statements. TypeScript automatically infers required parameters at compile time:

```typescript
// TypeScript enforces BOTH { author: string } and { count: number }:
translator.t("files", { author: "Sarah", count: 4 });
// => "Sarah uploaded 4 documents"
```

---

## 2. Object Pluralization with Exact Quantities

You can also define plurals as structured objects. LocL evaluates exact quantity matches first, followed by Unicode CLDR rules:

```typescript
const resources = defineResources({
  en: {
    inbox: {
      "=0": "Inbox zero! No unread messages.",
      "=1": "You have exactly one urgent message.",
      one: "You have 1 message.",
      other: "You have {count} messages."
    }
  }
});

translator.t("inbox", { count: 0 }); // => "Inbox zero! No unread messages."
translator.t("inbox", { count: 1 }); // => "You have exactly one urgent message."
translator.t("inbox", { count: 42 }); // => "You have 42 messages."
```

Or invoke via `translator.plural()`:

```typescript
translator.plural("inbox", { count: 5 });
```

---

## 3. Suffix Pluralization

Define forms as flat keys suffixed with categories or exact numbers:

```typescript
const resources = defineResources({
  en: {
    "item_=0": "No items remaining.",
    item_one: "1 item remaining.",
    item_other: "{count} items remaining."
  }
});

translator.t("item", { count: 0 }); // => "No items remaining."
translator.t("item", { count: 1 }); // => "1 item remaining."
translator.t("item", { count: 5 }); // => "5 items remaining."
```

---

## 4. Native Ordinal Plurals (`1st`, `2nd`, `3rd`, `4th`)

LocL provides native ordinal number formatting powered by `Intl.PluralRules({ type: "ordinal" })`:

```typescript
const resources = defineResources({
  en: {
    rank: {
      one: "{count}st place",
      two: "{count}nd place",
      few: "{count}rd place",
      other: "{count}th place"
    }
  }
});

// Using translator.ordinal()
translator.ordinal("rank", { count: 1 });  // => "1st place"
translator.ordinal("rank", { count: 2 });  // => "2nd place"
translator.ordinal("rank", { count: 3 });  // => "3rd place"
translator.ordinal("rank", { count: 21 }); // => "21st place"
translator.ordinal("rank", { count: 104 }); // => "104th place"

// Or using translator.t() with ordinal flag:
translator.t("rank", { count: 2, ordinal: true }); // => "2nd place"
```

---

## 5. Unicode CLDR Rules by Language (`LangWithPlurals<T, L>`)

Plural rules differ across languages. In English and German, there are only `one` and `other`. In Polish or Russian, there are `one`, `few`, `many`, and `other`. In Japanese or Chinese, only `other` exists.

LocL's `LangWithPlurals<T, L>` type helper enforces valid CLDR categories for target language `L`:

| Language Family | Languages | Required Plural Categories |
| :--- | :--- | :--- |
| **Other-only** | `ja`, `zh`, `ko`, `vi`, `th`, `id`, `tr`, `hu` | `other` |
| **Two-form** | `en`, `de`, `es`, `it`, `pt`, `nl`, `el` | `one`, `other` |
| **Slavic (Four-form)** | `ru`, `uk`, `pl`, `cs`, `sk` | `one`, `few`, `many`, `other` |
| **Arabic (Six-form)** | `ar` | `zero`, `one`, `two`, `few`, `many`, `other` |

If you define a Russian plural object without `few` or `many`, TypeScript will catch it at compile time!
