import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                border: "hsl(var(--border))",
                input: "hsl(var(--input))",
                ring: "hsl(var(--ring))",
                background: "hsl(var(--background))",
                foreground: "hsl(var(--foreground))",
                primary: {
                    DEFAULT: "hsl(var(--primary))",
                    foreground: "hsl(var(--primary-foreground))",
                },
                // Wuthering Waves Theme Colors
                canvas: "#030712", // Gray 950/Black
                surface: "#0f172a", // Slate 900
                surfaceHighlight: "#1e293b", // Slate 800
                gold: {
                    400: "#fbbf24", // Amber 400
                    500: "#f59e0b", // Amber 500
                    600: "#d97706", // Amber 600
                    glow: "#f59e0b",
                },
            },
            boxShadow: {
                'gold-glow': '0 0 15px -3px rgba(245, 158, 11, 0.3)',
                'gold-glow-lg': '0 0 25px -5px rgba(245, 158, 11, 0.4)',
                'holo': '0 0 0 1px rgba(255,255,255,0.05), 0 4px 6px -1px rgba(0,0,0,0.3)',
            },
            backgroundImage: {
                'gradient-gold': 'linear-gradient(135deg, #fbbf24 0%, #d97706 100%)',
                'gradient-dark': 'linear-gradient(to bottom right, #0f172a, #020617)',
            }
        },
    },
    plugins: [],
};
export default config;
