/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        'lv-navy':  '#1a1f4e',
        'lv-gold':  '#c8a84b',
        'lv-bg':    '#f5f4f0',
        'lv-white': '#ffffff',
      },
      fontFamily: {
        display: ['var(--font-display)', 'Playfair Display', 'Georgia', 'serif'],
        body: ['var(--font-body)', 'DM Sans', 'system-ui', 'sans-serif'],
      },
      borderRadius: { xl: '12px', '2xl': '16px' },
      boxShadow: {
        'lv': '0 2px 12px rgba(26,31,78,0.08)',
        'lv-lg': '0 8px 32px rgba(26,31,78,0.12)',
      },
    },
  },
  plugins: [],
}
