import {serial as test} from 'ava';
import ansiEscapes from 'ansi-escapes';
import term from "./helpers/term";


test('do not erase screen', async t => {
	const ps = term('erase', ['4']);
	await ps.waitForExit();
	t.false(ps.output.includes(ansiEscapes.clearTerminal));
});

test('do not erase screen where <Static> is taller than viewport', async t => {
	const ps = term('erase-with-static', ['4']);

	await ps.waitForExit();
	t.false(ps.output.includes(ansiEscapes.clearTerminal));
});

test('erase screen', async t => {
	const ps = term('erase', ['3']);
	await ps.waitForExit();
	t.true(ps.output.includes(ansiEscapes.clearTerminal));
});

test('erase screen where <Static> exists but interactive part is taller than viewport', async t => {
	const ps = term('erase', ['3']);
	await ps.waitForExit();
	t.true(ps.output.includes(ansiEscapes.clearTerminal));
});
