-- CreateTable
CREATE TABLE `device_last_seen` (
    `device_id` VARCHAR(64) NOT NULL,
    `last_seen` DATETIME(3) NOT NULL,

    PRIMARY KEY (`device_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `device_status` (
    `device_id` VARCHAR(64) NOT NULL,
    `status` ENUM('ONLINE', 'OFFLINE', 'UNKNOWN') NOT NULL,

    PRIMARY KEY (`device_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `device_last_seen` ADD CONSTRAINT `device_last_seen_ibfk_1` FOREIGN KEY (`device_id`) REFERENCES `device_status`(`device_id`) ON DELETE CASCADE ON UPDATE CASCADE;
