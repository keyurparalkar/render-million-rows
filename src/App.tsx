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

type ScrollConfig = {
	cellTranslateYOffset: number;
	rowsScrolled: number;
};

type DrawRegions = {
	x: number;
	y: number;
	height: number;
	width: number;
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
	const [csvData, setCsvData] = useState<TCustomData[] | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const lastConfig = useRef<ScrollConfig>({
		cellTranslateYOffset: 0,
		rowsScrolled: 0,
	});

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
		const last = lastConfig.current;

		const scrollTop = e.currentTarget.scrollTop;
		const rowsScrolled = Math.trunc(scrollTop / 50);
		const cellTranslateYOffset = scrollTop - rowsScrolled * 50;
		const drawRegions: Array<DrawRegions> = [];

		let deltaY = 0;
		deltaY += (rowsScrolled - last.rowsScrolled) * 50;
		if (rowsScrolled > last.rowsScrolled) {
			deltaY = -deltaY;
		}
		console.log({
			deltaY,
		});
		deltaY += cellTranslateYOffset - last.cellTranslateYOffset;

		const blitHeight = 500 - Math.abs(deltaY);
		const canvas = canvasRef.current;

		if (canvas) {
			const context = canvas.getContext("2d");
			// const context1 = canvas1.getContext("2d");

			if (context) {
				const args = {
					sx: 0,
					sy: 0,
					sw: 1800,
					sh: 500,
					dx: 0,
					dy: 0,
					dw: 1800,
					dh: 500,
				};
				if (blitHeight > 100) {
					if (deltaY < 0) {
						args.sy = -deltaY;
						args.sh = blitHeight;
						args.dy = 0;
						args.dh = blitHeight;

						drawRegions.push({
							x: 0,
							y: 500 + deltaY,
							width: 1800,
							height: -deltaY,
						});
					}
				}
				context.drawImage(
					context.canvas,
					args.sx,
					args.sy,
					args.sw,
					args.sh,
					args.dx,
					args.dy,
					args.dw,
					args.dh
				);
				context.fillStyle = "white";

				if (drawRegions.length > 0) {
					context.beginPath();
					for (const r of drawRegions) {
						context.rect(r.x, r.y, r.width, r.height);
					}
					context.clip();
					context.fill();
					context.beginPath();
				}

				context.lineWidth = 0.2;
				context.strokeStyle = "white";
				context.strokeRect(0, 0, 1800, 50);
			}
		}

		lastConfig.current = {
			cellTranslateYOffset,
			rowsScrolled,
		};
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
				<StyledContainer width={1200} height={500}>
					<StyledScrollbarContainer
						id="table-container"
						onScroll={handleOnScroll}
					>
						<StyledDummyHScroll
							id="dummy-scrollbar-x"
							$tableWidth={12 * 150}
							$containerWidth={500}
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
						height={500}
						ref={canvasRef}
					></StyledCanvas>
				</StyledContainer>
			)}

			{/* <canvas id="canvas1" width={1800} height={5500} ref={canvasRef1}></canvas> */}
		</>
	);
}

export default App;
