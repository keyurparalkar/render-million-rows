import { ElementRef, useEffect, useRef, useState } from "react";
import Papa from "papaparse";
import { CanvasTable } from "./Table";
import styled from "styled-components";

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

type ContainerDims = {
	height: number;
	width: number;
};

type TableDims = {
	[P in keyof ContainerDims as `$table${Capitalize<P>}`]: ContainerDims[P];
};
const StyledContainer = styled.div<ContainerDims>`
	position: relative;
	overflow: hidden;
	width: ${(props) => props.width}px;
	height: ${(props) => props.height}px;
`;
const StyledScrollbarContainer = styled.div`
	width: 100%;
	height: 100%;
	overflow: scroll;
	display: inline-block;
	position: relative;

	::-webkit-scrollbar {
		-webkit-appearance: none;
		width: 10px;
	}

	::-webkit-scrollbar-thumb {
		border-radius: 5px;
		background-color: rgba(0, 0, 0, 0.5);
		-webkit-box-shadow: 0 0 1px rgba(255, 255, 255, 0.5);
	}
`;

const StyledDummyVScroll = styled.div<
	Pick<TableDims, "$tableHeight"> & { $containerHeight: number }
>`
	left: ${(props) => props.$containerHeight - 50}px;
	width: 1px;
	height: ${(props) => props.$tableHeight}px;
	position: absolute;
`;

const StyledDummyHScroll = styled.div<
	Pick<TableDims, "$tableWidth"> & { $containerWidth: number }
>`
	top: ${(props) => props.$containerWidth - 20}px;
	width: ${(props) => props.$tableWidth}px;
	height: 1px;
	position: absolute;
`;

const StyledCanvas = styled.canvas`
	position: absolute;
	top: 0px;
	left: 0px;
	z-index: -10;
`;

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
		/**
		 * 1. Clear the first row
		 * 2. Copy and paste the clipped table to upper position
		 * 3. Calculate new row position
		 * 4. Create all the rects to complete the row.
		 * 5. Fill all the rects to complete the row
		 */
		// e.currentTarget.scrollTop = Math.round(e.currentTarget.scrollTop / 50) * 50;
		const scrollTop = e.currentTarget.scrollTop;
		const canvas = canvasRef.current;
		// const canvas1 = canvasRef1.current;

		if (canvas) {
			const context = canvas.getContext("2d", {
				willReadFrequently: true,
			});
			// const context1 = canvas1.getContext("2d");

			console.log({ scrollTop });
			if (context) {
				// Slide this image drawing such that only 5 rows are visible all the time
				// context.drawImage(
				// 	context1.canvas,
				// 	0,
				// 	scrollTop,
				// 	1800,
				// 	300,
				// 	0,
				// 	0,
				// 	1800,
				// 	300
				// );
				// 1.
				// context.translate(0, -50);
				// context.clearRect(0, 0, canvas.width, 50);
				const tmp = context.getImageData(0, 50, canvas.width, canvas.height);

				context.clearRect(0, 0, canvas.width, canvas.height);

				// 2.
				context.putImageData(tmp, 0, 0);

				// context.strokeRect(0, canvas.height - 50, 1800, 50);
				// // 3.
				// const newRowPos = {
				// 	x: 0,
				// 	y: 250,
				// 	w: 1800,
				// 	h: 50,
				// };
				// // 4. & 5.
				// for (let i = 0; i < 12; i++) {
				// 	context.strokeRect(i * 150, newRowPos.y, 150, 50);
				// 	context.fillText(`Test - ${i}`, i * 150, newRowPos.y);
				// }
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

	// useEffect(() => {
	// 	const canvas1 = canvasRef1.current;

	// 	if (canvas1 && csvData) {
	// 		const context = canvas1.getContext("2d");

	// 		if (context) {
	// 			const cell = {
	// 				width: 150,
	// 				height: 50,
	// 			};

	// 			const tableDims = {
	// 				rows: csvData.length + 100,
	// 				columns: 12,
	// 			};

	// 			const table = new CanvasTable<(typeof csvData)[0]>(
	// 				context,
	// 				tableDims,
	// 				cell,
	// 				csvData
	// 			);

	// 			table.clearTable();
	// 			table.drawTable();
	// 			table.writeInTable();
	// 		}
	// 	}
	// }, [csvData]);

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
				// TODO(Keyur): Optimize the below code with correct widths and heights that would work for any table.
				<StyledContainer width={1200} height={300}>
					<StyledScrollbarContainer
						id="table-container"
						onScroll={handleOnScroll}
					>
						<StyledDummyHScroll
							id="dummy-scrollbar-x"
							$tableWidth={12 * 150}
							$containerWidth={300}
						/>
						<StyledDummyVScroll
							id="dummy-scrollbar-y"
							$tableHeight={50 * 100}
							$containerHeight={1200}
						/>
					</StyledScrollbarContainer>
					<StyledCanvas
						id="canvas"
						width={1800}
						height={300}
						ref={canvasRef}
					></StyledCanvas>
				</StyledContainer>
			)}

			{/* <canvas id="canvas1" width={1800} height={5500} ref={canvasRef1}></canvas> */}
		</>
	);
}

export default App;
