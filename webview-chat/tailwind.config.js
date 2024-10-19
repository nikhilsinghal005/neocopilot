// webview-chat/tailwind.config.js
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  variants: {
    extend: {
      padding: ['important'],
      margin: ['important'],
    },
  },  
  plugins: [
    require('tailwind-scrollbar'), 
  ],
};
