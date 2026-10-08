import { initLocL } from "../src/index.js";
import { ExtractInterpolationParams, ExtractPluralObjectParams, IsEmptyParams } from "../src/types.js";

describe("Type Safety & Parameter Extraction", () => {
  it("should extract template parameters accurately at type level", () => {
    // 1. Single curly
    type P1 = ExtractInterpolationParams<"Hello, {name}! You have {count} items.">;
    const p1: P1 = { name: "Alice", count: 42 };
    expect(p1.name).toBe("Alice");

    // 2. Double curly (i18next style)
    type P2 = ExtractInterpolationParams<"Price is {{amount | currency:USD}} for {{item}}.">;
    const p2: P2 = { amount: 99, item: "Book" };
    expect(p2.amount).toBe(99);

    // 3. ICU select syntax
    type P3 = ExtractInterpolationParams<"{gender, select, male {He} female {She} other {They}} is here.">;
    const p3: P3 = { gender: "female" };
    expect(p3.gender).toBe("female");

    // 4. Static string has no parameters
    type P4 = ExtractInterpolationParams<"Static string with no tokens">;
    type IsP4Empty = IsEmptyParams<P4>;
    const isEmpty: IsP4Empty = true;
    expect(isEmpty).toBe(true);
  });

  it("should extract plural object parameters including count and inner variables", () => {
    type PluralObj = {
      one: "You have 1 message from {sender}.",
      other: "You have {count} messages from {sender}."
    };

    type PluralParams = ExtractPluralObjectParams<PluralObj>;
    const params: PluralParams = {
      count: 5,
      sender: "Alice"
    };

    expect(params.count).toBe(5);
    expect(params.sender).toBe("Alice");
  });

  it("should correctly handle strict resources with as const", () => {
    const resources = {
      en: {
        greeting: "Hello, {name}!",
        staticText: "Just a plain string",
        items: {
          one: "One item",
          other: "{count} items"
        },
        car_one: "1 car",
        car_other: "{count} cars",
        boat_one: "1 {color} boat",
        boat_other: "{count} {color} boats"
      }
    } as const;

    const translator = initLocL({
      resources,
      fallbackLanguage: "en"
    });

    // 1. Template with placeholder requires param
    const res1 = translator.t("greeting", { name: "World" });
    expect(res1).toBe("Hello, World!");

    // 2. Static template allows omitting params
    const res2 = translator.t("staticText");
    expect(res2).toBe("Just a plain string");

    // 3. Object plural through t()
    const res3 = translator.t("items", { count: 3 });
    expect(res3).toBe("3 items");

    // 4. Plural method with count for suffix plural
    const res4 = translator.plural("car", { count: 1 });
    expect(res4).toBe("1 car");

    // 5. Plural via t() directly for suffix plural
    const res5 = translator.t("car", { count: 2 });
    expect(res5).toBe("2 cars");

    // 6. Suffix plural with additional template parameters
    const res6 = translator.plural("boat", { count: 3, color: "blue" });
    expect(res6).toBe("3 blue boats");
  });
});
