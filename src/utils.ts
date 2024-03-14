export function findRangeIndices(number: number, rangeSize: number) {
	// Calculate the start index of the range
	const startIndex = Math.floor(number / rangeSize) * rangeSize;

	// Calculate the end index of the range
	const endIndex = startIndex + rangeSize;

	return [startIndex, endIndex];
}
