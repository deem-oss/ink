import {render} from '../../src';

// Fake process.stdout
interface Stream {
	output: string;
	columns: number;
	write(str: string): void;
	get(): string;
}

const createStream: (options: { columns: number }) => Stream = ({
	columns
}) => {
	let output = '';
	return {
		output,
		columns,
		write(str: string) {
			output = str;
		},
		get() {
			return output;
		}
	};
};

export const renderToString: (
	node: JSX.Element,
	options?: { columns?: number, rerenderCount?: number }
) => string = (node, options = {columns: 100, rerenderCount: 0}) => {
	const stream = createStream({columns: 100, rerenderCount: 0, ...options});

	const {rerender, waitUntilExit} = render(node, {
		// @ts-ignore
		stdout: stream,
		debug: true,
		experimental: process.env.EXPERIMENTAL === 'true'
	});

	waitUntilExit();

	if (options !== undefined) {
		for (let i = 0; i < options.rerenderCount; i++) {
			rerender(node);

			waitUntilExit();
		}
	}

	return stream.get();
};
