// D:\ExpenseSplitter\frontend\vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path'; // Import the 'path' module

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Configure the alias here
      "@": path.resolve(__dirname, "./src"),
    },
  },
});