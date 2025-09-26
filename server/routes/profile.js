const express = require("express");
const router = express.Router();
const authenticateToken = require("../middleware/authenticateToken");
const { poolPromise } = require("../db");
const axios = require("axios");

/* router.get("/profile", authenticateToken, async (req, res) => {
	const { reference_id, role } = req.user;
	if (reference_id.length == 9) {
		// นักศึกษา
		try {
			const studentRes = await axios.get(`http://localhost:8080/externalApi/student/${reference_id}`);
			const studentInfo = studentRes.data;
			return res.status(200).json({
				name: studentInfo.student_name,
				role: "student",
				id: studentInfo.student_id,
				education_level: studentInfo.education_level,
			});
		} catch (err) {
			console.warn(`ดึงข้อมูลนักเรียนไม่สำเร็จ: ${reference_id}`);
			return res.status(502).json({ message: "ไม่สามารถเชื่อมต่อกับระบบภายนอกได้" }); // Bad Gateway
		}
	} else {
		// บุคลากร
		const tableMap = {
			advisor: {
				table: "advisor",
				idCol: "advisor_id",
				nameCol: "advisor_name",
				idSea: "study_group_id",
			},
			chairpersons: {
				table: "chairpersons",
				idCol: "chairpersons_id",
				nameCol: "chairpersons_name",
				idSea: "major_name",
			},
			dean: {
				table: "dean",
				idCol: "dean_id",
				nameCol: "dean_name",
				idSea: "faculty_name",
			},
			officer_registrar: {
				table: "officer_registrar",
				idCol: "officer_registrar_id",
				nameCol: "officer_registrar_name",
			},
			officer_major: {
				table: "officer_major",
				idCol: "officer_major_id",
				nameCol: "officer_major_name",
				idSea: "major_name",
			},
		};
		const roleInfo = tableMap[role];
		if (!roleInfo) {
			return res.status(400).json({ message: "บทบาทผู้ใช้งานไม่ถูกต้อง" });
		}
		try {
			let selectCols = `${roleInfo.nameCol} AS name`;
			if (roleInfo.idSea) {
				selectCols += `, ${roleInfo.idSea} AS id`;
			}
			const pool = await poolPromise;
			const result = await pool.request().input("id", reference_id).query(`SELECT ${selectCols} FROM ${roleInfo.table} WHERE ${roleInfo.idCol} = @id`);
			if (result.recordset.length === 0) {
				return res.status(404).json({ message: "ไม่พบข้อมูลผู้ใช้งาน" });
			}
			return res.status(200).json({
				name: result.recordset[0].name,
				role: role,
				id: result.recordset[0].id,
			});
		} catch (err) {
			console.error("เกิดข้อผิดพลาดระหว่างดึงข้อมูลบุคลากร:", err);
			return res.status(500).json({ message: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์" });
		}
	}
});
*/

router.get("/profile", authenticateToken, async (req, res) => {
	const { user_id } = req.user;
	if (user_id.length == 9) {
		try {
			const studentRes = await axios.get(`http://localhost:8080/externalApi/student/${user_id}`);
			const studentInfo = studentRes.data;
			return res.status(200).json({
				name: studentInfo.student_name,
				education_level: studentInfo.education_level,
			});
		} catch (err) {
			console.warn(`ดึงข้อมูลนักเรียนไม่สำเร็จ: ${user_id}`);
			return res.status(502).json({ message: "ไม่สามารถเชื่อมต่อกับระบบภายนอกได้" }); // Bad Gateway
		}
	} else {
		try {
			const pool = await poolPromise;
			const result = await pool.request().input("user_id", user_id).query(`SELECT * FROM users WHERE user_id = @user_id`);
			if (result.recordset.length === 0) {
				return res.status(404).json({ message: "ไม่พบข้อมูลผู้ใช้งาน" });
			}
			return res.status(200).json({
				name: result.recordset[0].name,
			});
		} catch (err) {
			console.error("เกิดข้อผิดพลาดระหว่างดึงข้อมูลบุคลากร:", err);
			return res.status(500).json({ message: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์" });
		}
	}
});

router.get("/studentInfo", authenticateToken, async (req, res) => {
	const { user_id } = req.user;
	try {
		const response = await axios.get(`http://localhost:8080/externalApi/student/${user_id}`);
		return res.status(200).json(response.data);
	} catch (err) {
		console.error("เกิดข้อผิดพลาดระหว่างเรียกข้อมูลนักศึกษา:", err);
		return res.status(502).json({ message: "ไม่สามารถเชื่อมต่อกับระบบภายนอกได้" });
	}
});

router.get("/checkStudent", authenticateToken, async (req, res) => {
	const { user_id } = req.user;
	try {
		const pool = await poolPromise;
		const student = await axios.get(`http://localhost:8080/externalApi/student/${user_id}`);
		const request_exam = await pool.request().input("user_id", user_id).query(`SELECT status, exam_results FROM request_exam WHERE student_id = @user_id ORDER BY request_exam_id DESC`);
		const latest_request_exam = request_exam.recordset[0] || null;

		const Proposal = await pool.request().input("user_id", user_id).query(`SELECT status FROM request_thesis_proposal WHERE student_id = @user_id ORDER BY request_thesis_proposal_id DESC`);
		const latest_Proposal = Proposal.recordset[0] || null;

		const Defense = await pool.request().input("user_id", user_id).query(`SELECT status FROM request_thesis_defense WHERE student_id = @user_id ORDER BY request_thesis_defense_id DESC`);
		const latest_defense = Defense.recordset[0] || null;

		const Plagiarism = await pool.request().input("user_id", user_id).query(`SELECT status FROM plagiarism_report WHERE student_id = @user_id ORDER BY plagiarism_report_id DESC`);
		const latest_Plagiarism = Plagiarism.recordset[0] || null;

		return res.status(200).json({
			/* education_level: student.data.education_level,
			RequestExamCancel: latest_request_exam ? latest_request_exam.status !== "6" && latest_request_exam.exam_results === null : false,
			//รอผล RequestExamCancel
			RequestThesisProposal: latest_request_exam ? latest_request_exam.status === "5" && latest_request_exam.exam_results === "ผ่าน" : false,
			PostponeProposalExam: latest_Proposal ? latest_Proposal.status >= "5"  : false,
			PlagiarismProposal: latest_Proposal ? latest_Proposal.status === "5" : false,
			//รอผล RequestThesisProposal
			RequestThesisDefense: latest_Proposal ? latest_Proposal.status === "5" : false,
			PostponeDefenseExam: latest_defense ? latest_defense.status >= "5" : false,
			PlagiarismDefense: latest_defense ? latest_defense.status === "5" : false,
			//PlagiarismReport: latest_Proposal ? latest_Proposal.status === "5" : false,

			//รอผล RequestThesisDefense
			RequestGraduation: latest_defense ? latest_defense.status === "5" : false, */

			education_level: student.data.education_level,
			RequestExamCancel: true,
			RequestThesisProposal: true,
			PostponeProposalExam: true,
			PlagiarismProposal: true,
			RequestThesisDefense: true,
			PostponeDefenseExam: true,
			PlagiarismDefense: true,
			RequestGraduation: true,
		});
	} catch (err) {
		console.error(err);
		return res.status(502).json({ message: "ไม่สามารถเชื่อมต่อกับระบบภายนอกได้" });
	}
});

module.exports = router;
