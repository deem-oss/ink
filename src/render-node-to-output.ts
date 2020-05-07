import widestLine from 'widest-line';
import {wrapText} from './wrap-text';
import {getMaxWidth} from './get-max-width';
import {DOMNode, DOMElement} from './dom';
import Yoga from 'yoga-layout-prebuilt';
import {HideOverflowOptions, ScrollOffsets} from "./overflow";
import stringLength from "string-length";
import sliceAnsi from "slice-ansi";

export const openRegionTag = (name: string) => '\u001B_' + name + '\u001B\\';
export const closeRegionTag = (name: string) => '\u001B_/' + name + '\u001B\\';
export const wrapRegion = (name: string, text: string) => `${openRegionTag(name)}${text}${closeRegionTag(name)}`;

const isAllTextNodes = (node: DOMNode): boolean => {
	if (node.nodeName === '#text') {
		return true;
	}

	if (node.nodeName === 'SPAN') {
		if (node.textContent) {
			return true;
		}

		if (Array.isArray(node.childNodes)) {
			return node.childNodes.every(isAllTextNodes);
		}
	}

	return false;
};

// Squashing text nodes allows to combine multiple text nodes into one and write
// to `Output` instance only once. For example, <Text>hello{' '}world</Text>
// is actually 3 text nodes, which would result 3 writes to `Output`.
//
// Also, this is necessary for libraries like ink-link (https://github.com/sindresorhus/ink-link),
// which need to wrap all children at once, instead of wrapping 3 text nodes separately.
const squashTextNodes = (node: DOMElement) => {
	let text = '';
	if (node.childNodes.length > 0) {
		// If parent container is `<Box>`, text nodes will be treated as separate nodes in
		// the tree and will have their own coordinates in the layout.
		// To ensure text nodes are aligned correctly, take X and Y of the first text node
		// and use them as offset for the rest of the nodes
		// Only first node is taken into account, because other text nodes can't have margin or padding,
		// so their coordinates will be relative to the first node anyway
		const [{yogaNode}] = node.childNodes;
		if (yogaNode) {
			const offsetX = yogaNode.getComputedLeft();
			const offsetY = yogaNode.getComputedTop();

			text = '\n'.repeat(offsetY) + ' '.repeat(offsetX);

			for (const childNode of node.childNodes) {
				let nodeText = '';

				if (childNode.nodeName === '#text') {
					nodeText = childNode.nodeValue;
				} else {
					if (childNode.nodeName === 'SPAN') {
						nodeText = childNode.textContent ?? squashTextNodes(childNode);
					}

					// Since these text nodes are being concatenated, `Output` instance won't be able to
					// apply children transform, so we have to do it manually here for each text node
					if (childNode.unstable__transformChildren) {
						nodeText = childNode.unstable__transformChildren(nodeText);
					}

					if (childNode.unstable__regionName) {
						nodeText = wrapRegion(childNode.unstable__regionName, nodeText);
					}
				}

				text += nodeText;
			}
		}
	}

	return text;
};

interface RenderNodeToOutputOptions {
	offsetX?: number;
	offsetY?: number;
	transformers?: OutputTransformer[];
	skipStaticElements: boolean;
	openRegion?: string;
	closeRegion?: string;
	hideOverflow?: HideOverflowOptions;
}

export type OutputTransformer = (s: string) => string;

export interface OutputWriter {
	write(x: number, y: number, text: string): void;
}

