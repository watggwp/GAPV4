-- Baseline schema ของ GAPV4 (สร้างจากฐานข้อมูลที่ใช้งานจริง gap_dev1163 เมื่อ 2026-10-13)
-- ใช้ CREATE TABLE IF NOT EXISTS: ฐานข้อมูลใหม่จะได้ทุกตาราง ฐานข้อมูลเดิมจะไม่ถูกแก้
-- ไฟล์นี้แทน SQL/main/Structure Database.sql ซึ่งขาดตารางหลายตาราง

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

CREATE TABLE IF NOT EXISTS `acc_doctor` (
  `id_table_doctor` int(11) NOT NULL AUTO_INCREMENT,
  `id_doctor` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `uid_line_doctor` varchar(50) NOT NULL,
  `password_doctor` varchar(256) NOT NULL,
  `fullname_doctor` varchar(50) NOT NULL,
  `station_doctor` varchar(50) NOT NULL,
  `img_doctor` longblob NOT NULL,
  `status_account` tinyint(1) NOT NULL,
  `status_delete` tinyint(1) NOT NULL,
  `time_online` varchar(60) NOT NULL,
  `doctor_role` tinyint(1) NOT NULL,
  `analyst_role` tinyint(1) NOT NULL,
  `consultant_role` tinyint(1) NOT NULL,
  `protection_role` tinyint(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id_table_doctor`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
CREATE TABLE IF NOT EXISTS `acc_farmer` (
  `id_table` int(11) NOT NULL AUTO_INCREMENT,
  `id_farmer` varchar(50) NOT NULL,
  `id_table_doctor` varchar(50) NOT NULL,
  `fullname` varchar(50) NOT NULL,
  `img` longblob NOT NULL,
  `station` varchar(50) NOT NULL,
  `location` point NOT NULL,
  `password` varchar(256) NOT NULL,
  `register_auth` tinyint(1) NOT NULL,
  `date_register` datetime NOT NULL DEFAULT current_timestamp(),
  `date_doctor_confirm` varchar(100) NOT NULL,
  `uid_line` varchar(255) NOT NULL,
  `link_user` varchar(50) NOT NULL,
  `tel_number` varchar(15) NOT NULL,
  `text_location` longtext NOT NULL,
  `reminder_days_advance` int(11) DEFAULT 1,
  PRIMARY KEY (`id_table`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
CREATE TABLE IF NOT EXISTS `account_type` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
CREATE TABLE IF NOT EXISTS `admin` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `password` varchar(100) NOT NULL,
  `phone` varchar(20) NOT NULL,
  `address` point NOT NULL,
  `station_admin` varchar(50) NOT NULL,
  `img_admin` longblob NOT NULL,
  `fullname_admin` varchar(50) NOT NULL,
  `status_account` tinyint(1) NOT NULL,
  `status_delete` tinyint(1) NOT NULL,
  `time_online` varchar(60) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
CREATE TABLE IF NOT EXISTS `because_delete` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `id_table_doctor` varchar(50) NOT NULL,
  `id_admin` varchar(50) NOT NULL,
  `because_text` longtext NOT NULL,
  `date` varchar(50) NOT NULL,
  `role` int(11) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
CREATE TABLE IF NOT EXISTS `because_status` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `id_table_doctor` varchar(50) NOT NULL,
  `id_admin` varchar(50) NOT NULL,
  `because_text` longtext NOT NULL,
  `date` varchar(50) NOT NULL,
  `type_status` tinyint(1) NOT NULL,
  `role` int(11) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
CREATE TABLE IF NOT EXISTS `check_form_detail` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `id_plant` varchar(50) NOT NULL,
  `status_check` int(11) NOT NULL,
  `note_text` longtext NOT NULL,
  `id_table_doctor` int(11) NOT NULL,
  `date_check` datetime NOT NULL DEFAULT current_timestamp(),
  `acknowledged` tinyint(1) DEFAULT 0,
  `id_admin` int(11) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
CREATE TABLE IF NOT EXISTS `check_plant_detail` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `id_plant` varchar(50) NOT NULL,
  `status_check` int(11) NOT NULL,
  `state_check` tinyint(1) NOT NULL,
  `note_text` longtext NOT NULL,
  `id_table_doctor` int(11) NOT NULL,
  `date_check` datetime NOT NULL DEFAULT current_timestamp(),
  `acknowledged` tinyint(1) DEFAULT 0,
  `id_admin` int(11) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
CREATE TABLE IF NOT EXISTS `chemical_list` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL,
  `name_formula` varchar(50) NOT NULL,
  `how_use` longtext NOT NULL,
  `date_safe_list` int(11) NOT NULL,
  `is_use` tinyint(1) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
CREATE TABLE IF NOT EXISTS `detailedit` (
  `id_detail` int(11) NOT NULL AUTO_INCREMENT,
  `id_edit` int(11) NOT NULL,
  `subject_form` varchar(20) NOT NULL,
  `old_content` varchar(100) NOT NULL,
  `new_content` varchar(100) NOT NULL,
  PRIMARY KEY (`id_detail`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
CREATE TABLE IF NOT EXISTS `ecph` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `id_formplant` varchar(50) NOT NULL,
  `timestamp` datetime NOT NULL DEFAULT current_timestamp(),
  `ec_value` decimal(5,2) NOT NULL,
  `ph_value` decimal(5,2) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
CREATE TABLE IF NOT EXISTS `editform` (
  `id_edit` int(11) NOT NULL AUTO_INCREMENT,
  `id_form` varchar(50) NOT NULL,
  `id_doctor` varchar(50) NOT NULL,
  `id_doctor_edit` int(11) DEFAULT NULL,
  `because` varchar(100) NOT NULL,
  `date` datetime NOT NULL DEFAULT current_timestamp(),
  `note` varchar(100) NOT NULL,
  `status` int(11) NOT NULL,
  `type_form` varchar(10) NOT NULL,
  `id_admin` int(11) NOT NULL,
  PRIMARY KEY (`id_edit`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
CREATE TABLE IF NOT EXISTS `fertilizer_list` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL,
  `name_formula` varchar(50) NOT NULL,
  `how_use` longtext NOT NULL,
  `is_use` tinyint(1) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
CREATE TABLE IF NOT EXISTS `formchemical` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `id_plant` varchar(50) NOT NULL,
  `name` varchar(50) NOT NULL,
  `formula_name` varchar(50) NOT NULL,
  `insect` varchar(100) NOT NULL,
  `use_is` varchar(100) NOT NULL,
  `rate` varchar(20) NOT NULL,
  `volume` varchar(100) NOT NULL,
  `date_safe` varchar(100) NOT NULL,
  `date` varchar(100) NOT NULL,
  `source` varchar(50) NOT NULL,
  `pest_id` int(11) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
CREATE TABLE IF NOT EXISTS `formfertilizer` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `id_plant` varchar(50) NOT NULL,
  `name` varchar(50) NOT NULL,
  `formula_name` varchar(50) NOT NULL,
  `use_is` varchar(100) NOT NULL,
  `volume` varchar(100) NOT NULL,
  `source` varchar(100) NOT NULL,
  `date` varchar(50) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
CREATE TABLE IF NOT EXISTS `formplant` (
  `id` varchar(50) NOT NULL,
  `id_farm_house` varchar(255) NOT NULL,
  `name_plant` varchar(50) NOT NULL,
  `generation` int(11) DEFAULT NULL,
  `date_glow` varchar(50) DEFAULT NULL,
  `date_plant` varchar(50) NOT NULL,
  `posi_w` float DEFAULT NULL,
  `posi_h` float DEFAULT NULL,
  `qty` int(11) DEFAULT NULL,
  `area` float DEFAULT NULL,
  `date_harvest` varchar(50) DEFAULT NULL,
  `system_glow` varchar(50) DEFAULT NULL,
  `water` varchar(50) DEFAULT NULL,
  `water_flow` varchar(50) DEFAULT NULL,
  `history` varchar(50) DEFAULT NULL,
  `insect` varchar(50) DEFAULT NULL,
  `qtyInsect` varchar(50) DEFAULT NULL,
  `seft` varchar(200) DEFAULT NULL,
  `state_status` int(11) DEFAULT NULL,
  `date_success` varchar(50) DEFAULT NULL,
  `unit` varchar(30) DEFAULT NULL,
  `name_varieties` varchar(50) DEFAULT NULL,
  `expected_yield` decimal(10,2) DEFAULT NULL,
  `default_yield` decimal(10,2) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
CREATE TABLE IF NOT EXISTS `housefarm` (
  `id_farm_house` int(11) NOT NULL AUTO_INCREMENT,
  `uid_line` varchar(255) NOT NULL,
  `link_user` varchar(50) NOT NULL,
  `name_house` varchar(50) NOT NULL,
  `img_house` longblob NOT NULL,
  `location` point DEFAULT NULL,
  `status` tinyint(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id_farm_house`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
CREATE TABLE IF NOT EXISTS `log_admin` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `admin_id` int(11) NOT NULL,
  `date` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `admin_id` (`admin_id`),
  CONSTRAINT `log_admin_ibfk_1` FOREIGN KEY (`admin_id`) REFERENCES `admin` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
CREATE TABLE IF NOT EXISTS `message_user` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `message` longtext NOT NULL,
  `uid_line_farmer` varchar(255) DEFAULT NULL,
  `id_read` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`id_read`)),
  `date` datetime NOT NULL DEFAULT current_timestamp(),
  `type` varchar(50) NOT NULL,
  `type_message` varchar(10) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
