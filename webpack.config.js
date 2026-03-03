const path = require('path');
const webpack = require('webpack');
const TerserPlugin = require('terser-webpack-plugin');
const packageJson = require('./package.json');

module.exports = {
  entry: './src/index.ts',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'zimporter-pixi8.min.js',
    library: 'zimporter',
    libraryTarget: 'umd',
    globalObject: 'this',
  },
  resolve: {
    extensions: ['.ts', '.js'],
    alias: {
      // @pixi/particle-emitter v5 was written for PIXI v6/v7.
      // Its Particle class extends @pixi/sprite's Sprite, which is a v6 Sprite
      // lacking updateLocalTransform() that PIXI v8's renderer requires.
      // We redirect @pixi/sprite to our shim so Particle extends v8's Sprite.
      '@pixi/sprite': path.resolve(__dirname, 'src/pixi-sprite-shim.ts'),
    },
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        loader: 'ts-loader',
        options: {
          configFile: 'tsconfig.webpack.json',
        },
        exclude: /node_modules/,
      },
    ],
  },
  // All dependencies will be bundled. No externals.
  optimization: {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        extractComments: false,
      }),
    ],
  },
  plugins: [
    new webpack.DefinePlugin({
      __LIB_VERSION__: JSON.stringify(packageJson.version),
    }),
    new webpack.BannerPlugin({
      banner: `/*! zimporter-pixi8 v${packageJson.version} | (c) ${new Date().getFullYear()} Yonathan Zohar */`,
      raw: true,
    }),
  ],
  mode: 'production',
};
