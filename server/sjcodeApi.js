require("dotenv").config();
const axios = require("axios");
const sql = require("mssql");

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

	try {
		let pool = await sql.connect(config);

		// เรียก API วิชาทั้งหมด
		const response = await axios.get("https://mua.kpru.ac.th/FrontEnd_Tabian/apiforall/ListSubjectAll");

		const subjects = response.data;

		const seen = new Set();
		const duplicates = [];

		subjects.forEach((s) => {
			if (seen.has(s.SUBJCODE)) {
				duplicates.push(s); // เก็บข้อมูลซ้ำ
			} else {
				seen.add(s.SUBJCODE);
			}
		});

		// log ข้อมูลซ้ำ
		console.log("⚠️ ข้อมูลซ้ำ:");
		console.table(duplicates);

	} catch (err) {
		console.error("DB connection error:", err);
	}
}

main();
