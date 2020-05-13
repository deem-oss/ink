import stringLength from 'string-length';
import sliceAnsi from 'slice-ansi';
import {OutputWriter} from './render-node-to-output';

interface OutputConstructorOptions {
	width: number;
	height: number;
}

/**
 * "Virtual" output class
 *
 * Handles the positioning and saving of the output of each node in the tree.
 * Also responsible for applying transformations to each character of the output.
 *
 * Used to generate the final output of all nodes before writing it to actual output stream (e.g. stdout)
 */
export class Output implements OutputWriter {
	output: string[];

	constructor(options: OutputConstructorOptions) {
		const {width, height} = options;
		// Initialize output array with a specific set of rows, so that margin/padding at the bottom is preserved
		const output = [];

		for (let y = 0; y < height; y++) {
			output.push(' '.repeat(width));
		}

		this.output = output;
	}

	write(x: number, y: number, z: number, line: string) {
		// TODO: z-order ignored because we are not batching writes, only allowed in experimental renderer

		if (!line) {
			return;
		}

		const length = stringLength(line);
		const currentLine = this.output[y];

		// Line can be missing if `text` is taller than height of pre-initialized `this.output`
		if (!currentLine) {
			return
		}

		this.output[y] = sliceAnsi(currentLine, 0, x) +
						 line +
						 sliceAnsi(currentLine, x + length);
	}

	get() {
		return this.output.map(line => line.trimEnd()).join('\n');
	}

	getHeight() {
		return this.output.length;
	}
}
