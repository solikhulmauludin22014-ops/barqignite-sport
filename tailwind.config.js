/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        // Sport jersey display — Anton: ultra-condensed, heavy block letters
        // HANYA untuk hero headline (BARQIGNITE, PRIVATE SPORT) dan maks 1-2 section title besar
        display: ['var(--font-display)', 'system-ui', 'sans-serif'],
        // UI heading — Space Grotesk: modern geometric, readable di ukuran kecil-menengah
        // Untuk: dashboard title, card heading, section label, kategori badge, nama menu
        ui: ['var(--font-ui)', 'system-ui', 'sans-serif'],
        // Clean geometric body
        sans: ['var(--font-jakarta)', 'system-ui', 'sans-serif'],
        // Monospace for stats, scoreboard numbers
        mono: ['var(--font-space-mono)', 'monospace'],
      },
      colors: {
        arena: {
          900: 'rgb(var(--color-arena-900) / <alpha-value>)',
          800: 'rgb(var(--color-arena-800) / <alpha-value>)',
          700: 'rgb(var(--color-arena-700) / <alpha-value>)',
          600: 'rgb(var(--color-arena-600) / <alpha-value>)',
        },
        basket: {
          DEFAULT: '#FF6B00',
          dark: '#E05D00',
          light: '#FF8933',
        },
        renang: {
          DEFAULT: '#00C2CB',
          dark: '#00A3AB',
          light: '#33CED6',
        },
        neutral: {
          light: 'rgb(var(--color-neutral-light) / <alpha-value>)',
          dark: 'rgb(var(--color-neutral-dark) / <alpha-value>)',
        },
        muted: {
          DEFAULT: 'rgb(var(--color-muted) / <alpha-value>)',
          warm: '#A89070',
        },
        status: {
          success: '#22C55E',
          warning: '#F5B400',
          danger: '#E5484D',
        },
        primary: {
          400: '#FF8933',
          500: '#FF6B00',
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.6s ease-out both',
        'fade-in-up': 'fadeInUp 0.6s ease-out both',
        'slide-up': 'slideUp 0.5s ease-out both',
        'slide-in-left': 'slideInLeft 0.4s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
        'shimmer': 'shimmer 1.8s infinite linear',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideInLeft: {
          '0%': { transform: 'translateX(-20px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% center' },
          '100%': { backgroundPosition: '200% center' },
        },
      },
      backgroundImage: {
        'split-hero': 'linear-gradient(110deg, var(--color-arena-800) 50%, var(--color-arena-900) 50%)',
        'gradient-basket': 'linear-gradient(135deg, #FF6B00 0%, #FF8933 100%)',
        'gradient-renang': 'linear-gradient(135deg, #00C2CB 0%, #33CED6 100%)',
      },
    },
  },
  plugins: [],
};
