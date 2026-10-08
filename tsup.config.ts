import { defineConfig } from "tsup";

export default defineConfig({
    entry: {
        index: "src/index.ts",
        react: "src/react/index.tsx",
        compat: "src/compat/index.ts"
    },
    format: ["cjs", "esm"],
    dts: true,
    sourcemap: false,
    clean: true
});
