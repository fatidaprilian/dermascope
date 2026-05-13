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
          "primary": "#238c73",
          "primary-content": "#ffffff",
          "secondary": "#0f766e",
          "secondary-content": "#ffffff",
          "accent": "#ef5b63",
          "accent-content": "#ffffff",
          "neutral": "#1f2926",
          "neutral-content": "#fbfffc",
          "base-100": "#fffdf9",
          "base-200": "#f4f6ee",
          "base-300": "#dbe4d7",
          "base-content": "#1f2926",
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
