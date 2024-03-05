type Cell = {
	width: number;
	height: number;
};

type TableDims = {
	rows: number;
	columns: number;
};

type TableData<T extends object> = Array<T>;

// TODO(Keyur): Infer T from the tableData rather than passing it separately here.
// TODO(Keyur): Declare the types for this class

/**
 * TableDims - The number of actual rows and columns that needs to be drawn.
 */

export class CanvasTable<T extends object> {
	context: CanvasRenderingContext2D;
	tableDims: TableDims;
	cell: Cell;
	data: TableData<T>;

	constructor(
		context: CanvasRenderingContext2D,
		tableDims: TableDims,
		cell: Cell,
		data: TableData<T>
	) {
		this.context = context;
		this.tableDims = tableDims;
		this.cell = cell;
		this.data = data;

		// Default Styles:
		this.context.strokeStyle = "white";
		this.context.lineWidth = 0.2;

		this.context.fillStyle = "white";
		this.context.font = "18px serif";
	}

	drawTable() {
		const { width, height } = this.cell;
		const { rows, columns } = this.tableDims;

		//rows
		for (let i = 0; i < rows; i++) {
			//columns
			for (let j = 0; j < columns; j++) {
				this.context.strokeRect(j * width, i * height, width, height);
			}
		}
	}

	writeTableHeader() {
		const { width, height } = this.cell;
		const { columns } = this.tableDims;

		const columnHeaders = Object.keys(this.data[0]);
		//columns
		for (let j = 0; j < columns; j++) {
			const rawText = columnHeaders[j] as string;

			this.context.fillText(rawText, j * width + 20, height - 10);
		}
	}

	writeInTable() {
		const { width, height } = this.cell;
		const tableData = this.data;
		const dataRows = tableData.length;
		const dataColumns = Object.keys(tableData[0]).length;

		let gridStartRow = 2;

		// This will write the header;
		this.writeTableHeader();

		//dataRows
		for (let i = 0; i < dataRows; i++) {
			//dataColumns
			for (let j = 0; j < dataColumns; j++) {
				const rawText = Object.values(tableData[i])[j] as string;

				const truncatedText = `${rawText.slice(0, 5)}...`;

				const formattedText = rawText.length >= 5 ? truncatedText : rawText;

				this.context.fillText(
					formattedText,
					j * width + 20,
					gridStartRow * height - 10
				);
			}
			gridStartRow++;
		}
	}

	clearTable() {
		const { width, height } = this.cell;
		const { rows, columns } = this.tableDims;

		//rows
		for (let i = 0; i < rows; i++) {
			//columns
			for (let j = 0; j < columns; j++) {
				this.context.clearRect(j * width, i * height, width, height);
			}
		}

		this.drawTable();
	}
}
