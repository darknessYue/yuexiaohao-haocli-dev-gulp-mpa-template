
const yargs = require('yargs')
// 环境判断
const { argv } = yargs
let isProd = true
if (argv._[0] !== 'build') {
  isProd = false
}

module.exports = {
  mode: isProd ? 'production' : 'development',
  devtool: isProd ? false : 'eval-cheap-module-source-map',
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /(node_modules|bower_components|plugins)/,
        use: {
          loader: 'babel-loader',
          options: {
            plugins: [
              // '@babel/plugin-proposal-object-rest-spread',
              [
                '@babel/plugin-transform-runtime',
                {
                  absoluteRuntime: false,
                  corejs: 3,
                  helpers: true,
                  regenerator: true,
                  useESModules: false
                }
              ]
            ],
            presets: ['@babel/preset-env'],
            // cacheDirectory: true,
          }
        }
      }
    ]
  },
  resolve: {
    alias: {

    }
  }
}
