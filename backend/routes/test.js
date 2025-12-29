const express = require("express");
const router = express.Router();

router.get("/test", async (req, res) => {
	res.status(200).json("test");
});

router.get("/testdb", async (req, res) => {
	
});
module.exports = router;