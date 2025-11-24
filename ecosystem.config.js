// ecosystem.config.js
module.exports = {
  apps : [{
    name   : "my-backend-app",       // ตั้งชื่อ App ตามใจชอบ
    script : "./server/app.js",      // ชี้ไปที่ไฟล์ entry point ของ backend (แก้ path ให้ถูก)
    instances: max,                    // จำนวน Process (ถ้าอยากให้แรงตาม Core CPU ใส่ "max")
    autorestart: true,               // ให้รันใหม่เองถ้าแอปพัง
    watch: false,                    // Production ไม่ต้อง Watch File Change
    max_memory_restart: '1G',        // รีสตาร์ทถ้ารอมบวมเกิน 1GB
    env: {
      NODE_ENV: "production",
      // PM2 จะอ่านไฟล์ .env ใน folder server เองถ้าเรา setup code ไว้ถูก
      // หรือจะใส่ค่า default ตรงนี้ก็ได้
    }
  }]
}