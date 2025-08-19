-- AlterTable
ALTER TABLE `gateway` ADD COLUMN `group_id` VARCHAR(191) NULL;

-- AddForeignKey
ALTER TABLE `gateway` ADD CONSTRAINT `gateway_group_id_fkey` FOREIGN KEY (`group_id`) REFERENCES `device_group`(`group_id`) ON DELETE SET NULL ON UPDATE CASCADE;
