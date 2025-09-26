const express = require("express");
const router = express.Router();
const authenticateToken = require("../middleware/authenticateToken");
const { poolPromise } = require("../db");
const axios = require("axios");

const fs = require("fs");
const path = require("path");
const multer = require("multer");
const { v4: uuidv4 } = require("uuid");
const storage = multer.diskStorage({
	destination: function (req, file, cb) {
		cb(null, "uploads/");
	},
	filename: function (req, file, cb) {
		const ext = path.extname(file.originalname);
		cb(null, `${file.fieldname}-${uuidv4()}${ext}`);
	},
});
const upload = multer({ storage });

const dayjs = require("dayjs");
const utc = require("dayjs/plugin/utc");
const timezone = require("dayjs/plugin/timezone");
dayjs.extend(utc);
dayjs.extend(timezone);

function formatDateThaiBE(date) {
	if (!date) return null;
	const d = dayjs(date).tz("Asia/Bangkok");
	const buddhistYear = d.year() + 543;
	return `${buddhistYear}-${(d.month() + 1).toString().padStart(2, "0")}-${d.date().toString().padStart(2, "0")}`;
}

function formatDateForDB(date = new Date()) {
	return dayjs(date).tz("Asia/Bangkok").format("YYYY-MM-DD HH:mm:ss");
}

const statusMap = {
	1: "รออาจารย์ที่ปรึกษาอนุมัติ",
	2: "รอประธานหลักสูตรอนุมัติ",
	5: "อนุมัติ",
	6: "ไม่อนุมัติ",
};

router.post("/AllPlagiarismProposal", authenticateToken, async (req, res) => {
	const { user_id, role } = req.user;
	try {
		const pool = await poolPromise;
		const request = pool.request().input("user_id", user_id);
		let query = "SELECT * FROM plagiarism_proposal";
		if (role === "student") {
			query += " WHERE student_id = @user_id";
		} else if (role === "advisor") {
			query += " WHERE thesis_advisor_id = @user_id";
		} else if (role === "chairpersons") {
			query +=
				" WHERE major_id IN (SELECT major_id FROM users WHERE user_id = @user_id) AND (status IN (0, 2, 3, 4, 5, 7, 8, 9) OR (status = 6 AND advisor_approvals_id IS NOT NULL AND chairpersons_approvals_id IS NOT NULL))";
		}
		query += " ORDER BY plagiarism_report_id DESC";
		const result = await request.query(query);
		const enrichedData = await Promise.all(
			result.recordset.map(async (item) => {
				let studentInfo = null;
				try {
					const studentRes = await axios.get(`http://localhost:8080/externalApi/student/${item.student_id}`);
					studentInfo = studentRes.data;
				} catch (e) {
					console.warn(item.student_id, e);
				}

				return {
					...item,
					...studentInfo,
					request_date: item.request_date || null,
					advisor_approvals_date: item.advisor_approvals_date || null,
					chairpersons_approvals_date: item.chairpersons_approvals_date || null,
					inspection_date: result.recordset[0].inspection_date,
					status_text: statusMap[item.status?.toString()] || null,
					request_type: item.request_type || null,
				};
			})
		);
		res.status(200).json(enrichedData);
	} catch (err) {
		console.error("AllPlagiarismReport:", err);
		res.status(500).json({ message: "เกิดข้อผิดพลาดในการดึงข้อมูลคำร้อง" });
	}
});

// ตั้งค่าโฟลเดอร์ฐานที่อนุญาตให้อ่านไฟล์
const UPLOAD_ROOT = path.resolve(process.cwd(), "uploads"); // ให้ตรงกับ multer.diskStorage().destination
router.get("/plagiarism-proposal/:id/plagiarism-file", authenticateToken, async (req, res) => {
	await sendPdfByType(req, res, "plagiarism_file");
});
router.get("/plagiarism-proposal/:id/full-report-file", authenticateToken, async (req, res) => {
	await sendPdfByType(req, res, "full_report_file");
});
async function sendPdfByType(req, res, field) {
	try {
		const id = req.params.id;
		const pool = await poolPromise;
		const q = await pool.request().input("id", id).query(`SELECT ${field} FROM plagiarism_proposal WHERE plagiarism_report_id = @id`);
		if (!q.recordset?.length) {
			return res.status(404).json({ message: "ไม่พบรายการ" });
		}
		const rawPath = q.recordset[0][field];
		if (!rawPath) {
			return res.status(404).json({ message: "ยังไม่มีไฟล์สำหรับรายการนี้" });
		}
		let cleanPath = rawPath.replace(/^uploads[\/\\]/, "");
		let absPath = path.resolve(UPLOAD_ROOT, cleanPath);
		if (!fs.existsSync(absPath)) {
			return res.status(404).json({ message: "ไม่พบไฟล์" });
		}
		res.setHeader("Content-Type", "application/pdf");
		res.setHeader("Content-Disposition", "inline; filename=" + path.basename(absPath));
		const stream = fs.createReadStream(absPath);
		stream.pipe(res);
	} catch (err) {
		console.error("sendPdfByType error:", err);
		res.status(500).json({ message: "ไม่สามารถอ่านไฟล์ได้" });
	}
}

