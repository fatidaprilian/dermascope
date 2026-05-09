import daisyui from "daisyui";

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["Space Grotesk", "IBM Plex Sans", "sans-serif"],
        body: ["IBM Plex Sans", "Space Grotesk", "sans-serif"],
        mono: ["JetBrains Mono", "SFMono-Regular", "monospace"]
      }
    }
  },
  plugins: [daisyui],
  daisyui: {
    themes: [
      {
        imglab: {
          "primary": "#e1a33a",
          "primary-content": "#1b140a",
          "secondary": "#2fb6b1",
          "secondary-content": "#081514",
          "accent": "#f0657a",
          "accent-content": "#1a0b10",
          "neutral": "#1f1914",
          "neutral-content": "#f2e8d6",
          "base-100": "#1a1511",
          "base-200": "#14100c",
          "base-300": "#0f0c09",
          "base-content": "#f2e8d6",
          "info": "#5aa7ff",
          "success": "#5bc686",
          "warning": "#f0a62a",
          "error": "#e26363"
        }
      },
      "dark",
      "light"
    ]
  }
};
