/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./src/**/*.{js,jsx,ts,tsx}", // 1. Diz ao Tailwind para escanear todos estes arquivos na pasta src
  ],
  theme: {
    extend: {
      // 2. Aqui entram as suas cores customizadas do projeto original
      colors: {
        'primary': '#f8b7d5',      // Rosa claro
        'primary-dark': '#e6a2c3',
        'secondary': '#d0bdf4',    // Lilás
        'accent': '#a0d2eb',       // Azul claro
        'light': '#f9f0ff',        // Lilás muito claro
        'text': '#5a4a6f',         // Roxo escuro
        'success': '#a8e6cf',      // Verde pastel
        'warning': '#ffd8be',      // Laranja pastel
        'danger': '#ffaaa5'        // Vermelho pastel
      }
    },
  },
  plugins: [],
}