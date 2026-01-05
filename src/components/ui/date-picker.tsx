import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { Controller } from "react-hook-form";
import { Label } from "@/components/ui/label";
interface CustomDatePickerProps {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	control: any; // Accept any control type for flexibility with react-hook-form
	name: string;
	label: string;
	placeholder?: string;
	disabled?: boolean;
	defaultValue?: string;
	disableBefore?: Date; // New optional prop
	disableAfter?: Date; // New optional prop
}

export function CustomDatePicker({
	control,
	name,
	label,
	placeholder = "Pick a date",
	disabled = false,
	defaultValue,
	disableBefore, // New prop
	disableAfter, // New prop
}: CustomDatePickerProps) {
	const getDisabledDates = (date: Date) => {
		let isDisabled = false;

		// Disable dates before disableBefore
		if (disableBefore && date < disableBefore) {
			isDisabled = true;
		}

		// Disable dates after disableAfter
		if (disableAfter && date > disableAfter) {
			isDisabled = true;
		}

		// // Always disable dates before 1900
		// if (date < new Date("1900-01-01")) {
		// 	isDisabled = true;
		// }

		return isDisabled;
	};

	return (
		<Controller
			control={control}
			name={name}
			defaultValue={defaultValue as string | undefined}
			render={({ field, fieldState }) => (
				<div className="flex flex-col space-y-2">
					{label && <Label>{label}</Label>}
					<Popover>
						<PopoverTrigger asChild>
							<Button
								type="button"
								variant={"outline"}
								className={cn(
									"w-full pl-3 text-left font-normal",
									!field.value && "text-muted-foreground",
									disabled && "opacity-50 cursor-not-allowed",
									fieldState.error && "border-destructive"
								)}
								disabled={disabled}
							>
								{field.value && typeof field.value === 'string' ? (
									format(new Date(field.value), "PPP")
								) : (
									<span>{placeholder}</span>
								)}
								<CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
							</Button>
						</PopoverTrigger>
						<PopoverContent
							className="w-auto p-0"
							align="start"
							side="bottom"
							avoidCollisions={true}
							sideOffset={4}
						>
							<div className="bg-background rounded-md border shadow-md">
								<Calendar
									mode="single"
									selected={field.value && typeof field.value === 'string' ? new Date(field.value) : undefined}
									onSelect={(date) => {
										if (date) {
											// Format the selected date to ISO format (YYYY-MM-DD) for form compatibility
											const formattedDate = format(date, "yyyy-MM-dd");
											field.onChange(formattedDate);
										} else {
											field.onChange(undefined);
										}
									}}
									disabled={getDisabledDates} // Use disabled function
									autoFocus
									captionLayout="dropdown"
									startMonth={new Date(1900, 0)}
									endMonth={new Date(new Date().getFullYear() + 20, 11)} // Allow 20 years into the future
									className="p-3"
									classNames={{
										months:
											"flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
										month: "space-y-4",
										caption: "flex justify-center relative items-center p-4",
										nav: "space-x-1 flex items-center",
										nav_button: cn(
											"h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
										),
										nav_button_previous: "absolute left-1",
										nav_button_next: "absolute right-1",
										table: "w-full border-collapse space-y-1",
										head_row: "flex",
										head_cell:
											"text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
										row: "flex w-full mt-2",
										cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
										day: cn(
											"h-9 w-9 p-0 font-normal aria-selected:opacity-100"
										),
										day_selected:
											"bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
										day_today: "bg-accent text-accent-foreground",
										day_outside:
											"day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground",
										day_disabled: "text-muted-foreground opacity-50",
										day_range_middle:
											"aria-selected:bg-accent aria-selected:text-accent-foreground",
										day_hidden: "invisible",
									}}
								/>
								<div className="flex justify-end p-3 border-t">
									<Button
										type="button"
										variant="ghost"
										size="sm"
										onClick={() => field.onChange(undefined)}
									>
										Clear
									</Button>
									<Button
										type="button"
										size="sm"
										className="ml-2"
										onClick={() => {
											const popover = document.querySelector(
												'[data-state="open"]'
											);
											if (popover) {
												(popover as HTMLElement).click(); // Close the popover
											}
										}}
									>
										Done
									</Button>
								</div>
							</div>
						</PopoverContent>
					</Popover>
					{fieldState.error && (
						<p className="text-sm text-destructive">{fieldState.error.message}</p>
					)}
				</div>
			)}
		/>
	);
}

export default CustomDatePicker;
