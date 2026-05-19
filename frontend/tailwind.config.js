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
        dermascope: {
          "primary": "#284f8f",
          "primary-content": "#ffffff",
          "secondary": "#127566",
          "secondary-content": "#ffffff",
          "accent": "#d44b35",
          "accent-content": "#ffffff",
          "neutral": "#17201d",
          "neutral-content": "#fbfcf8",
          "base-100": "#fbfcf8",
          "base-200": "#eef4f0",
          "base-300": "#ccd8d0",
          "base-content": "#17201d",
          "info": "#3656a6",
          "success": "#127566",
          "warning": "#9a6a13",
          "error": "#b83352"
        }
      },
      "dark",
      "light"
    ]
  }
};
