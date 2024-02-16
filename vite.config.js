// vite.config.js
import { defineConfig } from 'vite';
import { builtinModules } from 'module';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';

// Configuration for the renderer process
const rendererConfig = defineConfig({
  build: {
    outDir: 'dist/renderer', // The output directory for your built files
    emptyOutDir: true, // Whether to empty the output directory before building
    target: 'es2020', // Target ECMAScript 2020
    rollupOptions: {
      external: builtinModules, // Exclude Node.js built-in modules from your bundle
      plugins: [nodeResolve(), commonjs()], // Use the Node.js resolve and CommonJS plugins
    },
  },
  plugins: [
    // Define any Vite plugins you are using here
  ],
});

// // Configuration for the main process
// const mainConfig = defineConfig({
//   build: {
//     outDir: 'dist/main', // The output directory for your built files
//     emptyOutDir: true, // Whether to empty the output directory before building
//     target: 'es2020', // Target ECMAScript 2020
//     rollupOptions: {
//       external: builtinModules, // Exclude Node.js built-in modules from your bundle
//       plugins: [nodeResolve(), commonjs()], // Use the Node.js resolve and CommonJS plugins
//     },
//   },
//   plugins: [
//     // Define any Vite plugins you are using here
//   ],
// });

// // Export the configurations
export default rendererConfig;
