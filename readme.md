# LocL.js 🌐

**LocL** is a powerful, lightweight, and fully-featured TypeScript internationalization (i18n) library. It is designed to be flexible, easy to use, and highly extensible, providing a seamless experience for adding multiple languages to your projects. With built-in support for plurals, formatting, and modularization, `LocL` is the perfect tool for developers looking for a modern and robust i18n solution.

It is inspired by libraries like `i18next` and `react-i18next`, but with a focus on type-safety, simplicity, performance and backend usability like discord bot and other apps.

## Features ✨

- **💪 Type-Safe**: Leverages TypeScript to provide compile-time safety for your translation keys, ensuring that you never miss a translation or use an incorrect key.
- **- 📦 Lightweight**: With zero dependencies, `LocL` is a small library that won't bloat your project.
- **- 🚀 Powerful**: Supports plurals, interpolation, formatting, and modularization out of the box.
- **- 🔧 Extensible**: Easily extend the library with custom formatters to fit your needs.
- **- 🌍 Modular**: Organize your translations into modules to keep your codebase clean and maintainable.
- **- ⚡ Fast**: Uses caching to provide fast and efficient translations.
- **- 💻 Dev-Friendly**: Provides helpful warnings in development mode to help you catch missing translations.

## Installation

```bash
npm install locl-js
```

## Quick Start

```typescript
import { initLocL, LangWithPlurals } from "locl-js";

const resources = {
    en: {
        hello: "Hello, {name}!",
        messages: {
            one: "You have one message.",
            other: "You have {count} messages.",
        },
    },
    fr: {
        hello: "Bonjour, {name}!",
        messages: {
            one: "Vous avez un message.",
            other: "Vous avez {count} messages.",
        },
    },
};

const translator = initLocL({
    resources,
    fallbackLanguage: "en",
});

console.log(translator.t("hello", { name: "John" })); // "Hello, John!"
console.log(translator.plural("messages", { count: 1 })); // "You have one message."
console.log(translator.plural("messages", { count: 5 })); // "You have 5 messages."

translator.changeLanguage("fr");

console.log(translator.t("hello", { name: "John" })); // "Bonjour, John!"
console.log(translator.plural("messages", { count: 1 })); // "Vous avez un message."
console.log(translator.plural("messages", { count: 5 })); // "Vous avez 5 messages."
```

## API

### `initLocL(config)`

Initializes a new LocL instance.

- `config`: An object with the following properties:
  - `resources`: An object where keys are language codes and values are translation objects.
  - `fallbackLanguage`: The language to use when a translation is not available in the current language.
  - `language` (optional): The initial language to use.
  - `scope` (optional): The scope to load translations from.
  - `formatters` (optional): An object with custom formatters.
  - `useDefaultFormatters` (optional): Whether to use the default formatters. Defaults to `true`.
  - `devMode` (optional): Whether to enable development mode. Defaults to `false`.
  - `useCache` (optional): Whether to use caching. Defaults to `true`.

### `translator.t(key, values, format)`

Translates a key.

- `key`: The key to translate.
- `values` (optional): An object with values to interpolate into the translation.
- `format` (optional): An object with formatting options.

### `translator.plural(key, values, format)`

Translates a key with pluralization.

- `key`: The key to translate.
- `values`: An object with a `count` property and other values to interpolate.
- `format` (optional): An object with formatting options.

### `translator.changeLanguage(lang)`

Changes the current language.

- `lang`: The language to switch to.

### `translator.withConfig(config)`

Creates a new proxy translator instance with a different configuration. This is useful for creating a translator with a different scope or language without creating a new instance.

- `config`: An object with the following properties:
    - `scope` (optional): The scope to load translations from.
    - `language` (optional): The language to use.

### `translator.clone(language, scope)`

Creates a new LocL instance with a different language or scope.

- `language` (optional): The language to use.
- `scope` (optional): The scope to load translations from.

### `translator.get(key)`

Gets a translation object or a specific translation value.

- `key` (optional): The key of the translation to get. If not provided, it returns the entire translation object for the current language and scope.

### `translator.format(value, formatter, args)`

Formats a value using a specific formatter.

- `value`: The value to format.
- `formatter`: The name of the formatter to use.
- `args` (optional): An array of arguments to pass to the formatter.

## Advanced Usage

### Interpolation

You can interpolate values into your translations using curly braces:

