import { tanstackConfig } from "@tanstack/eslint-config";

export default [
  { ignores: [".output/**", "dist/**", ".vercel/**", "node_modules/**"] },
  ...tanstackConfig.map((c) =>
    c.files
      ? {
          ...c,
          files: [
            "src/**/*.{js,ts,tsx}",
            "vite.config.ts",
            "drizzle.config.ts",
          ],
        }
      : c
  ),
  // Relax rules that are often noisy; re-enable and fix when desired
  {
    files: ["src/**/*.{ts,tsx}", "vite.config.ts", "drizzle.config.ts"],
    rules: {
      "@typescript-eslint/no-unnecessary-condition": "off",
      "@typescript-eslint/no-unnecessary-type-assertion": "off",
      "@typescript-eslint/require-await": "warn",
      "no-shadow": "warn",
    },
  },
];
