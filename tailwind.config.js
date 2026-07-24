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
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        display: ['var(--font-anton)', 'system-ui', 'sans-serif'],
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
        status: {
          success: '#22C55E', // Lunas/Hadir
          warning: '#F5B400', // Pending/Izin
          danger: '#E5484D',  // Terlambat/Alpa
        }
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'slide-in-left': 'slideInLeft 0.4s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
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
        }
      },
      backgroundImage: {
        'split-hero': 'linear-gradient(110deg, var(--color-arena-800) 50%, var(--color-arena-900) 50%)',
      }
    },
  },
  plugins: [],
};
