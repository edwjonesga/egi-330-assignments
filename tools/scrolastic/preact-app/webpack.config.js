const path = require('path');

module.exports = {
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, '../public'),
    filename: 'bundle.js',
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              '@babel/preset-env',
              // *** IMPORTANT CHANGE HERE ***
              [
                '@babel/preset-react',
                {
                  runtime: 'automatic', // Use the new JSX transform
                  importSource: 'preact' // Tell Babel to import JSX functions from 'preact'
                }
              ]
            ],
          },
        },
      },
    ],
  },
  resolve: {
    alias: {
      'react': 'preact/compat',
      'react-dom': 'preact/compat',
      // It's also good practice to include these aliases for completeness,
      // though 'react-dom' usually covers most cases.
      'react-dom/test-utils': 'preact/test-utils',
      'react/jsx-runtime': 'preact/jsx-runtime' // Explicitly alias jsx-runtime
    },
  },
};