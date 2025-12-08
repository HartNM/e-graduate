/* 
$center = $data[0]['codeOrg'];
$citizent = $data[0]['citizen_id'];
$_POST['orderRef1'] = $_POST['orderRef1'];
$_POST['name'] = $data[0]['FULLNAME'].$data[0]['FRISTNAME_LOGIN'];
$_POST['lname'] = $data[0]['LASTNAME_LOGIN'];
$_POST['amount'] = $data[0]['amount'];
$add1 = $data[0]['message3_1'];
$add2 = $data[0]['message3_2'];
$add3 = $data[0]['message3_3'];
$NameOther1 = $data[0]['title_1'];
$NameOther1_2 = $data[0]['title_2'];
$NameOther1_3 = $data[0]['title_3'];
$NameOther1_4 = $data[0]['title_4'];
$NameOther1_5 = $data[0]['title_5'];
$NameOther1_6 = $data[0]['title_6'];
$NameOther1_7 = $data[0]['title_7'];
$NameOther1_8 = $data[0]['title_8'];
$NameOther1_9 = $data[0]['title_9'];
$NameOther1_10 = $data[0]['title_10'];
$NameOther1_11 = $data[0]['title_11'];
$NameOther1_12 = $data[0]['title_12'];
$NameOther1_13 = $data[0]['title_13'];
$NameOther1_14 = $data[0]['title_14'];
$NameOther1_15 = $data[0]['title_15'];
$NameOther1_16 = $data[0]['title_16']; */

const express = require("express");
const router = express.Router();
const authenticateToken = require("../middleware/authenticateToken");
const { poolPromise } = require("../db");
const axios = require("axios");
const BASE_URL = process.env.VITE_API_URL;

router.post("/printReceipt", authenticateToken, async (req, res) => {
	const { citizen_id, student_id, fname, lname, amount, request_type } = req.body;
	console.log(req.body);

	const center = "-";
	const citizent = citizen_id;
	const orderRef1 = student_id;
	const name = fname;
	/* const lname = "";
    const amount = ""; */
	const add1 = "-";
	const add2 = "-";
	const add3 = "-";
	const NameOther1 = `ชำระค่า${request_type}`;
	const NameOther1_2 = `ค่า${request_type} ${amount} บาท`;
	const NameOther1_3 = "-";
	const NameOther1_4 = "-";
	const NameOther1_5 = "-";
	const NameOther1_6 = "-";
	const NameOther1_7 = "-";
	const NameOther1_8 = "-";
	const NameOther1_9 = "-";
	const NameOther1_10 = "-";
	const NameOther1_11 = "-";
	const NameOther1_12 = "-";
	const NameOther1_13 = "-";
	const NameOther1_14 = "-";
	const NameOther1_15 = "-";
	const NameOther1_16 = "-";

	const url = `${BASE_URL}/api/paytest?center=${center}&citizent=${citizent}&_POST['orderRef1']=${orderRef1}&_POST['name']=${name}&_POST['lname']=${lname}&_POST['amount']=${amount}&add1=${add1}&add2=${add2}&add3=${add3}&NameOther1=${NameOther1}&NameOther1_2=${NameOther1_2}&NameOther1_3=${NameOther1_3}&NameOther1_4=${NameOther1_4}&NameOther1_5=${NameOther1_5}&NameOther1_6=${NameOther1_6}&NameOther1_7=${NameOther1_7}&NameOther1_8=${NameOther1_8}&NameOther1_9=${NameOther1_9}&NameOther1_10=${NameOther1_10}&NameOther1_11=${NameOther1_11}&NameOther1_12=${NameOther1_12}&NameOther1_13=${NameOther1_13}&NameOther1_14=${NameOther1_14}&NameOther1_15=${NameOther1_15}&NameOther1_16=${NameOther1_16}`;
	console.log(url);

	res.status(200).json({ message: "บันทึกผลสอบเรียบร้อยแล้ว" });
});