router.post(
	"/addPlagiarismProposal",
	authenticateToken,
	upload.fields([
		{ name: "plagiarism_file", maxCount: 1 },
		{ name: "full_report_file", maxCount: 1 },
	]),
	async (req, res) => {
		try {
			const plagiarismFilePath = req.files["plagiarism_file"]?.[0]?.path || null;
			const fullReportFilePath = req.files["full_report_file"]?.[0]?.path || null;
			const { student_id, study_group_id, major_id, faculty_name, request_type, research_name, thesis_advisor_id, chapter_1, chapter_2, chapter_3, inspection_date, request_thesis_proposal_id } =
				req.body;
			console.log(req.body);

			const pool = await poolPromise;
			const infoRes = await pool.request().query(`SELECT TOP 1 *
			FROM request_exam_info
			WHERE CAST(GETDATE() AS DATE) BETWEEN KQ_open_date AND KQ_close_date
			ORDER BY request_exam_info_id DESC`);

			const result = await pool
				.request()
				.input("request_thesis_proposal_id", request_thesis_proposal_id)
				.input("student_id", student_id)
				.input("study_group_id", study_group_id)
				.input("research_name", research_name)
				.input("thesis_advisor_id", thesis_advisor_id)
				.input("major_id", major_id)
				.input("faculty_name", faculty_name)
				.input("request_thesis_type", request_type)
				.input("term", infoRes.recordset[0].term)
				.input("request_date", formatDateForDB())
				.input("status", "1")
				.input("chapter_1", chapter_1)
				.input("chapter_2", chapter_2)
				.input("chapter_3", chapter_3)
				.input("inspection_date", inspection_date)
				.input("plagiarism_file", plagiarismFilePath)
				.input("full_report_file", fullReportFilePath).query(`INSERT INTO plagiarism_proposal (
					request_thesis_proposal_id,
					student_id,
					study_group_id,
					research_name,
					thesis_advisor_id,
					major_id,
					faculty_name,
					request_thesis_type,
					term,
					request_date,
					status,
					chapter_1,
					chapter_2,
					chapter_3,
					inspection_date,
					plagiarism_file,
					full_report_file
				) OUTPUT INSERTED.* VALUES (
				 	@request_thesis_proposal_id,
					@student_id,
					@study_group_id,
					@research_name,
					@thesis_advisor_id,
					@major_id,
					@faculty_name,
					@request_thesis_type,
					@term,
					@request_date,
					@status,
					@chapter_1,
					@chapter_2,
					@chapter_3,
					@inspection_date,
					@plagiarism_file,
					@full_report_file)`);
			await pool.request().input("research_name", research_name).input("request_thesis_proposal_id", request_thesis_proposal_id).query(`
					UPDATE request_thesis_proposal
					SET research_name = @research_name
					WHERE request_thesis_proposal_id = @request_thesis_proposal_id
				`);
			res.status(200).json({
				message: "บันทึกคำร้องขอสอบเรียบร้อยแล้ว",
				data: {
					...result.recordset[0],
					status_text: statusMap[result.recordset[0].status?.toString()],
					request_date: result.recordset[0].request_date,
					inspection_date: result.recordset[0].inspection_date,
				},
			});
		} catch (err) {
			console.error("addRequestExam:", err);
			res.status(500).json({ message: "เกิดข้อผิดพลาดในการบันทึกคำร้องขอสอบ" });
		}
	}
);

router.post("/approvePlagiarismProposal", authenticateToken, async (req, res) => {
	const { plagiarism_report_id, selected, comment } = req.body;
	const { user_id, role } = req.user;
	try {
		let statusValue = "";
		if (selected === "approve") {
			if (role === "advisor") {
				statusValue = "2";
			} else {
				statusValue = "5";
			}
		} else {
			statusValue = "6";
		}
		const pool = await poolPromise;
		const request = pool
			.request()
			.input("plagiarism_report_id", plagiarism_report_id)
			.input("status", statusValue)
			.input("user_id", user_id)
			.input("approve", selected === "approve" ? 1 : 0)
			.input("date", formatDateForDB())
			.input("comment", comment);
		const roleFields = {
			advisor: `
				advisor_approvals_id = @user_id,
				advisor_approvals = @approve,
				advisor_approvals_date = @date
			`,
			chairpersons: `
				chairpersons_approvals_id = @user_id,
				chairpersons_approvals = @approve,
				chairpersons_approvals_date = @date
			`,
		};
		const query = `
			UPDATE plagiarism_proposal
			SET ${roleFields[role]},
				status = @status
				${selected !== "approve" ? ", comment = @comment" : ""}
			OUTPUT INSERTED.*
			WHERE plagiarism_report_id = @plagiarism_report_id
			`;
		const result = await request.query(query);
		try {
			const advisorRes = await axios.get(`http://localhost:8080/externalApi/user_idGetUser_name/${result.recordset[0].advisor_approvals_id}`);
			advisorInfo = advisorRes.data;
		} catch (e) {
			console.warn(item.advisor_approvals_id, e);
		}
		try {
			const chairpersonsRes = await axios.get(`http://localhost:8080/externalApi/user_idGetUser_name/${result.recordset[0].chairpersons_approvals_id}`);
			chairpersonsInfo = chairpersonsRes.data;
		} catch (e) {
			console.warn(item.chairpersons_approvals_id, e);
		}

		res.status(200).json({
			message: "บันทึกผลการอนุมัติคำร้องขอสอบเรียบร้อยแล้ว",
			data: {
				...result.recordset[0],
				status_text: statusMap[result.recordset[0].status?.toString()] || null,
				request_date: result.recordset[0].request_date || null,
				advisor_approvals_name: advisorInfo.name,
				advisor_approvals_date: result.recordset[0].advisor_approvals_date || null,
				chairpersons_approvals_name: chairpersonsInfo.name,
				chairpersons_approvals_date: result.recordset[0].chairpersons_approvals_date || null,
				registrar_approvals_date: result.recordset[0].registrar_approvals_date || null,
				receipt_pay_date: result.recordset[0].receipt_pay_date || null,
				inspection_date: result.recordset[0].inspection_date,
			},
		});
	} catch (err) {
		console.error("Error approving request:", err);
		res.status(500).json({ message: "เกิดข้อผิดพลาดในการประมวลผลการอนุมัติ" });
	}
});
module.exports = router;
