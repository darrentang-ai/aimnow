import path from 'node:path'
import { fileURLToPath } from 'node:url'

// Absolute content globs so class scanning works regardless of process cwd.
const dir = path.dirname(fileURLToPath(import.meta.url))

/** @type {import('tailwindcss').Config} */
export default {
  content: [path.join(dir, 'index.html'), path.join(dir, 'src/**/*.{js,jsx}')],
  theme: {
    extend: {
      colors: {
        ink: {
          900: '#06101f',
          800: '#0a1628',
          700: '#0e1d35',
          600: '#13294a',
        },
        cyan: {
          glow: '#3fc6ff',
        },
        aim: {
          blue: '#2b8cff',
          sky: '#5fd0ff',
          deep: '#0a1628',
        },
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 0 40px -8px rgba(63, 198, 255, 0.55)',
        'glow-sm': '0 0 20px -6px rgba(63, 198, 255, 0.45)',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-12px)' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: '0.6' },
          '50%': { opacity: '1' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        // A band of light crossing the announcement pill, then a long pause.
        // Travelling in the first 45% and parking off-screen for the rest is
        // what makes it read as an occasional glint rather than a barber pole.
        sweep: {
          '0%': { transform: 'translateX(-150%)' },
          '45%, 100%': { transform: 'translateX(250%)' },
        },
        // Peaks as the sweep crosses the middle, so the two read as one
        // effect rather than two things happening nearby.
        pillGlow: {
          '0%, 55%, 100%': { boxShadow: '0 0 0 0 rgba(63, 198, 255, 0)' },
          '22%': { boxShadow: '0 0 22px -2px rgba(63, 198, 255, 0.5)' },
        },
      },
      animation: {
        float: 'float 6s ease-in-out infinite',
        pulseGlow: 'pulseGlow 4s ease-in-out infinite',
        shimmer: 'shimmer 8s linear infinite',
        // Same period, so they stay in step.
        sweep: 'sweep 4.5s ease-in-out infinite',
        pillGlow: 'pillGlow 4.5s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
