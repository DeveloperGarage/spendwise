/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  // Web loads this flag after startup and then applies the scheme. `media` makes that
  // call throw. `class` is the mode NativeWind can set, and it matches the theme toggle.
  darkMode: 'class',
  presets: [require('nativewind/preset')],
  theme: {
    extend: {},
  },
  plugins: [],
};
