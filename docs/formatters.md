# Built-in & Custom Formatters

LocL.js includes a high-performance inline formatter pipeline powered by native browser/Node `Intl` APIs. Format dates, numbers, currencies, strings, arrays, and language names with zero external formatting dependencies (like `date-fns` or `numeral`).

---

## Pipe Syntax & Multi-Pipe Chaining

Format variables directly within your translation strings using pipe (`|`) syntax:

```typescript
const en = {
  welcome: "User: {name | trim | upper | truncate:10, ...}",
  summary: "Order placed on {date | date:short}. Total: {amount | currency:USD}.",
  attendees: "Present: {users | list}"
};
```

Formatters evaluate sequentially from left to right:
1. `{name | trim}` -> strips whitespace
2. `... | upper` -> converts to uppercase
3. `... | truncate:10, ...` -> truncates at 10 chars

---

## List Formatting (`Intl.ListFormat`)

Format arrays of items into localized natural-language conjunctions or disjunctions:

```typescript
const en = {
  team: "Team members: {names | list}",
  options: "Choose: {items | list:en,disjunction}",
  short: "{items | list:en,conjunction,narrow}"
};

translator.t("team", { names: ["Alice", "Bob", "Charlie"] });
// => "Team members: Alice, Bob, and Charlie"

translator.t("options", { items: ["Apple", "Orange", "Banana"] });
// => "Choose: Apple, Orange, or Banana"
```

In other languages (e.g. German):
```typescript
translator.changeLanguage("de");
translator.t("team", { names: ["Alice", "Bob", "Charlie"] });
// => "Team members: Alice, Bob und Charlie"
```

---

## Localized Display Names (`Intl.DisplayNames`)

Translate language codes, country codes, and currency codes into human-readable localized names:

```typescript
const en = {
  lang: "Selected Language: {code | languageName:en}",
  country: "Country: {region | regionName:en}",
  curr: "Currency: {curr | currencyName:en}",
  custom: "Script: {tag | displayName:script,en}"
};

// Language names
translator.t("lang", { code: "de" }); // => "Selected Language: German"
translator.t("lang", { code: "ja" }); // => "Selected Language: Japanese"

// Country/Region names
translator.t("country", { region: "US" }); // => "Country: United States"
translator.t("country", { region: "JP" }); // => "Country: Japan"

// Currency names
translator.t("curr", { curr: "EUR" }); // => "Currency: Euro"
translator.t("curr", { curr: "USD" }); // => "Currency: US Dollar"
```

---

## Complete Built-in Formatters Reference

| Formatter | Description | Example Syntax | Output Example |
| :--- | :--- | :--- | :--- |
| `list` | Native `Intl.ListFormat` for arrays | `{users \| list:en,conjunction}` | `"Alice, Bob, and Charlie"` |
| `languageName` | Localized language display name | `{code \| languageName:en}` | `"German"` |
| `regionName` | Localized country/region name | `{code \| regionName:en}` | `"United States"` |
| `currencyName` | Localized currency display name | `{code \| currencyName:en}` | `"US Dollar"` |
| `displayName` | Generic `Intl.DisplayNames` resolver | `{code \| displayName:language,fr}` | `"allemand"` |
| `number` | `Intl.NumberFormat` decimal | `{val \| number:en-US}` | `"1,234.56"` |
| `currency` | `Intl.NumberFormat` currency | `{val \| currency:EUR,de-DE}` | `"1.234,56 €"` |
| `date` | `Intl.DateTimeFormat` date/time | `{val \| date:en-US,short}` | `"10/16/26"` |
| `relativeDate` | Formats relative time | `{val \| relativeDate:en-US}` | `"2 days ago"` |
| `upper` | Uppercase string | `{val \| upper}` | `"HELLO"` |
| `lower` | Lowercase string | `{val \| lower}` | `"hello"` |
| `capitalize` | Capitalize first letter | `{val \| capitalize}` | `"Hello"` |
| `trim` | Strip leading & trailing whitespace | `{val \| trim}` | `"hello"` |
| `truncate` | Truncate string with suffix | `{val \| truncate:8,...}` | `"Hello..."` |
| `padStart` | Pad string from start | `{val \| padStart:5,0}` | `"00042"` |
| `padEnd` | Pad string from end | `{val \| padEnd:5,_}` | `"42___"` |
| `json` | Converts object to JSON string | `{val \| json}` | `{"a":1}` |
| `boolean` | Custom boolean labels | `{val \| boolean:Active,Inactive}`| `"Active"` |
| `yesNo` | Returns "Yes" / "No" or custom | `{val \| yesNo}` | `"Yes"` |

---

## Defining Custom Formatters

Define your own formatters during `initLocL()`:

```typescript
const translator = initLocL({
  resources,
  fallbackLanguage: "en",
  formatters: {
    // Reverse a string
    reverse: (val) => String(val).split("").reverse().join(""),

    // Highlight text
    highlight: (val, args) => {
      const tag = args[0] || "strong";
      return `<${tag}>${val}</${tag}>`;
    }
  }
});

// Usage in translations:
// "{text | highlight:mark}" => "<mark>Important</mark>"
```

### Standalone Formatter Invocation

You can also invoke formatters directly via `translator.format()`:

```typescript
const formatted = translator.format("1000", "currency", ["USD", "en-US"]);
// => "$1,000.00"
```
