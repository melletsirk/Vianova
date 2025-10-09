export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        /* paleta brand a la Tailwind */
        brand: {
          50:  'rgb(var(--brand-50) / <alpha-value>)',
          100: 'rgb(var(--brand-100) / <alpha-value>)',
          200: 'rgb(var(--brand-200) / <alpha-value>)',
          300: 'rgb(var(--brand-300) / <alpha-value>)',
          400: 'rgb(var(--brand-400) / <alpha-value>)',
          500: 'rgb(var(--brand-500) / <alpha-value>)',
          600: 'rgb(var(--brand-600) / <alpha-value>)',
          700: 'rgb(var(--brand-700) / <alpha-value>)',
          800: 'rgb(var(--brand-800) / <alpha-value>)',
          900: 'rgb(var(--brand-900) / <alpha-value>)',
          DEFAULT: 'rgb(var(--brand-500) / <alpha-value>)',
        },
        /* tokens semánticos “rápidos” */
        primary: 'rgb(var(--color-primary) / <alpha-value>)',
        surface: 'rgb(var(--color-surface) / <alpha-value>)',
        on: {
          primary: 'rgb(var(--color-on-primary) / <alpha-value>)',
          surface: 'rgb(var(--color-on-surface) / <alpha-value>)',
        },
        success: 'rgb(var(--color-success) / <alpha-value>)',
        warning: 'rgb(var(--color-warning) / <alpha-value>)',
        error:   'rgb(var(--color-error) / <alpha-value>)',
        outline: 'rgb(var(--color-outline) / <alpha-value>)',
        surfaceVariant: 'rgb(var(--color-surface-variant) / <alpha-value>)',
      },
      boxShadow: {
        brand: '0 8px 20px 0 rgb(var(--brand-500) / 0.25)',
      },
    },
  },
  plugins: [],
}