import React, {createRef, useEffect, useState} from 'react';
import test from 'ava';
import {renderToString} from './helpers/render-to-string';
import {Box, Color, Text, useApp} from '../src';
import {YogaNode} from "yoga-layout-prebuilt";

test('measure parent box', t => {
	const TestComponent = () => {
        const [parentSize, setParentSize] = useState<number>(0);
		const ref = createRef<any>();

		useEffect(() => {

			// console.log("effect called", ref.current.nodeRef.current);
			if (ref.current.nodeRef.current.yogaNode) {
					const yoga = ref.current.nodeRef.current.yogaNode as YogaNode;
					const height = yoga.getComputedHeight()
				    setParentSize(height);
			}
		}, [ref]);

		return (<Box position="relative" positionTop={2} positionLeft={2} minWidth={10} minHeight={4} ref={ref}>
			       <Box width={10} height={10}><Text>Text thingy!</Text><Text> - {parentSize} -</Text></Box>
		       </Box>);
	}

	const output = renderToString(<TestComponent />, {rerenderCount: 1});


	const expected = "\n" +
		"\n" +
		"  Text thingy! - 10 -\n" +
		"\n" +
		"\n" +
		"\n" +
		"\n" +
		"\n" +
		"\n"
	t.is(output, expected, `actual output:\n***\n${output}\n***`);
});

