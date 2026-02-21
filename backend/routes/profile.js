const express = require("express");
const router = express.Router();
const authenticateToken = require("../middleware/authenticateToken");
const { poolPromise } = require("../db");
const { getStudentData } = require("../services/studentService");

router.get("/studentInfo", authenticateToken, async (req, res) => {
	const { user_id } = req.user;
	try {
		/* const response = await axios.get(`${BASE_URL}/api/student/${user_id}`);
		return res.status(200).json(response.data); */
		const studentData = await getStudentData(user_id);
		if (!studentData) {
			return res.status(404).json({ message: "ไม่พบข้อมูลนักศึกษา" });
		}
		return res.status(200).json(studentData);
	} catch (err) {
		console.error("เกิดข้อผิดพลาดระหว่างเรียกข้อมูลนักศึกษา:", err);
		return res.status(502).json({ message: "ไม่สามารถเชื่อมต่อกับระบบภายนอกได้" });
	}
});

module.exports = router;
