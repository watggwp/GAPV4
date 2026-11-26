-- ให้บันทึกได้ว่า admin เป็นคนสั่งปั๊ม/ตั้งตารางเวลา (เดิมรองรับแค่ doctor, farmer)
ALTER TABLE `pump_log` MODIFY `account_type` enum('doctor','farmer','admin') DEFAULT NULL;
ALTER TABLE `pump_schedule` MODIFY `account_type` enum('doctor','farmer','admin') DEFAULT NULL;
