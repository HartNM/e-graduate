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
const requestExamInfoRouters = require("./routes/requestExamInfo");
app.use("/api", requestExamInfoRouters);
const requestExamRoutes = require("./routes/requestExam");
app.use("/api", requestExamRoutes);
const assignMajorOfficerRouters = require("./routes/assignMajorOfficer");
app.use("/api", assignMajorOfficerRouters);
const assignChairpersonsRouters = require("./routes/assignChairpersons");
app.use("/api", assignChairpersonsRouters);
const CourseRegistrationRouters = require("./routes/CourseRegistration");
app.use("/api", CourseRegistrationRouters);

app.listen(PORT, () => {
	console.log(`Server is running on port ${PORT}`);
});