CREATE TABLE IF NOT EXISTS `notify_doctor` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `id_table_farmer` int(11) NOT NULL,
  `date` datetime NOT NULL DEFAULT current_timestamp(),
  `id_read` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`id_read`)),
  `notify` longtext NOT NULL,
  `station` varchar(50) NOT NULL,
  `type` int(11) DEFAULT 0,
  `ref_id` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;
CREATE TABLE IF NOT EXISTS `notify_type` (
  `id` int(11) NOT NULL,
  `name` varchar(100) DEFAULT NULL,
  `description` text DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
CREATE TABLE IF NOT EXISTS `pest_chemical` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `pest_id` int(11) NOT NULL,
  `chemical_id` int(11) NOT NULL,
  `plant_id` int(11) DEFAULT NULL,
  `safe_days` int(11) DEFAULT 0,
  `status` tinyint(1) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `pest_id` (`pest_id`),
  KEY `chemical_id` (`chemical_id`),
  CONSTRAINT `pest_chemical_ibfk_2` FOREIGN KEY (`chemical_id`) REFERENCES `chemical_list` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
CREATE TABLE IF NOT EXISTS `pests` (
  `pest_id` int(11) NOT NULL AUTO_INCREMENT,
  `pest_name` varchar(255) NOT NULL,
  `type_pest` varchar(50) DEFAULT NULL,
  `is_use` tinyint(1) NOT NULL,
  PRIMARY KEY (`pest_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
CREATE TABLE IF NOT EXISTS `plant_list` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL,
  `variety_name` varchar(255) NOT NULL,
  `is_use` tinyint(1) NOT NULL,
  `type_plant` varchar(20) NOT NULL,
  `qty_harvest` int(11) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
CREATE TABLE IF NOT EXISTS `pump_log` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `device_id` varchar(50) DEFAULT NULL,
  `action` enum('on','off') DEFAULT NULL,
  `source` enum('manual','auto') DEFAULT NULL,
  `account_type` enum('doctor','farmer') DEFAULT NULL,
  `account_id` int(11) DEFAULT NULL,
  `timestamp` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
CREATE TABLE IF NOT EXISTS `pump_schedule` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `device_id` varchar(50) DEFAULT NULL,
  `start_time` time DEFAULT NULL,
  `duration` int(11) DEFAULT NULL,
  `account_type` enum('doctor','farmer') DEFAULT NULL,
  `account_id` int(11) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
CREATE TABLE IF NOT EXISTS `record_edit` (
  `id_record_edit` int(11) NOT NULL AUTO_INCREMENT,
  `edit_date` datetime NOT NULL,
  `report_text` longtext NOT NULL,
  `image_path` varchar(100) NOT NULL,
  `id_report_detail` int(11) NOT NULL,
  PRIMARY KEY (`id_record_edit`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
CREATE TABLE IF NOT EXISTS `report_detail` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `id_plant` varchar(50) NOT NULL,
  `report_text` longtext NOT NULL,
  `id_table_doctor` int(11) NOT NULL,
  `date_report` datetime NOT NULL DEFAULT current_timestamp(),
  `image_path` varchar(100) NOT NULL,
  `is_read` tinyint(1) DEFAULT 0,
  `id_admin` int(11) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
CREATE TABLE IF NOT EXISTS `schedule_tracking` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `formplant_id` varchar(50) DEFAULT NULL,
  `schedule_id` int(11) NOT NULL COMMENT 'ID แผนการปลูก (schedules)',
  `formfertilizer_id` varchar(50) DEFAULT NULL,
  `formchemical_id` varchar(50) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_tracking` (`formplant_id`,`schedule_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
CREATE TABLE IF NOT EXISTS `schedules` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `uid` varchar(36) NOT NULL,
  `plant_id` int(11) NOT NULL,
  `station_id` varchar(2) NOT NULL,
  `category` int(11) NOT NULL,
  `title` varchar(50) NOT NULL,
  `age_plant` int(11) NOT NULL,
  `repeat` tinyint(1) NOT NULL,
  `last_update` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `schedule_uid` (`uid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
CREATE TABLE IF NOT EXISTS `schedules_detail_disease` (
  `schedule_id` int(11) NOT NULL,
  `pest` varchar(100) NOT NULL,
  `chemical` varchar(100) NOT NULL,
  `rate` float NOT NULL,
  `volume` float NOT NULL,
  `unit_volume` varchar(50) NOT NULL,
  `how_use` text NOT NULL,
  PRIMARY KEY (`schedule_id`),
  CONSTRAINT `schedule_detail_disease` FOREIGN KEY (`schedule_id`) REFERENCES `schedules` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
CREATE TABLE IF NOT EXISTS `schedules_detail_fertilizer` (
  `schedule_id` int(11) NOT NULL,
  `fertilizer` varchar(150) NOT NULL,
  `formula_fertilizer` varchar(20) NOT NULL,
  `volume` float NOT NULL,
  `unit_volume` varchar(50) NOT NULL,
  `how_use` text NOT NULL,
  PRIMARY KEY (`schedule_id`) USING BTREE,
  CONSTRAINT `schedule_detail_fertilizer` FOREIGN KEY (`schedule_id`) REFERENCES `schedules` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
CREATE TABLE IF NOT EXISTS `schedules_history` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `schedule_id` int(11) NOT NULL,
  `greenhouse_id` int(11) NOT NULL,
  `details_message` text NOT NULL,
  `date` date NOT NULL DEFAULT current_timestamp(),
  `notified_unrecorded` tinyint(1) DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `schedule_historys_shcedule_id` (`schedule_id`),
  CONSTRAINT `schedule_historys_shcedule_id` FOREIGN KEY (`schedule_id`) REFERENCES `schedules` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
CREATE TABLE IF NOT EXISTS `sensor_pump_greenhouse` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `device_id` varchar(50) NOT NULL,
  `greenhouse_id` int(11) DEFAULT NULL,
  `status` enum('on','off','not register') NOT NULL DEFAULT 'not register',
  `create_timestamp` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `fk_greenhouse_id` (`greenhouse_id`),
  CONSTRAINT `fk_greenhouse_id` FOREIGN KEY (`greenhouse_id`) REFERENCES `housefarm` (`id_farm_house`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
CREATE TABLE IF NOT EXISTS `sensor_weather_greenhouse` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `device_id` varchar(50) NOT NULL,
  `greenhouse_id` int(11) DEFAULT NULL,
  `status` enum('on','off','not register') NOT NULL DEFAULT 'not register',
  `create_timestamp` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `sensor_greenhouse` (`greenhouse_id`),
  CONSTRAINT `sensor_greenhouse` FOREIGN KEY (`greenhouse_id`) REFERENCES `housefarm` (`id_farm_house`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
CREATE TABLE IF NOT EXISTS `sensor_weather_station` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `device_id` varchar(50) NOT NULL,
  `station_signature` varchar(255) DEFAULT NULL,
  `status` enum('on','off','not register') NOT NULL DEFAULT 'not register',
  `create_timestamp` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `sensor_station` (`station_signature`),
  CONSTRAINT `sensor_station` FOREIGN KEY (`station_signature`) REFERENCES `station_list` (`id_station`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
CREATE TABLE IF NOT EXISTS `source_list` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(80) NOT NULL,
  `is_use` tinyint(1) NOT NULL,
  `location` point DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
CREATE TABLE IF NOT EXISTS `station_list` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL,
  `is_use` tinyint(1) NOT NULL,
  `location` point NOT NULL,
  `id_station` varchar(255) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `station_signature_id` (`id_station`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
CREATE TABLE IF NOT EXISTS `statistic` (
  `id` int(11) NOT NULL,
  `id_role` varchar(20) NOT NULL,
  `role` varchar(20) NOT NULL,
  `count_day` int(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
CREATE TABLE IF NOT EXISTS `success_detail` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `id_success` varchar(100) NOT NULL,
  `id_plant` varchar(50) NOT NULL,
  `type_success` tinyint(1) NOT NULL,
  `id_table_doctor` int(11) NOT NULL,
  `date_of_doctor` datetime NOT NULL DEFAULT current_timestamp(),
  `date_of_farmer` varchar(100) NOT NULL,
  `id_admin` int(11) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
CREATE TABLE IF NOT EXISTS `user_access_logs` (
  `user_id` int(11) NOT NULL,
  `user_type` int(11) NOT NULL,
  `access_date` date NOT NULL DEFAULT current_timestamp(),
  `access_time` time NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`user_id`,`user_type`,`access_date`,`access_time`) USING BTREE,
  KEY `user_access_logs_account_type` (`user_type`),
  CONSTRAINT `user_access_logs_account_type` FOREIGN KEY (`user_type`) REFERENCES `account_type` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
CREATE TABLE IF NOT EXISTS `varieties` (
  `variety_id` int(11) NOT NULL AUTO_INCREMENT,
  `plant_id` int(11) DEFAULT NULL,
  `variety_name` varchar(50) NOT NULL,
  `dates` int(11) DEFAULT NULL,
  PRIMARY KEY (`variety_id`),
  KEY `fk_varieties_plant_list` (`plant_id`),
  CONSTRAINT `fk_varieties_plant_list` FOREIGN KEY (`plant_id`) REFERENCES `plant_list` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
CREATE TABLE IF NOT EXISTS `weather_greenhouse` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `device_id` varchar(50) DEFAULT NULL,
  `timestamp` datetime DEFAULT NULL,
  `air_temperature` float DEFAULT NULL,
  `air_humidity` float DEFAULT NULL,
  `light` float DEFAULT NULL,
  `soil_temperature` float DEFAULT NULL,
  `soil_humidity` float DEFAULT NULL,
  `pressure` float DEFAULT NULL,
  `batt` float DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
CREATE TABLE IF NOT EXISTS `weather_station` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `device_id` varchar(50) DEFAULT NULL,
  `timestamp` datetime NOT NULL DEFAULT current_timestamp(),
  `temperature` double DEFAULT NULL,
  `humidity` double DEFAULT NULL,
  `light` double DEFAULT NULL,
  `rainfall` double DEFAULT NULL,
  `pressure` float DEFAULT NULL,
  `batt` float DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

SET FOREIGN_KEY_CHECKS = 1;
