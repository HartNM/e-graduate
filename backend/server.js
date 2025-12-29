require("dotenv").config();
const express = require("express");
const path = require("path");
const cors = require("cors");
const app = express();
const PORT = process.env.PORT || 5000;
const helmet = require("helmet");
app.use(helmet());

/* -------------------- Middleware -------------------- */
app.use(cors({ credentials: true }));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

/* -------------------- API Routes -------------------- */
app.use("/api", require("./services/kpruApi"));
app.use("/api", require("./routes/majors"));
app.use("/api", require("./routes/login"));
app.use("/api", require("./routes/profile"));
app.use("/api", require("./routes/pdfRoutes"));

app.use("/api", require("./routes/assignMajorOfficer"));
app.use("/api", require("./routes/assignChairpersons"));
app.use("/api", require("./routes/CourseRegistration"));
app.use("/api", require("./routes/ExamResults"));
app.use("/api", require("./routes/ExamEligibleListPrint"));

app.use("/api", require("./routes/requestExamInfo"));
app.use("/api", require("./routes/RequestExam"));
app.use("/api", require("./routes/RequestExamCancel"));
app.use("/api", require("./routes/RequestEngTest"));
app.use("/api", require("./routes/RequestThesisProposal"));
app.use("/api", require("./routes/ExamProposalResults"));
app.use("/api", require("./routes/RequestThesisDefense"));
app.use("/api", require("./routes/ExamDefenseResults"));

app.use("/api", require("./routes/pay"));
app.use("/api", require("./routes/test"));

/* -------------------- Static Frontend -------------------- */
// ต้องอยู่หลัง API
app.use(express.static(path.join(__dirname, "public")));

/* -------------------- SPA Fallback (Express 5 compatible) -------------------- */
app.get(/^(?!\/api).*/, (req, res) => {
	res.sendFile(path.join(__dirname, "public", "index.html"));
});

/* -------------------- Start Server -------------------- */
app.listen(PORT, "0.0.0.0", () => {
	console.log(`✅ Server running on port ${PORT}`);
});
