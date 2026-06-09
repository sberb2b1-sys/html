/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    screens: {
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
    },
    extend: {
      colors: {
        dark: {
          DEFAULT: '#0F0F13',
          sidebar: '#16161C',
          card: '#1C1C24',
          border: '#2A2A35',
          hover: '#22222C',
        },
        accent: {
          purple: '#7C3AED',
          blue: '#3B82F6',
          violet: '#7C6FF7',
        },
        status: {
          green: '#22C55E',
          yellow: '#EAB308',
          red: '#EF4444',
        },
      },
      fontFamily: {
        inter: ['Inter', 'sans-serif'],
        'inter-medium': ['Inter-Medium', 'Inter', 'sans-serif'],
        'inter-semibold': ['Inter-Semi Bold', 'Inter', 'sans-serif'],
        'inter-bold': ['Inter-Bold', 'Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
