/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
      },
      colors: {
        // Enhanced brand colors from trading-platform
        brand: {
          50: "#e8edff",
          100: "#cfd8ff",
          200: "#a2b4ff",
          300: "#6c8cff",
          400: "#3f63ff",
          500: "#1f4cff",
          600: "#0036ff",
          700: "#0a2dd1",
          800: "#0c2aa8",
          900: "#0d257f",
        },
        navy: {
          50: "#e9ecf5",
          100: "#cfd5e6",
          200: "#a4b0cd",
          300: "#7c8cb4",
          400: "#556692",
          500: "#33456f",
          600: "#1f2f54",
          700: "#162541",
          800: "#0f1c33",
          900: "#0a122a",
        },
        slate: {
          925: "#0b1220",
        },
        // Design tokens (light defaults, dark via .dark using Tailwind's dark: utilities)
        surface: {
          DEFAULT: '#ffffff',
          alt: '#f8fafc', // slate-50-ish
        },
        border: {
          DEFAULT: '#e5e7eb', // gray-200
          strong: '#d1d5db', // gray-300
        },
        text: {
          primary: '#0f172a', // slate-900
          secondary: '#475569', // slate-600
          muted: '#64748b', // slate-500
        },
        accent: {
          primary: '#0036ff', // Brand blue
          secondary: '#1f4cff',
          ring: '#a2b4ff', // brand-200
        },
        success: {
          soft: '#dcfce7',
          fg: '#16a34a',
        },
        warning: {
          soft: '#fef9c3',
          fg: '#a16207',
        },
        danger: {
          soft: '#fee2e2',
          fg: '#dc2626',
        },
        info: {
          soft: '#dbeafe',
          fg: '#2563eb',
        },
      },
      borderRadius: {
        card: '0.75rem', // ~rounded-xl
        pill: '9999px',
      },
      boxShadow: {
        card: "0 14px 45px rgba(15,30,60,0.12)",
        'card-hover': "0 20px 60px rgba(15,30,60,0.18)",
        glow: "0 0 20px rgba(0, 54, 255, 0.15)",
        'glow-danger': "0 0 20px rgba(239, 68, 68, 0.15)",
        'glow-warning': "0 0 20px rgba(245, 158, 11, 0.15)",
        'glow-success': "0 0 20px rgba(22, 163, 74, 0.15)",
      },
      backgroundImage: {
        "hero-grid": "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.12) 1px, transparent 0)",
        "theme-gradient": "linear-gradient(135deg, var(--bg-primary) 0%, var(--bg-secondary) 100%)",
        "card-gradient": "linear-gradient(135deg, rgba(15, 28, 51, 0.95) 0%, rgba(31, 47, 84, 0.9) 100%)",
      },
      animation: {
        'slide-in-right': 'slide-in-right 0.5s ease-out',
        'slide-in-up': 'slide-in-up 0.5s ease-out',
        'fade-in': 'fade-in 0.5s ease-out',
        'pulse-glow': 'pulse-glow 2s infinite',
      },
      keyframes: {
        'slide-in-right': {
          from: { transform: 'translateX(100%)', opacity: '0' },
          to: { transform: 'translateX(0)', opacity: '1' },
        },
        'slide-in-up': {
          from: { transform: 'translateY(20px)', opacity: '0' },
          to: { transform: 'translateY(0)', opacity: '1' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(0, 54, 255, 0.15)' },
          '50%': { boxShadow: '0 0 30px rgba(0, 54, 255, 0.25)' },
        },
      },
    },
  },
  plugins: [],
};
        card: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
        'card-hover': '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
      },
    },
  },
  plugins: [],
}
