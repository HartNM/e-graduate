process.env.DEBUG = "mssql";
const sql = require("mssql");

const config = {
	user: process.env.USER,
	password: process.env.PASSWORD,
	server: process.env.SERVER,
	database: process.env.DATABASE,
	options: {
		encrypt: true,
		trustServerCertificate: true,
		cryptoCredentialsDetails: {
			minVersion: "TLSv1",
		},
	},
};

const poolPromise = new sql.ConnectionPool(config)
	.connect()
	.then((pool) => {
		console.log("Connected to MSSQL");
		return pool;
	})
	.catch((err) => {
		console.error("Database connection failed:", err);
	});

module.exports = {
	sql,
	poolPromise,
};
