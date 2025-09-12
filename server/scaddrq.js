require("dotenv").config();
const axios = require("axios");
const sql = require("mssql");
const dayjs = require("dayjs");
const utc = require("dayjs/plugin/utc");
const timezone = require("dayjs/plugin/timezone");

dayjs.extend(utc);
dayjs.extend(timezone);

async function main() {
	const config = {
		user: "sa",
		password: "060668@min",
		server: "localhost",
		database: "request_submission",
		options: {
			encrypt: false,
			trustServerCertificate: true,
		},
	};
	const date = dayjs().tz("Asia/Bangkok").format("YYYY-MM-DD HH:mm:ss");

	try {
		let pool = await sql.connect(config);

		/* const startId = 684140101;
		const endId = 684140130;
		const type = "ประมวลความรู้";
		const term = "3/68";
		const advisor = "นางสาวพรทิพย์ ขยันดี";
		const chairpersons = "นายวิทยา พัฒน์";
		const registrar = "นายธนกร ศรีสุวรรณ"; */

		const startId = 684270201;
		const endId = 684270215;
		const type = "ขอสอบวัดคุณสมบัติ";
		const term = "3/68";
		const advisor = "นายเอกชัย ตั้งใจเรียน";
		const chairpersons = "นายวิทยา พัฒน์";
		const registrar = "นายธนกร ศรีสุวรรณ";

		for (let id = startId; id <= endId; id++) {
			try {
				const response = await axios.get(`http://localhost:8080/externalApi/student/${id}`);

				if (response.data) {
					const s = response.data;
					await pool
						.request()
						.input("student_id", s.student_id)
						.input("study_group_id", s.study_group_id)
						.input("major_id", "09")
						.input("faculty_name", "คณะครุศาสตร์")
						.input("request_type", type)
						.input("term", term)
						.input("request_date", date)
						.input("status", "5")
						.input("advisor_approvals_id", advisor)
						.input("advisor_approvals", 1)
						.input("advisor_approvals_date", date)
						.input("chairpersons_approvals_id", chairpersons)
						.input("chairpersons_approvals", 1)
						.input("chairpersons_approvals_date", date)
						.input("registrar_approvals_id", registrar)
						.input("registrar_approvals", 1)
						.input("registrar_approvals_date", date)
						.input("receipt_vol_No", "1/64")
						.input("receipt_pay_date", date).query(`
                        INSERT INTO request_exam (
                            student_id, study_group_id, major_id, faculty_name, request_type, term, request_date, status, advisor_approvals_id, advisor_approvals, advisor_approvals_date, 
                            chairpersons_approvals_id, chairpersons_approvals, chairpersons_approvals_date, registrar_approvals_id, registrar_approvals, registrar_approvals_date, receipt_vol_No, receipt_pay_date
                        ) VALUES (
                            @student_id, @study_group_id, @major_id, @faculty_name, @request_type, @term, @request_date, @status, @advisor_approvals_id, @advisor_approvals, @advisor_approvals_date, 
                            @chairpersons_approvals_id, @chairpersons_approvals, @chairpersons_approvals_date, @registrar_approvals_id, @registrar_approvals, @registrar_approvals_date, @receipt_vol_No, @receipt_pay_date
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
