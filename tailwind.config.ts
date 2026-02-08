import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}'
  ],
  theme: {
    extend: {
      colors: {
        primary: '#0F172A',
        accent: '#2563EB',
        muted: '#E2E8F0'
      }
    }
  },
  plugins: [require('@tailwindcss/forms')]
};

export default config;
