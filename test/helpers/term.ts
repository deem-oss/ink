import {spawn} from "node-pty";

export const term = (fixture: string, args: string[] = []) => {
	let resolve: (value?: any) => void;
	let reject: (error?: Error) => void;

	// eslint-disable-next-line promise/param-names
	const exitPromise = new Promise((resolve2, reject2) => {
		resolve = resolve2;
		reject = reject2;
	});

	const ps = spawn('ts-node', [`./fixtures/${fixture}.tsx`, ...args], {
		name: 'xterm-color',
		cols: 100,
		cwd: __dirname,
		env: process.env
	});

	const result = {
		write: (input: string) => ps.write(input),
		output: '',
		waitForExit: () => exitPromise
	};

	ps.on('data', data => {
		result.output += data;
	});

	ps.on('exit', code => {
		if (code === 0) {
			resolve();
			return;
		}

		reject(new Error(`Process exited with non-zero exit code: ${code}`));
	});

	return result;
};

export default term;
