import { CanvasTable } from "./Table";
import {
	DEFAULT_CELL_DIMS,
	DEFAULT_COLUMN_LENGTH,
	DEFAULT_HEADER_HEIGHT,
	DEFAULT_SLICE_THRESHOLD,
} from "./constants";

// ======================== TYPINGS START =========================
type OffscreenCanvasSlice = {
	index: number;
	start: number;
	end: number;
	canvas: OffscreenCanvas;
};

type TDataStore = {
	canvasSlices: OffscreenCanvasSlice[];
} & Omit<GenerateAndDrawEvent, "type" | "csvData">;

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

const createOffscreenSlices = (csvData: TCustomData[]) => {
	const offScreenCanvasSlices: OffscreenCanvasSlice[] = [];

	for (let i = 0; i < csvData.length; i += DEFAULT_SLICE_THRESHOLD) {
		const slicedData = csvData.slice(i, i + DEFAULT_SLICE_THRESHOLD);

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

			const currentIdx =
				offScreenCanvasSlices.length > 0
					? offScreenCanvasSlices[offScreenCanvasSlices.length - 1].index + 1
					: 0;

			offScreenCanvasSlices.push({
				index: currentIdx,
				start: i,
				end: i + DEFAULT_SLICE_THRESHOLD,
				canvas: backupCanvas,
			});
		}
	}
	return offScreenCanvasSlices;
};

const drawOnTargetCanvas = (
	targetCanvas: OffscreenCanvas | null,
	divScrollTop: number,
	canvasSlices: OffscreenCanvasSlice[]
) => {
	const scrollTop =
		divScrollTop === 0 ? 0 : divScrollTop - DEFAULT_HEADER_HEIGHT;
	const canvas = targetCanvas;
	/**
	 * When the scroll top reaches the 90% of the end limit of dataSetLimits then we increment it by 5000
	 */
	const trunScrollTop = Math.trunc(scrollTop / 50);

	// if (trunScrollTop >= 0.8 * end) {
	// 	setDataStartLimit(dataStartLimit + DEFAULT_SLICE_THRESHOLD);
	// 	setDataEndLimit(dataEndLimit + DEFAULT_SLICE_THRESHOLD);
	// }

	const currentCanvasConfig = canvasSlices.filter(
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

		if (context) {
			context.clearRect(0, 0, 1800, 1000);

			// TODO(Keyur): Solve the problem of canvas redrawing at the same location on mount;
			context.drawImage(
				currentCanvasConfig.canvas,
				0,
				scrollTop - lastScrollOffset,
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
};

onmessage = (e: MessageEvent<WorkerProps>) => {
	const { type } = e.data;

	switch (type) {
		case "generate-data-draw": {
			const { targetCanvas, csvData } = e.data;
			if (targetCanvas && csvData) {
				const canvasSlices = createOffscreenSlices(csvData);
				dataStore.canvasSlices = canvasSlices;
				dataStore.targetCanvas = targetCanvas;
				drawOnTargetCanvas(targetCanvas, 0, canvasSlices);
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

	console.log("Outside of onMessage = ", dataStore);
};
