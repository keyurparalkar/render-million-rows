import { ElementRef, useEffect, useRef, useState } from "react";
import Papa from "papaparse";
import styled from "styled-components";

import CustomWorker from "./worker?worker";
import { CanvasTable } from "./Table";
import {
	DEFAULT_CELL_DIMS,
	DEFAULT_COLUMN_LENGTH,
	DEFAULT_HEADER_HEIGHT,
	DEFAULT_SLICE_THRESHOLD,
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
	const workerRef = useRef<Worker | null>(null);
	const lastScrollY = useRef(0);
	const offsetY = useRef(0);

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

	useEffect(() => {
		const canvas = canvasRef.current;

		/**
		 * Once the data is loaded we transfer this data to worker.
		 * We also transfer the main table canvas to the worker;
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

	useEffect(() => {
		if (window.Worker) {
			const worker = new CustomWorker();
			worker.onmessage = (e) => {
				console.log("Recieved Msg from worker = ", e);
			};

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
				// TODO(Keyur): Optimize the below code with correct widths and heights that would work for any table.
				<>
					<StyledContainer width={2000} height={1000 + DEFAULT_HEADER_HEIGHT}>
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
