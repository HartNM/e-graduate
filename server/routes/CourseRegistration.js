const express = require("express");
const router = express.Router();
const authenticateToken = require("../middleware/authenticateToken");
const { poolPromise } = require("../db");
const axios = require("axios");

router.post("/EditCourseRegistration", authenticateToken, async (req, res) => {
	const { id, selectedSubjects } = req.body;
	try {
		const pool = await poolPromise;
		await pool.request().input("id", id).input("course_id", JSON.stringify(selectedSubjects)).query(`
			UPDATE course_registration 
			SET course_id = @course_id
			WHERE id = @id`);
		res.status(200).json({ message: "บันทึกข้อมูลเรียบร้อยแล้ว" });
	} catch (err) {
		console.error("requestExamInfoAll:", err);
		res.status(500).json({ error: "เกิดข้อผิดพลาดในการดึงข้อมูล" });
	}
});

router.post("/AllCourseRegistration", authenticateToken, async (req, res) => {
	const { id } = req.body;

	try {
		const pool = await poolPromise;
		const result = await pool.request().input("id", id).query(`SELECT * FROM course_registration WHERE major_name = @id`);

		const formatted = result.recordset.map((row) => ({
			...row,
			course_id: JSON.parse(row.course_id),
		}));
		res.status(200).json(formatted);
	} catch (err) {
		console.error("requestExamInfoAll:", err);
		res.status(500).json({ error: "เกิดข้อผิดพลาดในการดึงข้อมูล" });
	}
});

router.post("/AddCourseRegistration", authenticateToken, async (req, res) => {
	const { selectedMajor, selectedGroup, selectedSubjects } = req.body;
	const { reference_id } = req.user;

	try {
		const pool = await poolPromise;
		const request = pool.request();
		await request
			.input("major_name", selectedMajor)
			.input("study_group_id", selectedGroup)
			.input("course_id", JSON.stringify(selectedSubjects))
			.input("officer_faculty_id", reference_id)
			.input("course_registration_date", new Date()).query(`
        INSERT INTO course_registration ( 
            major_name, 
            study_group_id, 
            course_id,
            officer_faculty_id,
            course_registration_date
        ) VALUES ( 
            @major_name, 
            @study_group_id, 
            @course_id,
            @officer_faculty_id, 
            @course_registration_date
        )`);
		res.status(201).json({ message: "บันทึกข้อมูลเรียบร้อยแล้ว" });
	} catch (err) {
		console.error("addRequestExamInfo:", err);
		res.status(500).json({ error: "เกิดข้อผิดพลาดในการบันทึกข้อมูล" });
	}
});

module.exports = router;
