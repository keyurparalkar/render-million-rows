import { ElementRef, useEffect, useRef, useState } from "react";
import Papa from "papaparse";
import styled from "styled-components";

import CustomWorker from "./worker?worker";
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
	const workerRef = useRef<Worker | null>(null);
	const lastScrollY = useRef(0);
	const offsetY = useRef(0);

	const handleClick = (url: string) => {
		setIsLoading(true);

		// Download the data on click
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
		const { clientHeight, scrollTop: elScrollTop } = e.currentTarget;

		const newY =
			elScrollTop >= 0 && elScrollTop < DEFAULT_HEADER_HEIGHT
				? 0
				: elScrollTop - DEFAULT_HEADER_HEIGHT;

		const scrollHeight = (csvData?.length || 0) * DEFAULT_CELL_DIMS.height;

		const delta = lastScrollY.current - newY;
		const scrollableHeight = e.currentTarget.scrollHeight - clientHeight;
		lastScrollY.current = newY;

		if (
			scrollableHeight > 0 &&
			(Math.abs(delta) > 2000 || newY === 0 || newY === scrollableHeight) &&
			scrollHeight > e.currentTarget.scrollHeight + 5
		) {
			const prog = newY / scrollableHeight;
			const recomputed = (scrollHeight - clientHeight) * prog;
			offsetY.current = recomputed - newY;
		}

		if (workerRef.current) {
			workerRef.current.postMessage({
				type: "scroll",
				divScrollTop: newY + offsetY.current,
			});
		}
	};

	/**
	 * This effect runs when the downloaded data becomes available.
	 * It has the following purpose:
	 * 1. Draw the table header on #header-canvas
	 * 2. Transfer the control to the worker
	 */
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

				for (let i = 0; i < DEFAULT_COLUMN_LENGTH; i++) {
					headerContext.fillStyle = "#242424";
					headerContext.fillRect(i * width, 0, width, height);
					headerContext.fillStyle = "white";
					headerContext.strokeRect(i * width, 0, width, height);
					headerContext.fillText(colNames[i], i * width + 20, height - 10);
				}
			}
		}

		/**
		 * We transfer two things here:
		 * 1. We convert our #canvas that draws the actual table to an offscreen canvas
		 * 2. We use the transfer the above canvas to the worker via postMessage
		 */
		if (workerRef.current && csvData && canvas) {
			const mainOffscreenCanvas = canvas.transferControlToOffscreen();
			workerRef.current.postMessage(
				{
					type: "generate-data-draw",
					targetCanvas: mainOffscreenCanvas,
					csvData,
				},
				[mainOffscreenCanvas]
			);
		}
	}, [csvData]);

	/**
	 * On component mount, initialze the worker.
	 */
	useEffect(() => {
		if (window.Worker) {
			// Refer to the Vite's Query Suffix syntax for loading your custom worker: https://vitejs.dev/guide/features.html#import-with-query-suffixes
			const worker = new CustomWorker();
			workerRef.current = worker;
		}
	}, []);

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
				<button
					onClick={() =>
						handleClick(
							"https://dl.dropboxusercontent.com/scl/fi/qjnzwwal9mtfroiyd5gf4/customers-1000000.csv?rlkey=3izklijvilv0kxmpvjdhehgy1&dl=0"
						)
					}
				>
					Load 1M rows
				</button>
				<button
					onClick={() =>
						handleClick(
							"https://dl.dropboxusercontent.com/scl/fi/sm3jnihtkl6uevo6rsy9s/customers-2000000.csv?rlkey=vey9u644vs0i8zjutdxdol31x&dl=0"
						)
					}
				>
					Load 2M rows
				</button>
			</div>

			{isLoading && <span>Loading...</span>}
			{csvData && (
				<>
					{/* Below is a div that serves as container with infinite scroll.
						We manually assign the width and height to this container and make the content overflow in it by create huge divs. */}
					<StyledContainer width={2000} height={1000 + DEFAULT_HEADER_HEIGHT}>
						<StyledScrollbarContainer
							id="table-container"
							onScroll={handleOnScroll}
						>
							{/* Below are the dummy divs of width 1px but whos length is equal to the # of rows and columns in the data.
							This helps us to bring in the scrollbars equal to the rows and columns of the data.
							So effectively we have scrollHeight = DEFAULT_HEADER + ROWs + ROW_LENGTH. */}
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
								$containerHeight={1800}
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
							height={1000}
							ref={canvasRef}
						></StyledCanvas>
					</StyledContainer>
				</>
			)}
		</>
	);
}

export default App;
