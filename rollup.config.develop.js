import resolve from "@rollup/plugin-node-resolve";
import terser from "@rollup/plugin-terser";
import typescript from "@rollup/plugin-typescript";

export default {
	input: "./src/main.ts",
	output: {
		format: "iife",
		file: "./build/openrct2-bb-waves.js",
	},
	plugins: [
		resolve(),
		typescript(),
		terser({
			format: {
				preamble: "// Copyright (c) 2024 Sadret",
			},
		}),
	],
};
