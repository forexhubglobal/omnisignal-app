import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        obsidian: "#03070c",
        panel: "#060d16",
        panelBorder: "#102538",
        neonGreen: "#00f59b",
        neonCyan: "#00d4ff",
        neonAmber: "#f59e0b",
        neonRed: "#ff3b5c",
      },
      fontFamily: {
        mono: ["'JetBrains Mono'", "'Fira Code'", "Consolas", "monospace"],
        sans: ["'Space Grotesk'", "'Inter'", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
