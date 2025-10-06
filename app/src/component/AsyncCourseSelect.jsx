import { useState, useEffect, useCallback } from "react";
import { MultiSelect } from "@mantine/core";
import debounce from "lodash.debounce";

function AsyncCourseSelect({ form, disabled = false, fullCourses }) {
	const [data, setData] = useState([]);
	// โหลดข้อมูลครั้งเดียว
	// search filter client-side
	const handleSearchChange = useCallback(
		debounce((query) => {
			if (!query) return setData(fullCourses.slice(0, 0));
			const filtered = fullCourses.filter((item) => (item?.value || "").toLowerCase().includes(query.toLowerCase()) || (item?.label || "").toLowerCase().includes(query.toLowerCase())).slice(0, 50); // render แค่ 200 แถว
			setData(filtered);
		}, 300),
		[fullCourses]
	);

	return <MultiSelect label="รหัสวิชาที่ต้องเรียน" searchable hidePickedOptions data={data} onSearchChange={handleSearchChange} disabled={disabled} {...form.getInputProps("course_id")} />;
}

export default AsyncCourseSelect;
