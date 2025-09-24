import { useState, useEffect, useCallback } from "react";
import { MultiSelect } from "@mantine/core";
import debounce from "lodash.debounce";

function AsyncCourseSelect({ form, disabled = false }) {
  const [fullData, setFullData] = useState([]);
  const [data, setData] = useState([]);

  const token = localStorage.getItem("token");

  // โหลดข้อมูลครั้งเดียว
  useEffect(() => {
    const fetchAll = async () => {
      try {
        const res = await fetch("http://localhost:8080/api/allCoures", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        });
        const allCouresData = await res.json();
        if (!res.ok) throw new Error(allCouresData.message);
        setFullData(allCouresData);
        setData(allCouresData.slice(0, 200)); // render แค่ 200 แถวแรกตอนแรก
      } catch (e) {
        console.error(e);
        setFullData([]);
        setData([]);
      }
    };
    fetchAll();
  }, [token]);

  // search filter client-side
  const handleSearchChange = useCallback(
    debounce((query) => {
      if (!query) return setData(fullData.slice(0, 0)); // แสดง top 200 ถ้า search ว่าง
      const filtered = fullData
        .filter(
          (item) =>
            (item?.value || "").toLowerCase().includes(query.toLowerCase()) ||
            (item?.label || "").toLowerCase().includes(query.toLowerCase())
        )
        .slice(0, 50); // render แค่ 200 แถว
      setData(filtered);
    }, 300),
    [fullData]
  );

  return (
    <MultiSelect
      label="รหัสวิชาที่ต้องเรียน"
      searchable
      hidePickedOptions
      data={data}
      onSearchChange={handleSearchChange}
      disabled={disabled}
      {...form.getInputProps("course_id")}
    />
  );
}

export default AsyncCourseSelect;
