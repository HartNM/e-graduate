const express = require("express");
const router = express.Router();
const authenticateToken = require("../middleware/authenticateToken");
const { poolPromise } = require("../db");

router.post("/allTerm", authenticateToken, async (req, res) => {
	try {
		const pool = await poolPromise;
		const request = await pool.request();

		let query = "SELECT * FROM request_exam_info ORDER BY term DESC, year_book DESC";
		const result = await request.query(query);
		const rawData = result.recordset;

		const today = new Date();
		today.setHours(0, 0, 0, 0);

		const getCurriculumStatus = (targetYearBook) => {
			// กรองเอาเฉพาะข้อมูลของหลักสูตรนั้นๆ
			const curriculumRows = rawData.filter((r) => r.year_book === targetYearBook);

			// หาเทอมที่ "กำลังเรียนอยู่" (อยู่ในช่วง term_open - term_close)
			const activeTermRow = curriculumRows.find((item) => {
				const start = new Date(item.term_open_date);
				const end = new Date(item.term_close_date);
				return today >= start && today <= end;
			});

			// ถ้าไม่มี active ให้เอาอันล่าสุดของหลักสูตรนั้น
			const targetRow = activeTermRow || (curriculumRows.length > 0 ? curriculumRows[0] : null);

			let isOpen = false;
			let currentTerm = "";
			let closeDate = null;

			if (targetRow) {
				currentTerm = targetRow.term;

				// เช็คช่วงเวลาเปิดรับคำร้อง (KQ)
				const kqStart = new Date(targetRow.KQ_open_date);
				const kqEnd = new Date(targetRow.KQ_close_date);

				if (today >= kqStart && today <= kqEnd) {
					isOpen = true;

					// จัด Format วันที่ปิดรับคำร้อง
					const options = {
						day: "2-digit",
						month: "2-digit",
						year: "numeric",
						calendar: "buddhist",
						numberingSystem: "latn",
						timeZone: "Asia/Bangkok",
					};
					closeDate = new Intl.DateTimeFormat("th-TH", options).format(kqEnd);
				}
			}

			return { isOpen, currentTerm, closeDate };
		};

		const status67 = getCurriculumStatus("ตั้งแต่ปี 67");
		const statusOld = getCurriculumStatus("ระหว่างปี 57-66");

		const uniqueTerms = [...new Set(rawData.map((item) => item.term))];

		const activeTermRow = rawData.find((item) => {
			const isNewCurriculum = item.year_book === "ตั้งแต่ปี 67";
			if (!isNewCurriculum) return false;

			const startDate = new Date(item.term_open_date);
			const endDate = new Date(item.term_close_date);

			return today >= startDate && today <= endDate;
		});

		let currentTerm = null;
		if (activeTermRow) {
			currentTerm = activeTermRow.term;
		} else if (rawData.length > 0) {
			currentTerm = rawData[0].term;
		}

		console.log(status67);
		console.log(statusOld);
		res.status(200).json({
			statusNew: status67, // สำหรับรหัส 67 ขึ้นไป
			statusOld: statusOld, // สำหรับรหัส 66 ลงมา

			termList: uniqueTerms,
			allData: rawData,
			currentTerm: currentTerm,
		});
	} catch (err) {
		console.error("allTerm:", err);
		res.status(500).json({ message: "เกิดข้อผิดพลาดในการดึงข้อมูลช่วงเวลาการยื่นคำร้อง" });
	}
});

