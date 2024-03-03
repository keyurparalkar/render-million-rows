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
	for (let i = 0; i < 10; i++) {
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
	rectDims: ShapeDim
	// allText?: Record<string, unknown>
) => {
	context.fillStyle = "white";
	context.font = "38px serif";

	for (let i = 0; i < 10; i++) {
		//rows
		for (let j = 0; j < 12; j++) {
			//columns
			context.fillText(
				`C${i}${j}`,
				j * rectDims.width + 20,
				i * rectDims.height - 10
			);
		}
	}
};
