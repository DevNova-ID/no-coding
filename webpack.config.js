const path = require('path');

module.exports = {
  entry: './src/noCoding.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'noCoding.min.js',
    library: 'NoCodeShop',
    libraryTarget: 'umd',
    globalObject: 'this'
  },
  mode: 'production'
};