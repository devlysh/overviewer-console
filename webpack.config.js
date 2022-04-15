const path = require('path');
const CopyPlugin = require("copy-webpack-plugin");

module.exports = {
	target: 'node',
	mode: 'production',
	entry: './src/index.js',
	output: {
		filename: 'main.js',
		path: path.resolve(__dirname, 'dist'),
	},
	plugins: [
		new CopyPlugin({
			patterns: [
				{ from: "src/public", to: "public" },
			],
		}),
	],
};
