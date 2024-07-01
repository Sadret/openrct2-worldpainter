import {
	name,
	version
} from "./package.json";

import resolve from "@rollup/plugin-node-resolve";
import terser from "@rollup/plugin-terser";
import typescript from "@rollup/plugin-typescript";

export default {
	input: "./src/main.ts",
	output: {
		format: "iife",
		file: `./build/${name}-${version}.js`,
	},
	plugins: [
		resolve(),
		typescript(),
		terser({
			format: {
				preamble: "// Copyright (c) 2023 Sadret",
			},
		}),
	],
};
