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
        cream: {
          50: "#FCFAF6",
          100: "#FAF7F2",
          200: "#F4EFE6",
          300: "#EBE4D8",
          400: "#D9CFBF",
          500: "#B8AB96",
          DEFAULT: "#FAF7F2",
        },
        maroon: {
          50: "#FDF4F4",
          100: "#FBE6E7",
          200: "#F7CFD2",
          300: "#F0A8AE",
          400: "#E3707B",
          500: "#D03C4B",
          600: "#B82535",
          700: "#991B28",
          800: "#8B1D24", // Primary accent
          900: "#70161C",
          950: "#44090D",
          DEFAULT: "#8B1D24",
        },
        hairline: "#E6E0D6",
      },
      fontFamily: {
        serif: ["var(--font-serif)", "Playfair Display", "Georgia", "serif"],
        sans: ["var(--font-sans)", "Inter", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      boxShadow: {
        card: "0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02)",
        preview: "0 20px 40px -15px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.05)",
      },
    },
  },
  plugins: [],
};
export default config;
