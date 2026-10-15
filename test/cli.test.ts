import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { extractKeys, checkTranslations, compileTranslations, getTranslationStatus, runCli } from "../src/cli/index.js";
import { setNested } from "../src/cli/extract.js";

describe("LocL CLI & Developer Pipeline (locl-cli)", () => {
  let tempDir: string;
  let srcDir: string;
  let localesDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "locl-cli-test-"));
    srcDir = path.join(tempDir, "src");
    localesDir = path.join(tempDir, "locales");
    fs.mkdirSync(srcDir, { recursive: true });
    fs.mkdirSync(localesDir, { recursive: true });
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  describe("locl extract", () => {
    it("should scan .tsx and .ts files and extract translation keys into base JSON", () => {
      // Create dummy React/TS component files
      const componentContent = `
        import React from "react";
        import { useTranslation, Trans } from "locl-js/react";

        export function MyComponent() {
          const { t, plural, ordinal, rich, get, getObj } = useTranslation();
          return (
            <div>
              <h1>{t("dashboard.title", "My Dashboard")}</h1>
              <p>{t("user.welcome")}</p>
              <span>{plural("messages", { count: 2 })}</span>
              <strong>{ordinal("place", { count: 1 })}</strong>
              <span>{rich("rich.key", {})}</span>
              <span>{get("getter.key")}</span>
              <span>{getObj("getter.obj")}</span>
              <Trans i18nKey="legal.terms" />
              <Trans i18nKey={'dynamic.key'} fallback={'Dynamic Fallback'} />
              <Trans i18nKey="static.key" fallback="Static Fallback" />
            </div>
          );
        }
      `;
      fs.writeFileSync(path.join(srcDir, "Component.tsx"), componentContent, "utf8");

      // Run extraction
      const result = extractKeys({
        src: srcDir,
        localesDir,
        baseLang: "en"
      });

      expect(result.filesScanned).toBe(1);
      expect(result.keysFound).toContain("dashboard.title");
      expect(result.keysFound).toContain("user.welcome");
      expect(result.keysFound).toContain("messages");
      expect(result.keysFound).toContain("place");
      expect(result.keysFound).toContain("rich.key");
      expect(result.keysFound).toContain("getter.key");
      expect(result.keysFound).toContain("getter.obj");
      expect(result.keysFound).toContain("legal.terms");
      expect(result.keysFound).toContain("dynamic.key");
      expect(result.keysFound).toContain("static.key");

      // Inspect generated en.json
      const enJson = JSON.parse(fs.readFileSync(path.join(localesDir, "en.json"), "utf8"));
      expect(enJson.dashboard.title).toBe("My Dashboard");
      expect(enJson.user.welcome).toBe("user.welcome");
      expect(enJson.legal.terms).toBe("legal.terms");
      expect(enJson.dynamic.key).toBe("Dynamic Fallback");
      expect(enJson.static.key).toBe("Static Fallback");
    });

    it("should preserve existing keys without overwriting translations and guard against object collisions", () => {
      fs.writeFileSync(
        path.join(localesDir, "en.json"),
        JSON.stringify({ dashboard: { title: "Custom Title" } }, null, 2),
        "utf8"
      );
      fs.writeFileSync(
        path.join(srcDir, "App.ts"),
        `t("dashboard.title", "Default Title"); t("auth.login"); t("dashboard", "Should Not Overwrite Object");`,
        "utf8"
      );

      const result = extractKeys({ src: srcDir, localesDir, baseLang: "en" });
      const enJson = JSON.parse(fs.readFileSync(path.join(localesDir, "en.json"), "utf8"));

      expect(result.newKeysCount).toBe(1);
      expect(enJson.dashboard.title).toBe("Custom Title");
      expect(enJson.auth.login).toBe("auth.login");
    });

    it("should prune obsolete keys when clean option is enabled", () => {
      fs.writeFileSync(
        path.join(localesDir, "en.json"),
        JSON.stringify({ obsolete: "Old Key", active: "Keep Me" }, null, 2),
        "utf8"
      );
      fs.writeFileSync(
        path.join(srcDir, "Active.ts"),
        't("active", "Keep Me");',
        "utf8"
      );

      const result = extractKeys({ src: srcDir, localesDir, baseLang: "en", clean: true });
      const enJson = JSON.parse(fs.readFileSync(path.join(localesDir, "en.json"), "utf8"));
      expect(result.keysFound).toContain("active");
      expect(enJson.obsolete).toBeUndefined();
      expect(enJson.active).toBe("Keep Me");
    });

    it("should recursively scan subdirectories and ignore ignored directories", () => {
      const subDir = path.join(srcDir, "sub");
      fs.mkdirSync(subDir, { recursive: true });
      fs.writeFileSync(path.join(subDir, "Sub.tsx"), 't("sub.title", "Sub Title");', "utf8");

      for (const ignored of ["node_modules", ".git", "dist", "build", ".next"]) {
        const ignoredDir = path.join(srcDir, ignored);
        fs.mkdirSync(ignoredDir, { recursive: true });
        fs.writeFileSync(path.join(ignoredDir, "Ignored.tsx"), 't("ignored.key", "Ignored");', "utf8");
      }

      const res = extractKeys({ src: srcDir, localesDir, baseLang: "en" });
      expect(res.keysFound).toContain("sub.title");
      expect(res.keysFound).not.toContain("ignored.key");
    });

    it("should handle array src, empty src, omitted src, flat mode, dryRun, and custom defaultValue", () => {
      fs.writeFileSync(path.join(srcDir, "App.tsx"), 't("flat.title", "Flat Title"); t("flat.desc");', "utf8");

      // src as array
      const resArr = extractKeys({ src: [srcDir], localesDir, baseLang: "en" });
      expect(resArr.filesScanned).toBeGreaterThan(0);

      // options.src omitted (runs DEFAULT_SRC_DIRS.filter((d) => fs.existsSync(d)))
      const resDefaultSrc = extractKeys({ localesDir, baseLang: "en" });
      expect(resDefaultSrc).toBeDefined();

      // src as empty array (falls back to ".")
      const resEmptySrc = extractKeys({ src: [], localesDir, baseLang: "en" });
      expect(resEmptySrc).toBeDefined();

      // non-existent dir returns empty results
      const resMissing = extractKeys({ src: path.join(tempDir, "nonexistent-src"), localesDir });
      expect(resMissing.filesScanned).toBe(0);

      // flat: true, defaultValue function, and sort: false
      const flatOut = path.join(localesDir, "flat.json");
      const resFlat = extractKeys({
        src: srcDir,
        localesDir,
        outputFile: flatOut,
        flat: true,
        defaultValue: (k) => `CUSTOM_${k}`,
        sort: false
      });
      expect(resFlat.newKeysCount).toBeGreaterThan(0);
      const flatJson = JSON.parse(fs.readFileSync(flatOut, "utf8"));
      expect(flatJson["flat.title"]).toBe("Flat Title");
      expect(flatJson["flat.desc"]).toBe("CUSTOM_flat.desc");

      // Running again with flat: true covers branch where currentJson[item.key] !== undefined
      const resFlat2 = extractKeys({
        src: srcDir,
        localesDir,
        outputFile: flatOut,
        flat: true
      });
      expect(resFlat2.newKeysCount).toBe(0);

      // dryRun: true does not write file
      const dryOut = path.join(localesDir, "dryrun.json");
      extractKeys({ src: srcDir, localesDir, outputFile: dryOut, dryRun: true });
      expect(fs.existsSync(dryOut)).toBe(false);

      // static string defaultValue
      extractKeys({ src: srcDir, localesDir, defaultValue: "STATIC_VAL" });

      // Omit localesDir to exercise default "locales"
      const resNoLocalesDir = extractKeys({ src: srcDir, dryRun: true });
      expect(resNoLocalesDir.outputFile).toContain("locales");

      // Default arguments options = {}
      const mkdirSpy = jest.spyOn(fs, "mkdirSync").mockImplementation();
      const writeSpy = jest.spyOn(fs, "writeFileSync").mockImplementation();
      const resNoArgs = extractKeys();
      expect(resNoArgs).toBeDefined();
      mkdirSpy.mockRestore();
      writeSpy.mockRestore();

      // Prototype pollution keys in source files
      fs.writeFileSync(
        path.join(srcDir, "Proto.ts"),
        't("__proto__.evil"); t("constructor.evil"); t("prototype.evil"); t("safe.__proto__"); t("safe.constructor"); t("safe.prototype");',
        "utf8"
      );
      extractKeys({ src: srcDir, localesDir, baseLang: "en" });

      // Non-file, non-directory entry in readdirSync
      const readdirSpy = jest.spyOn(fs, "readdirSync").mockReturnValueOnce([
        { name: "sock", isDirectory: () => false, isFile: () => false } as any
      ]);
      extractKeys({ src: srcDir, localesDir, dryRun: true });
      readdirSpy.mockRestore();

      const target = { user: { profile: "info" } };
      setNested(target, "user", "primitive value");
      expect(target.user).toEqual({ profile: "info" });
    });
  });

  describe("locl check", () => {
    it("should detect missing keys across secondary language files", () => {
      fs.writeFileSync(
        path.join(localesDir, "en.json"),
        JSON.stringify({ title: "Hello", save: "Save", cancel: "Cancel" }, null, 2),
        "utf8"
      );
      fs.writeFileSync(
        path.join(localesDir, "de.json"),
        JSON.stringify({ title: "Hallo" }, null, 2), // missing 'save' and 'cancel'
        "utf8"
      );

      const check = checkTranslations({ localesDir, baseLang: "en" });
      expect(check.success).toBe(false);
      expect(check.locales.de.missing).toEqual(["save", "cancel"]);
    });

    it("should automatically backfill missing keys when --fix is enabled d on nested and plural targets", () => {
      fs.writeFileSync(
        path.join(localesDir, "en.json"),
        JSON.stringify({
          auth: { login: "Log In", logout: "Log Out" },
          messages: { one: "1 item", other: "{count} items", "=0": "no items", ordinal: "ord" }
        }, null, 2),
        "utf8"
      );
      fs.writeFileSync(
        path.join(localesDir, "de.json"),
        JSON.stringify({
          auth: { login: "Anmelden" },
          messages: { one: "1 Artikel", other: "{count} Artikel", "=0": "keine", ordinal: "ord" }
        }, null, 2),
        "utf8"
      );

      const check = checkTranslations({ localesDir, baseLang: "en", fix: true });
      expect(check.success).toBe(true);

      const fixedDe = JSON.parse(fs.readFileSync(path.join(localesDir, "de.json"), "utf8"));
      expect(fixedDe.auth.login).toBe("Anmelden");
      expect(fixedDe.auth.logout).toBe("Log Out");
      expect(fixedDe.messages.other).toBe("{count} Artikel");

      fs.writeFileSync(path.join(localesDir, "ignore.txt"), "text");
      fs.writeFileSync(path.join(localesDir, ".hidden.json"), "{}");
      fs.writeFileSync(path.join(localesDir, "locales.compiled.json"), "{}");
      fs.writeFileSync(
        path.join(localesDir, "fr.json"),
        JSON.stringify({ title: "Bonjour" })
      );
      const checkFlat = checkTranslations({ localesDir, baseLang: "en", fix: true });
      expect(checkFlat.success).toBe(true);
      const fixedFr = JSON.parse(fs.readFileSync(path.join(localesDir, "fr.json"), "utf8"));
      expect(fixedFr.title).toBe("Bonjour");
      expect(fixedFr["auth.login"]).toBe("Log In");
      expect(fixedFr.auth).toBeUndefined();
    });

    it("should throw an error when base language file is missing", () => {
      expect(() => checkTranslations({ localesDir: path.join(tempDir, "missing-locales") })).toThrow(
        /Base language file not found/
      );
    });

    it("should fail when strict mode is enabled and extraneous or empty keys exist", () => {
      fs.writeFileSync(
        path.join(localesDir, "en.json"),
        JSON.stringify({ title: "Hello", save: "Save" }, null, 2),
        "utf8"
      );
      // Extraneous keys
      fs.writeFileSync(
        path.join(localesDir, "de.json"),
        JSON.stringify({ title: "Hallo", save: "Speichern", extra: "Extra" }, null, 2),
        "utf8"
      );

      const checkExtra = checkTranslations({ localesDir, baseLang: "en", strict: true });
      expect(checkExtra.success).toBe(false);
      expect(checkExtra.locales.de.extraneous).toContain("extra");

      // Empty string keys
      fs.writeFileSync(
        path.join(localesDir, "de.json"),
        JSON.stringify({ title: "Hallo", save: "" }, null, 2),
        "utf8"
      );
      const checkEmpty = checkTranslations({ localesDir, baseLang: "en", strict: true });
      expect(checkEmpty.success).toBe(false);
      expect(checkEmpty.locales.de.empty).toContain("save");
    });

    it("should run with default arguments when options are omitted", () => {
      const existsSpy = jest.spyOn(fs, "existsSync").mockReturnValue(true);
      const readSpy = jest.spyOn(fs, "readFileSync").mockReturnValue(JSON.stringify({ a: "b" }));
      const readdirSpy = jest.spyOn(fs, "readdirSync").mockReturnValue([]);

      const defaultCheck = checkTranslations();
      expect(defaultCheck.success).toBe(true);

      existsSpy.mockRestore();
      readSpy.mockRestore();
      readdirSpy.mockRestore();

      //(totalKeys <= 0 -> : 100)
      fs.writeFileSync(path.join(localesDir, "en.json"), "{}");
      fs.writeFileSync(path.join(localesDir, "de.json"), "{}");
      const statsEmpty = getTranslationStatus({ localesDir, baseLang: "en" });
      expect(statsEmpty.totalKeys).toBe(0);
      expect(statsEmpty.locales.de.percentage).toBe(100);
    });

    it("should guard against object collisions in setNested", () => {
      const target = { user: { profile: "info" } };
      setNested(target, "user", "primitive value");
      expect(target.user).toEqual({ profile: "info" });
    });

    it("should filter non-json, hidden, and compiled files and handle flat target with fix", () => {
      fs.writeFileSync(
        path.join(localesDir, "en.json"),
        JSON.stringify({ auth: { login: "Log In" } }, null, 2),
        "utf8"
      );
      fs.writeFileSync(path.join(localesDir, "ignore.txt"), "text");
      fs.writeFileSync(path.join(localesDir, ".hidden.json"), "{}");
      fs.writeFileSync(path.join(localesDir, "locales.compiled.json"), "{}");
      fs.writeFileSync(
        path.join(localesDir, "fr.json"),
        JSON.stringify({ title: "Bonjour" })
      );
      const checkFlat = checkTranslations({ localesDir, baseLang: "en", fix: true });
      expect(checkFlat.success).toBe(true);
      const fixedFr = JSON.parse(fs.readFileSync(path.join(localesDir, "fr.json"), "utf8"));
      expect(fixedFr.title).toBe("Bonjour");
      expect(fixedFr["auth.login"]).toBe("Log In");
      expect(fixedFr.auth).toBeUndefined();
    });
  });

  describe("locl status", () => {
    it("should calculate language coverage matrix and stats", () => {
      fs.writeFileSync(
        path.join(localesDir, "en.json"),
        JSON.stringify({ key1: "One", key2: "Two", key3: "Three", key4: "Four" }),
        "utf8"
      );
      fs.writeFileSync(
        path.join(localesDir, "de.json"),
        JSON.stringify({ key1: "Eins", key2: "Zwei", key3: "" }),
        "utf8"
      );
      // Compiled and hidden files should be filtered out
      fs.writeFileSync(path.join(localesDir, "locales.compiled.json"), "{}");
      fs.writeFileSync(path.join(localesDir, ".hidden.json"), "{}");
      fs.writeFileSync(path.join(localesDir, "ignore.txt"), "text");

      const stats = getTranslationStatus({ localesDir, baseLang: "en" });
      expect(stats.baseLang).toBe("en");
      expect(stats.totalKeys).toBe(4);
      expect(stats.locales.en.percentage).toBe(100);
      expect(stats.locales.de.total).toBe(4);
      expect(stats.locales.de.translated).toBe(2);
      expect(stats.locales.de.missing).toBe(2);
      expect(stats.locales.de.percentage).toBe(50);
    });

    it("should throw an error when base language file is missing in status", () => {
      expect(() => getTranslationStatus({ localesDir: path.join(tempDir, "missing-locales") })).toThrow(
        /Base language file not found/
      );
    });

    it("should run with default arguments when options are omitted in status", () => {
      const existsSpy = jest.spyOn(fs, "existsSync").mockReturnValue(true);
      const readSpy = jest.spyOn(fs, "readFileSync").mockReturnValue(JSON.stringify({ a: "b" }));
      const readdirSpy = jest.spyOn(fs, "readdirSync").mockReturnValue([]);

      const defaultStatus = getTranslationStatus();
      expect(defaultStatus.totalKeys).toBe(1);

      existsSpy.mockRestore();
      readSpy.mockRestore();
      readdirSpy.mockRestore();
    });

    it("should handle empty base language dictionary with 100% percentage in status", () => {
      fs.writeFileSync(path.join(localesDir, "en.json"), "{}");
      fs.writeFileSync(path.join(localesDir, "de.json"), "{}");
      const statsEmpty = getTranslationStatus({ localesDir, baseLang: "en" });
      expect(statsEmpty.totalKeys).toBe(0);
      expect(statsEmpty.locales.de.percentage).toBe(100);
    });
  });

  describe("locl compile", () => {
    it("should compile JSON files to TypeScript and ESM bundle", () => {
      fs.writeFileSync(path.join(localesDir, "en.json"), JSON.stringify({ hello: "Hello" }), "utf8");
      fs.writeFileSync(path.join(localesDir, "de.json"), JSON.stringify({ hello: "Hallo" }), "utf8");

      const tsOut = path.join(tempDir, "locales.compiled.ts");
      const compileTs = compileTranslations({ localesDir, output: tsOut, format: "ts" });
      expect(fs.existsSync(tsOut)).toBe(true);
      expect(fs.readFileSync(tsOut, "utf8")).toContain("export const resources =");

      const esmOut = path.join(tempDir, "locales.compiled.js");
      compileTranslations({ localesDir, output: esmOut, format: "esm" });
      expect(fs.existsSync(esmOut)).toBe(true);
      expect(fs.readFileSync(esmOut, "utf8")).toContain("export const resources =");
    });

    it("should throw an error when locales directory does not exist", () => {
      expect(() => compileTranslations({ localesDir: path.join(tempDir, "missing-locales") })).toThrow(
        /Locales directory not found/
      );
    });

    it("should compile to CJS and JSON formats with and without output path", () => {
      fs.writeFileSync(path.join(localesDir, "en.json"), JSON.stringify({ hello: "Hello" }), "utf8");

      const cjsOut = path.join(tempDir, "locales.compiled.cjs");
      const cjsRes = compileTranslations({ localesDir, output: cjsOut, format: "cjs" });
      expect(fs.existsSync(cjsOut)).toBe(true);
      expect(fs.readFileSync(cjsOut, "utf8")).toContain("module.exports =");
      expect(cjsRes.localesCount).toBe(1);

      const jsonOut = path.join(tempDir, "locales.compiled.json");
      compileTranslations({ localesDir, output: jsonOut, format: "json" });
      expect(fs.existsSync(jsonOut)).toBe(true);

      const jsonDef = compileTranslations({ localesDir, format: "json" });
      expect(jsonDef.outputFile).toContain(".json");

      const cjsDef = compileTranslations({ localesDir, format: "cjs" });
      expect(cjsDef.outputFile).toContain(".js");

      const cExistsSpy = jest.spyOn(fs, "existsSync").mockReturnValue(true);
      const cReaddirSpy = jest.spyOn(fs, "readdirSync").mockReturnValue(["en.json"] as any);
      const cReadSpy = jest.spyOn(fs, "readFileSync").mockReturnValue(JSON.stringify({ hello: "Hello" }));
      const cMkdirSpy = jest.spyOn(fs, "mkdirSync").mockImplementation();
      const cWriteSpy = jest.spyOn(fs, "writeFileSync").mockImplementation();

      const defaultCompile = compileTranslations();
      expect(defaultCompile.localesCount).toBe(1);

      cExistsSpy.mockRestore();
      cReaddirSpy.mockRestore();
      cReadSpy.mockRestore();
      cMkdirSpy.mockRestore();
      cWriteSpy.mockRestore();
    });
  });

  describe("runCli Execution", () => {
    it("should handle --help, --version, status and valid commands", async () => {
      expect(await runCli(["--help"])).toBe(0);
      expect(await runCli(["--version"])).toBe(0);

      fs.writeFileSync(path.join(srcDir, "App.tsx"), `t("title", "Hello");`, "utf8");
      expect(await runCli(["extract", "--src", srcDir, "--locales", localesDir])).toBe(0);

      fs.writeFileSync(path.join(localesDir, "en.json"), JSON.stringify({ ok: "OK" }), "utf8");
      fs.writeFileSync(path.join(localesDir, "de.json"), JSON.stringify({ ok: "OK" }), "utf8");
      expect(await runCli(["check", "--locales", localesDir])).toBe(0);

      expect(await runCli(["status", "--locales", localesDir, "--base", "en"])).toBe(0);
      expect(await runCli(["compile", "--locales", localesDir, "--output", path.join(tempDir, "out.ts"), "-f", "ts"])).toBe(0);
      expect(await runCli(["unknownCommand"])).toBe(1);
    });

    it("should handle parity check failure reporting, short flags, default argv, and errors in runCli", async () => {
      // Test missing keys <= 5
      fs.writeFileSync(path.join(localesDir, "en.json"), JSON.stringify({ a: "1", b: "2" }), "utf8");
      fs.writeFileSync(path.join(localesDir, "de.json"), JSON.stringify({}, null, 2), "utf8");
      const errSpy = jest.spyOn(console, "error").mockImplementation();
      expect(await runCli(["check", "--locales", localesDir])).toBe(1);

      // Test missing keys > 5
      const bigEn: Record<string, string> = {};
      for (let i = 0; i < 7; i++) {
        bigEn[`key_${i}`] = `Value ${i}`;
      }
      fs.writeFileSync(path.join(localesDir, "en.json"), JSON.stringify(bigEn, null, 2), "utf8");
      fs.writeFileSync(path.join(localesDir, "de.json"), JSON.stringify({}, null, 2), "utf8");

      const checkCode = await runCli(["check", "--locales", localesDir]);
      expect(checkCode).toBe(1);

      // Catch block when command throws
      const throwCode = await runCli(["check", "--locales", path.join(tempDir, "nonexistent-locales")]);
      expect(throwCode).toBe(1);

      errSpy.mockRestore();

      // Short flags -s, -l, -b, -o, --flat, --ext with and without leading dot
      fs.writeFileSync(path.join(srcDir, "Short.tsx"), 't("short.title", "Short Title");', "utf8");
      const shortCode = await runCli([
        "extract",
        "-s", srcDir,
        "-l", localesDir,
        "-b", "en",
        "-o", path.join(localesDir, "short.json"),
        "--flat",
        "--ext", "tsx, .ts",
        "--default", "FALLBACK_VAL"
      ]);
      expect(shortCode).toBe(0);

      // Default argv (process.argv.slice(2))
      const origArgv = process.argv;
      process.argv = ["node", "locl", "--version"];
      expect(await runCli()).toBe(0);
      process.argv = origArgv;
    });
  });
});