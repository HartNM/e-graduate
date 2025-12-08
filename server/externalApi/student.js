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

module.exports = router;
