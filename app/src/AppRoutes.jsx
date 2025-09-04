import { Routes, Route, BrowserRouter } from "react-router-dom";
import { lazy, Suspense } from "react";
import LoadingScreen from "./component/LoadingScreen.jsx";

const Personnel = lazy(() => import("./pages/personnel"));

const NotFound = lazy(() => import("./pages/NotFound"));
const AuthenticationForm = lazy(() => import("./pages/AuthenticationTitle/login.jsx"));

const RequestExam = lazy(() => import("./component/RequestExam.jsx"));
const RequestExamCancel = lazy(() => import("./component/RequestExamCancel.jsx"));
const RequestEngTest = lazy(() => import("./component/RequestEngTest.jsx"));
const RequestThesisProposal = lazy(() => import("./component/RequestThesisProposal.jsx"));
const PostponeProposalExam = lazy(() => import("./component/PostponeProposalExam.jsx"));
const RequestThesisDefense = lazy(() => import("./component/RequestThesisDefense.jsx"));
const PostponeDefenseExam = lazy(() => import("./component/PostponeDefenseExam.jsx"));
const PlagiarismReport = lazy(() => import("./component/PlagiarismReport.jsx"));
const RequestGraduation = lazy(() => import("./component/RequestGraduation.jsx"));

const Chairpersons = lazy(() => import("./pages/chairpersons/Chairpersons.jsx"));

const Advisor = lazy(() => import("./pages/Advisor/Advisor.jsx"));
const ExamResults = lazy(() => import("./pages/MajorOfficer/ExamResults.jsx"));

const RegistrarOfficer = lazy(() => import("./pages/RegistrarOfficer/RegistrarOfficer.jsx"));
const ExamScheduleSetupPage = lazy(() => import("./pages/RegistrarOfficer/ExamScheduleSetupPage.jsx"));
const AssignMajorOfficer = lazy(() => import("./pages/RegistrarOfficer/AssignMajorOfficer.jsx"));
const ExamResultsPrint = lazy(() => import("./pages/RegistrarOfficer/ExamResultsPrint.jsx"));

const Student = lazy(() => import("./pages/student/Student.jsx"));

const Dean = lazy(() => import("./pages/dean/dean.jsx"));

const MajorOfficer = lazy(() => import("./pages/MajorOfficer/MajorOfficer.jsx"));
const AssignChairpersons = lazy(() => import("./pages/MajorOfficer/AssignChairpersons.jsx"));
const CourseRegistration = lazy(() => import("./pages/MajorOfficer/CourseRegistration.jsx"));
const ExamEligibleListPrint = lazy(() => import("./pages/MajorOfficer/ExamEligibleListPrint.jsx"));

function AppRoutes() {
	return (
		<BrowserRouter>
			<Suspense fallback={<LoadingScreen />}>
				<Routes>
					{/* <Route path="/Personnel" element={<Personnel />}>
						<Route path="RequestExam/:type" element={<RequestExam />} />
						<Route path="RequestExam" element={<RequestExam />} />
						<Route path="RequestEngTest" element={<RequestEngTest />} />
						<Route path="ExamScheduleSetupPage" element={<ExamScheduleSetupPage />} />
						<Route path="assign-major-officer" element={<AssignMajorOfficer />} />
						<Route path="exam-results-print" element={<ExamResultsPrint />} />
						<Route path="CourseRegistration" element={<CourseRegistration />} />
						<Route path="AssignChairpersons" element={<AssignChairpersons />} />
						<Route path="examResults" element={<ExamResults />} />
						<Route path="ExamEligibleListPrint" element={<ExamEligibleListPrint />} />
					</Route> */}
					<Route path="*" element={<NotFound />} />
					<Route path="/login" element={<AuthenticationForm />} />

					<Route path="/registrar-officer" element={<RegistrarOfficer />}>
						<Route path="RequestExam/:type" element={<RequestExam />} />
						<Route path="RequestEngTest" element={<RequestEngTest />} />
						<Route path="RequestThesisProposal/:type" element={<RequestThesisProposal />} />
						<Route path="RequestThesisDefense/:type" element={<RequestThesisDefense />} />
						<Route path="ExamScheduleSetupPage" element={<ExamScheduleSetupPage />} />
						<Route path="assign-major-officer" element={<AssignMajorOfficer />} />
						<Route path="exam-results-print" element={<ExamResultsPrint />} />
					</Route>

					<Route path="/student" element={<Student />}>
						<Route path="RequestExam" element={<RequestExam />} />
						<Route path="RequestExamCancel" element={<RequestExamCancel />} />
						<Route path="RequestEngTest" element={<RequestEngTest />} />
						<Route path="RequestThesisProposal" element={<RequestThesisProposal />} />
						<Route path="PostponeProposalExam" element={<PostponeProposalExam />} />
						<Route path="RequestThesisDefense" element={<RequestThesisDefense />} />
						<Route path="PostponeDefenseExam" element={<PostponeDefenseExam />} />
						<Route path="PlagiarismReport" element={<PlagiarismReport />} />
						<Route path="RequestGraduation" element={<RequestGraduation />} />
					</Route>

					<Route path="/advisor" element={<Advisor />}>
						<Route path="RequestExam" element={<RequestExam />} />
						<Route path="RequestExamCancel" element={<RequestExamCancel />} />
						<Route path="RequestEngTest" element={<RequestEngTest />} />
						<Route path="RequestThesisProposal" element={<RequestThesisProposal />} />
						<Route path="RequestThesisDefense" element={<RequestThesisDefense />} />
					</Route>

					<Route path="/chairpersons" element={<Chairpersons />}>
						<Route path="RequestExam" element={<RequestExam />} />
						<Route path="RequestExamCancel" element={<RequestExamCancel />} />
						<Route path="RequestEngTest" element={<RequestEngTest />} />
						<Route path="RequestThesisProposal" element={<RequestThesisProposal />} />
						<Route path="RequestThesisDefense" element={<RequestThesisDefense />} />
					</Route>

					<Route path="/dean" element={<Dean />}>
						<Route path="RequestExam" element={<RequestExam />} />
						<Route path="RequestExamCancel" element={<RequestExamCancel />} />
					</Route>

					<Route path="/major-officer" element={<MajorOfficer />}>
						<Route path="CourseRegistration" element={<CourseRegistration />} />
						<Route path="AssignChairpersons" element={<AssignChairpersons />} />
						<Route path="examResults" element={<ExamResults />} />
						<Route path="ExamEligibleListPrint" element={<ExamEligibleListPrint />} />
					</Route>
				</Routes>
			</Suspense>
		</BrowserRouter>
	);
}

export default AppRoutes;
