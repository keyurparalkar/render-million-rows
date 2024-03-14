import { CanvasTable } from "./Table";
import {
	DEFAULT_CELL_DIMS,
	DEFAULT_COLUMN_LENGTH,
	DEFAULT_HEADER_HEIGHT,
	DEFAULT_SLICE_THRESHOLD,
} from "./constants";
import { findRangeIndices } from "./utils";

// ======================== TYPINGS START =========================
type OffscreenCanvasSlice = {
	index: number;
	start: number;
	end: number;
	canvas: OffscreenCanvas;
};

type TDataStore = {
	canvasSlices: OffscreenCanvasSlice[];
} & Omit<GenerateAndDrawEvent, "type">;

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

type ActionType = ["generate-data-draw", "scroll"];

type GenerateAndDrawEvent = {
	type: ActionType[0];
	csvData: TCustomData[];
	targetCanvas: OffscreenCanvas | null;
};

type ScrollEvent = {
	type: ActionType[1];
	divScrollTop: number;
};

type WorkerProps = GenerateAndDrawEvent | ScrollEvent;

// ======================== TYPINGS END =========================

const createBlankOffscreenCanvas = () => {
	const backupCanvas = new OffscreenCanvas(
		1800,
		DEFAULT_SLICE_THRESHOLD * DEFAULT_CELL_DIMS.height
	);
	const bContext = backupCanvas.getContext("2d");

	const tableDims = {
		rows: DEFAULT_SLICE_THRESHOLD,
		columns: DEFAULT_COLUMN_LENGTH,
	};

	if (bContext) {
		const table = new CanvasTable(bContext, tableDims, DEFAULT_CELL_DIMS, []);

		table.drawTable();

		return {
			index: 0,
			start: 0,
			end: DEFAULT_SLICE_THRESHOLD * DEFAULT_CELL_DIMS.height,
			canvas: backupCanvas,
		};
	}
};

const createOffscreenSlice = (
	csvData: TCustomData[],
	index: number,
	start: number,
	end: number
) => {
	const slicedData = csvData.slice(start, end);

	// We create slices of Offscreen canvas of size 5000
	const backupCanvas = new OffscreenCanvas(
		1800,
		DEFAULT_SLICE_THRESHOLD * DEFAULT_CELL_DIMS.height
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

		return {
			index,
			start,
			end,
			canvas: backupCanvas,
		};
	}
};

const drawOnTargetCanvas = (
	targetCanvas: OffscreenCanvas | null,
	divScrollTop: number,
	canvasSlices: OffscreenCanvasSlice[]
) => {
	const scrollTop = divScrollTop;
	const canvas = targetCanvas;
	const trunScrollTop = Math.trunc(scrollTop / 50);

	let currentCanvasConfig = canvasSlices.filter(
		(item) => trunScrollTop >= item.start && trunScrollTop <= item.end
	)[0];

	/**
	 * If there is no currentCanvas then add a blank canavas.
	 * In the mean time we execute a promise that creates 2 offScreencanvas.
	 * When this promise is resolved we draw them on to the canvas.
	 */
	if (currentCanvasConfig === undefined) {
		const promise = new Promise((resolve) => {
			const tempSlices = [];
			for (
				let i = 0;
				i < 2 * DEFAULT_SLICE_THRESHOLD;
				i += DEFAULT_SLICE_THRESHOLD
			) {
				const [start, end] = findRangeIndices(
					trunScrollTop,
					DEFAULT_SLICE_THRESHOLD
				);
				const existingCanvas = dataStore.canvasSlices.filter(
					(canvas) => canvas.start === start
				)[0];

				if (existingCanvas === undefined) {
					const newCanvas = createOffscreenSlice(
						dataStore.csvData,
						dataStore.canvasSlices.length + 1,
						start,
						end
					);
					if (newCanvas) {
						tempSlices.push(newCanvas);
						dataStore.canvasSlices.push(newCanvas);
					}
				}
			}
			resolve(tempSlices);
		});

		promise.then((data) => {
			drawOnTargetCanvas(targetCanvas, divScrollTop, data);
		});
		const blankCanvas = createBlankOffscreenCanvas();
		if (blankCanvas) currentCanvasConfig = blankCanvas;
	}

	const canvasEndLimit = findRangeIndices(
		scrollTop,
		DEFAULT_SLICE_THRESHOLD * DEFAULT_CELL_DIMS.height
	)[0];

	const previousCanvasEndScrollOffset =
		currentCanvasConfig.start === 0 ? 0 : canvasEndLimit;

	if (canvas) {
		const context = canvas.getContext("2d");

		if (context) {
			context.clearRect(0, 0, 1800, 1000);

			context.drawImage(
				currentCanvasConfig.canvas,
				0,
				scrollTop - previousCanvasEndScrollOffset,
				1800,
				1000,
				0,
				0,
				1800,
				1000
			);

			if (
				scrollTop + 1000 >= currentCanvasConfig.canvas.height &&
				canvasSlices[currentCanvasConfig.index + 1]
			) {
				const diffRegion = {
					sx: 0,
					sy: 0,
					sw: currentCanvasConfig.canvas.width,
					sh:
						scrollTop +
						1000 -
						currentCanvasConfig.canvas.height * (currentCanvasConfig.index + 1),
					dx: 0,
					dy:
						1000 -
						(scrollTop +
							1000 -
							currentCanvasConfig.canvas.height *
								(currentCanvasConfig.index + 1)),
					dw: currentCanvasConfig.canvas.width,
					dh:
						scrollTop +
						1000 -
						currentCanvasConfig.canvas.height * (currentCanvasConfig.index + 1),
				};

				context.drawImage(
					canvasSlices[currentCanvasConfig.index + 1].canvas,
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

const dataStore: TDataStore = {
	canvasSlices: [],
	targetCanvas: null,
	csvData: [],
};

onmessage = (e: MessageEvent<WorkerProps>) => {
	const { type } = e.data;

	switch (type) {
		case "generate-data-draw": {
			const { targetCanvas, csvData } = e.data;
			if (targetCanvas && csvData) {
				const startingSlices = [
					createOffscreenSlice(csvData, 0, 0, DEFAULT_SLICE_THRESHOLD),
					createOffscreenSlice(
						csvData,
						1,
						DEFAULT_SLICE_THRESHOLD,
						DEFAULT_SLICE_THRESHOLD * 2
					),
				];
				if (startingSlices)
					dataStore.canvasSlices = [
						...dataStore.canvasSlices,
						...startingSlices,
					];

				dataStore.targetCanvas = targetCanvas;
				dataStore.csvData = csvData;
				drawOnTargetCanvas(targetCanvas, 0, dataStore.canvasSlices);
			}
			break;
		}

		case "scroll": {
			const { divScrollTop } = e.data;

			// fetch targetCanvas and canvasSlices from the dataStore;
			const { targetCanvas, canvasSlices } = dataStore;
			drawOnTargetCanvas(targetCanvas, divScrollTop, canvasSlices);
			break;
		}

		default:
			break;
	}
};