// After nodes are laid out, render each to output object, which later gets rendered to terminal
export const renderNodeToOutput = (
	node: DOMNode,
	output: OutputWriter,
	options: RenderNodeToOutputOptions
) => {
	let {
		offsetX = 0,
		offsetY = 0,
		transformers = [],
		skipStaticElements,
		openRegion = '',
		closeRegion = '',
		hideOverflow
	} = options;

	if (skipStaticElements && node.unstable__static) {
		return;
	}

	const {yogaNode} = node;

	if (yogaNode) {
		// Left and top positions in Yoga are relative to their parent node

		const localScrollOffsets = yogaNode.getOverflow() == Yoga.OVERFLOW_SCROLL ? ((yogaNode as any).scrollOffsets as ScrollOffsets) : { offsetTop: 0, offsetLeft: 0};

		const tempLeft= offsetX + yogaNode.getComputedLeft();
		const tempTop = offsetY + yogaNode.getComputedTop();
		const tempWidth = yogaNode.getComputedWidth()
		const tempHeight = yogaNode.getComputedHeight();
		const tempRight = tempLeft + tempWidth - 1;
		const tempBottom = tempTop + tempHeight - 1;

		if (yogaNode.getOverflow() == Yoga.OVERFLOW_HIDDEN || yogaNode.getOverflow() == Yoga.OVERFLOW_SCROLL) {
			hideOverflow = { left: tempLeft, right: tempRight, top: tempTop, bottom: tempBottom, width: tempWidth, height: tempHeight };
		}

		const x = tempLeft - localScrollOffsets.offsetLeft;
		const y = tempTop - localScrollOffsets.offsetTop;

		const applyRegion = (text: string) => `${openRegion}${text}${closeRegion}`;

		const writeAsLines = (output: OutputWriter, x: number, y: number, text: string, hideOverflow?: HideOverflowOptions, transformers?: OutputTransformer[]) => {
			if (!text) {
				return;
			}

			const lines = text.split('\n');

			lines.forEach((line, index) => {
				const actualY = y + index;

				if (transformers) {
					for (const transformer of transformers) {
						line = transformer(line);
					}
				}

				const length = stringLength(line);

				let inBounds = true;
				if (hideOverflow) {
					const viewPortTop = hideOverflow.top;
					const viewPortBottom = viewPortTop + hideOverflow.height - 1;

					const viewPortLeft = hideOverflow.left;
					const viewPortRight = viewPortLeft + hideOverflow.width - 1;
					const textLeft = x;
					const textRight = x + length - 1;

					// is text anywhere in viewport?
					inBounds = actualY >= viewPortTop && actualY <= viewPortBottom &&
						!(textRight < viewPortLeft || textLeft > viewPortRight);

					if (inBounds) {
						// for text partially in viewport horizontally
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
					output.write(x, actualY, line);
				}
			})
		}

		// Transformers are functions that transform final text output of each component
		// See Output class for logic that applies transformers
		let newTransformers = transformers;

		// Text nodes
		if (node.nodeName === '#text') {
			writeAsLines(output, x, y, applyRegion(node.nodeValue), hideOverflow, newTransformers);
			return;
		}

		if (node.unstable__transformChildren) {
			newTransformers = [node.unstable__transformChildren, ...transformers];
		}

		if (node.unstable__regionName) {
			openRegion += openRegionTag(node.unstable__regionName);
			closeRegion = closeRegionTag(node.unstable__regionName) + closeRegion;
		}

		// Nodes with only text inside
		if (node.textContent) {
			let text = node.textContent;

			// Since text nodes are always wrapped in an additional node, parent node
			// is where we should look for attributes
			if (node.parentNode?.style.textWrap) {
				const currentWidth = widestLine(text);
				const maxWidth = node.parentNode.yogaNode ?
					getMaxWidth(node.parentNode.yogaNode) :
					0;

				if (currentWidth > maxWidth) {
					text = wrapText(text, maxWidth, {
						textWrap: node.parentNode.style.textWrap
					});
				}
			}

			writeAsLines(output, x, y, applyRegion(text), hideOverflow, newTransformers);
			return;
		}

		const isFlexDirectionRow = node.style.flexDirection === 'row';

		if (isFlexDirectionRow && node.childNodes.every(isAllTextNodes)) {
			let text = squashTextNodes(node);

			if (node.style.textWrap) {
				const currentWidth = widestLine(text);
				const maxWidth = getMaxWidth(yogaNode);

				if (currentWidth > maxWidth) {
					text = wrapText(text, maxWidth, {
						textWrap: node.style.textWrap
					});
				}
			}

			writeAsLines(output, x, y, applyRegion(text), hideOverflow, newTransformers);
			return;
		}

		// Nodes that have other nodes as children
		// @ts-ignore
		for (const [index, childNode] of node.childNodes.entries()) {
			renderNodeToOutput(childNode, output, {
				offsetX: x,
				offsetY: y,
				transformers: newTransformers,
				skipStaticElements,
				openRegion:
					index === 0 && node.unstable__regionName ?
						openRegionTag(node.unstable__regionName) :
						undefined,
				closeRegion:
					index === node.childNodes.length - 1 && node.unstable__regionName ?
						closeRegionTag(node.unstable__regionName) :
						undefined,
				hideOverflow
			});
		}
	}
};
