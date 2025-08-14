import { Routes, Route, BrowserRouter } from "react-router-dom";
import { lazy, Suspense } from "react";
import LoadingScreen from "./component/LoadingScreen.jsx";

const NotFound = lazy(() => import("./pages/NotFound"));
const AuthenticationForm = lazy(() => import("./pages/AuthenticationTitle/login.jsx"));

const GraduateCommitteeChair = lazy(() => import("./pages/GraduateCommitteeChair/GraduateCommitteeChair.jsx"));

const Advisor = lazy(() => import("./pages/Advisor/Advisor.jsx"));
const ExamResults = lazy(() => import("./pages/MajorOfficer/ExamResults.jsx"));

const RegistrarOfficer = lazy(() => import("./pages/RegistrarOfficer/RegistrarOfficer.jsx"));
const ExamScheduleSetupPage = lazy(() => import("./pages/RegistrarOfficer/ExamScheduleSetupPage.jsx"));
const AssignMajorOfficer = lazy(() => import("./pages/RegistrarOfficer/AssignMajorOfficer.jsx"));

const Student = lazy(() => import("./pages/student/Student.jsx"));

const RequestList = lazy(() => import("./component/RequestExam.jsx"));

const Dean = lazy(() => import("./pages/dean/dean.jsx"));

const MajorOfficer = lazy(() => import("./pages/MajorOfficer/MajorOfficer.jsx"));
const AssignChairpersons = lazy(() => import("./pages/MajorOfficer/AssignChairpersons.jsx"));
const CourseRegistration = lazy(() => import("./pages/MajorOfficer/CourseRegistration.jsx"));

function AppRoutes() {
	return (
		<BrowserRouter>
			<Suspense fallback={<LoadingScreen />}>
				<Routes>
					<Route path="*" element={<NotFound />} />
					<Route path="/login" element={<AuthenticationForm />} />

					<Route path="/registrar-officer" element={<RegistrarOfficer />}>
						<Route path="requestList" element={<RequestList />} />
						<Route path="ExamScheduleSetupPage" element={<ExamScheduleSetupPage />} />
						<Route path="assign-major-officer" element={<AssignMajorOfficer />} />
					</Route>

					<Route path="/student" element={<Student />}>
						<Route path="requestList" element={<RequestList />} />
					</Route>

					<Route path="/advisor" element={<Advisor />}>
						<Route path="requestList" element={<RequestList />} />
					</Route>

					<Route path="/graduate-committee-chair" element={<GraduateCommitteeChair />}>
						<Route path="requestList" element={<RequestList />} />
					</Route>

					<Route path="/dean" element={<Dean />}>
						<Route path="requestList" element={<RequestList />} />
					</Route>

					<Route path="/major-officer" element={<MajorOfficer />}>
						<Route path="CourseRegistration" element={<CourseRegistration />} />
						<Route path="AssignChairpersons" element={<AssignChairpersons />} />
						<Route path="examResults" element={<ExamResults />} />
					</Route>
				</Routes>
			</Suspense>
		</BrowserRouter>
	);
}

export default AppRoutes;
