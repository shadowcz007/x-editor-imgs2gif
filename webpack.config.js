module.exports = {
  entry: './src/index.js',
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'babel-loader',
            query: {
              presets: [ '@babel/preset-env' ],
            },
          },
        ]
      },
      {
        test: /\.css$/,
        use: [
          'style-loader',
          'css-loader',
          {
            loader: 'postcss-loader',
            options: {
              plugins: [
                require('postcss-nested-ancestors'),
                require('postcss-nested')
              ]
            }
          }
        ]
      },
      {
        test: /\.(svg)$/,
        use: [
          {
            loader: 'raw-loader',
          }
        ]
      },
      // {
      //   test: /\.worker\.js$/,
      //   use: { 
      //     loader: 'worker-loader',
      //     options: { inline: false,name: 'gif.worker.js' } 
      //   }
      // }
    ]
  },
  output: {
    path: __dirname + '/dist',
    publicPath: '/',
    filename: 'bundle.js',
    library: 'Imgs2gif',
    libraryTarget: 'umd'
  }
};
