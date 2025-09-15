require("dotenv").config();
const express = require("express");
const app = express();
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
const cors = require("cors");
app.use(cors({ origin: "http://localhost:3000", credentials: true }));
const PORT = process.env.PORT;

const externalApiStudent = require("./externalApi/student");
app.use("/externalApi", externalApiStudent);
const externalApiUsers = require("./externalApi/users");
app.use("/externalApi", externalApiUsers);
const loginRoutes = require("./routes/login");
app.use("/api", loginRoutes);
const profileRoutes = require("./routes/profile");
app.use("/api", profileRoutes);

const majors = require("./routes/majors");
app.use("/api", majors);

const assignMajorOfficer = require("./routes/assignMajorOfficer");
app.use("/api", assignMajorOfficer);
const assignChairpersons = require("./routes/assignChairpersons");
app.use("/api", assignChairpersons);
const CourseRegistration = require("./routes/CourseRegistration");
app.use("/api", CourseRegistration);
const ExamResults = require("./routes/ExamResults");
app.use("/api", ExamResults);
const ExamResultsPrint = require("./routes/ExamResultsPrint");
app.use("/api", ExamResultsPrint);
const ExamEligibleListPrint = require("./routes/ExamEligibleListPrint");
app.use("/api", ExamEligibleListPrint);

const requestExamInfoRouters = require("./routes/requestExamInfo");
app.use("/api", requestExamInfoRouters);

const RequestExam = require("./routes/RequestExam");
app.use("/api", RequestExam);
const RequestExamCancel = require("./routes/RequestExamCancel");
app.use("/api", RequestExamCancel);

const RequestEngTest = require("./routes/RequestEngTest");
app.use("/api", RequestEngTest);

const RequestThesisProposal = require("./routes/RequestThesisProposal");
app.use("/api", RequestThesisProposal);

const RequestThesisDefense = require("./routes/RequestThesisDefense");
app.use("/api", RequestThesisDefense);

const PlagiarismReport = require("./routes/PlagiarismReport");
app.use("/api", PlagiarismReport);

app.listen(PORT, () => {
	console.log(`Server is running on port ${PORT}`);
});
