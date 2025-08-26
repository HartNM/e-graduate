const express = require("express");
const router = express.Router();
const axios = require("axios");
const { poolPromise, sql } = require("../db");


      /* major_name: item.mjcode, */
/* router.get("/student/:student_id", async (req, res) => {
  const studentid = req.params.student_id;
  try {
    const response = await axios.get(
      `https://mua.kpru.ac.th/FrontEnd_Tabian/petition/Showstudent/${studentid}`
    );
    const item = response.data[0];
    const transformedData = {
      student_id: item.OLDID,
      PNAME: item.PNAME,
      NAME: item.NAME,
      BDATE: item.BDATE,
      student_name: `${item.name} ${item.lname}`,
      education_level: item.level_type,
      program: `${item.level_name_long} (${item.level_name})`,
      study_group_id: item.GROUP_NO,

      major_name: item.t_mjname,
      faculty_name: item.faculty_name,
      request_type:
        item.level_type === "ปริญญาโท" ? "ประมวลความรู้" : "วัดคุณสมบัติ",
    };
    res.json(transformedData);
  } catch (err) {
    console.error("API call error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}); */

router.get("/student/:student_id", async (req, res) => {
	const studentid = req.params.student_id;
          /* mjcode AS major_id */
	try {
		const pool = await poolPromise;
		const result = await pool.request().input("id", sql.BigInt, studentid).query(`
        SELECT TOP 1
          id AS student_id,
          pname AS PNAME,
          name_th AS NAME,
          bdate AS BDATE,
          CONCAT(short_name, ' ', lname) AS student_name,
          level_type AS education_level,
          CONCAT(level_name_long, ' (', level_name, ')') AS program,
          group_no AS study_group_id,
          t_mjname AS major_name,
          faculty_name
        FROM Api_students
        WHERE id = @id
      `);

		if (result.recordset.length > 0) {
			res.json(result.recordset[0]);
		} else {
			res.status(404).json({ error: "Student not found" });
		}
	} catch (err) {
		console.error("DB query error:", err);
		res.status(500).json({ error: "Internal server error" });
	}
});

module.exports = router;
