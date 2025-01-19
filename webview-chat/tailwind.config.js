// webview-chat/tailwind.config.js
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontSize: {
        'xxxs': '0.6rem', // Custom size for xxxs
      },
    },
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
