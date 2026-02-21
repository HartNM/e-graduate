const express = require("express");
const router = express.Router();
const { sql, poolPromise } = require("../db");
const authenticateToken = require("../middleware/authenticateToken");

router.get("/test", async (req, res) => {
	res.status(200).json("test");
});

router.get("/testdb", async (req, res) => {
	const pool = await poolPromise;
	const request = pool.request();
	const request_exam = await request.query(`SELECT * FROM request_exam`);
	const request_exam_cancel = await request.query(`SELECT * FROM request_exam_cancel`);
	const request_eng_test = await request.query(`SELECT * FROM request_eng_test`);
	const request_thesis_proposal = await request.query(`SELECT * FROM request_thesis_proposal`);
	const request_thesis_defense = await request.query(`SELECT * FROM request_thesis_proposal`);

	const result = (request_exam.recordset, request_exam_cancel.recordset, request_eng_test.recordset, request_thesis_proposal.recordset, request_thesis_defense.recordset);
	res.status(200).json(result);
});
const axios = require("axios");

const getActiveTermsInfo = async () => {
	const pool = await poolPromise;
	const result = await pool.request().query(`
        SELECT term, year_book 
        FROM request_exam_info 
        WHERE CAST(GETDATE() AS DATE) BETWEEN term_open_date AND term_close_date
    `);
	console.log(result.recordset);

	return result.recordset;
};

router.get("/countRequest", authenticateToken, async (req, res) => {
	const { role, major_ids, user_id } = req.user;
	let { type, term, status } = req.query;

	const validTables = ["request_exam", "request_exam_cancel", "request_eng_test", "request_thesis_proposal", "request_thesis_defense"];
	if (!type || !validTables.includes(type)) {
		return res.status(400).json({ count: 0, message: "Invalid type" });
	}

	try {
		const pool = await poolPromise;
		const request = pool.request();

		// 1. 🏗️ สร้าง Base Query และกำหนดตัวแปรชื่อคอลัมน์
		// R = ตารางหลัก (Main Request), E = ตารางข้อมูลสอบ (Exam Info)
		let query = "";

		// ถ้าเป็น "คำร้องขอยกเลิก" (ไม่มี major_id/term ในตัว) -> ต้อง JOIN
		if (type === "request_exam_cancel") {
			query = `
                SELECT COUNT(*) as count 
                FROM request_exam_cancel R
                INNER JOIN request_exam E ON R.request_exam_id = E.request_exam_id
                WHERE 1=1
            `;
		}
		// ถ้าเป็น "คำร้องทั่วไป" (มีข้อมูลครบในตัว) -> ไม่ต้อง JOIN
		else {
			query = `
                SELECT COUNT(*) as count 
                FROM ${type} R
                -- ใช้ E เป็น Alias เดียวกับ R เพื่อให้ Logic ข้างล่างใช้ตัวแปรเดียวกันได้
                CROSS APPLY (SELECT R.*) AS E 
                WHERE 1=1
            `;
		}

		// --- 🟢 2. จัดการเงื่อนไข Term และ รหัสนักศึกษา (Year Book) ---
		// ใช้ E.term และ E.student_id (เพราะตาราง Cancel ไม่มีคอลัมน์นี้)
		if (term) {
			request.input("term_val", term);
			query += ` AND E.term = @term_val`;
		} else {
			const activeTerms = await getActiveTermsInfo();
			if (activeTerms.length > 0) {
				const termConditions = activeTerms
					.map((t, i) => {
						const tParam = `t_${i}`;
						request.input(tParam, t.term);

						if (t.year_book.includes("ตั้งแต่ปี 67")) {
							return `(E.term = @${tParam} AND LEFT(E.student_id, 2) >= '67')`;
						} else if (t.year_book.includes("57-66")) {
							return `(E.term = @${tParam} AND LEFT(E.student_id, 2) BETWEEN '57' AND '66')`;
						}
						return `(E.term = @${tParam})`;
					})
					.join(" OR ");

				query += ` AND (${termConditions})`;
			} else {
				return res.json({ count: 0 });
			}
		}

		// --- 🟡 3. เงื่อนไข Role (เช็คที่ E เหมือนกัน) ---
		if (role === "student") {
			// ✅ เพิ่มเงื่อนไขสำหรับนักศึกษา: เช็ค user_id ให้ตรงกับ student_id
			request.input("std_id", user_id);
			query += ` AND E.student_id = @std_id`;
		} else if (role === "advisor") {
			const apiResponse = await axios.post("https://mua.kpru.ac.th/FrontEnd_Tabian/apiforall/FindGroup", { ID_TEACHER: user_id });
			const groupNumbers = apiResponse.data.map((item) => item.GROUP_NO);
			if (groupNumbers.length === 0) return res.json({ count: 0 });

			request.input("groupNumbers", groupNumbers.join(","));
			query += ` AND E.study_group_id IN (SELECT value FROM STRING_SPLIT(@groupNumbers, ','))`;
		} else if (role === "officer_major" || role === "chairpersons") {
			if (!major_ids || major_ids.length === 0) return res.json({ count: 0 });
			request.input("m_ids", major_ids.join(","));
			query += ` AND E.major_id IN (SELECT value FROM STRING_SPLIT(@m_ids, ','))`;
		}

		// --- 🔴 4. เงื่อนไข Status (เช็คที่ R เพราะสถานะการยกเลิกอยู่ที่ตาราง Cancel) ---
		if (status) {
			request.input("st_val", status);
			query += ` AND R.status = @st_val`;
		} else {
			const defaults = { advisor: "1", chairpersons: "2", officer_major: "5", officer_registrar: "3", dean: "2" };
			// *หมายเหตุ: คณบดี (Dean) อาจจะต้องดูสถานะเฉพาะสำหรับ Cancel
			query += ` AND R.status = '${defaults[role] || "0"}'`;
		}

		// กรองรายการที่ผลสอบออกแล้ว (เฉพาะตารางที่มีผลสอบ)
		if (["request_exam", "request_thesis_proposal", "request_thesis_defense"].includes(type)) {
			// ตาราง Cancel ไม่มี exam_results ดังนั้นเช็คที่ E (ถ้าเป็นประเภท Cancel E คือ request_exam)
			query += ` AND E.exam_results IS NULL`;
		}

		const result = await request.query(query);
		res.status(200).json({ count: result.recordset[0].count });
	} catch (err) {
		console.error("Count Error:", err);
		res.status(500).json({ count: 0 });
	}
});

