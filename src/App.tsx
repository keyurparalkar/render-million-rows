import { ElementRef, useEffect, useRef, useState } from "react";
import Papa from "papaparse";
import { CanvasTable } from "./Table";

type CustomerDataColumns = [
	"Index",
	"Customer Id",
	"First Name",
	"Last Name",
	"Company",
	"City",
	"Country",
	"Phone 1",
	"Phone 2",
	"Email",
	"Subscription Date",
	"Website"
];

type TCustomData = Record<CustomerDataColumns[number], string>;

function App() {
	const canvasRef = useRef<ElementRef<"canvas">>(null);
	const canvasRef1 = useRef<ElementRef<"canvas">>(null);
	const [csvData, setCsvData] = useState<TCustomData[] | null>(null);
	const [isLoading, setIsLoading] = useState(false);

	const handleClick = (url: string) => {
		setIsLoading(true);

		Papa.parse<TCustomData>(url, {
			download: true,
			header: true,
			skipEmptyLines: true,
			complete(results, file) {
				console.log({ results, file });
				setCsvData(results.data);
				setIsLoading(false);
			},
		});
	};

	const handleOnScroll = (e: React.UIEvent<HTMLDivElement>) => {
		e.currentTarget.scrollTop = Math.round(e.currentTarget.scrollTop / 50) * 50;
		const scrollTop = e.currentTarget.scrollTop;
		// console.log(scrollTop + 500);
		const canvas = canvasRef.current;
		const canvas1 = canvasRef1.current;

		if (canvas && canvas1) {
			const context = canvas.getContext("2d");
			const context1 = canvas1.getContext("2d");

			if (context && context1) {
				context.clearRect(0, 0, 1800, 500);

				// Slide this image drawing such that only 5 rows are visible all the time
				context.drawImage(
					context1.canvas,
					0,
					scrollTop,
					1800,
					500,
					0,
					scrollTop,
					1800,
					500
				);
			}
		}
	};

	useEffect(() => {
		const canvas = canvasRef.current;

		if (canvas && csvData) {
			const context = canvas.getContext("2d");

			if (context) {
				const cell = {
					width: 150,
					height: 50,
				};

				const tableDims = {
					rows: 6,
					columns: 12,
				};

				const table = new CanvasTable<(typeof csvData)[0]>(
					context,
					tableDims,
					cell,
					csvData
				);

				table.clearTable();
				table.drawTable();
				table.writeInTable();
			}
		}
	}, [csvData]);

	useEffect(() => {
		const canvas1 = canvasRef1.current;

		if (canvas1 && csvData) {
			const context = canvas1.getContext("2d");

			if (context) {
				const cell = {
					width: 150,
					height: 50,
				};

				const tableDims = {
					rows: csvData.length + 100,
					columns: 12,
				};

				const table = new CanvasTable<(typeof csvData)[0]>(
					context,
					tableDims,
					cell,
					csvData
				);

				table.clearTable();
				table.drawTable();
				table.writeInTable();
			}
		}
	}, [csvData]);

	return (
		<>
			<h1>A million row challenge</h1>
			<div
				style={{
					display: "flex",
					justifyContent: "space-between",
					maxWidth: 500,
					marginBottom: 30,
				}}
			>
				<button
					onClick={() =>
						handleClick(
							"https://dl.dropboxusercontent.com/scl/fi/jzrw3sdb9odsxsf32wygy/customers-100.csv?rlkey=52bfah1kvjvoy9jnw5zcbz5tg&dl=0"
						)
					}
				>
					Load 100 rows
				</button>
				<button
					onClick={() =>
						handleClick(
							"https://dl.dropboxusercontent.com/scl/fi/16yzk30lnlabj457i0wj3/customers-500000.csv?rlkey=98fhhmzqnbmjkggz0rkmzxkf9&dl=0"
						)
					}
				>
					Load 0.5M rows
				</button>
				<button>Load 1M rows</button>
				<button>Load 2M rows</button>
			</div>

			{isLoading && <span>Loading...</span>}
			{csvData && (
				<div
					id="table-container"
					onScroll={handleOnScroll}
					style={{
						maxWidth: 1200,
						maxHeight: 300,
						overflowY: "scroll",
						display: "inline-block",
					}}
				>
					<canvas
						id="canvas"
						width={1800}
						height={500}
						ref={canvasRef}
					></canvas>
				</div>
			)}

			<canvas id="canvas1" width={1800} height={5500} ref={canvasRef1}></canvas>
		</>
	);
}

export default App;
