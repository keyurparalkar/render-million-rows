import { ElementRef, useEffect, useRef } from "react";
import { drawTable, writeTextInTable } from "./utils";
import CustomerData from "./assets/customers-100.csv";

function App() {
	const canvasRef = useRef<ElementRef<"canvas">>(null);

	useEffect(() => {
		const canvas = canvasRef.current;

		if (canvas) {
			const context = canvas.getContext("2d");

			if (context) {
				const rectDims = {
					width: 100,
					height: 50,
				};

				// const canvasDims = {
				// 	width: 800,
				// 	height: 400,
				// };

				drawTable(context, rectDims);
				writeTextInTable(context, rectDims);
			}
		}
	}, []);

	useEffect(() => {
		console.log({ CustomerData });
	}, []);

	return (
		<>
			<h1>A million row challenge</h1>
			<div
				id="table-container"
				style={{ maxHeight: 300, overflowY: "scroll", display: "inline-block" }}
			>
				<canvas
					id="canvas"
					style={{ border: "1px solid white" }}
					width={1200}
					height={600}
					ref={canvasRef}
				></canvas>
			</div>
		</>
	);
}

export default App;
