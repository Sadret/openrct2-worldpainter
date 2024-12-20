import resolve from "@rollup/plugin-node-resolve";
import typescript from "@rollup/plugin-typescript";

export default {
	input: "./src/main.ts",
	output: {
		format: "iife",
		file: "./build/openrct2-worldpainter-develop.js",
	},
	plugins: [
		resolve(),
		typescript(),
	],
};
