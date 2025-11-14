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

router.post("/printReceipt", authenticateToken, async (req, res) => {
	const { citizen_id, student_id, fname, lname, amount } = req.body;
	console.log(req.body);

    const center = "";
    const citizent = "";
    const orderRef1 = "";
    const name = "";
/*     const lname = "";
    const amount = ""; */
	const add1 = "";
	const add2 = "";
	const add3 = "";
	const NameOther1 = "";
	const NameOther1_2 = "";
	const NameOther1_3 = "";
	const NameOther1_4 = "";
	const NameOther1_5 = "";
	const NameOther1_6 = "";
	const NameOther1_7 = "";
	const NameOther1_8 = "";
	const NameOther1_9 = "";
	const NameOther1_10 = "";
	const NameOther1_11 = "";
	const NameOther1_12 = "";
	const NameOther1_13 = "";
	const NameOther1_14 = "";
	const NameOther1_15 = "";
	const NameOther1_16 = "";

	const url = `citizent=${citizen_id}&_POST['orderRef1']=${student_id}&_POST['name']=${fname}&_POST['lname']=${lname}&_POST['amount']=${amount}&add1=${add1}&add2=${add2}&add3=${add3}&NameOther1=${NameOther1}&NameOther1_2=${NameOther1_2}&NameOther1_3=${NameOther1_3}&NameOther1_4=${NameOther1_4}&NameOther1_5=${NameOther1_5}&NameOther1_6=${NameOther1_6}&NameOther1_7=${NameOther1_7}&NameOther1_8=${NameOther1_8}&NameOther1_9=${NameOther1_9}&NameOther1_10=${NameOther1_10}&NameOther1_11=${NameOther1_11}&NameOther1_12=${NameOther1_12}&NameOther1_13=${NameOther1_13}&NameOther1_14=${NameOther1_14}&NameOther1_15=${NameOther1_15}&NameOther1_16=${NameOther1_16}`;
	console.log(url);

	res.status(200).json({ message: "บันทึกผลสอบเรียบร้อยแล้ว" });
});

module.exports = router;
