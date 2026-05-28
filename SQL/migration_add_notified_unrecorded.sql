-- Migration: เพิ่ม column notified_unrecorded ใน schedules_history
-- รัน script นี้ครั้งเดียวก่อนเปิดใช้งานฟีเจอร์แจ้งเตือนการไม่บันทึกปุ๋ย/สารเคมี

ALTER TABLE schedules_history
ADD COLUMN notified_unrecorded TINYINT(1) NOT NULL DEFAULT 0
COMMENT '0 = ยังไม่ได้แจ้งเตือน, 1 = แจ้งเตือนแล้ว';
