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
        // Enhanced brand colors — vivid blue readable on dark backgrounds
        brand: {
          50: "#eff6ff",
          100: "#dbeafe",
          200: "#bfdbfe",
          300: "#93c5fd",
          400: "#60a5fa",
          500: "#3b82f6",
          600: "#2563eb",
          700: "#1d4ed8",
          800: "#1e40af",
          900: "#1e3a8a",
        },
        // Navy palette remapped to Charcoal Pro (gray scale)
        navy: {
          50: "#f9fafb",
          100: "#f3f4f6",
          200: "#e5e7eb",
          300: "#d1d5db",
          400: "#9ca3af",
          500: "#6b7280",
          600: "#4b5563",
          700: "#374151",
          800: "#1f2937",
          900: "#111827",
        },
        slate: {
          925: "#0b1220",
        },
        // Design tokens — updated for high-contrast Charcoal Pro
        surface: {
          DEFAULT: '#ffffff',
          alt: '#f9fafb',
        },
        border: {
          DEFAULT: '#4b5563', // gray-600 on dark
          strong: '#6b7280', // gray-500
        },
        text: {
          primary: '#f9fafb',
          secondary: '#d1d5db',
          muted: '#9ca3af',
        },
        accent: {
          primary: '#3b82f6', // blue-500
          secondary: '#60a5fa', // blue-400
          ring: '#93c5fd', // blue-300
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
        card: "0 14px 45px rgba(0,0,0,0.25)",
        'card-hover': "0 20px 60px rgba(0,0,0,0.35)",
        glow: "0 0 20px rgba(59, 130, 246, 0.25)",
        'glow-danger': "0 0 20px rgba(239, 68, 68, 0.20)",
        'glow-warning': "0 0 20px rgba(245, 158, 11, 0.20)",
        'glow-success': "0 0 20px rgba(22, 163, 74, 0.20)",
      },
      backgroundImage: {
        "hero-grid": "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.12) 1px, transparent 0)",
        "theme-gradient": "linear-gradient(135deg, var(--bg-primary) 0%, var(--bg-secondary) 100%)",
        "card-gradient": "linear-gradient(135deg, rgba(55, 65, 81, 0.92) 0%, rgba(75, 85, 99, 0.88) 100%)",
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
