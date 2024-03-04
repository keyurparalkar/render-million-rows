import { ElementRef, useEffect, useRef } from "react";
import CustomerData from "./assets/customers-100.csv";
import { CanvasTable } from "./Table";

function App() {
	const canvasRef = useRef<ElementRef<"canvas">>(null);

	useEffect(() => {
		const canvas = canvasRef.current;

		if (canvas) {
			const context = canvas.getContext("2d");

			if (context) {
				const cell = {
					width: 100,
					height: 50,
				};

				const tableDims = {
					rows: 100,
					columns: 12,
				};

				const table = new CanvasTable<(typeof CustomerData)[0]>(
					context,
					tableDims,
					cell,
					CustomerData
				);

				table.clearTable();
				table.drawTable();
				table.writeInTable();
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
				style={{ maxHeight: 500, overflowY: "scroll", display: "inline-block" }}
			>
				<canvas
					id="canvas"
					style={{ border: "1px solid white" }}
					width={1200}
					height={5000}
					ref={canvasRef}
				></canvas>
			</div>
		</>
	);
}

export default App;
