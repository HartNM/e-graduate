@echo off
:: ตั้งค่าข้อความ commit (จะให้กรอกหรือใส่คงที่ก็ได้)

set /p commitMsg=Enter commit message commit: 
if "%commitMsg%"=="" set commitMsg=update

:: รันคำสั่ง git
git add .
git commit -m "%commitMsg%"
git push

pause