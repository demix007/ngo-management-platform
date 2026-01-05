import {
	type ColumnDef,
	flexRender,
	type Table as ReactTable,
} from "@tanstack/react-table";

import { Table, TableBody, TableCell, TableHeader, TableRow } from "../table";
import { SimpleSpinnerPage } from "../spinner/Spinner";
import { Button } from "@/components/ui/button";

interface DataTableProps<TData, TValue> {
	columns: ColumnDef<TData, TValue>[];
	table: ReactTable<TData>;
	loading?: boolean;
	refetch?: () => void;
}
export function DataTable<TData, TValue>({
	columns,
	table,
	loading,
}: DataTableProps<TData, TValue>) {
	return (
		<>
			{/* Table */}
			<div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
				<div className="max-w-full overflow-x-auto">
					<div className="min-w-[1102px]">
						<Table>
							<TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
								{table.getHeaderGroups().map((headerGroup) => (
									<TableRow key={headerGroup.id}>
										{headerGroup.headers.map((header) => (
											<TableCell
												key={header.id}
												isHeader
												className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
											>
												{flexRender(
													header.column.columnDef.header,
													header.getContext()
												)}
											</TableCell>
										))}
									</TableRow>
								))}
							</TableHeader>
							<TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
								{loading ? (
									<TableRow
										className={
											"bg-white px-3 border border-[#EAECF0] border-x-0 py-10"
										}
									>
										<TableCell
											className="px-3 py-3 text-sm align-middle"
											colSpan={columns.length ?? 4}
										>
											<div className="flex items-center justify-center p-10 py-20">
												<SimpleSpinnerPage />
											</div>
										</TableCell>
									</TableRow>
								) : table.getRowModel().rows.length > 0 ? (
									table.getRowModel().rows.map((row) => (
										<TableRow key={row.id} className="border">
											{row.getVisibleCells().map((cell) => (
												<TableCell
													className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400"
													key={cell.id}
												>
													{flexRender(
														cell.column.columnDef.cell,
														cell.getContext()
													)}
												</TableCell>
											))}
										</TableRow>
									))
								) : (
									<TableRow>
										<TableCell
											colSpan={columns.length}
											className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400"
										>
											No results found.
										</TableCell>
									</TableRow>
								)}
							</TableBody>
						</Table>
					</div>
				</div>
			</div>

			{/* Pagination Controls */}

			<div className="flex items-center justify-between mt-6 px-2">
				{/* Page Info */}
				<div className="text-sm text-gray-600 dark:text-gray-400">
					Showing page {table.getState().pagination.pageIndex + 1} of{" "}
					{table.getPageCount()}
				</div>

				{/* Navigation Buttons */}
				<div className="flex items-center gap-2">
					<Button
						onClick={() => table.previousPage()}
						disabled={!table.getCanPreviousPage()}
						className="flex items-center justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg shadow-theme-xs hover:bg-gray-50 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white transition-colors duration-200"
					>
						<svg
							className="w-4 h-4 mr-2"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M15 19l-7-7 7-7"
							/>
						</svg>
						Previous
					</Button>

					{/* Page Numbers (Optional) */}
					{table.getPageCount() > 1 && (
						<div className="hidden sm:flex items-center gap-1">
							{Array.from(
								{ length: Math.min(5, table.getPageCount()) },
								(_, i) => {
									const pageIndex = i;
									return (
										<Button
											key={i}
											onClick={() => table.setPageIndex(pageIndex)}
											className={`w-8 h-8 flex items-center justify-center text-sm font-medium rounded-lg border transition-colors duration-200 ${
												table.getState().pagination.pageIndex === pageIndex
													? "bg-blue-600 border-blue-600 text-white dark:bg-blue-500 dark:border-blue-500"
													: "bg-white border-gray-300 text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700"
											}`}
										>
											{pageIndex + 1}
										</Button>
									);
								}
							)}
							{table.getPageCount() > 5 && (
								<span className="px-2 text-gray-500 dark:text-gray-400">
									...
								</span>
							)}
						</div>
					)}

					<Button
						onClick={() => table.nextPage()}
						disabled={!table.getCanNextPage()}
						className="flex items-center justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg shadow-theme-xs hover:bg-gray-50 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white transition-colors duration-200"
					>
						Next
						<svg
							className="w-4 h-4 ml-2"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M9 5l7 7-7 7"
							/>
						</svg>
					</Button>
				</div>
			</div>
		</>
	);
}

export default DataTable;
