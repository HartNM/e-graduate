require("dotenv").config();
const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { poolPromise } = require("../db"); // เชื่อมต่อฐานข้อมูล MSSQL
const axios = require("axios");
const SECRET_KEY = process.env.SECRET_KEY;

router.post("/login", async (req, res) => {
	const { username, password } = req.body;
	if (username.length == 9) {
		try {
			const request = await axios.get(`http://localhost:8080/externalApi/student/${username}`);
			const result = request.data;

			if (result.student_name === "undefined undefined" || (result.education_level !== "ปริญญาโท" && result.education_level !== "ปริญญาเอก")) {
				return res.status(401).json({ message: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" });
			}
			/* console.log(result);
			if (result.BDATE !== password) {
				return res.status(401).json({ message: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" });
			} */
			const token = jwt.sign({ reference_id: username, role: "student" }, SECRET_KEY, { expiresIn: "1h" });
			res.status(200).json({ message: "เข้าสู่ระบบสำเร็จ", token, role: "student" });
		} catch (err) {
			console.error("Login error:", err);
			res.status(500).json({ message: "Internal Server Error" });
		}
	} else {
		try {
			const pool = await poolPromise;
			const result = await pool.request().input("username", username).query("SELECT * FROM user_account WHERE username = @username");
			const user = result.recordset[0];
			if (!user) {
				return res.status(401).json({ message: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" });
			}
			const isMatch = await bcrypt.compare(password, user.password);
			if (!isMatch) {
				return res.status(401).json({ message: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" });
			}
			const token = jwt.sign({ reference_id: user.reference_id, role: user.role }, SECRET_KEY, { expiresIn: "1h" });
			res.status(200).json({ message: "เข้าสู่ระบบสำเร็จ", token, role: user.role });
		} catch (err) {
			console.error("Login error:", err);
			res.status(500).json({ message: "Internal Server Error" });
		}
	}
});

/* router.post("/login", async (req, res) => {
	const { username, password } = req.body;
	if (username.length == 9) {
		try {
			const request = await axios.get(`http://localhost:8080/externalApi/student/${username}`);
			const result = request.data;

			if (result.student_name === "undefined undefined" || (result.education_level !== "ปริญญาโท" && result.education_level !== "ปริญญาเอก")) {
				return res.status(401).json({ message: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" });
			}
			const token = jwt.sign({ UserId: username, roles: [`student`] }, SECRET_KEY, { expiresIn: "1h" });
			console.log(token);
			res.status(200).json({ message: "เข้าสู่ระบบสำเร็จ", token, roles: [`student`] });
		} catch (err) {
			console.error("Login error:", err);
			res.status(500).json({ message: "Internal Server Error" });
		}
	} else {
		try {
			const db = await poolPromise;
			const uRes = await db.request().input("username", username).query("SELECT * FROM Users WHERE username = @username");
			const u = uRes.recordset[0];
			if (!u) {
				return res.status(401).json({ message: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" });
			}
			const ok = await bcrypt.compare(password, u.Password);
			if (!ok) {
				return res.status(401).json({ message: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" });
			}
			const rRes = await db.request().input("uid", u.UserId).query("SELECT Role FROM UserRoles WHERE UserId = @uid");
			const roles = rRes.recordset.map((r) => r.Role);
			const token = jwt.sign({ UserId: u.UserId, roles }, SECRET_KEY, { expiresIn: "1h" });

			res.status(200).json({ message: "เข้าสู่ระบบสำเร็จ", token, roles });
		} catch (err) {
			console.error("Login error:", err);
			res.status(500).json({ message: "Internal Server Error" });
		}
	}
}); */

module.exports = router;
