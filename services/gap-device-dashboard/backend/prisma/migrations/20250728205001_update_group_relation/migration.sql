/*
  Warnings:

  - You are about to drop the `device_group_member` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `device_group_member` DROP FOREIGN KEY `device_group_member_device_id_fkey`;

-- DropForeignKey
ALTER TABLE `device_group_member` DROP FOREIGN KEY `device_group_member_group_id_fkey`;

-- AlterTable
ALTER TABLE `device` ADD COLUMN `group_id` VARCHAR(191) NULL;

-- DropTable
DROP TABLE `device_group_member`;

-- AddForeignKey
ALTER TABLE `device` ADD CONSTRAINT `device_group_id_fkey` FOREIGN KEY (`group_id`) REFERENCES `device_group`(`group_id`) ON DELETE SET NULL ON UPDATE CASCADE;
