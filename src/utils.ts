// interface DrawTableProps {
//     context: CanvasRenderingContext2D
// }
type ShapeDim = {
	width: number;
	height: number;
};

export const drawTable = (
	context: CanvasRenderingContext2D,
	rectDims: ShapeDim,
	canvasDim: ShapeDim
) => {
	const totalNoOfRect =
		(canvasDim.width * canvasDim.height) / (rectDims.width * rectDims.height);

	for (let i = 0; i < 10; i++) {
		for (let j = 0; j < 10; j++) {
			context.strokeStyle = "white";
			context.strokeRect(
				i * rectDims.width,
				j * rectDims.height,
				rectDims.width,
				rectDims.height
			);
		}
	}
};
