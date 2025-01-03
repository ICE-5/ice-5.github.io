const path = require('path');

module.exports = {
    entry: {
        main: './assets/js/main.js',   // Entry point for main scripts
        wave: './assets/js/wave.js', // Entry point for waves
        cube: './assets/js/cube.js',   // Entry point for cube
    },
    output: {
        filename: '[name].bundle.js', // Output bundle name
        path: path.resolve(__dirname, '_site/assets/js'), // Output to Jekyll's _site directory
        publicPath: '/assets/js/', // Match the URL path where your assets will be served
    },
    mode: 'development', // Set to 'production' for optimized builds
    performance: {
        hints: false, // Turn off size warnings
    },
    // watch: isDevelopment, // Automatically rebuild when files change
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader', // Add Babel if needed for ES6+
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
        ],
    },
};