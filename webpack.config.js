const path = require('path');

const DIR_APP = process.env.DIR_APP;
const MODE = process.env.MODE;

const webpackConfig = {
  entry: `./${DIR_APP}/src/index.js`,
  output: {
    filename: 'bundle.js',
    publicPath: `./${DIR_APP}/public`,
    path: path.resolve(__dirname, `./${DIR_APP}/public/dist`),
  },
  module: {
    rules: [
      {
        test: /\.css/,
        use: ['style-loader', 'css-loader'],
      },
    ],
  },
};

webpackConfig.mode = MODE;
webpackConfig.devtool = MODE == 'development' ? 'source-map' : undefined;

module.exports = webpackConfig;
