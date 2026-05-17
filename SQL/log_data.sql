CREATE TABLE `log_data` (
  `id` int NOT NULL AUTO_INCREMENT,
  `data_id` int NOT NULL,
  `data_type` enum('plant','fertilizer','chemical','source','pest') NOT NULL,
  `action_type` enum('insert','edit','status') NOT NULL,
  `editor_id` varchar(20) NOT NULL,
  `editor_name` varchar(150) NOT NULL,
  `before_data` json DEFAULT NULL,
  `after_data` json NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `because` longtext NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_data` (`data_id`, `data_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
