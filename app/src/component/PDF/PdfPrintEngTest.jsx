import { Button } from "@mantine/core";
import { PDFDocument } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import { formatThaiDate, drawRect, drawLine, drawCenteredText, drawMiddleText, drawCenterXText } from "./PdfUtils.js";

const BASE_URL = import.meta.env.VITE_API_URL;

async function fillPdf(templateUrl, data) {
    const templateBytes = await fetch(templateUrl).then((res) => res.arrayBuffer());
    const templateDoc = await PDFDocument.load(templateBytes);
    templateDoc.registerFontkit(fontkit);
    const pdfDoc = await PDFDocument.create();
    pdfDoc.registerFontkit(fontkit);

    const fontBytes = await fetch("/fonts/THSarabunNew.ttf").then((res) => res.arrayBuffer());
    const customFont = await pdfDoc.embedFont(fontBytes);

    const logoBytes = await fetch("/icons/KPRU-LOGO-line2.png").then((res) => res.arrayBuffer());
    const logoImage = await pdfDoc.embedPng(logoBytes);
    const pngDims = logoImage.scale(0.125);

    const term = data?.[0]?.term;

    const groupedData = data.reduce((acc, student) => {
        const groupId = student.study_group_id;
        if (!acc[groupId]) {
            acc[groupId] = [];
        }
        acc[groupId].push(student);
        return acc;
    }, {});

    let examInfo = null;
    try {
        const token = localStorage.getItem("token");
        const requestRes = await fetch(`${BASE_URL}/api/allRequestExamInfo`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({ term: term }),
        });
        const requestData = await requestRes.json();
        if (Array.isArray(requestData) && requestData.length > 0) {
            examInfo = requestData[0];
        }
        console.log("Exam Info (ET):", examInfo);
    } catch (e) {
        console.error("Error fetch allRequestExamInfo:", e);
    }

    // --- ส่วนที่แยกมาเฉพาะ: ดึงแค่ ET_exam_date ---
    const examDates = [];
    if (examInfo && examInfo.ET_exam_date) {
        examDates.push(new Date(examInfo.ET_exam_date));
    } else {
        // ถ้าไม่มีวันที่ ให้ใส่ null เพื่อเว้นว่างไว้ (...........)
        examDates.push(null);
    }

    const STUDENTS_PER_PAGE = 25;
    const ROW_HEIGHT = 20;

    // --- ลูปหลัก (วนตามกลุ่ม) ---
    for (const groupId in groupedData) {
        const students = groupedData[groupId];

        // วนลูป (ซึ่งจะมีแค่รอบเดียวสำหรับ ET_exam_date)
        for (const examDate of examDates) {
            
            // --- สร้างข้อความวันที่ ---
            let dateString;
            if (examDate) {
                const [day, month, year] = formatThaiDate(examDate);
                dateString = `สอบวันที่ ${day} ${month} ${year} เวลา............................`;
            } else {
                dateString = "สอบวันที่ ........................................ เวลา............................";
            }

            // --- ลูปแบ่งหน้า (Pagination) ---
            let pageIndex = 0;
            while (pageIndex * STUDENTS_PER_PAGE < students.length) {
                const [newPage] = await pdfDoc.copyPages(templateDoc, [0]);
                pdfDoc.addPage(newPage);
                const start = pageIndex * STUDENTS_PER_PAGE;
                const end = Math.min(start + STUDENTS_PER_PAGE, students.length);

                // --- วาดโลโก้ ---
                const centerX = (newPage.getWidth() - pngDims.width) / 2;
                newPage.drawImage(logoImage, {
                    x: centerX,
                    y: 700,
                    width: pngDims.width,
                    height: pngDims.height,
                });

                // --- Header ---
                const studentInfo = students[0];
                // เช็ค request_type ป้องกัน error กรณี format ต่างจากเดิม
                const type = studentInfo.request_type && studentInfo.request_type.includes("ขอ") 
                    ? studentInfo.request_type.split("ขอ")[1] 
                    : studentInfo.request_type;

                const programName = studentInfo.program ? studentInfo.program.split(" (")[0] : "";
                const majorHeaderLine = `${programName} สาขาวิชา${studentInfo.major_name}`;

                // ส่วนหัวกระดาษ (Header Text)
                drawCenterXText(newPage, `รายชื่อผู้เข้า${type}`, 680, customFont, 16);
                drawCenterXText(newPage, majorHeaderLine, 660, customFont, 16);
                drawCenterXText(newPage, `ประจำภาคเรียนที่ ${studentInfo.term}`, 640, customFont, 16);
                
                // ปรับเงื่อนไข Header ตามประเภท ถ้าต้องการ (Code เดิม)
                if (type === "สอบประมวลความรู้") {
                     drawCenterXText(newPage, `หมวด..........................................`, 620, customFont, 16);
                } else {
                     drawCenterXText(newPage, `ด้าน..................................................`, 620, customFont, 16);
                }
                
                drawCenterXText(newPage, dateString, 600, customFont, 16);

                const yHeader = 560;

                // --- วาดตาราง ---
                drawRect(newPage, 60, yHeader, 490, ROW_HEIGHT);
                const tableHeight = (end - start) * ROW_HEIGHT;
                const bottomY = yHeader - tableHeight;
                
                // เส้นแนวตั้ง
                drawLine(newPage, 100, yHeader + ROW_HEIGHT, 100, bottomY);
                drawLine(newPage, 170, yHeader + ROW_HEIGHT, 170, bottomY);
                drawLine(newPage, 370, yHeader + ROW_HEIGHT, 370, bottomY);
                drawLine(newPage, 470, yHeader + ROW_HEIGHT, 470, bottomY);

                // หัวตาราง
                drawCenteredText(newPage, "ลำดับ", 60, yHeader, 40, ROW_HEIGHT, customFont, 14);
                drawCenteredText(newPage, "รหัสนักศึกษา", 100, yHeader, 70, ROW_HEIGHT, customFont, 14);
                drawCenteredText(newPage, "ชื่อ - นามสกุล", 170, yHeader, 200, ROW_HEIGHT, customFont, 14);
                drawCenteredText(newPage, "ลายมือชื่อ", 370, yHeader, 100, ROW_HEIGHT, customFont, 14);
                drawCenteredText(newPage, "หมายเหตุ", 470, yHeader, 80, ROW_HEIGHT, customFont, 14);

                // --- วาดข้อมูลนักศึกษา ---
                let currentY = yHeader;
                for (let i = start; i < end; i++) {
                    currentY -= ROW_HEIGHT;
                    drawRect(newPage, 60, currentY, 490, ROW_HEIGHT);
                    drawCenteredText(newPage, `${i + 1}`, 60, currentY, 40, ROW_HEIGHT, customFont, 14);
                    drawCenteredText(newPage, `${students[i].student_id}`, 100, currentY, 70, ROW_HEIGHT, customFont, 14);
                    
                    const nameParts = students[i].student_name.split(" ");
                    const firstName = nameParts[0];
                    const lastName = nameParts.slice(1).join(" ");
                    
                    drawMiddleText(newPage, firstName, 190, currentY, ROW_HEIGHT, customFont, 14);
                    drawMiddleText(newPage, lastName, 290, currentY, ROW_HEIGHT, customFont, 14);
                }
                pageIndex++;
            }
        }
    }

    const pdfBytes = await pdfDoc.save();
    return new Blob([pdfBytes], { type: "application/pdf" });
}

export default function SignatureFormET({ data }) {
    const handleClick = async () => {
        if (!data || data.length === 0) {
            console.error("No data to print");
            return;
        }
        // เปลี่ยนชื่อไฟล์ PDF ที่ดาวน์โหลดให้สื่อความหมาย
        const blob = await fillPdf("/pdf/blank.pdf", data);
        const url = URL.createObjectURL(blob);
        window.open(url, "_blank");
    };

    return (
        <Button size="xs" color="blue" onClick={handleClick} disabled={!data || data.length === 0}>
            พิมพ์รายชื่อ
        </Button>
    );
}