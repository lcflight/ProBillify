console.log('reading forge.config.js');

module.exports = {
  packagerConfig: {
    asar: true,
    asarUnpack: [
      '**/node_modules/.bin/**/*',
      '**/node_modules/.modules.yaml/**/*',
      '**/node_modules/.pnpm/**/*',
      '**/node_modules/@electron-forge/**/*',
      '**/node_modules/@eslint/**/*',
      '**/node_modules/@eslint-community/**/*',
      '**/node_modules/@foliojs-fork/**/*',
      '**/node_modules/@jridgewell/**/*',
      '**/node_modules/@types/**/*',
      '**/node_modules/@vitest/**/*',
      '**/node_modules/abort-controller/**/*',
      '**/node_modules/acorn/**/*',
      '**/node_modules/acorn-node/**/*',
      '**/node_modules/acorn-walk/**/*',
      '**/node_modules/array-from/**/*',
      '**/node_modules/ast-transform/**/*',
      '**/node_modules/base64-js/**/*',
      '**/node_modules/brfs/**/*',
      '**/node_modules/brotli/**/*',
      '**/node_modules/browserify-optional/**/*',
      '**/node_modules/buffer/**/*',
      '**/node_modules/buffer-equal/**/*',
      '**/node_modules/buffer-from/**/*',
      '**/node_modules/concat-stream/**/*',
      '**/node_modules/convert-source-map/**/*',
      '**/node_modules/crypto-js/**/*',
      '**/node_modules/d/**/*',
      '**/node_modules/dash-ast/**/*',
      '**/node_modules/debug/**/*',
      '**/node_modules/duplexer2/**/*',
      '**/node_modules/electron/**/*',
      '**/node_modules/electron-installer-dmg/**/*',
      '**/node_modules/electron-squirrel-startup/**/*',
      '**/node_modules/es5-ext/**/*',
      '**/node_modules/es6-iterator/**/*',
      '**/node_modules/es6-map/**/*',
      '**/node_modules/es6-set/**/*',
      '**/node_modules/es6-symbol/**/*',
      '**/node_modules/escodegen/**/*',
      '**/node_modules/eslint/**/*',
      '**/node_modules/eslint-config-prettier/**/*',
      '**/node_modules/eslint-plugin-prettier/**/*',
      '**/node_modules/eslint-scope/**/*',
      '**/node_modules/eslint-visitor-keys/**/*',
      '**/node_modules/esprima/**/*',
      '**/node_modules/estraverse/**/*',
      '**/node_modules/estree-is-function/**/*',
      '**/node_modules/esutils/**/*',
      '**/node_modules/event-emitter/**/*',
      '**/node_modules/event-target-shim/**/*',
      '**/node_modules/events/**/*',
      '**/node_modules/ext/**/*',
      '**/node_modules/function-bind/**/*',
      '**/node_modules/get-assigned-identifiers/**/*',
      '**/node_modules/has/**/*',
      '**/node_modules/hasown/**/*',
      '**/node_modules/ieee754/**/*',
      '**/node_modules/inherits/**/*',
      '**/node_modules/is-core-module/**/*',
      '**/node_modules/magic-string/**/*',
      '**/node_modules/merge-source-map/**/*',
      '**/node_modules/minimist/**/*',
      '**/node_modules/ms/**/*',
      '**/node_modules/next-tick/**/*',
      '**/node_modules/object-inspect/**/*',
      '**/node_modules/pako/**/*',
      '**/node_modules/papaparse/**/*',
      '**/node_modules/path-parse/**/*',
      '**/node_modules/pdfmake/**/*',
      '**/node_modules/prettier/**/*',
      '**/node_modules/prettier-linter-helpers/**/*',
      '**/node_modules/process/**/*',
      '**/node_modules/quote-stream/**/*',
      '**/node_modules/readable-stream/**/*',
      '**/node_modules/resolve/**/*',
      '**/node_modules/safe-buffer/**/*',
      '**/node_modules/scope-analyzer/**/*',
      '**/node_modules/shallow-copy/**/*',
      '**/node_modules/source-map/**/*',
      '**/node_modules/static-eval/**/*',
      '**/node_modules/static-module/**/*',
      '**/node_modules/string_decoder/**/*',
      '**/node_modules/supports-preserve-symlinks-flag/**/*',
      '**/node_modules/through/**/*',
      '**/node_modules/through2/**/*',
      '**/node_modules/tiny-inflate/**/*',
      '**/node_modules/ts-node/**/*',
      '**/node_modules/type/**/*',
      '**/node_modules/typedarray/**/*',
      '**/node_modules/typescript/**/*',
      '**/node_modules/unicode-trie/**/*',
      '**/node_modules/vitest/**/*',
      '**/node_modules/xtend/**/*',
    ],
  },
  rebuildConfig: {},
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {},
    },
    {
      name: '@electron-forge/maker-zip',
      platforms: ['darwin'],
    },
    {
      name: '@electron-forge/maker-deb',
      config: {},
    },
    {
      name: '@electron-forge/maker-rpm',
      config: {},
    },
  ],
  plugins: [
    {
      name: '@electron-forge/plugin-auto-unpack-natives',
      config: {},
    },
  ],
};
