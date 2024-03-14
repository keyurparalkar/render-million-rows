import { CanvasTable } from "./Table";
import {
	DEFAULT_CELL_DIMS,
	DEFAULT_COLUMN_LENGTH,
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

/**
 * This creates a blank offscreen canvas.
 * @returns OffscreenCanvasSlice | undefined
 */
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

/**
 * @param csvData - actual csv data
 * @param index - index of the canvas
 * @param start - index position in csvData from which slicing needs to start
 * @param end - index position in csvData from which slicing needs to end(exclusive)
 * @returns OffscreenCanvasSlice | undefined
 */
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

/**
 * This functions draws the data from each canvas slice on to the targetCanvas.
 * It makes use of the divScrollTop to determine the location of data in the canvas slice.
 * @param targetCanvas - canvas element on which the table needs to be drawn.
 * @param divScrollTop - scrollTop of the infinite scroll container
 * @param canvasSlices - canvas slices. Each slice is of dim = 1800 x 5000(i.e. DEFAULT_SLICE_THRESHOLD*DEFAULT_CELL_DIMS.height)
 */
const drawOnTargetCanvas = (
	targetCanvas: OffscreenCanvas | null,
	divScrollTop: number,
	canvasSlices: OffscreenCanvasSlice[]
) => {
	const scrollTop = divScrollTop;
	const canvas = targetCanvas;

	// Gets the number of rows scrolled.
	const truncScrollTop = Math.trunc(scrollTop / 50);

	// We get currentCanvas by comparing truncScrollTop with start and end indices of the current canvas slice
	let currentCanvasConfig = canvasSlices.filter(
		(item) => truncScrollTop >= item.start && truncScrollTop <= item.end
	)[0];

	/**
	 * If there is no currentCanvas then add a blank canavas.
	 * In the mean time we execute a promise that creates 2 offScreencanvas.
	 * When this promise is resolved we draw them on to the canvas.
	 */
	if (currentCanvasConfig === undefined) {
		const promise = new Promise<OffscreenCanvasSlice[]>((resolve) => {
			const tempSlices = [];
			for (
				let i = 0;
				i < 2 * DEFAULT_SLICE_THRESHOLD;
				i += DEFAULT_SLICE_THRESHOLD
			) {
				const [start, end] = findRangeIndices(
					truncScrollTop,
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

						// Make sure to also update the global dataStore.
						dataStore.canvasSlices.push(newCanvas);
					}
				}
			}
			resolve(tempSlices);
		});

		// On resolve we draw
		promise.then((data) => {
			drawOnTargetCanvas(targetCanvas, divScrollTop, data);
		});

		const blankCanvas = createBlankOffscreenCanvas();
		if (blankCanvas) currentCanvasConfig = blankCanvas;
	}

	// We find the canvas limits in terms of scrollHeight i.e. csvData.length * DEFAULT_CELL_DIMS.height
	// So here the canvasLimits gives us the start and end limit from the scrollheight standpoint for the currentCanvas.
	// For example, if scrollTop is 5500 the canvasLimits will be [5000, 10000]
	const canvasLimits = findRangeIndices(
		scrollTop,
		DEFAULT_SLICE_THRESHOLD * DEFAULT_CELL_DIMS.height
	);

	// If it is the first canvas slice then no need of limits
	const currentCanvasStartScrollOffset =
		currentCanvasConfig.start === 0 ? 0 : canvasLimits[0];

	if (canvas) {
		const context = canvas.getContext("2d");

		if (context) {
			context.clearRect(0, 0, 1800, 1000);

			// We start copying the pixel from the currentCanvas to the targetCanvas.
			// This is called blitting.
			// Since the targetCanvas is of size 1800 x 1000 therefore during each scroll we make sure that we extract
			// that amount of portion from the currentCanvas
			context.drawImage(
				currentCanvasConfig.canvas,
				0,
				scrollTop - currentCanvasStartScrollOffset,
				1800,
				1000,
				0,
				0,
				1800,
				1000
			);

			const nextCanvas = canvasSlices.filter(
				(canvas) =>
					canvas.start === currentCanvasConfig.start + DEFAULT_SLICE_THRESHOLD
			)[0];

			// There is a scenario that arise during our implementation which is, whenever the currentCanvas is about to finish
			// then if you scroll down then we see a blank canvas till it current canvas is finished.
			// This happens so because the above drawImage blitting operation is trying to copy pixels which are out of the range
			// of the currentCanvas.
			// To mitigate this I came up with an approach to start drawing the rows of the next canvas. We determine the rows to be
			// drawn from the next canvas using the below diffRegion
			if (scrollTop + 1000 >= currentCanvasConfig.canvas.height && nextCanvas) {
				const diffRegion = {
					sx: 0,
					sy: 0,
					sw: nextCanvas.canvas.width,
					sh: 1000 - (canvasLimits[1] - scrollTop),
					dx: 0,
					dy: canvasLimits[1] - scrollTop,
					dw: nextCanvas.canvas.width,
					dh: 1000 - (canvasLimits[1] - scrollTop),
				};

				context.drawImage(
					nextCanvas.canvas,
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
				const firstSlice = createOffscreenSlice(
					csvData,
					0,
					0,
					DEFAULT_SLICE_THRESHOLD
				);
				const secondSlice = createOffscreenSlice(
					csvData,
					1,
					DEFAULT_SLICE_THRESHOLD,
					DEFAULT_SLICE_THRESHOLD * 2
				);
				if (firstSlice && secondSlice)
					dataStore.canvasSlices = [
						...dataStore.canvasSlices,
						firstSlice,
						secondSlice,
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
