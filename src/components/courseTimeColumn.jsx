import { View } from "@tarojs/components";
import TimeSlot from "./courseTimeSlot";

export default function TimeColumn({ timeTable }) {
	return (
		<>
			{timeTable.map((item, idx) => (
				<TimeSlot
					key={`time-${idx}`}
					startTime={item.startTime}
					endTime={item.endTime}
					order={`${item.jc}`}
					style={{
						gridColumn: 1,
						gridRow: idx + 1,
						height: "13px",
					}}
				/>
			))}
		</>
	);
}
