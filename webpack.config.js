const path = require("path");
const env = process.env.NODE_ENV;

module.exports = {
  mode: env === 'production' || env === 'none' ? env : 'development',
  entry: "./src/index.js",
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "index.js",
    library: "goliveviewStimulus",
    libraryTarget: "umd",
  },
  externals: {
    "@hotwired/stimulus": {
      commonjs: "@hotwired/stimulus",
      commonjs2: "@hotwired/stimulus",
      amd: "@hotwired/stimulus",
      root: "@hotwired/stimulus",
    },
    "morphdom": "morphdom",
    "lodash.debounce": "lodash.debounce",
    "regenerator-runtime": "regenerator-runtime"
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        include: path.resolve(__dirname, "src"),
        exclude: [/node_modules/],
        use: [
          { loader: "babel-loader" }
        ]
      }
    ]
  }
}
