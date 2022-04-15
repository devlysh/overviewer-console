const path = require('path');
const nodeExternals = require('webpack-node-externals');
const CopyPlugin = require("copy-webpack-plugin");

module.exports = {
	mode: 'production',
	entry: './src/index.js',
	output: {
		filename: 'main.js',
		path: path.resolve(__dirname, 'dist'),
	},
	target: 'node', // in order to ignore built-in modules like path, fs, etc.
	externals: [nodeExternals()],
	plugins: [
		new CopyPlugin({
			patterns: [
				{ from: "public", to: "public" },
			],
		}),
	],
};