```typescript
const en = {
    hello: "Hello, {name}!",
};
```

Then, pass the values to the `t` function:

```typescript
translator.t("hello", { name: "John" }); // "Hello, John!"
```

### Pluralization

`LocL` supports two ways of handling plurals:

#### 1. Object Pluralization

You can define plurals as an object with different forms:

```typescript
const en = {
    messages: {
        one: "You have one message.",
        other: "You have {count} messages.",
    },
};
```

Then, use the `plural` function:

```typescript
translator.plural("messages", { count: 1 }); // "You have one message."
translator.plural("messages", { count: 5 }); // "You have 5 messages."
```

#### 2. Suffix Pluralization

You can also define plurals using suffixes:

```typescript
const en = {
    message_one: "You have one message.",
    message_other: "You have {count} messages.",
};
```

Then, use the `plural` function with the base key:

```typescript
translator.plural("message", { count: 1 }); // "You have one message."
translator.plural("message", { count: 5 }); // "You have 5 messages."
```

### Formatting

`LocL` comes with a set of built-in formatters that you can use to format your translations.

#### Default Formatters

- `upper`: Converts the value to uppercase.
- `lower`: Converts the value to lowercase.
- `capitalize`: Capitalizes the first letter of the value.
- `trim`: Trims the value.
- `truncate`: Truncates the value to a specific length.
- `number`: Formats a number using `Intl.NumberFormat`.
- `currency`: Formats a currency value using `Intl.NumberFormat`.
- `date`: Formats a date using `Intl.DateTimeFormat`.
- `relativeDate`: Formats a date as a relative time (e.g., "2 hours ago").
- `json`: Converts a value to a JSON string.
- `yesNo`: Returns "Yes" or "No" based on the value.
- `boolean`: Returns "true" or "false" based on the value.
- `padStart`: Pads the start of the value with a string.
- `padEnd`: Pads the end of the value with a string.

You can use formatters in your translations like this:

```typescript
const en = {
    greeting: "Hello, {name | upper}!",
};

translator.t("greeting", { name: "John" }); // "Hello, JOHN!"
```

You can also pass arguments to formatters:

```typescript
const en = {
    price: "The price is {price | currency:USD}",
};

translator.t("price", { price: 123 }); // "The price is $123.00"
```

#### Custom Formatters

You can also define your own custom formatters:

```typescript
const translator = initLocL({
    resources,
    fallbackLanguage: "en",
    formatters: {
        reverse: (value) => String(value).split("").reverse().join(""),
    },
});

const en = {
    greeting: "Hello, {name | reverse}!",
};

translator.t("greeting", { name: "John" }); // "Hello, nhoJ!"
```

### Modules

You can organize your translations into scopes to keep your codebase clean and maintainable.

```typescript
const resources = {
    en: {
        common: {
            hello: "Hello",
        },
        home: {
            title: "Welcome to the home page",
        },
    },
};
```

Then, you can create a translator for a specific scope:

```typescript
const homeTranslator = translator.withConfig({ scope: "home" });

console.log(homeTranslator.t("title")); // "Welcome to the home page"
```

You can also load multiple scopes at once:

```typescript
const multiScopeTranslator = translator.withConfig({ scope: ["common", "home"] });

console.log(multiScopeTranslator.t("common.hello")); // "Hello"
console.log(multiScopeTranslator.t("home.title")); // "Welcome to the home page"
```

### Type-Safe Translations

`LocL` provides type-safety for your translation keys. To enable this, you can use the `LangWithPlurals` type to define your translation resources:

```typescript
import { LangWithPlurals } from "locl-js";

const en: LangWithPlurals<typeof en> = {
    hello: "Hello, {name}!",
    messages: {
        one: "You have one message.",
        other: "You have {count} messages.",
    },
};
const fr: LangWithPlurals<typeof en> = {
    hello: "Bonjour, {name}!",
    messages: {
        one: "Vous avez un message.",
        few: "Vous avez quelques messages.", 
        // Typescript error for missing "other" plural key
    },
};
```

Now, you will get autocompletion and type-checking for your translation keys:

```typescript
translator.t("hell"); // TypeScript error: Argument of type '"hell"' is not assignable to parameter of type '"hello" | "messages"'.
```

## Contributing

Contributions are welcome! Please open an issue or submit a pull request if you have any ideas or suggestions.

## License

This project is licensed under the MIT License.
