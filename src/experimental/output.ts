import sliceAnsi from 'slice-ansi';
import stringLength from 'string-length';
import {OutputWriter} from '../render-node-to-output';

/**
 * "Virtual" output class
 *
 * Handles the positioning and saving of the output of each node in the tree.
 * Also responsible for applying transformations to each character of the output.
 *
 * Used to generate the final output of all nodes before writing it to actual output stream (e.g. stdout)
 */

interface OutputConstructorOptions {
	width: number;
	height: number;
}

interface Writes {
	x: number;
	y: number;
	line: string;
}

export class Output implements OutputWriter {
	width: number;
	height: number;

	// Initialize output array with a specific set of rows, so that margin/padding at the bottom is preserved
	writes: Writes[] = [];

	constructor(options: OutputConstructorOptions) {
		const {width, height} = options;

		this.width = width;
		this.height = height;
	}

	write(x: number, y: number, line: string) {
		if (!line) {
			return;
		}

		this.writes.push({x, y, line: line});
	}

	get() {
		const output: string[] = [];

		for (let y = 0; y < this.height; y++) {
			output.push(' '.repeat(this.width));
		}

		for (const write of this.writes) {
			const {x, y, line} = write;

			const currentLine = output[y];

			// Line can be missing if `text` is taller than height of pre-initialized `this.output`
			if (!currentLine) {
				continue;
			}

			const length = stringLength(line);

			output[y] = sliceAnsi(currentLine, 0, x) +
						line +
						sliceAnsi(currentLine, x + length);
		}

		// eslint-disable-next-line unicorn/prefer-trim-start-end
		const generatedOutput = output.map(line => line.trimRight()).join('\n');

		return {
			output: generatedOutput,
			height: output.length
		};
	}
}