router.post("/checkKQStatus", authenticateToken, async (req, res) => {
	try {
		const { student_id } = req.body;

		if (!student_id) {
			return res.status(400).json({ message: "กรุณาส่งรหัสนักศึกษา" });
		}

		const yearStr = String(student_id).substring(0, 2);
		const yearInt = parseInt(yearStr, 10);

		let targetYearBook = "";
		if (yearInt >= 67) {
			targetYearBook = "ตั้งแต่ปี 67";
		} else {
			targetYearBook = "ระหว่างปี 57-66";
		}

		const pool = await poolPromise;

		const result = await pool.request().input("year_book", targetYearBook).query(`
                SELECT TOP 1 term, KQ_open_date, KQ_close_date
                FROM request_exam_info
                WHERE year_book = @year_book
                AND GETDATE() BETWEEN term_open_date AND term_close_date
                ORDER BY request_exam_info_id DESC
            `);

		let isOpen = false;
		let currentTerm = null;
		let KQ_close_date = null;

		if (result.recordset.length > 0) {
			const row = result.recordset[0];
			currentTerm = row.term;

			const options = {
				day: "2-digit",
				month: "2-digit",
				year: "numeric",
				calendar: "buddhist",
				numberingSystem: "latn",
				timeZone: "Asia/Bangkok",
			};
			const formattedDate = new Intl.DateTimeFormat("th-TH", options).format(new Date(row.KQ_close_date));

			KQ_close_date = formattedDate;

			const today = new Date();
			const startKQ = new Date(row.KQ_open_date);
			const endKQ = new Date(row.KQ_close_date);

			if (today >= startKQ && today <= endKQ) {
				isOpen = true;
			}
		} else {
			const latestTermResult = await pool.request().input("year_book", targetYearBook).query(`SELECT TOP 1 term FROM request_exam_info WHERE year_book = @year_book ORDER BY request_exam_info_id DESC`);

			if (latestTermResult.recordset.length > 0) {
				currentTerm = latestTermResult.recordset[0].term;
			}
		}
		res.status(200).json({
			isOpen: isOpen, // true หรือ false
			currentTerm: currentTerm, // เช่น "2/68"
			KQ_close_date: KQ_close_date,
			studentYear: yearInt, // ส่งกลับไป debug (63)
			curriculum: targetYearBook, // ส่งกลับไป debug (ระหว่างปี 57-66)
		});
	} catch (err) {
		console.error("checkKQStatus:", err);
		res.status(500).json({ message: "เกิดข้อผิดพลาดในการตรวจสอบสถานะ" });
	}
});

router.post("/allRequestExamInfo", authenticateToken, async (req, res) => {
	try {
		const { term, year_book } = req.body; // รับ year_book เพิ่ม
		const pool = await poolPromise;
		const request = await pool.request();
		let query = "SELECT * FROM request_exam_info WHERE 1=1"; // ใช้ WHERE 1=1 เพื่อให้ต่อ String ง่ายขึ้น

		if (term) {
			query += " AND term = @term";
			request.input("term", term);
		}

		// เพิ่มการกรองด้วย year_book
		if (year_book) {
			query += " AND year_book = @year_book";
			request.input("year_book", year_book);
		}

		query += " ORDER BY request_exam_info_id DESC";
		const result = await request.query(query);
		res.status(200).json(result.recordset);
	} catch (err) {
		console.error("requestExamInfoAll:", err);
		res.status(500).json({ message: "เกิดข้อผิดพลาดในการดึงข้อมูลช่วงเวลาการยื่นคำร้อง" });
	}
});

/* router.post("/allRequestExamInfo", authenticateToken, async (req, res) => {
	try {
		const { term } = req.body;
		const pool = await poolPromise;
		const request = await pool.request();
		let query = "SELECT * FROM request_exam_info";
		if (term) {
			query += " WHERE term = @term";
			request.input("term", term);
		}
		query += " ORDER BY request_exam_info_id DESC";
		const result = await request.query(query);
		res.status(200).json(result.recordset);
	} catch (err) {
		console.error("requestExamInfoAll:", err);
		res.status(500).json({ message: "เกิดข้อผิดพลาดในการดึงข้อมูลช่วงเวลาการยื่นคำร้อง" });
	}
}); */

router.post("/addRequestExamInfo", authenticateToken, async (req, res) => {
	try {
		// เพิ่ม year_book เข้ามาในตัวแปรที่รับ
		const { term, year_book, term_open_date, term_close_date, KQ_open_date, KQ_close_date, KQ_exam_date, KQ_exam_end_date, ET_exam_date } = req.body;
		const { user_id } = req.user;
		const pool = await poolPromise;
		await pool
			.request()
			.input("term", term)
			.input("year_book", year_book) // เพิ่ม input parameter
			.input("term_open_date", term_open_date)
			.input("term_close_date", term_close_date)
			.input("KQ_open_date", KQ_open_date)
			.input("KQ_close_date", KQ_close_date)
			.input("KQ_exam_date", KQ_exam_date)
			.input("KQ_exam_end_date", KQ_exam_end_date)
			.input("ET_exam_date", ET_exam_date)
			.input("officer_registrar_id", user_id).query(`
                INSERT INTO request_exam_info (
                term,
                year_book, 
                term_open_date,
                term_close_date,
                KQ_open_date, 
                KQ_close_date, 
                KQ_exam_date, 
                ET_exam_date,
                KQ_exam_end_date,
                officer_registrar_id, 
                info_exam_date 
                ) VALUES ( 
                @term,
                @year_book,
                @term_open_date,
                @term_close_date,
                @KQ_open_date, 
                @KQ_close_date, 
                @KQ_exam_date,
                @KQ_exam_end_date,
                @ET_exam_date,
                @officer_registrar_id, 
                GETDATE() 
            )`); // เพิ่ม @year_book ใน VALUES และ year_book ใน column list
		res.status(200).json({ message: "เพิ่มข้อมูลช่วงเวลาการยื่นคำร้องสอบเรียบร้อยแล้ว" });
	} catch (err) {
		console.error("addRequestExamInfo:", err);
		res.status(500).json({ message: "เกิดข้อผิดพลาดในการเพิ่มข้อมูล" });
	}
});

