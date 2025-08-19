-- AlterTable
ALTER TABLE `device_info` ADD COLUMN `api_endpoint` VARCHAR(191) NULL,
    ADD COLUMN `fields` JSON NULL;