router.get("/paytest", async (req, res) => {
	try {
		// 1. ดูข้อมูลทั้งหมดที่ได้รับ
		// req.query จะเก็บทุกอย่างที่อยู่หลัง ?
		console.log("Query Data Received:", req.query);

		// 2. ดึงค่าที่ต้องการ
		// สำหรับ parameter ทั่วไป
		const citizenId = req.query.citizent; // (คุณพิมพ์ citizent ไม่ใช่ citizen)

		// 3. สำหรับ parameter ที่มีชื่อแปลกๆ (มี ' )
		// ต้องใช้ Bracket Notation (วงเล็บเหลี่ยม) ในการเข้าถึง
		const orderRef = req.query["_POST['orderRef1']"];
		const name = req.query["_POST['name']"];
		const lname = req.query["_POST['lname']"];
		const amount = req.query["_POST['amount']"];

		// 4. พิมพ์ค่าที่ดึงออกมาดู
		console.log("Citizen ID:", citizenId);
		console.log("Order Ref:", orderRef);
		console.log("Name:", name);
		console.log("Amount:", amount);

		// 5. ตอบกลับ (สำคัญมากสำหรับ API callback)
		// ระบบชำระเงินมักจะคาดหวังการตอบกลับที่สำเร็จ
		// (คุณอาจจะต้องตอบกลับเป็น "OK" หรือ JSON ตามที่คู่มือกำหนด)
		res.status(200).json(
			req.query /* {
			message: "Payment data received successfully.",
			receivedData: {
				citizenId: citizenId,
				orderRef: orderRef,
				name: name,
				lname: lname,
				amount: amount,
			},
		} */
		);
	} catch (error) {
		console.error("Error processing payment callback:", error);
		// ตอบกลับว่ามีข้อผิดพลาด
		res.status(500).json({ message: "Error processing data." });
	}
});

router.get("/getPayData", async (req, res) => {
	const student_id = req.query.student_id;
	const tables = ["request_exam", "request_eng_test", "request_thesis_proposal", "request_thesis_defense"];
	try {
		const pool = await poolPromise;
		const request = pool.request().input("id", student_id);
		const queries = tables.map(async (tbl) => {//status = 5 AND
			const sql = `SELECT TOP 1 *, '${tbl}' as src FROM ${tbl} WHERE student_id = @id ORDER BY request_date DESC`;
			const { recordset } = await request.query(sql);
			return recordset[0];
		});
		const results = await Promise.all(queries);
		const candidates = results.filter((item) => item);

		if (candidates.length === 0) {
			return res.status(200).json({ message: "ไม่พบข้อมูลรายการที่ค้นหา" });
		}
		candidates.sort((a, b) => new Date(b.request_date) - new Date(a.request_date));
		const winner = candidates[0];
		let student = {};
		try {
			const { data } = await axios.get(`${BASE_URL}/api/student/${student_id}`);
			student = data;
		} catch (e) {
			student = {};
		}
		const paymentObj = {
			center: winner.src.replace("request_", ""),
			citizent: student.citizen_id,
			orderRef1: winner.student_id,
			name: student.fname,
			lname: student.lname,
			amount: winner.receipt_pay,
			add1: "-",
			add2: "-",
			add3: "-",
			NameOther1: `ชำระค่า${winner.request_type}`,
			NameOther1_2: `ค่า${winner.request_type} ${winner.receipt_pay} บาท`,
		};
		for (let i = 3; i <= 16; i++) {
			paymentObj[`NameOther1_${i}`] = null;
		}
		return res.status(200).json([paymentObj]);
	} catch (error) {
		console.error("Error:", error);
		res.status(500).json({ message: "Error processing data." });
	}
});

/* router.get("/getPayData", async (req, res) => {
	const student_id = req.query.student_id;
	console.log("student_id = ", student_id);
	try {
		const pool = await poolPromise;
		const request = pool.request();

		let sql = `SELECT * FROM request_exam WHERE status = 5`;

		if (student_id) {
			request.input("id", student_id);
			sql += ` AND student_id = @id`;
		}

		const { recordset } = await request.query(sql);

		if (!recordset || recordset.length === 0) {
			console.log("ไม่พบข้อมูลรายการชำระเงิน");
			return res.status(200).json({ message: "ไม่พบข้อมูลรายการที่ค้นหา" });
		}

		const jsonArray = await Promise.all(
			recordset.map(async (item) => {
				let student = {};
				try {
					const { data } = await axios.get(`${BASE_URL}/api/student/${item.student_id}`);
					student = data;
				} catch (e) {
					console.warn(`ไม่สามารถดึงข้อมูลนักศึกษา ${item.student_id}`);
				}
				const paymentObj = {
					center: "-",
					citizent: student.citizen_id,
					orderRef1: item.student_id,
					name: student.fname,
					lname: student.lname,
					amount: item.receipt_pay,
					add1: "-",
					add2: "-",
					add3: "-",
					NameOther1: `ชำระค่า${item.request_type}`,
					NameOther1_2: `ค่า${item.request_type} ${item.receipt_pay} บาท`,
				};
				for (let i = 3; i <= 16; i++) {
					paymentObj[`NameOther1_${i}`] = null;
				}
				return paymentObj;
			})
		);

		res.status(200).json(jsonArray);
	} catch (error) {
		console.error("Error:", error);
		res.status(500).json({ message: "Error processing data." });
	}
}); */

module.exports = router;
