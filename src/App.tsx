import { ElementRef, useEffect, useRef, useState } from "react";
import Papa from "papaparse";
// import CustomerData from "./assets/customers-100.csv";
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
					style={{
						maxWidth: 1000,
						maxHeight: 500,
						overflow: "scroll",
						display: "inline-block",
					}}
				>
					<canvas id="canvas" width={1800} height={10500} ref={canvasRef}>
						<span>Table</span>
					</canvas>
				</div>
			)}
		</>
	);
}

export default App;
