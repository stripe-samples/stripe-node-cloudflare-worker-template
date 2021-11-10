const path = require('path');
const webpack = require("webpack");

module.exports = {
  target: "webworker",
  entry: "./src/index.js",
  mode: "production",
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: "worker.js"
  },
  resolve: {
    fallback: { 
      // Replace these libraries with no-ops as they have no polyfills and we
      // are using fetch instead of http/https.
      "child_process": false,
      "http": false,
      "https": false,
      // Browser/worker polyfills required to replace Node libraries used by the
      // stripe-node SDK.
      "buffer": require.resolve("buffer"),
      "crypto": require.resolve("crypto-browserify"),
      "events": require.resolve("events/"),
      "path": require.resolve("path-browserify"),
      "stream": require.resolve("stream-browserify"),
    }
  },
  plugins: [
    new webpack.DefinePlugin({
      STRIPE_API_KEY: JSON.stringify(process.env.STRIPE_API_KEY),
    }),
    new webpack.ProvidePlugin({
      // Polyfill Node behavior of Buffer being available at the global level.
      Buffer: ['buffer', 'Buffer'],
    }), 
  ]
};
