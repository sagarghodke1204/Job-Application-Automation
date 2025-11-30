// tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
    // CRITICAL: Tells Tailwind where to scan for class names
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            animation: {
                blob: "blob 7s infinite",
                "fade-in-up": "fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards",
                float: "float 3s ease-in-out infinite",
                "gradient-x": "gradient-x 15s ease infinite",
                shimmer: "shimmer 2.5s linear infinite",
                "text-shimmer": "text-shimmer 2.5s ease-out infinite alternate",
                "border-beam": "border-beam 4s linear infinite",
                "image-glow": "image-glow 4s ease-in-out infinite alternate",
                "button-glow": "button-glow 2s ease-in-out infinite alternate",
            },
            keyframes: {
                blob: {
                    "0%": { transform: "translate(0px, 0px) scale(1)" },
                    "33%": { transform: "translate(30px, -50px) scale(1.1)" },
                    "66%": { transform: "translate(-20px, 20px) scale(0.9)" },
                    "100%": { transform: "translate(0px, 0px) scale(1)" },
                },
                fadeInUp: {
                    "0%": { opacity: "0", transform: "translateY(40px)" },
                    "100%": { opacity: "1", transform: "translateY(0)" },
                },
                float: {
                    "0%, 100%": { transform: "translateY(0)" },
                    "50%": { transform: "translateY(-10px)" },
                },
                "gradient-x": {
                    "0%, 100%": {
                        "background-size": "200% 200%",
                        "background-position": "left center",
                    },
                    "50%": {
                        "background-size": "200% 200%",
                        "background-position": "right center",
                    },
                },
                shimmer: {
                    "0%": { backgroundPosition: "-1000px 0" },
                    "100%": { backgroundPosition: "1000px 0" },
                },
                "text-shimmer": {
                    "0%": { backgroundPosition: "0% 50%" },
                    "100%": { backgroundPosition: "100% 50%" },
                },
                "border-beam": {
                    "100%": { "offset-distance": "100%" },
                },
                "image-glow": {
                    "0%": { "box-shadow": "0 0 20px 5px rgba(59, 130, 246, 0.1)" },
                    "100%": { "box-shadow": "0 0 40px 10px rgba(59, 130, 246, 0.3)" },
                },
                "button-glow": {
                    "0%, 100%": { "box-shadow": "0 0 15px 0px rgba(59, 130, 246, 0.5)" },
                    "50%": { "box-shadow": "0 0 30px 10px rgba(99, 102, 241, 0.6)" },
                },
            },
        },
    },
    plugins: [],
}