import { ElementRef, useEffect, useRef, useState } from "react";
import Papa from "papaparse";
import { CanvasTable } from "./Table";
import styled from "styled-components";
import {
	DEFAULT_CELL_DIMS,
	DEFAULT_COLUMN_LENGTH,
	DEFAULT_HEADER_HEIGHT,
} from "./constants";

const CustomerDataColumns = [
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
	"Website",
] as const;

type TCustomData = Record<(typeof CustomerDataColumns)[number], string>;

type ContainerDims = {
	height: number;
	width: number;
};

type TableDims = {
	[P in keyof ContainerDims as `$table${Capitalize<P>}`]: ContainerDims[P];
};

type TCanvasConfig = {
	index: number;
	start: number;
	end: number;
	canvas: OffscreenCanvas;
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
	&#header-canvas {
		top: 0px;
	}

	&#canvas {
		top: ${DEFAULT_HEADER_HEIGHT}px;
	}
	position: absolute;
	left: 0px;
	z-index: -10;
`;

function App() {
	const canvasRef = useRef<ElementRef<"canvas">>(null);
	const headerCanvasRef = useRef<ElementRef<"canvas">>(null);
	const [csvData, setCsvData] = useState<TCustomData[] | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const offScreenRef = useRef<TCanvasConfig[] | []>([]);
	const [dataStartLimit, setDataStartLimit] = useState(0);
	const [dataEndLimit, setDataEndLimit] = useState(100);

	const handleClick = (url: string) => {
		setIsLoading(true);

		Papa.parse<TCustomData>(url, {
			worker: true,
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
		const scrollTop =
			e.currentTarget.scrollTop === 0
				? 0
				: e.currentTarget.scrollTop - DEFAULT_HEADER_HEIGHT;
		const canvas = canvasRef.current;
		const end = dataEndLimit;
		/**
		 * When the scroll top reaches the 90% of the end limit of dataSetLimits then we increment it by 5000
		 */
		const trunScrollTop = Math.trunc(scrollTop / 50);

		if (trunScrollTop >= 0.8 * end) {
			setDataStartLimit(dataStartLimit + 100);
			setDataEndLimit(dataEndLimit + 100);
		}

		const currentCanvasConfig = offScreenRef.current.filter(
			(item) => trunScrollTop >= item.start && trunScrollTop <= item.end
		)[0];

		const lastScrollOffset =
			currentCanvasConfig.start === 0
				? 0
				: (currentCanvasConfig.end - currentCanvasConfig.start) *
				  DEFAULT_CELL_DIMS.height *
				  currentCanvasConfig.index;

		if (canvas) {
			const context = canvas.getContext("2d");

			if (context && offScreenRef.current) {
				context.clearRect(0, 0, 1800, 500);

				// TODO(Keyur): Solve the problem of canvas redrawing at the same location on mount;
				context.drawImage(
					currentCanvasConfig.canvas,
					0,
					scrollTop - lastScrollOffset,
					1800,
					500,
					0,
					0,
					1800,
					500
				);

				if (
					scrollTop + 500 >= currentCanvasConfig.canvas.height &&
					offScreenRef.current[currentCanvasConfig.index + 1]
				) {
					const diffRegion = {
						sx: 0,
						sy: 0,
						sw: currentCanvasConfig.canvas.width,
						sh:
							scrollTop +
							500 -
							currentCanvasConfig.canvas.height *
								(currentCanvasConfig.index + 1),
						dx: 0,
						dy:
							500 -
							(scrollTop +
								500 -
								currentCanvasConfig.canvas.height *
									(currentCanvasConfig.index + 1)),
						dw: currentCanvasConfig.canvas.width,
						dh:
							scrollTop +
							500 -
							currentCanvasConfig.canvas.height *
								(currentCanvasConfig.index + 1),
					};

					context.drawImage(
						offScreenRef.current[currentCanvasConfig.index + 1].canvas,
						diffRegion.sx,
						diffRegion.sy,
						diffRegion.sw,
						diffRegion.sh,
						diffRegion.dx,
						diffRegion.dy,
						diffRegion.dw,
						diffRegion.dh
					);
				}
			}
		}
	};

	useEffect(() => {
		const canvas = canvasRef.current;
		const headerCanvas = headerCanvasRef.current;

		if (headerCanvas) {
			const headerContext = headerCanvas.getContext("2d");
			const { width, height } = DEFAULT_CELL_DIMS;
			const colNames = CustomerDataColumns;

			if (headerContext) {
				headerContext.strokeStyle = "white";
				headerContext.font = "bold 18px serif";
				headerContext.fillStyle = "white";

				for (let i = 0; i < DEFAULT_COLUMN_LENGTH; i++) {
					headerContext.fillRect(i * width, 0, width, height);
					headerContext.fillStyle = "black";
					headerContext.fillText(colNames[i], i * width + 20, height - 10);
				}
			}
		}

		if (canvas && csvData) {
			const context = canvas.getContext("2d");

			if (context) {
				const tableDims = {
					rows: 10,
					columns: DEFAULT_COLUMN_LENGTH,
				};

				const table = new CanvasTable<(typeof csvData)[0]>(
					context,
					tableDims,
					DEFAULT_CELL_DIMS,
					csvData
				);

				table.clearTable();
				table.drawTable();
				// table.writeTableHeader();
				table.writeInTable();
			}
		}
	}, [csvData]);

	useEffect(() => {
		if (csvData) {
			const start = dataStartLimit;
			const end = dataEndLimit;

			// Create the slice of csvData:
			const slicedData = csvData.slice(start, end);

			// We create slices of Offscreen canvas of size 5000
			const backupCanvas = new OffscreenCanvas(
				1800,
				100 * DEFAULT_CELL_DIMS.height
			);
			const bContext = backupCanvas.getContext("2d");

			const tableDims = {
				rows: slicedData.length,
				columns: DEFAULT_COLUMN_LENGTH,
			};

			if (bContext) {
				const table = new CanvasTable<(typeof csvData)[0]>(
					bContext,
					tableDims,
					DEFAULT_CELL_DIMS,
					slicedData
				);

				table.clearTable();
				table.drawTable();
				table.writeInTable();
				offScreenRef.current = [
					...offScreenRef.current,
					{
						index:
							offScreenRef.current.length > 0
								? offScreenRef.current[offScreenRef.current.length - 1].index +
								  1
								: 0,
						start,
						end,
						canvas: backupCanvas,
					},
				];
			}
		}
	}, [csvData, dataStartLimit, dataEndLimit]);

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
				<>
					<StyledContainer width={1200} height={500 + DEFAULT_HEADER_HEIGHT}>
						<StyledScrollbarContainer
							id="table-container"
							onScroll={handleOnScroll}
						>
							<StyledDummyHScroll
								id="dummy-scrollbar-x"
								$tableWidth={DEFAULT_COLUMN_LENGTH * 150}
								$containerWidth={300}
							/>
							<StyledDummyVScroll
								id="dummy-scrollbar-y"
								$tableHeight={
									DEFAULT_HEADER_HEIGHT +
									DEFAULT_CELL_DIMS.height * csvData.length
								}
								$containerHeight={1200}
							/>
						</StyledScrollbarContainer>
						<StyledCanvas
							id="header-canvas"
							width={1800}
							height={50}
							ref={headerCanvasRef}
						></StyledCanvas>
						<StyledCanvas
							id="canvas"
							width={1800}
							height={500}
							ref={canvasRef}
						></StyledCanvas>
					</StyledContainer>
				</>
			)}
		</>
	);
}

export default App;
