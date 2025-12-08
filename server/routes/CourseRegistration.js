const express = require("express");
const router = express.Router();
const authenticateToken = require("../middleware/authenticateToken");
const { poolPromise } = require("../db");

// --- Helper Functions ---

// แปลงข้อมูลจาก Database ให้เป็น Format ที่ Frontend ต้องการ (จัดกลุ่มตาม study_group_id)
const processGroupedData = (data) => {
	const grouped = {};
	data.forEach((item) => {
		if (!grouped[item.study_group_id]) {
			grouped[item.study_group_id] = {
				major_id: item.major_id,
				study_group_id: item.study_group_id,
				course_id: [], // Usage 1
				course_first: [], // Usage 2
				course_last: [], // Usage 3
			};
		}

		// แปลง usage เป็น int เพื่อความชัวร์ก่อนเช็ค
		const usage = parseInt(item.usage);
		if (usage === 1) grouped[item.study_group_id].course_id.push(item.course_id);
		else if (usage === 2) grouped[item.study_group_id].course_first.push(item.course_id);
		else if (usage === 3) grouped[item.study_group_id].course_last.push(item.course_id);
	});
	return Object.values(grouped);
};

// --- Routes ---

router.post("/allMajorCourseRegistration", authenticateToken, async (req, res) => {
	const { major_ids, role } = req.user;
	const usage = req.body.usage;

	try {
		const pool = await poolPromise;
		const request = pool.request();

		const usageStr = usage.join(",");
		request.input("usage_str", usageStr);

		let sqlQuery = `
            SELECT * FROM course_registration 
            WHERE usage IN (SELECT value FROM STRING_SPLIT(@usage_str, ','))
        `;

		if (role === "officer_major") {
			const idsStr = major_ids && major_ids.length > 0 ? major_ids.join(",") : "";
			request.input("major_ids_str", idsStr);
			sqlQuery += ` AND major_id IN (SELECT value FROM STRING_SPLIT(@major_ids_str, ','))`;
		}

		const result = await request.query(sqlQuery);
		const data = result.recordset;

		if (data.length === 0) return res.status(200).json([]);

		// ใช้ Helper จัดรูปแบบข้อมูล
		const formatted = processGroupedData(data);
		res.status(200).json(formatted);
	} catch (e) {
		console.error("allMajorCourseRegistration:", e);
		res.status(500).json({ message: "เกิดข้อผิดพลาดในการดึงข้อมูล" });
	}
});

router.post("/addCourseRegistration", authenticateToken, async (req, res) => {
	const { course_id, course_first, course_last, major_id, study_group_id } = req.body;

	try {
		const pool = await poolPromise;

		// เตรียม Tasks
		const tasks = [
			{ usage: 1, courses: course_id },
			{ usage: 2, courses: course_first },
			{ usage: 3, courses: course_last },
		].filter((task) => task.courses && task.courses.length > 0);

		if (tasks.length === 0) {
			return res.status(400).json({ message: "ไม่พบข้อมูลรายวิชาที่ต้องการบันทึก" });
		}

		// 1. Check Duplicates
		for (const task of tasks) {
			const check = await pool
				.request()
				.input("study_group_id", study_group_id)
				.input("usage", task.usage)
				.query(`SELECT COUNT(*) as count FROM course_registration WHERE study_group_id = @study_group_id AND usage = @usage`);

			if (check.recordset[0].count > 0) {
				return res.status(400).json({ message: `หมู่เรียนนี้มีรายวิชาประเภทนี้อยู่แล้ว` });
			}
		}

		// 2. Insert Data
		for (const task of tasks) {
			for (const cid of task.courses) {
				await pool.request().input("major_id", major_id).input("study_group_id", study_group_id).input("course_id", cid).input("usage", task.usage).query(`
                        INSERT INTO course_registration (major_id, study_group_id, course_id, usage)
                        VALUES (@major_id, @study_group_id, @course_id, @usage)
                    `);
			}
		}

		res.status(201).json({ message: "บันทึกข้อมูลเรียบร้อยแล้ว" });
	} catch (e) {
		console.error("addCourseRegistration:", e);
		res.status(500).json({ message: "เกิดข้อผิดพลาดในการบันทึกข้อมูล" });
	}
});

