const path = require('path')
const webpack = require('webpack')
const BundleAnalyzerPlugin = require("webpack-bundle-analyzer").BundleAnalyzerPlugin
const CopyWebpackPlugin = require('copy-webpack-plugin')

const fs = require('fs');

var pjson = require('./package.json')

var nodeModules = {};
fs.readdirSync('node_modules')
    .filter(function (x) {
        return ['.bin'].indexOf(x) === -1;
    })
    .forEach(function (mod) {
        nodeModules[mod] = 'commonjs ' + mod;
    });

const plugins = [
    new webpack.DefinePlugin({
        'process.env': {
            LAYER: JSON.stringify(process.env.LAYER),
            SERVER_PORT: '3000',
            SERVER_HOST: "'localhost'",
            VERSION: JSON.stringify(pjson.version)
        }
    }),
    new CopyWebpackPlugin([
        { context: 'src', from: 'views/**/*.pug' },
        "assets/**/*.css"
    ])
]
if (process.env.ANALYZE === "true") {
    plugins.push(new BundleAnalyzerPlugin())
}

module.exports = {
    externals: nodeModules,
    target: 'node',
    entry: {
        [process.env.LAYER]: './src/index.ts'
    },
    output: {
        filename: '[name].bundle.js',
        path: path.resolve(__dirname, 'dist')
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                loader: 'awesome-typescript-loader',
                options: {
                    useBabel: true
                }
            }
        ]
    },
    resolve: {
        extensions: [".tsx", ".ts", ".js"],
        alias: {
            "@": path.resolve(__dirname, "src"),
        }
    },
    plugins,
    devtool: 'source-map',
    node: {
        __dirname: false
    }
}
