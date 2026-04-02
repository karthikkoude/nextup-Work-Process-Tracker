const config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        surface: {
          base: '#f8fafc',
          card: '#ffffff',
          offset: '#f1f5f9',
          border: '#e2e8f0',
          hover: '#f8fafc',
        },
        ink: {
          primary: '#0f172a',
          body: '#334155',
          muted: '#64748b',
          faint: '#94a3b8',
          inverse: '#f8fafc',
        },
        status: {
          blocked: '#ef4444',
          blockedBg: '#fef2f2',
          blockedBorder: '#fecaca',
          progress: '#f59e0b',
          progressBg: '#fffbeb',
          progressBorder: '#fde68a',
          done: '#22c55e',
          doneBg: '#f0fdf4',
          doneBorder: '#bbf7d0',
        },
        priority: {
          critical: '#dc2626',
          high: '#ea580c',
          medium: '#ca8a04',
          low: '#16a34a',
        },
        brand: {
          DEFAULT: '#0d9488',
          hover: '#0f766e',
          active: '#115e59',
          subtle: '#f0fdfa',
          border: '#99f6e4',
        },
        danger: {
          DEFAULT: '#dc2626',
          hover: '#b91c1c',
          subtle: '#fef2f2',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      fontSize: {
        xs: ['0.75rem', { lineHeight: '1rem' }],
        sm: ['0.875rem', { lineHeight: '1.25rem' }],
        base: ['1rem', { lineHeight: '1.5rem' }],
        lg: ['1.125rem', { lineHeight: '1.75rem' }],
        xl: ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
      },
      borderRadius: {
        sm: '0.25rem',
        DEFAULT: '0.375rem',
        md: '0.5rem',
        lg: '0.75rem',
        xl: '1rem',
        full: '9999px',
      },
      boxShadow: {
        card: '0 1px 3px rgba(15,23,42,0.06), 0 1px 2px rgba(15,23,42,0.04)',
        panel: '0 4px 16px rgba(15,23,42,0.08), 0 2px 4px rgba(15,23,42,0.04)',
        modal: '0 20px 60px rgba(15,23,42,0.16), 0 4px 12px rgba(15,23,42,0.08)',
      },
    },
  },
}

export default config
