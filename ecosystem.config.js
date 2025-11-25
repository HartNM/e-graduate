module.exports = {
  apps: [
    {
      name: "backend-api", // จำชื่อนี้ไว้ใช้สั่ง Stop
      script: "./server/app.js", // Path ของไฟล์ (เช็คดีๆ ว่าต้องมี ./ หรือไม่)
      instances: 1,
      autorestart: true,
      watch: false,
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};
