// backend/services/pdfService.js
const { PDFDocument, rgb } = require("pdf-lib");
const fontkit = require("@pdf-lib/fontkit");
const fs = require("fs");
const path = require("path");
const axios = require("axios");

// โหลดฟอนต์เตรียมไว้ (Load ครั้งเดียว หรือ load ทุก request ก็ได้แต่วิธีนี้ดีกว่า)
const fontPath = path.join(__dirname, "../assets/fonts/THSarabunNew.ttf");
const fontBytes = fs.readFileSync(fontPath);

async function createPDF(data, signatureIds) {
    // 1. สร้าง Doc ใหม่
    const pdfDoc = await PDFDocument.create();
    pdfDoc.registerFontkit(fontkit);
    const customFont = await pdfDoc.embedFont(fontBytes);

    // 2. ดึงลายเซ็น (Server คุยกับ Server โดยตรง ไม่ผ่าน Browser)
    const signatureImages = {};
    for (const [role, id] of Object.entries(signatureIds)) {
        if (!id) continue;
        try {
            // ยิงไป Source ต้นทางโดยตรง (เหมือนใน kpruApi.js)
            const imgRes = await axios.get(`https://e-par.kpru.ac.th/timeKPRU/contents/signature/${id}.jpg`, {
                responseType: 'arraybuffer'
            });
            
            const img = await pdfDoc.embedJpg(imgRes.data);
            signatureImages[role] = img;
        } catch (err) {
            console.warn(`ไม่พบลายเซ็น ID: ${id}`);
        }
    }

    // 3. วาดหน้ากระดาษ (Logic เดิมจาก PdfUtils.js/Components)
    const page = pdfDoc.addPage([595.28, 841.89]); // A4
    const { width, height } = page.getSize();
    const fontSize = 16;

    page.drawText(`เอกสารรับรองของ: ${data.student_name}`, {
        x: 50,
        y: height - 50,
        size: fontSize,
        font: customFont,
        color: rgb(0, 0, 0),
    });

    // ตัวอย่างการวาดลายเซ็น
    if (signatureImages['advisor']) {
        page.drawImage(signatureImages['advisor'], {
            x: 100,
            y: 100,
            width: 100,
            height: 40,
        });
    }

    // 4. คืนค่าเป็น Buffer
    const pdfBytes = await pdfDoc.save();
    return Buffer.from(pdfBytes);
}

module.exports = { createPDF };