router.post("/editRequestExamInfo", authenticateToken, async (req, res) => {
	try {
		// เพิ่ม year_book
		const { request_exam_info_id, term, year_book, term_open_date, term_close_date, KQ_open_date, KQ_close_date, KQ_exam_date, KQ_exam_end_date, ET_exam_date } = req.body;
		const pool = await poolPromise;
		await pool
			.request()
			.input("request_exam_info_id", request_exam_info_id)
			.input("term", term)
			.input("year_book", year_book) // เพิ่ม input parameter
			.input("term_open_date", term_open_date)
			.input("term_close_date", term_close_date)
			.input("KQ_open_date", KQ_open_date)
			.input("KQ_close_date", KQ_close_date)
			.input("KQ_exam_date", KQ_exam_date)
			.input("KQ_exam_end_date", KQ_exam_end_date)
			.input("ET_exam_date", ET_exam_date).query(`
                UPDATE request_exam_info 
                SET term = @term,
                    year_book = @year_book,
                    term_open_date = @term_open_date,
                    term_close_date = @term_close_date,
                    KQ_open_date = @KQ_open_date, 
                    KQ_close_date = @KQ_close_date, 
                    KQ_exam_date = @KQ_exam_date, 
                    KQ_exam_end_date = @KQ_exam_end_date,
                    ET_exam_date = @ET_exam_date
                WHERE request_exam_info_id = @request_exam_info_id
            `); // เพิ่ม year_book = @year_book
		res.status(200).json({ message: "แก้ไขข้อมูลเรียบร้อยแล้ว" });
	} catch (err) {
		console.error("requestExamInfoEdit:", err);
		res.status(500).json({ message: "เกิดข้อผิดพลาดระหว่างการแก้ไขข้อมูล" });
	}
});
router.post("/deleteRequestExamInfo", authenticateToken, async (req, res) => {
	try {
		const { request_exam_info_id } = req.body;
		const pool = await poolPromise;
		await pool.request().input("request_exam_info_id", request_exam_info_id).query(`DELETE FROM request_exam_info WHERE request_exam_info_id = @request_exam_info_id`);
		res.status(200).json({ message: "ลบข้อมูลเรียบร้อยแล้ว" });
	} catch (err) {
		console.error("requestExamInfoEdit:", err);
		res.status(500).json({ message: "เกิดข้อผิดพลาดในการลบข้อมูล" });
	}
});

router.get("/checkOpenRequests", async (req, res) => {
	try {
		const { CheckKQ, CheckTerm } = req.body;

		let status = 0;

		const pool = await poolPromise;
		const request = pool.request();
		const result = await request.query(`SELECT * FROM request_exam_info`);

		console.log(result);

		if (CheckKQ) {
		}
		if (CheckTerm) {
		}

		res.status(200).json({ status: status });
	} catch (err) {
		console.error("CheckOpenRequests:", err);
		res.status(500).json({ message: "เกิดข้อผิดพลาดในการดึงข้อมูล" });
	}
});

module.exports = router;

