import React from 'react';
import test from 'ava';
import {renderToString} from './helpers/render-to-string';
import {Box} from '../src';

const isExperimental = process.env.EXPERIMENTAL === 'true';

test('same zindex is order of nodes', t => {
	if (!isExperimental) {
		t.pass("zIndex is only applicable in experimental renderer")
		return
	}

	const output = renderToString(<Box width={50} height={4}>
		<Box position="absolute" positionTop={2} positionLeft={2} >hello Frank!</Box>
		<Box position="absolute" positionTop={2} positionLeft={8} >Mary!</Box>
	</Box>);

	const expected = "\n" +
		"\n" +
		"  hello Mary!!\n"
	t.is(output, expected, `actual output:\n***\n${output}\n***`);
});

test('same zindex is order of nodes 2', t => {
	if (!isExperimental) {
		t.pass("zIndex is only applicable in experimental renderer")
		return
	}

	const output = renderToString(<Box width={50} height={4}>
		<Box position="absolute" positionTop={2} positionLeft={8} >Mary!</Box>
		<Box position="absolute" positionTop={2} positionLeft={2} >hello Frank!</Box>
	</Box>);

	const expected = "\n" +
		"\n" +
		"  hello Frank!\n"
	t.is(output, expected, `actual output:\n***\n${output}\n***`);
});

test('set zindex to counter order of nodes', t => {
	if (!isExperimental) {
		t.pass("zIndex is only applicable in experimental renderer")
		return
	}

	const output = renderToString(<Box width={50} height={4}>
		<Box position="absolute" positionTop={2} positionLeft={8} zIndex={2} >Mary!</Box>
		<Box position="absolute" positionTop={2} positionLeft={2} >hello Frank!</Box>
	</Box>);

	const expected = "\n" +
		"\n" +
		"  hello Mary!!\n"
	t.is(output, expected, `actual output:\n***\n${output}\n***`);
});
