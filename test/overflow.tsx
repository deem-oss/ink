import React from 'react';
import test from 'ava';
import {renderToString} from './helpers/render-to-string';
import {Box, Text} from '../src';

const items = ['A', 'B', 'C', 'X', 'Y', 'Z', 'NADA'];

const Letters = () => {
	return <Box flexDirection="column" flexGrow={1}>
				{items.map((item, i) => {
					return <Box key={i} flexDirection="row" flexShrink={0}>
							   <Text>{item}</Text>
						   </Box>
				})}
           </Box>
}

const Wrapper: React.FC<{}> = (props) => {
	return <Box width={10} height={5} flexDirection="column">
		      <Box flexShrink={0}>
			     <Text>Header</Text>
		      </Box>
		      {props.children}
			  <Box flexShrink={0}>
			     <Text>Footer</Text>
			  </Box>
	       </Box>
}

test('default overflow', t => {
	const output = renderToString(<Wrapper><Box height={3}><Letters /></Box></Wrapper>);
	t.is(output, 'Header\nA\nB\nC\nFooter', `actual was:\n***\n${output}\n***`);
});

test('default overflow with -3 marginY', t => {
	const output = renderToString(<Wrapper><Box height={3}><Box marginY={-3}><Letters /></Box></Box></Wrapper>);
	// note the 'C' overwrites header
	t.is(output, 'Ceader\nX\nY\nZ\nFooter', `actual was:\n***\n${output}\n***`);
});

test('visible overflow', t => {
	const output = renderToString(<Wrapper><Box height={3} overflow='visible'><Letters /></Box></Wrapper>);
	t.is(output, 'Header\nA\nB\nC\nFooter', `actual was:\n***\n${output}\n***`);
});

test('visible overflow with -3 marginY', t => {
	const output = renderToString(<Wrapper><Box height={3} overflow='visible'><Box marginY={-3}><Letters /></Box></Box></Wrapper>);
    // note the 'C' overwrites header
	t.is(output, 'Ceader\nX\nY\nZ\nFooter', `actual was:\n***\n${output}\n***`);
});

test('hidden overflow', t => {
	const output = renderToString(<Wrapper><Box height={3} overflow='hidden'><Letters /></Box></Wrapper>);
	t.is(output, 'Header\nA\nB\nC\nFooter', `actual was:\n***\n${output}\n***`);
});

test('hidden overflow with -3 marginY', t => {
	const output = renderToString(<Wrapper><Box height={3} overflow='hidden'><Box marginY={-3}><Letters /></Box></Box></Wrapper>);
	t.is(output, 'Header\nX\nY\nZ\nFooter', `actual was:\n***\n${output}\n***`);
});


test('hidden overflow horizontal and vertical', t => {
	const output = renderToString(<Box width={33} flexDirection="column">
		                              <Box width="100%">01234567890123456789012345678901</Box>
		                              <Box width="100%" flexDirection="row">
										  <Box width={10} marginRight={3} paddingRight={1}>Left__Left</Box>
										  <Box overflow='hidden' width={5} height={2}><Box marginX={-2} marginY={-1}><Text>xxline0xxxxxxxx{'\n'}xxline1xxxxxxxx{'\n'}xxline2xxxxxxxx</Text></Box></Box>
										  <Box overflow='hidden' width={5} height={2}><Box marginX={-2}><Text>ooXXXXXoo</Text></Box></Box>
										  <Box width={10}>RightRight</Box>
									  </Box>
		                              <Box width="100%">01234567890123456789012345678901</Box>
	                              </Box>)

	const expected = "01234567890123456789012345678901\n" +
				 	 "Left__Left line1XXXXX  RightRight\n" +
				  	 "           line2\n" +
				 	 "01234567890123456789012345678901"
	t.is(output, expected, `actual was:\n***\n${output}\n***`);

})


test('overflow scroll 1,5 offset', t => {
	const output = renderToString(<Box width={33} flexDirection="column">
		<Box width="100%">01234567890123456789012345678901</Box>
		<Box width="100%" flexDirection="row">
			<Box width={10} paddingRight={1}>Left__Left</Box>
			<Box overflow='scroll' width={5} height={2} scrollOffsetTop={1} scrollOffsetLeft={5}><Text>xxxxxline0xxxxxxxx{'\n'}xxxxxline1xxxxxxxx{'\n'}xxxxxline2xxxxxxxx</Text></Box>
			<Box overflow='hidden' width={5} height={2}><Text>XXXXXoo</Text></Box>
			<Box width={10} paddingLeft={1}>RightRight</Box>
		</Box>
		<Box width="100%">01234567890123456789012345678901</Box>
	</Box>)

	const expected = "01234567890123456789012345678901\n" +
		"Left__Left line1     XXXXXRightRight\n" +
		"           line2\n" +
		"01234567890123456789012345678901";
	t.is(output, expected, `actual was:\n***\n${output}\n***`);
})
