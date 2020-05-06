import stringLength from 'string-length';
import sliceAnsi from 'slice-ansi';
import {OutputWriteOptions, OutputWriter} from './render-node-to-output';

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

	write(x: number, y: number, text: string, options: OutputWriteOptions) {
		const {transformers} = options;

		if (!text) {
			return;
		}

		const lines = text.split('\n');
		let offsetY = 0;

		for (let line of lines) {
			const length = stringLength(line);
			const currentLine = this.output[y + offsetY];

			// Line can be missing if `text` is taller than height of pre-initialized `this.output`
			if (!currentLine) {
				offsetY++; // this was a bug having this missing
				continue;
			}

			for (const transformer of transformers) {
				line = transformer(line);
			}

			const actualY = y + offsetY;
			let inBounds = true;
			if (options.hideOverflow) {
				const viewPortTop = options.hideOverflow.top;
				const viewPortBottom = viewPortTop + options.hideOverflow.height - 1;

				inBounds = actualY >= viewPortTop && actualY <= viewPortBottom

				if (inBounds) {
					const viewPortLeft = options.hideOverflow.left;
					const viewPortRight = viewPortLeft + options.hideOverflow.width - 1;
					const textLeft = x;

					// textLeft = 5, viewPortLeft = 6, text length = 7, viewPortRight = 10
					//  slice text  1 .. 5
					let sliceStart = 0;
					if (textLeft < viewPortLeft) {
                        sliceStart = viewPortLeft - textLeft;
					}
					const sliceEnd = sliceStart + Math.min(length - sliceStart, viewPortRight - viewPortLeft + 1);

					if (sliceStart > 0 || sliceEnd < length) {
						line = sliceAnsi(line, sliceStart, sliceEnd);
					}
				}
			}


			if (inBounds) {
				this.output[actualY] =
					sliceAnsi(currentLine, 0, x) +
					line +
					sliceAnsi(currentLine, x + length);
			}

			offsetY++;
		}

	}

	get() {
		return this.output.map(line => line.trimEnd()).join('\n');
	}

	getHeight() {
		return this.output.length;
	}
}
