//services/studentService.js

const express = require("express");
const router = express.Router();
const axios = require("axios");

// 1. สร้างฟังก์ชันแยกออกมา (Function นี้แค่ดึงข้อมูล ไม่เกี่ยวกับ req, res)
const getStudentData = async (studentId) => {
	try {
		// ยิงไปข้างนอก (KPRU API)
		const response = await axios.get(`https://mua.kpru.ac.th/FrontEnd_Tabian/petition/Showstudent/${studentId}`);
		const item = response.data[0];

		if (!item) return null; // กรณีไม่พบข้อมูล

		// Transform Data
		return {
			student_id: item.OLDID,
			PNAME: item.PNAME,
			NAME: item.NAME,
			BDATE: item.BDATE,
			student_name: `${item.PNAME}${item.NAME}`,
			education_level: item.level_type,
			program: `${item.level_name_long} (${item.level_name})`,
			study_group_id: item.GROUP_NO,
			major_id: item.mjcode,
			major_name: item.t_mjname,
			faculty_name: item.faculty_name,
			citizen_id: item.GDNAME,
			fname: item.name,
			lname: item.lname,
			STATUS: item.STATUS,
		};
	} catch (err) {
		console.error("Internal Service Error:", err.message);
		throw err;
	}
};

// 2. ใช้ใน Router (API endpoint เดิม)
router.get("/student/:student_id", async (req, res) => {
	try {
		const data = await getStudentData(req.params.student_id);
		if (!data) return res.status(404).json({ error: "Student not found" });
		res.json(data);
	} catch (err) {
		res.status(500).json({ error: "Internal server error" });
	}
});

// 3. (สำคัญ) Export ฟังก์ชันออกไปใช้ที่อื่นด้วย
module.exports = { router, getStudentData };
