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
					width: 150,
					height: 50,
				};

				const tableDims = {
					rows: 110,
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

	return (
		<>
			<h1>A million row challenge</h1>
			<div
				id="table-container"
				style={{
					maxWidth: 1000,
					maxHeight: 500,
					overflow: "scroll",
					display: "inline-block",
				}}
			>
				<canvas id="canvas" width={1800} height={5500} ref={canvasRef}></canvas>
			</div>
		</>
	);
}

export default App;
