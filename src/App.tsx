import { ElementRef, useEffect, useRef } from "react";
import { drawTable } from "./utils";

function App() {
	const canvasRef = useRef<ElementRef<"canvas">>(null);

	useEffect(() => {
		const canvas = canvasRef.current;

		if (canvas) {
			const context = canvas.getContext("2d");

			if (context) {
				// context.strokeStyle = "white";
				// context.strokeRect(0, 0, 100, 40);
				const rectDims = {
					width: 80,
					height: 40,
				};

				const canvasDims = {
					width: 800,
					height: 400,
				};

				drawTable(context, rectDims, canvasDims);
			}
		}
	}, []);

	/**
	 * 1 ---- 100*40
	 * x ---- 800*400
	 */
	return (
		<>
			<h1>A million row challenge</h1>
			<canvas
				id="canvas"
				style={{ border: "1px solid white" }}
				width={800}
				height={400}
				ref={canvasRef}
			></canvas>
		</>
	);
}

export default App;
