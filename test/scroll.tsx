import React, {FC} from 'react';
import {Box, Text} from "../src";
import test from "ava";
import {renderToString} from "./helpers/render-to-string";

interface IScrollViewProps {
	totalHeight: number;
	viewportHeight: number;
	scrollOffset: number;
}

const VerticalScrollView: FC<IScrollViewProps> = (props) => {

    return (
		<Box flexDirection="column">
			<Box>offset: {props.scrollOffset}</Box>
			<Box flexDirection="row" flexGrow={1} justifyContent="space-between">
				<Box overflow="scroll" scrollOffsetTop={props.scrollOffset}>
					<Box>{props.children}</Box>
				</Box>
			</Box>
		</Box>
	);
};

export const TestScroll: FC<{}> = () => {
	const [termColumns, termRows] = [80, 10]
	const items = [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60];
	const viewportHeight = termRows - 5;
	const totalHeight = items.length;

	return (
		<Box width={termColumns} height={termRows} flexDirection="column">
			<Box>Header</Box>
			<Box flexGrow={1} flexDirection="column">
				<VerticalScrollView totalHeight={totalHeight} viewportHeight={viewportHeight} scrollOffset={3}>
					<Box flexDirection="column" flexGrow={1}>
						{items.map((item, i) => (
							<Box key={i} flexDirection="row" flexShrink={0}>
								<Text>{item.toString(10)}</Text>
							</Box>
						))}
					</Box>
				</VerticalScrollView>
			</Box>
			<Box>Footer</Box>
		</Box>
	);
};

test('scroll test', t => {
	const output = renderToString(<TestScroll/>);
	const expected = "Header\n" +
		"offset: 3\n" +
		"3\n" +
		"4\n" +
		"5\n" +
		"6\n" +
		"7\n" +
		"8\n" +
		"9\n" +
		"Footer"
	t.is(output, expected, `actual was:\n***\n${output}\n***`);
});

test('overflow scroll 1,5 offset', t => {
	const output = renderToString(<Box width={40} flexDirection="column">
		<Box width={40}>0123456789012345678901234567890123456789</Box>
		<Box width={40} flexDirection="row">
			<Box width={5} flexShrink={0} flexGrow={1}>Left</Box>
			<Box overflow='scroll' width={5} height={2} scrollOffsetTop={1} scrollOffsetLeft={5} flexShrink={0} flexGrow={0}><Text>xxxxxline0yayxx{'\n'}xxxxxline1yayxxxx{'\n'}xxxxxline2yayxxxx</Text></Box>
			<Box overflow='hidden' width={5} height={2} flexShrink={0} flexGrow={0}><Text>XXXXXoooo</Text></Box>
			<Box width={5} flexShrink={0} flexGrow={1} justifyContent="flex-end">Right</Box>
		</Box>
		<Box width={40}>0123456789012345678901234567890123456789</Box>
	</Box>)

	const expected = "0123456789012345678901234567890123456789\n" +
				 	 "Left      line1     XXXXX          Right\n" +
					 "          line2\n" +
					 "0123456789012345678901234567890123456789";

	t.is(output, expected, `actual was:\n***\n${output}\n***`);
})
