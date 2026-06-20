/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: '#060a13',
        card: '#0d1526',
        border: '#1e2d4a',
        primary: '#a3ff00',
        'primary-foreground': '#060a13',
        foreground: '#e8eaf0',
        secondary: '#0f1a2e',
        muted: '#1e2d4a',
        'muted-foreground': '#8899aa',
        destructive: '#ef4444',
        accent: '#0f1a2e',
        success: '#22c55e',
        warning: '#f59e0b',
        'sidebar-bg': '#060d1c',
      },
      fontFamily: {
        sans: ['DM-Sans_400Regular', 'System'],
        'sans-medium': ['DM-Sans_500Medium', 'System'],
        'sans-bold': ['DM-Sans_700Bold', 'System'],
        display: ['Syne_700Bold', 'System'],
      },
    },
  },
  plugins: [],
}
