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
          "primary": "#235fd6",
          "primary-content": "#ffffff",
          "secondary": "#0f9c9a",
          "secondary-content": "#ffffff",
          "accent": "#c05a82",
          "accent-content": "#ffffff",
          "neutral": "#223035",
          "neutral-content": "#f8fbfb",
          "base-100": "#ffffff",
          "base-200": "#f4f0e8",
          "base-300": "#e1dbcf",
          "base-content": "#1d2527",
          "info": "#2d7bdc",
          "success": "#22885f",
          "warning": "#b66b00",
          "error": "#c94141"
        }
      },
      "dark",
      "light"
    ]
  }
};
