require("dotenv").config();
const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { poolPromise } = require("../db"); // เชื่อมต่อฐานข้อมูล MSSQL
const axios = require("axios");
const SECRET_KEY = process.env.SECRET_KEY;
const authenticateToken = require("../middleware/authenticateToken");

router.post("/login", async (req, res) => {
	const { username, password } = req.body;
	console.log(req.body);

	/* https://mua.kpru.ac.th/FrontEnd_Tabian/login/LoginsAdminTabian/481320117/13-06-30/074726168 */

	/* if (username.length == 9) {
		try {
			const request = await axios.get(`https://mua.kpru.ac.th/FrontEnd_Tabian/login/LoginsAdminTabian/${username}/${password}/074726168`);
			const result = request.data;
			console.log(result[0]);
			if (!result[0].OLDID) {
				return res.status(401).json({ message: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" });
			}
			const token = jwt.sign({ user_id: username, roles: [`student`], role: `student`, name: result[0].Pname + result[0].Name }, SECRET_KEY, { expiresIn: "1h" });
			console.log(token);
			res.status(200).json({ message: "เข้าสู่ระบบสำเร็จ", token, role: `student` });
		} catch (e) {
			console.error("Login error:", e);
			res.status(500).json({ message: "Internal Server Error" });
		}
	} else */

	if (username.length == 9) {
		try {
			const request = await axios.get(`http://localhost:8080/externalApi/student/${username}`);
			const result = request.data;
			console.log(result);
			if (result.student_name === "undefined undefined" || (result.education_level !== "ปริญญาโท" && result.education_level !== "ปริญญาเอก") /* || result.BDATE !== password */) {
				return res.status(401).json({ message: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" });
			}
			const token = jwt.sign({ user_id: username, roles: [`student`], role: `student`, name: result.PNAME + result.NAME }, SECRET_KEY, { expiresIn: "1h" });
			console.log(token);
			res.status(200).json({ message: "เข้าสู่ระบบสำเร็จ", token, role: `student` });
		} catch (e) {
			console.error("Login error:", e);
			res.status(500).json({ message: "Internal Server Error" });
		}
	} else {
		try {
			const loginReq = await fetch("https://mua.kpru.ac.th/FrontEnd_Mis/login/login/074726168", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ txtemail: username, txtpass: password }),
			});
			const loginData = await loginReq.json();
			console.log(loginData[0]);

			if (loginData[0].loginstatus === "0") {
				/* return res.status(401).json({ message: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" }); */
				try {
					const db = await poolPromise;
					const uRes = await db.request().input("username", username).query("SELECT * FROM users WHERE username = @username");
					const u = uRes.recordset[0];
					if (!u) {
						return res.status(401).json({ message: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" });
					}
					const isMatch = await bcrypt.compare(password, u.password);
					if (!isMatch) {
						return res.status(401).json({ message: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" });
					}
					let roles = [];

					for (let i = 0; i < uRes.recordset.length; i++) {
						const role = uRes.recordset[i].role;
						if (role) {
							roles.push(role);
						}
					}

					const check_thesis = await db.request().input("user_id", u.user_id).query("SELECT TOP 1 * FROM request_thesis_proposal WHERE thesis_advisor_id = @user_id");
					if (check_thesis.recordset[0]) {
						roles.push("research_advisor");
					}

					console.log(roles);

					const token = jwt.sign({ user_id: u.user_id.toString(), roles: roles, name: u.name }, SECRET_KEY, { expiresIn: "1h" });
					return res.status(200).json({ message: "เข้าสู่ระบบสำเร็จ", token, role: u.role });
				} catch (e) {
					console.error("Login error:", e);
					return res.status(500).json({ message: "Internal Server Error" });
				}
			}
			let roles = [];

			if (loginData[0].AJStatus === "1") {
				roles.push("advisor");
			}

			const db = await poolPromise;
			const check_thesis = await db.request().input("user_id", username).query("SELECT TOP 1 * FROM request_thesis_proposal WHERE thesis_advisor_id = @user_id");
			if (check_thesis.recordset[0]) {
				roles.push("research_advisor");
			}

			const roleReq = await db.request().input("employee_id", loginData[0].employee_id).query("SELECT * FROM roles WHERE user_id = @employee_id");
			if (roleReq.recordset.length > 0) {
				for (let i = 0; i < roleReq.recordset.length; i++) {
					roles.push(roleReq.recordset[i].role);
				}
			}

			if (loginData[0].organization_id === "0000000007") {
				roles.push("officer_registrar");
			}

			const token = jwt.sign({ user_id: username, roles: roles, name: `${loginData[0].prefix_name}${loginData[0].frist_name} ${loginData[0].last_name}` }, SECRET_KEY, { expiresIn: "1h" });

			res.status(200).json({ message: "เข้าสู่ระบบสำเร็จ", token });
		} catch (e) {
			console.error("Login error:", e);
			res.status(500).json({ message: "Internal Server Error" });
		}
		/* try {
			const db = await poolPromise;
			const uRes = await db.request().input("username", username).query("SELECT * FROM users WHERE username = @username");
			const u = uRes.recordset[0];
			if (!u) {
				return res.status(401).json({ message: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" });
			}
			const isMatch = await bcrypt.compare(password, u.password);
			if (!isMatch) {
				return res.status(401).json({ message: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" });
			}
			let roles = [];

			for (let i = 0; i < uRes.recordset.length; i++) {
				const role = uRes.recordset[i].role;
				if (role) {
					roles.push(role);
				}
			}

			const check_thesis = await db.request().input("user_id", u.user_id).query("SELECT TOP 1 * FROM request_thesis_proposal WHERE thesis_advisor_id = @user_id");
			if (check_thesis.recordset[0]) {
				roles.push("research_advisor");
			}

			console.log(roles);

			const token = jwt.sign(
				{
					user_id: u.user_id.toString(),
					roles: roles, // ,role: u.role //
				},
				SECRET_KEY,
				{ expiresIn: "1h" }
			);
			res.status(200).json({ message: "เข้าสู่ระบบสำเร็จ", token, role: u.role });
		} catch (e) {
			console.error("Login error:", e);
			res.status(500).json({ message: "Internal Server Error" });
		} */
	}
});

router.post("/switchRole", authenticateToken, (req, res) => {
	const { role } = req.body;
	const { user_id, roles, name } = req.user;
	console.log(roles, role);

	if (!roles.includes(role)) {
		return res.status(403).json({ message: "ไม่มีสิทธิ์ role นี้" });
	}
	const newToken = jwt.sign({ user_id, roles, role: role, name: name }, process.env.SECRET_KEY, { expiresIn: "1h" });

	res.json({ token: newToken, activeRole: role });
});

module.exports = router;
