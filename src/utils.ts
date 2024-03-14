// interface DrawTableProps {
//     context: CanvasRenderingContext2D
// }
type ShapeDim = {
	width: number;
	height: number;
};

export const drawTable = (
	context: CanvasRenderingContext2D,
	rectDims: ShapeDim
	// canvasDim: ShapeDim
) => {
	// const totalNoOfRect =
	// 	(canvasDim.width * canvasDim.height) / (rectDims.width * rectDims.height);

	// TOOD(Keyur): Make rows and columns generation dynamic
	context.strokeStyle = "white";
	for (let i = 0; i < 100; i++) {
		//rows
		for (let j = 0; j < 12; j++) {
			//columns
			context.strokeRect(
				j * rectDims.width,
				i * rectDims.height,
				rectDims.width,
				rectDims.height
			);
		}
	}
};

export const writeTextInTable = (
	context: CanvasRenderingContext2D,
	rectDims: ShapeDim,
	allText: Array<Record<string, unknown>>
) => {
	context.fillStyle = "white";
	context.font = "18px serif";

	for (let i = 0; i < 100; i++) {
		//rows
		for (let j = 0; j < 12; j++) {
			//columns

			const rawText = Object.values(allText[i])[j] as string;
			const textProperties = context.measureText(rawText);
			// console.log({ textProperties });

			const truncatedText = `${rawText.slice(0, 5)}...`;

			const formattedText = rawText.length >= 5 ? truncatedText : rawText;

			context.fillText(
				// `C${i}${j}`,
				formattedText,
				j * rectDims.width + 20,
				i * rectDims.height - 10
			);
		}
	}
};

export function findRangeIndices(number: number, rangeSize: number) {
	// Calculate the start index of the range
	const startIndex = Math.floor(number / rangeSize) * rangeSize;

	// Calculate the end index of the range
	const endIndex = startIndex + rangeSize;

	return [startIndex, endIndex];
}