/* const express = require("express");
const router = express.Router();
const authenticateToken = require("../middleware/authenticateToken");
const { poolPromise } = require("../db");

router.post("/allRequestExamInfo", authenticateToken, async (req, res) => {
	try {
		const { term } = req.body;
		const pool = await poolPromise;
		const request = await pool.request();
		let query = "SELECT * FROM request_exam_info";
		if (term) {
			query += " WHERE term = @term";
			request.input("term", term);
		}
		query += " ORDER BY request_exam_info_id DESC";
		const result = await request.query(query);
		res.status(200).json(result.recordset);
	} catch (err) {
		console.error("requestExamInfoAll:", err);
		res.status(500).json({ message: "เกิดข้อผิดพลาดในการดึงข้อมูลช่วงเวลาการยื่นคำร้อง" });
	}
});

router.post("/addRequestExamInfo", authenticateToken, async (req, res) => {
	try {
		const { term, term_open_date, term_close_date, KQ_open_date, KQ_close_date, KQ_exam_date, KQ_exam_end_date, ET_exam_date } = req.body;
		const { user_id } = req.user;
		const pool = await poolPromise;
		await pool
			.request()
			.input("term", term)
			.input("term_open_date", term_open_date)
			.input("term_close_date", term_close_date)
			.input("KQ_open_date", KQ_open_date)
			.input("KQ_close_date", KQ_close_date)
			.input("KQ_exam_date", KQ_exam_date)
			.input("KQ_exam_end_date", KQ_exam_end_date)
			.input("ET_exam_date", ET_exam_date)
			.input("officer_registrar_id", user_id).query(`
				INSERT INTO request_exam_info (
				term,
				term_open_date,
				term_close_date,
				KQ_open_date, 
				KQ_close_date, 
				KQ_exam_date, 
				ET_exam_date,
				KQ_exam_end_date,
				officer_registrar_id, 
				info_exam_date 
				) VALUES ( 
				@term,
				@term_open_date,
				@term_close_date,
				@KQ_open_date, 
				@KQ_close_date, 
				@KQ_exam_date,
				@KQ_exam_end_date,
				@ET_exam_date,
				@officer_registrar_id, 
				GETDATE() 
			)`);
		res.status(200).json({ message: "เพิ่มข้อมูลช่วงเวลาการยื่นคำร้องสอบเรียบร้อยแล้ว" });
	} catch (err) {
		console.error("addRequestExamInfo:", err);
		res.status(500).json({ message: "เกิดข้อผิดพลาดในการเพิ่มข้อมูล" });
	}
});

router.post("/editRequestExamInfo", authenticateToken, async (req, res) => {
	try {
		const { request_exam_info_id, term, term_open_date, term_close_date, KQ_open_date, KQ_close_date, KQ_exam_date, KQ_exam_end_date, ET_exam_date } = req.body;
		const pool = await poolPromise;
		await pool
			.request()
			.input("request_exam_info_id", request_exam_info_id)
			.input("term", term)
			.input("term_open_date", term_open_date)
			.input("term_close_date", term_close_date)
			.input("KQ_open_date", KQ_open_date)
			.input("KQ_close_date", KQ_close_date)
			.input("KQ_exam_date", KQ_exam_date)
			.input("KQ_exam_end_date", KQ_exam_end_date)
			.input("ET_exam_date", ET_exam_date).query(`
                UPDATE request_exam_info 
                SET term = @term,
                    term_open_date = @term_open_date,
                    term_close_date = @term_close_date,
                    KQ_open_date = @KQ_open_date, 
                    KQ_close_date = @KQ_close_date, 
                    KQ_exam_date = @KQ_exam_date, 
                    KQ_exam_end_date = @KQ_exam_end_date,
                    ET_exam_date = @ET_exam_date
                WHERE request_exam_info_id = @request_exam_info_id
            `);
		res.status(200).json({ message: "แก้ไขข้อมูลเรียบร้อยแล้ว" });
	} catch (err) {
		console.error("requestExamInfoEdit:", err);
		res.status(500).json({ message: "เกิดข้อผิดพลาดระหว่างการแก้ไขข้อมูล" });
	}
});

router.post("/deleteRequestExamInfo", authenticateToken, async (req, res) => {
	try {
		const { request_exam_info_id } = req.body;
		const pool = await poolPromise;
		await pool.request().input("request_exam_info_id", request_exam_info_id).query(`DELETE FROM request_exam_info WHERE request_exam_info_id = @request_exam_info_id`);
		res.status(200).json({ message: "ลบข้อมูลเรียบร้อยแล้ว" });
	} catch (err) {
		console.error("requestExamInfoEdit:", err);
		res.status(500).json({ message: "เกิดข้อผิดพลาดในการลบข้อมูล" });
	}
});

router.get("/checkOpenRequests", async (req, res) => {
	try {
		const { CheckKQ, CheckTerm } = req.body;

		let status = 0;

		const pool = await poolPromise;
		const request = pool.request();
		const result = await request.query(`SELECT * FROM request_exam_info`);

		console.log(result);

		if (CheckKQ) {
		}
		if (CheckTerm) {
		}

		res.status(200).json({ status: status });
	} catch (err) {
		console.error("CheckOpenRequests:", err);
		res.status(500).json({ message: "เกิดข้อผิดพลาดในการดึงข้อมูล" });
	}
});

module.exports = router;
 */
