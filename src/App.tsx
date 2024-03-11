import { ElementRef, useEffect, useRef, useState } from "react";
import Papa from "papaparse";
import { CanvasTable } from "./Table";
import styled from "styled-components";
import { DEFAULT_CELL_DIMS, DEFAULT_COLUMN_LENGTH } from "./constants";

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
	const [csvData, setCsvData] = useState<TCustomData[] | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const offScreenRef = useRef<OffscreenCanvas | null>(null);

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
		const scrollTop = e.currentTarget.scrollTop;
		const canvas = canvasRef.current;

		if (canvas) {
			const context = canvas.getContext("2d");

			if (context && offScreenRef.current) {
				context.clearRect(0, 0, 1800, 300);

				// TODO(Keyur): Solve the problem of canvas redrawing at the same location on mount;
				context.drawImage(
					offScreenRef.current,
					0,
					scrollTop,
					1800,
					300,
					0,
					0,
					1800,
					300
				);
			}
		}
	};

	useEffect(() => {
		const canvas = canvasRef.current;

		if (canvas && csvData) {
			const context = canvas.getContext("2d");

			if (context) {
				const tableDims = {
					rows: 6,
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
				table.writeInTable();
			}
		}
	}, [csvData]);

	useEffect(() => {
		if (csvData) {
			const backupCanvas = new OffscreenCanvas(
				1800,
				csvData.length * DEFAULT_CELL_DIMS.height
			);
			const bContext = backupCanvas.getContext("2d");

			const tableDims = {
				rows: csvData.length,
				columns: DEFAULT_COLUMN_LENGTH,
			};

			if (bContext) {
				const table = new CanvasTable<(typeof csvData)[0]>(
					bContext,
					tableDims,
					DEFAULT_CELL_DIMS,
					csvData
				);

				table.clearTable();
				table.drawTable();
				table.writeInTable();
				offScreenRef.current = backupCanvas;
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
				// TODO(Keyur): Optimize the below code with correct widths and heights that would work for any table.
				<StyledContainer width={1200} height={300}>
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
							$tableHeight={50 * csvData.length}
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
		</>
	);
}

export default App;
