const express = require("express");
const router = express.Router();
const authenticateToken = require("../middleware/authenticateToken");
const { poolPromise } = require("../db");
/* const axios = require("axios");
const BASE_URL = process.env.VITE_API_URL; */
const { getStudentData } = require("../externalApi/studentService");

router.post("/AddExamProposalResults", authenticateToken, async (req, res) => {
    const { term, ...studentIdsObj } = req.body;
    console.log(req.body); // log จะแสดง { student_id: { result: "...", date: "..." } }

    try {
        const pool = await poolPromise;
        // *** UPDATED HERE ***
        // 1. เปลี่ยน 'examResult' เป็น 'data'
        for (const [id, data] of Object.entries(studentIdsObj)) {
            // 2. แยก result และ date ออกจาก object
            const { result, date } = data; 

            const request = pool.request();
            await request
                .input("id", id)
                .input("term", term)
                // 3. ใช้ 'result' ที่แยกออกมา
                .input("exam_result", result) 
                // 4. เพิ่ม 'date'
                .input("exam_date", date) 
                // 5. อัปเดต query ให้บันทึกทั้ง 2 fields
                .query(`
                    UPDATE request_thesis_proposal 
                    SET 
                        exam_results = @exam_result,
                        thesis_exam_date = @exam_date
                    WHERE 
                        student_id = @id AND status = 5 AND term = @term
                `);
        }
        res.status(200).json({ message: "บันทึกผลสอบเรียบร้อยแล้ว" });
    } catch (err) {
        console.error("AddExamResults:", err);
        res.status(500).json({ message: "เกิดข้อผิดพลาดในการบันทึกผลสอบ" });
    }
});

router.post("/AllExamProposalResults", authenticateToken, async (req, res) => {
    const { user_id , major_ids} = req.user;
    try {
        const { recordset: exams } = await (await poolPromise).request().input("user_id", user_id).input("major_ids_str", major_ids.join(",")).query(`
            SELECT 
                study_group_id, student_id, exam_results, term, request_type,
                thesis_exam_date -- *** UPDATED HERE: เพิ่ม field นี้
            FROM request_thesis_proposal 
            WHERE major_id IN ((SELECT value FROM STRING_SPLIT(@major_ids_str, ','))) AND status = 5
        `);
        const examsWithStudentData = await Promise.all(
            // promise map จะส่ง thesis_exam_date ไปด้วยอัตโนมัติ
            exams.map(async ({ student_id, ...rest }) => {
                /* const { student_name, major_name } = (await axios.get(`${BASE_URL}/api/student/${student_id}`)).data; */
                const { student_name, major_name } = await getStudentData(student_id);

                return { ...rest, student_id, name: student_name, major_name };
            })
        );
        res.status(200).json(examsWithStudentData);
    } catch (err) {
        console.error("requestExamInfoAll:", err);
        res.status(500).json({ message: "เกิดข้อผิดพลาดในการดึงข้อมูล" });
    }
});

router.post("/allExamProposalResultsPrint", authenticateToken, async (req, res) => {
    try {
        const { recordset: exams } = await (await poolPromise).request().query(`
            SELECT 
                study_group_id, student_id, exam_results, term, request_type,
                thesis_exam_date -- *** UPDATED HERE: เพิ่ม field นี้
            FROM request_thesis_proposal 
            WHERE status = 5
        `);
        const examsWithStudentData = await Promise.all(
            exams.map(async ({ student_id, ...rest }) => {
                /* const { student_name, major_name } = (await axios.get(`${BASE_URL}/api/student/${student_id}`)).data; */
                const { student_name, major_name } = await getStudentData(student_id);
                
                return { ...rest, student_id, name: student_name, major_name };
            })
        );
        /* console.log(examsWithStudentData); */
        res.status(200).json(examsWithStudentData);
    } catch (err) {
        console.error("requestExamInfoAll:", err);
        res.status(500).json({ message: "เกิดข้อผิดพลาดในการดึงข้อมูล" });
    }
});

module.exports = router;