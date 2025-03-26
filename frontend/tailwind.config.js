module.exports = {
    content: [
      "./app/**/*.{html,js,ts}", // Agrega los archivos que usarán Tailwind
      "index.html",
    ],
    theme: {
      extend: {
        colors: {
          'fondo': 'oklch(0.987 0.022 95.277)',
        }
      },
    },
    plugins: [],
  }