router.post("/editCourseRegistration", authenticateToken, async (req, res) => {
	const { course_id, course_first, course_last, major_id, study_group_id } = req.body;

	try {
		const pool = await poolPromise;

		const tasks = [
			{ usage: 1, courses: course_id },
			{ usage: 2, courses: course_first },
			{ usage: 3, courses: course_last },
		];

		for (const task of tasks) {
			// ถ้าเป็น undefined แปลว่าไม่ต้องการแก้ส่วนนี้ (ข้ามไป)
			if (task.courses !== undefined) {
				// 1. ลบข้อมูลเก่า
				await pool.request().input("study_group_id", study_group_id).input("usage", task.usage).query(`DELETE FROM course_registration WHERE study_group_id = @study_group_id AND usage = @usage`);

				// 2. เพิ่มข้อมูลใหม่ (ถ้า Array ไม่ว่าง)
				if (task.courses.length > 0) {
					for (const cid of task.courses) {
						await pool.request().input("major_id", major_id).input("study_group_id", study_group_id).input("course_id", cid).input("usage", task.usage).query(`
                                INSERT INTO course_registration (major_id, study_group_id, course_id, usage)
                                VALUES (@major_id, @study_group_id, @course_id, @usage)
                            `);
					}
				}
			}
		}

		res.status(200).json({ message: "แก้ไขข้อมูลเรียบร้อย" });
	} catch (e) {
		console.error("editCourseRegistration:", e);
		res.status(500).json({ message: "เกิดข้อผิดพลาดในการแก้ไขข้อมูล" });
	}
});

router.post("/deleteCourseRegistration", authenticateToken, async (req, res) => {
	let { study_group_id, usage } = req.body;

	try {
		const pool = await poolPromise;
		const request = pool.request();

		request.input("study_group_id", study_group_id);

		let sqlQuery = `DELETE FROM course_registration WHERE study_group_id = @study_group_id`;

		// Check usage input (Optional delete)
		if (usage) {
			if (usage.length > 0) {
				request.input("usage_str", usage.join(","));
				sqlQuery += ` AND usage IN (SELECT value FROM STRING_SPLIT(@usage_str, ','))`;
			}
		}

		await request.query(sqlQuery);
		res.status(200).json({ message: "ลบข้อมูลเรียบร้อย" });
	} catch (e) {
		console.error("deleteCourseRegistration:", e);
		res.status(500).json({ message: "เกิดข้อผิดพลาดในการลบข้อมูล" });
	}
});

router.post("/allStudyGroupIdCourseRegistration", authenticateToken, async (req, res) => {
	const study_group_id = req.user.user_id.slice(0, -2);
	const usage = req.body.usage; // ใช้ Helper

	try {
		const pool = await poolPromise;

		const result = await pool.request().input("study_group_id", study_group_id).input("usage_str", usage.join(",")).query(`
                SELECT * FROM course_registration 
                WHERE study_group_id = @study_group_id 
                AND usage IN (SELECT value FROM STRING_SPLIT(@usage_str, ','))
            `);

		const data = result.recordset;

		if (data.length === 0) {
			return res.status(403).json({ message: "รอเจ้าหน้าที่ประกรอกรายวิชาบังคับ" });
			//return res.status(403).json({ message: "รอเจ้าหน้าที่ประจำสาขากรอกรายวิชาบังคับ" });
		}

		// ใช้ Logic จัดกลุ่มเดียวกับ Route แรก แต่ดึงเอาแค่ตัวแรก (เพราะ Query มาเฉพาะ Study Group เดียว)
		const formattedArray = processGroupedData(data);
		const formatted = formattedArray.length > 0 ? formattedArray[0] : {};

		console.log(formatted);
		res.status(200).json(formatted);
	} catch (e) {
		console.error("allStudyGroupIdCourseRegistration:", e);
		res.status(500).json({ message: "เกิดข้อผิดพลาดในการดึงข้อมูล" });
	}
});

module.exports = router;

/* router.post("/allStudyGroupIdCourseRegistration", authenticateToken, async (req, res) => {
	const study_group_id = req.user.user_id.slice(0, -2);
	try {
		const pool = await poolPromise;
		const result = await pool.request().input("study_group_id", study_group_id).query(`SELECT * FROM course_registration WHERE study_group_id = @study_group_id AND usage = 1`);
		const data = result.recordset;
		if (data.length === 0) return res.status(403).json({ message: "รอเจ้าหน้าที่ประจำสาขากรอกรายวิชาบังคับ" });
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
}); */
