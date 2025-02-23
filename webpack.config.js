const path = require('path');
const { mod } = require('three/tsl');
const WebpackObfuscator = require('webpack-obfuscator');

module.exports = {
    entry: {
        main: './assets/js/main.js',
        fluidity: './assets/js/curl-noise/main.js',
        heat: './assets/js/heat/main.js',
    },
    output: {
        filename: '[name].bundle.js',
        path: path.resolve(__dirname, '_site/assets/js'),
        publicPath: '/assets/js/',
        clean: true,
    },
    mode: "production",
    // mode: "development",
    performance: {
        hints: false,
    },
    optimization: {
        minimize: true,
        // minimize: false,
    },
    devtool: 'source-map',
    plugins: [
        new WebpackObfuscator(
            {
                rotateStringArray: true,
                stringArray: true,
                stringArrayThreshold: 0.75,
                compact: true,
                controlFlowFlattening: true,
                controlFlowFlatteningThreshold: 0.75,
                deadCodeInjection: true,
                deadCodeInjectionThreshold: 0.4,
                debugProtection: true,
                debugProtectionInterval: true,
                disableConsoleOutput: true,
                selfDefending: true,
                reservedStrings: [
                    "/**",
                    " * @license",
                    " * Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International (CC BY-NC-SA 4.0)",
                    " * Copyright 2025 - Yuning Wu",
                    " * Portions of this code reference publicly available GitHub Gists and code snippets.",
                    " * See source files for attribution details.",
                    " * You must provide attribution when using this work.",
                    " * Non-commercial use only.",
                    " * Derivative works must be licensed under CC BY-NC-SA 4.0.",
                    " * Full License: https://creativecommons.org/licenses/by-nc-sa/4.0/",
                    " */"
                ]
            },
            ["*.bundle.js"]
        ),
    ],
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                },
            },
            {
                test: /\.css$/,
                use: ['style-loader', 'css-loader'],
            },
            {
                test: /\.(woff|woff2|eot|ttf|otf|svg)$/,
                type: 'asset/resource',
            },
            {
                test: /\.(glsl|vs|fs)$/,
                use: [
                    {
                        loader: 'raw-loader',
                        options: { esModule: false }
                    },
                    'glslify-loader'
                ]
            },
        ],
    },
};