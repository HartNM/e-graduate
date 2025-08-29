require("dotenv").config();
const express = require("express");
const app = express();
app.use(express.json());
const cors = require("cors");
app.use(cors());
const PORT = process.env.PORT;

const externalApiStudent = require("./externalApi/student");
app.use("/externalApi", externalApiStudent);
const authRoutes = require("./routes/auth");
app.use("/api", authRoutes);
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
const ExamResultsPrint = require("./routes/ExamResultsPrint");
app.use("/api", ExamResultsPrint);

const requestExamInfoRouters = require("./routes/requestExamInfo");
app.use("/api", requestExamInfoRouters);
const RequestExam = require("./routes/RequestExam");
app.use("/api", RequestExam);
const RequestExamCancel = require("./routes/RequestExamCancel");
app.use("/api", RequestExamCancel);

const RequestEngTest = require("./routes/RequestEngTest");
app.use("/api", RequestEngTest);


app.listen(PORT, () => {
	console.log(`Server is running on port ${PORT}`);
});
