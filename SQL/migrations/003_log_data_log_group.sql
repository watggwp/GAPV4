-- ตารางประวัติการแก้ข้อมูลหลัก (log_data) และการแก้กลุ่มสารเคมี (log_group)
-- โค้ดเขียน/อ่านสองตารางนี้อยู่แล้ว แต่ฐานข้อมูลจริงยังไม่มี ทำให้ประวัติไม่ถูกบันทึกและหน้าประวัติกลุ่มเปิดไม่ได้
-- ที่มา: SQL/log_data.sql และ SQL/log_group.sql (because ของ log_group ให้เป็น NULL ได้ เพราะบาง route ไม่ส่งเหตุผลมา)

CREATE TABLE IF NOT EXISTS `log_data` (
  `id` int NOT NULL AUTO_INCREMENT,
  `data_id` int NOT NULL,
  `data_type` enum('plant','fertilizer','chemical','source','pest') NOT NULL,
  `action_type` enum('insert','edit','status','delete') NOT NULL,
  `editor_id` varchar(20) NOT NULL,
  `editor_name` varchar(150) NOT NULL,
  `before_data` json DEFAULT NULL,
  `after_data` json DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `because` longtext DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_data` (`data_id`, `data_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `log_group` (
  `id` int NOT NULL AUTO_INCREMENT,
  `group_id` int NOT NULL,
  `action_type` enum('insert','edit','status') NOT NULL,
  `editor_id` varchar(20) NOT NULL,
  `editor_name` varchar(150) NOT NULL,
  `before_data` json DEFAULT NULL,
  `after_data` json NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `because` longtext DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_group_id` (`group_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
