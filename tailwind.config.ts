import type { Config } from "tailwindcss";

const config: Config = {
    darkMode: 'class',
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
                background: "var(--background)",
                foreground: "var(--foreground)",
                primary: {
                    DEFAULT: "var(--primary)",
                    foreground: "var(--foreground)",
                },
                sage: {
                    50: "#f2f7f2",
                    100: "#e1eade",
                    200: "#cde2cd",
                    300: "#abc9ab",
                    400: "#7da37d",
                    500: "#5a825a",
                    600: "#456645",
                    700: "#385238",
                    800: "#2f422f",
                    900: "#273727",
                    950: "#131e13",
                },
            },
            boxShadow: {
                'holo': '0 0 0 1px rgba(255,255,255,0.05), 0 4px 6px -1px rgba(0,0,0,0.3)',
            },
            backgroundImage: {
                'gradient-sage': 'linear-gradient(135deg, #CDE2CD 0%, #abc9ab 100%)',
                'gradient-dark': 'linear-gradient(to bottom right, #141414, #0C0C0C)',
            }
        },
    },
    plugins: [],
};
export default config;
