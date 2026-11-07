import { defineConfig } from "vite";

// Builds every card into ONE file: dist/senorfungi-cards.js.
// HACS installs this file and registers it as a Lovelace resource.
export default defineConfig({
  build: {
    target: "es2021",
    lib: {
      entry: "src/senorfungi-cards.ts",
      formats: ["es"],
      fileName: () => "senorfungi-cards.js",
    },
    rollupOptions: {
      output: { codeSplitting: false },
    },
  },
  preview: { port: 4000, host: "0.0.0.0", cors: true },
});