/* router.get("/countRequest", authenticateToken, async (req, res) => {
	const { role, major_ids, user_id } = req.user;
	let { type, term, status } = req.query;

	const validTables = ["request_exam", "request_exam_cancel", "request_eng_test", "request_thesis_proposal", "request_thesis_defense"];
	if (!type || !validTables.includes(type)) {
		return res.status(400).json({ count: 0, message: "Invalid type" });
	}

	try {
		const pool = await poolPromise;
		const request = pool.request();
		let query = `SELECT COUNT(*) as count FROM ${type} WHERE 1=1`;

		if (term) {
			request.input("term_val", term);
			query += ` AND term = @term_val`;
		} else {
			const activeTerms = await getActiveTermsInfo();
			if (activeTerms.length > 0) {
				const termConditions = activeTerms
					.map((t, i) => {
						const tParam = `t_${i}`;
						request.input(tParam, t.term);
						if (t.year_book.includes("ตั้งแต่ปี 67")) {
							return `(term = @${tParam} AND LEFT(student_id, 2) >= '67')`;
						} else if (t.year_book.includes("57-66")) {
							return `(term = @${tParam} AND LEFT(student_id, 2) BETWEEN '57' AND '66')`;
						}
						return `(term = @${tParam})`;
					})
					.join(" OR ");

				query += ` AND (${termConditions})`;
			} else {
				return res.json({ count: 0 });
			}
		}

		if (["request_exam", "request_thesis_proposal", "request_thesis_defense"].includes(type)) {
			query += ` AND exam_results IS NULL`;
		}

		if (role === "advisor") {
			const apiResponse = await axios.post("https://mua.kpru.ac.th/FrontEnd_Tabian/apiforall/FindGroup", {
				ID_TEACHER: user_id,
			});
			const groupNumbers = apiResponse.data.map((item) => item.GROUP_NO);
			if (groupNumbers.length === 0) return res.json({ count: 0 });

			request.input("groupNumbers", groupNumbers.join(","));
			query += ` AND study_group_id IN (SELECT value FROM STRING_SPLIT(@groupNumbers, ','))`;
		} else if (role === "chairpersons" || role === "officer_major") {
			if (!major_ids || major_ids.length === 0) return res.json({ count: 0 });

			request.input("major_ids_str", major_ids.join(","));
			query += ` AND major_id IN (SELECT value FROM STRING_SPLIT(@major_ids_str, ','))`;
		} else if (role === "officer_registrar") {
		} else {
			return res.json({ count: 0 });
		}

		if (status) {
			request.input("status_val", status);
			query += ` AND status = @status_val`;
		} else {
			const defaults = { advisor: "1", chairpersons: "2", officer_major: "5", officer_registrar: "3" };
			query += ` AND status = '${defaults[role]}'`;
		}

		const result = await request.query(query);
		res.status(200).json({ count: result.recordset[0].count });
	} catch (err) {
		console.error("Count Error:", err);
		res.status(500).json({ count: 0 });
	}
}); */

module.exports = router;
