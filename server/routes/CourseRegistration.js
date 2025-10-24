const express = require("express");
const router = express.Router();
const authenticateToken = require("../middleware/authenticateToken");
const { poolPromise } = require("../db");

router.post("/allCourses", authenticateToken, async (req, res) => {
	try {
		const pool = await poolPromise;
		const result = await pool.request().query(`SELECT * FROM courses`);
		const formatted = result.recordset.map((row) => ({
			value: row.course_id, // ใช้เป็น key
			label: `${row.course_id} - ${row.course_name}`, // แสดงผล
		}));
		res.status(200).json(formatted);
	} catch (e) {
		console.error("addCourseRegistration:", e);
		res.status(500).json({ message: "เกิดข้อผิดพลาดในการดึงข้อมูล" });
	}
});

router.post("/officerGetMajor_id", authenticateToken, async (req, res) => {
	const { user_id } = req.body;
	try {
		const pool = await poolPromise;	
		const result = await pool.request().input("user_id", user_id).query(`SELECT major_id FROM users WHERE user_id = @user_id`);
		res.status(200).json(result.recordset[0]);
	} catch (e) {
		console.error("addCourseRegistration:", e);
		res.status(500).json({ message: "เกิดข้อผิดพลาดในการบันทึกข้อมูล" });
	}
});

router.post("/major_idGetMajor_name", authenticateToken, async (req, res) => {
	const { major_id } = req.body;
	try {
		const pool = await poolPromise;
		const result = await pool.request().input("major_id", major_id).query(`SELECT major_name FROM majors WHERE major_id = @major_id`);
		res.status(200).json(result.recordset[0]);
	} catch (e) {
		console.error("addCourseRegistration:", e);
		res.status(500).json({ message: "เกิดข้อผิดพลาดในการบันทึกข้อมูล" });
	}
});

router.post("/Course", authenticateToken, async (req, res) => {
	let { course_id } = req.body;
	try {
		const pool = await poolPromise;
		let result;
		if (course_id && course_id.length > 0) {
			const params = course_id.map((id, index) => `@id${index}`).join(", ");
			const request = pool.request();
			course_id.forEach((id, index) => {
				request.input(`id${index}`, id);
			});
			result = await request.query(`SELECT * FROM courses WHERE course_id IN (${params})`);
		} else {
			result = await pool.request().query("SELECT * FROM courses");
		}
		res.json(result.recordset);
	} catch (e) {
		console.error("Course:", e);
		res.status(500).json({ message: "เกิดข้อผิดพลาดในการดึงข้อมูล" });
	}
});

router.post("/addCourseRegistration", authenticateToken, async (req, res) => {
	const { course_id, major_id, study_group_id } = req.body;
	try {
		const pool = await poolPromise;
		const check = await pool.request().input("study_group_id", study_group_id).query(`SELECT COUNT(*) as count FROM course_registration WHERE study_group_id = @study_group_id`);
		if (check.recordset[0].count > 0) {
			return res.status(400).json({ message: "หมู่เรียนนี้มีอยู่แล้ว ไม่สามารถเพิ่มได้" });
		}
		for (let i = 0; i < course_id.length; i++) {
			await pool.request().input("major_id", major_id).input("study_group_id", study_group_id).input("course_id", course_id[i]).query(`
                INSERT INTO course_registration (major_id, study_group_id, course_id)
                VALUES (@major_id, @study_group_id, @course_id)
            `);
		}
		res.status(201).json({ message: "บันทึกข้อมูลเรียบร้อยแล้ว" });
	} catch (e) {
		console.error("addCourseRegistration:", e);
		res.status(500).json({ message: "เกิดข้อผิดพลาดในการบันทึกข้อมูล" });
	}
});

router.post("/editCourseRegistration", authenticateToken, async (req, res) => {
	const { course_id, major_id, study_group_id } = req.body;
	try {
		const pool = await poolPromise;
		await pool.request().input("study_group_id", study_group_id).query(`DELETE FROM course_registration WHERE study_group_id = @study_group_id`);
		for (let i = 0; i < course_id.length; i++) {
			await pool.request().input("major_id", major_id).input("study_group_id", study_group_id).input("course_id", course_id[i]).query(`
			INSERT INTO course_registration (major_id, study_group_id, course_id)
			VALUES (@major_id, @study_group_id, @course_id)
			`);
		}
		res.status(200).json({ message: "แก้ไขข้อมูลเรียบร้อย" });
	} catch (e) {
		console.error("editCourseRegistration:", e);
		res.status(500).json({ message: "เกิดข้อผิดพลาดในการแก้ไขข้อมูล" });
	}
});

router.post("/deleteCourseRegistration", authenticateToken, async (req, res) => {
	const { study_group_id } = req.body;
	try {
		const pool = await poolPromise;
		await pool.request().input("study_group_id", study_group_id).query(`DELETE FROM course_registration WHERE study_group_id = @study_group_id`);
		res.status(200).json({ message: "ลบข้อมูลเรียบร้อย" });
	} catch (e) {
		console.error("deleteCourseRegistration:", e);
		res.status(500).json({ message: "เกิดข้อผิดพลาดในการลบข้อมูล" });
	}
});

router.post("/allMajorCourseRegistration", authenticateToken, async (req, res) => {
	const { user_id } = req.user;
	try {
		const pool = await poolPromise;
		const result = await pool.request().input("user_id", user_id).query(`SELECT * FROM course_registration WHERE major_id IN (SELECT major_id FROM users WHERE user_id = @user_id)`);

		const data = result.recordset;
		if (data.length === 0) {
			return res.status(200).json([]);
		}
		const grouped = {};
		data.forEach((item) => {
			if (!grouped[item.study_group_id]) {
				grouped[item.study_group_id] = {
					major_id: item.major_id,
					study_group_id: item.study_group_id,
					course_id: [],
				};
			}
			grouped[item.study_group_id].course_id.push(item.course_id);
		});
		const formatted = Object.values(grouped);
		res.status(200).json(formatted);
	} catch (e) {
		console.error("allMajorCourseRegistration:", e);
		res.status(500).json({ message: "เกิดข้อผิดพลาดในการดึงข้อมูล" });
	}
});

router.post("/allStudyGroupIdCourseRegistration", authenticateToken, async (req, res) => {
	const study_group_id = req.user.user_id.slice(0, -2);
	try {
		const pool = await poolPromise;
		const result = await pool.request().input("study_group_id", study_group_id).query(`SELECT * FROM course_registration WHERE study_group_id = @study_group_id`);
		const data = result.recordset;
		if (data.length === 0) return res.status(200).json(null);
		const formatted = {
			major_id: data[0].major_id,
			study_group_id: data[0].study_group_id,
			course_id: data.map((item) => item.course_id),
		};
		console.log(formatted);
		res.status(200).json(formatted);
	} catch (e) {
		console.error("allStudyGroupIdCourseRegistration:", e);
		res.status(500).json({ message: "เกิดข้อผิดพลาดในการดึงข้อมูล" });
	}
});
module.exports = router;
