module.exports = {
    content: [
      "./app/**/*.{html,js,ts}", // Agrega los archivos que usarán Tailwind
      "index.html",
    ],
    theme: {
      extend: {
        colors: {
          'fondo': 'oklch(0.987 0.022 95.277)',
          blue: {
            800: '#1e3a8f',
            900: '#01a1f4d',
          }
        }
      },
    },
    plugins: [],
  }