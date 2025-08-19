/*
  Warnings:

  - The primary key for the `device_status` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the `device_last_seen` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `device_last_seen` DROP FOREIGN KEY `device_last_seen_ibfk_1`;

-- DropIndex
DROP INDEX `device_id` ON `device_status`;

-- AlterTable
ALTER TABLE `device_status` DROP PRIMARY KEY,
    ADD COLUMN `last_seen` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    MODIFY `device_id` VARCHAR(191) NOT NULL,
    ADD PRIMARY KEY (`device_id`);

-- DropTable
DROP TABLE `device_last_seen`;

-- CreateTable
CREATE TABLE `gateway` (
    `gateway_id` VARCHAR(64) NOT NULL,
    `name` VARCHAR(191) NULL,

    PRIMARY KEY (`gateway_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `gateway_status` (
    `gateway_id` VARCHAR(191) NOT NULL,
    `status` ENUM('ONLINE', 'OFFLINE', 'UNKNOWN') NOT NULL,
    `last_seen` DATETIME(3) NOT NULL,

    PRIMARY KEY (`gateway_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `device` (
    `device_id` VARCHAR(64) NOT NULL,
    `name` VARCHAR(191) NULL,

    PRIMARY KEY (`device_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `gateway_device` (
    `gateway_id` VARCHAR(191) NOT NULL,
    `device_id` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`gateway_id`, `device_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `device_group` (
    `group_id` VARCHAR(64) NOT NULL,
    `name` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`group_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `device_group_member` (
    `group_id` VARCHAR(191) NOT NULL,
    `device_id` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`group_id`, `device_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `gateway_status` ADD CONSTRAINT `gateway_status_gateway_id_fkey` FOREIGN KEY (`gateway_id`) REFERENCES `gateway`(`gateway_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `device_status` ADD CONSTRAINT `device_status_device_id_fkey` FOREIGN KEY (`device_id`) REFERENCES `device`(`device_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `gateway_device` ADD CONSTRAINT `gateway_device_gateway_id_fkey` FOREIGN KEY (`gateway_id`) REFERENCES `gateway`(`gateway_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `gateway_device` ADD CONSTRAINT `gateway_device_device_id_fkey` FOREIGN KEY (`device_id`) REFERENCES `device`(`device_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `device_group_member` ADD CONSTRAINT `device_group_member_group_id_fkey` FOREIGN KEY (`group_id`) REFERENCES `device_group`(`group_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `device_group_member` ADD CONSTRAINT `device_group_member_device_id_fkey` FOREIGN KEY (`device_id`) REFERENCES `device`(`device_id`) ON DELETE RESTRICT ON UPDATE CASCADE;
