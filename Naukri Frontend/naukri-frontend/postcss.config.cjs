// postcss.config.cjs
module.exports = {
    plugins: {
        // ⚠️ CORRECT WAY to reference the Tailwind PostCSS plugin
        '@tailwindcss/postcss': {},
        // Autoprefixer remains for broader browser compatibility
        autoprefixer: {},
    },
}