require("dotenv").config();
const express = require("express");
const app = express();
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
const cors = require("cors");
app.use(cors({ /* origin: "http://localhost:3000", */ credentials: true }));
const PORT = process.env.PORT;
const BASE_URL = process.env.VITE_API_URL;

const externalApiStudent = require("./externalApi/student");
app.use("/externalApi", externalApiStudent);
const externalApiUsers = require("./externalApi/users");
app.use("/externalApi", externalApiUsers);
const loginRoutes = require("./routes/login");
app.use("/api", loginRoutes);
const profileRoutes = require("./routes/profile");
app.use("/api", profileRoutes);

const assignMajorOfficer = require("./routes/assignMajorOfficer");
app.use("/api", assignMajorOfficer);
const assignChairpersons = require("./routes/assignChairpersons");
app.use("/api", assignChairpersons);
const CourseRegistration = require("./routes/CourseRegistration");
app.use("/api", CourseRegistration);
const ExamResults = require("./routes/ExamResults");
app.use("/api", ExamResults);
const ExamEligibleListPrint = require("./routes/ExamEligibleListPrint");
app.use("/api", ExamEligibleListPrint);
const PrintExam = require("./routes/PrintExam");
app.use("/api", PrintExam);

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
const PostponeProposalExam = require("./routes/PostponeProposalExam");
app.use("/api", PostponeProposalExam);
const PlagiarismProposal = require("./routes/PlagiarismProposal");
app.use("/api", PlagiarismProposal);
const ExamProposalResults = require("./routes/ExamProposalResults");
app.use("/api", ExamProposalResults);

const RequestThesisDefense = require("./routes/RequestThesisDefense");
app.use("/api", RequestThesisDefense);
const PostponeDefenseExam = require("./routes/PostponeDefenseExam");
app.use("/api", PostponeDefenseExam);
const PlagiarismDefense = require("./routes/PlagiarismDefense");
app.use("/api", PlagiarismDefense);
const ExamDefenseResults = require("./routes/ExamDefenseResults");
app.use("/api", ExamDefenseResults);

const RequestGraduation = require("./routes/RequestGraduation");
app.use("/api", RequestGraduation);

const AssignFinanceOfficer = require("./routes/AssignFinanceOfficer");
app.use("/api", AssignFinanceOfficer);
const AssignRegistrarOfficer = require("./routes/AssignRegistrarOfficer");
app.use("/api", AssignRegistrarOfficer);

const pay = require("./routes/pay");
app.use("/api", pay);

app.listen(PORT, () => {
	console.log(`Server is running on port ${PORT}`);
});
