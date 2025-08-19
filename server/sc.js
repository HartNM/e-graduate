require("dotenv").config();
const axios = require("axios");
const sql = require("mssql");

async function main() {
	const config = {
		user: process.env.USER,
		password: process.env.PASSWORD,
		server: process.env.SERVER,
		database: process.env.DATABASE,
		options: {
			encrypt: false,
			trustServerCertificate: true,
		},
	};

	try {
		let pool = await sql.connect(config);

		const startId = 684270201;
		const endId = 684270220;

		for (let id = startId; id <= endId; id++) {
			try {
				const response = await axios.get(`https://mua.kpru.ac.th/FrontEnd_Tabian/petition/Showstudent/${id}`);

				if (response.data && response.data.length > 0) {
					const s = response.data[0];

					await pool
						.request()
						.input("id", sql.BigInt, s.OLDID)
						.input("group_no", sql.NVarChar(20), s.GROUP_NO)
						.input("level1", sql.NVarChar(10), s.LEVEL1)
						.input("faculty_name", sql.NVarChar(255), s.faculty_name)
						.input("faculty_name_eng", sql.NVarChar(255), s.faculty_name_eng)
						.input("t_mjname", sql.NVarChar(255), s.t_mjname)
						.input("e_mjname", sql.NVarChar(255), s.e_mjname)
						.input("level_name_long", sql.NVarChar(255), s.level_name_long)
						.input("level_name_longeng", sql.NVarChar(255), s.level_name_longeng)
						.input("level_name", sql.NVarChar(50), s.level_name)
						.input("level_type", sql.NVarChar(100), s.level_type)
						.input("oldid", sql.NVarChar(20), s.OLDID)
						.input("status", sql.NVarChar(50), s.STATUS)
						.input("pname", sql.NVarChar(50), s.PNAME)
						.input("name_th", sql.NVarChar(255), s.NAME)
						.input("name_en", sql.NVarChar(255), s.E_NAME)
						.input("tmndate", sql.NVarChar(50), s.TMNDATE)
						.input("gdname", sql.NVarChar(50), s.GDNAME)
						.input("tgpa", sql.NVarChar(50), s.TGPA)
						.input("stts", sql.NVarChar(50), s.STTS)
						.input("bdate", sql.NVarChar(50), s.BDATE)
						.input("job", sql.NVarChar(255), s.JOB)
						.input("mjcode", sql.NVarChar(20), s.mjcode)
						.input("img_url", sql.NVarChar(500), s.ImgUrl)
						.input("type_name", sql.NVarChar(255), s.Type_name)
						.input("short_name", sql.NVarChar(255), s.name)
						.input("lname", sql.NVarChar(255), s.lname)
						.input("dateshowfinish", sql.NVarChar(50), s.DATESHOWFINISH)
						.input("email", sql.NVarChar(255), s.EMAIL)
						.input("phone", sql.NVarChar(50), s.PHONE).query(`
              INSERT INTO Api_students (
                id, group_no, level1, faculty_name, faculty_name_eng, t_mjname, e_mjname,
                level_name_long, level_name_longeng, level_name, level_type, oldid, status,
                pname, name_th, name_en, tmndate, gdname, tgpa, stts, bdate, job, mjcode,
                img_url, type_name, short_name, lname, dateshowfinish, email, phone
              ) VALUES (
                @id, @group_no, @level1, @faculty_name, @faculty_name_eng, @t_mjname, @e_mjname,
                @level_name_long, @level_name_longeng, @level_name, @level_type, @oldid, @status,
                @pname, @name_th, @name_en, @tmndate, @gdname, @tgpa, @stts, @bdate, @job, @mjcode,
                @img_url, @type_name, @short_name, @lname, @dateshowfinish, @email, @phone
              )
            `);

					console.log(`✔️ Inserted student ${id}`);
				} else {
					console.log(`❌ No data for student ${id}`);
				}
			} catch (err) {
				console.error(`Error fetching student ${id}:`, err.message);
			}
		}

		sql.close();
	} catch (err) {
		console.error("DB connection error:", err);
	}
}

main();
