const express = require("express");
const router = express.Router();
const authenticateToken = require("../middleware/authenticateToken");
const { poolPromise } = require("../db");

router.get("/user_idGetUser_name/:user_id", async (req, res) => {
	const user_id = req.params.user_id;
	try {
		const pool = await poolPromise;
		const result = await pool.request().input("user_id", user_id).query(`
            SELECT name, user_id
            FROM users
            WHERE user_id = @user_id
        `);
		res.json(result.recordset[0]);
	} catch (e) {
		console.error("DB query error:", e);
		res.status(500).json({ error: "Internal server error" });
	}
});

module.exports = router;
