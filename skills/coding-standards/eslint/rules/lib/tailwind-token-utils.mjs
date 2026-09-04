export function splitTailwindSegments(token, delimiter = ":") {
	const segments = [];
	let bracketDepth = 0;
	let segmentStart = 0;

	for (let index = 0; index < token.length; index += 1) {
		const character = token[index];
		if (character === "[" || character === "(") {
			bracketDepth += 1;
		} else if (character === "]" || character === ")") {
			bracketDepth = Math.max(0, bracketDepth - 1);
		} else if (character === delimiter && bracketDepth === 0) {
			segments.push(token.slice(segmentStart, index));
			segmentStart = index + 1;
		}
	}

	segments.push(token.slice(segmentStart));
	return segments;
}
