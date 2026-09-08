/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: '#0F1623',
          900: '#0a1019',
          800: '#141d2e',
          700: '#1a2540',
        },
        saven: {
          DEFAULT: '#2563EB',
          50: '#eff6ff',
          100: '#dbeafe',
          500: '#3b82f6',
          600: '#2563EB',
          700: '#1d4ed8',
        },
        surface: '#F5F6FA',
      },
      fontSize: {
        '2xs': ['10px', '14px'],
        xs:   ['11px', '16px'],
        sm:   ['12px', '18px'],
        base: ['13px', '20px'],
        md:   ['14px', '22px'],
        lg:   ['15px', '24px'],
        xl:   ['17px', '26px'],
        '2xl':['20px', '30px'],
        '3xl':['24px', '34px'],
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '8px',
        sm: '6px',
        md: '8px',
        lg: '10px',
        xl: '14px',
        '2xl': '18px',
      },
      boxShadow: {
        card: '0 1px 3px 0 rgba(0,0,0,0.06), 0 1px 2px -1px rgba(0,0,0,0.04)',
        'card-hover': '0 4px 12px 0 rgba(0,0,0,0.08)',
        'blue-glow': '0 0 0 3px rgba(37,99,235,0.15)',
      },
    },
  },
  plugins: [],
};
