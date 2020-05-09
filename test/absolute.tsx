import React from 'react';
import test from 'ava';
import {renderToString} from './helpers/render-to-string';
import {Box} from '../src';

test('relative at 2,2', t => {
	const output = renderToString(<Box position="relative" positionTop={2} positionLeft={2} width={10} height={4}>abc</Box>);

	const expected = "\n" +
		"\n" +
		"  abc\n"
	t.is(output, expected, `actual output:\n***\n${output}\n***`);
});


test('absolute at 2,2', t => {
	const output = renderToString(<Box width={50} height={4}><Box position="absolute" positionTop={2} positionLeft={2} width={10} minHeight={4}>abc</Box></Box>);

	const expected = "\n" +
		"\n" +
		"  abc\n"
	t.is(output, expected, `actual output:\n***\n${output}\n***`);
});
