const express = require("express");
const router = express.Router();
const axios = require("axios");

router.get("/student/:student_id", async (req, res) => {
	const studentid = req.params.student_id;
	try {
		const response = await axios.get(`https://mua.kpru.ac.th/FrontEnd_Tabian/petition/Showstudent/${studentid}`);
		const item = response.data[0];

		const transformedData = {
			student_id: item.OLDID,
			PNAME: item.PNAME,
			NAME: item.NAME,
			BDATE: item.BDATE,
			student_name: `${item.PNAME}${item.NAME}` /* `${item.name} ${item.lname}`, */,
			education_level: item.level_type,
			program: `${item.level_name_long} (${item.level_name})`,
			study_group_id: item.GROUP_NO,
			major_id: item.mjcode,
			major_name: item.t_mjname,
			faculty_name: item.faculty_name,
			citizen_id: item.GDNAME,
			fname: item.name,
			lname: item.lname,
			STATUS: item.STATUS,
		};
		console.log(transformedData.student_id);

		res.json(transformedData);
	} catch (err) {
		console.error("API call error:", err);
		res.status(500).json({ error: "Internal server error" });
	}
});

router.post("/get-all-courses", async (req, res) => {
	try {
		const { user_id } = req.body;

		if (!user_id) {
			return res.status(400).json({ message: "User ID is required" });
		}

		let allRegisteredCourses = [];
		let hasData = true;

		// คำนวณปีเริ่มต้นจากรหัสนักศึกษา
		let loopYear = 2500 + parseInt(user_id.toString().substring(0, 2));
		let loopTerm = 1;

		// กำหนด URL ของ API ภายนอก (แทนที่ proxy เดิม)

		while (hasData) {
			const currentLoopTermStr = `${loopTerm}/${loopYear}`;

			try {
				// ยิง API ไปยังระบบทะเบียน
				const response = await axios.post(
					"https://mua.kpru.ac.th/FrontEnd_Tabian/apiforall/ListRegister",
					{
						ID_NO: user_id,
						TERM: currentLoopTermStr,
					},
					{
						headers: { "Content-Type": "application/json" },
						timeout: 5000, // แนะนำให้ใส่ timeout ไว้ป้องกัน loop ค้างนาน
					}
				);

				const registerCoursesData = response.data;

				// ตรวจสอบว่ามีข้อมูลที่เป็น Array และไม่ว่าง
				if (Array.isArray(registerCoursesData) && registerCoursesData.length > 0) {
					allRegisteredCourses = [...allRegisteredCourses, ...registerCoursesData];

					// ขยับไปเทอมถัดไป
					loopTerm++;
					if (loopTerm > 3) {
						loopTerm = 1;
						loopYear++;
					}
				} else {
					// ถ้าไม่เจอข้อมูล ให้หยุดการวนลูป
					hasData = false;
				}
			} catch (error) {
				console.error(`Error at ${currentLoopTermStr}:`, error.message);
				// กรณี Error จาก API ภายนอก อาจจะหยุด loop หรือข้ามเทอมนี้ไป
				hasData = false;
			}
		}

		// ส่งข้อมูลทั้งหมดกลับไปให้ Frontend
		res.json({
			success: true,
			total_courses: allRegisteredCourses.length,
			data: allRegisteredCourses,
		});
	} catch (globalError) {
		console.error("Server Error:", globalError);
		res.status(500).json({ message: "Internal Server Error" });
	}
});


module.exports = router;
