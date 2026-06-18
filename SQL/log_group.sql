CREATE TABLE `log_group` (
  `id` int NOT NULL AUTO_INCREMENT,
  `group_id` int NOT NULL,
  `action_type` enum('insert','edit','status') NOT NULL,
  `editor_id` varchar(20) NOT NULL,
  `editor_name` varchar(150) NOT NULL,
  `before_data` json DEFAULT NULL,
  `after_data` json NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `because` longtext NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_group_id` (`group_id`)
);
