-- CreateTable
CREATE TABLE `gateway_info` (
    `gateway_id` VARCHAR(191) NOT NULL,
    `api_key` VARCHAR(191) NOT NULL,
    `tenant_domain` VARCHAR(191) NOT NULL,
    `region` VARCHAR(191) NOT NULL,
    `app_id` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`gateway_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `device_info` (
    `device_id` VARCHAR(191) NOT NULL,
    `mqtt_username` VARCHAR(191) NOT NULL,
    `mqtt_password` VARCHAR(191) NOT NULL,
    `mqtt_topic` VARCHAR(191) NOT NULL,
    `mqtt_broker` VARCHAR(191) NOT NULL,
    `mqtt_port` INTEGER NOT NULL,

    PRIMARY KEY (`device_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `gateway_info` ADD CONSTRAINT `gateway_info_gateway_id_fkey` FOREIGN KEY (`gateway_id`) REFERENCES `gateway`(`gateway_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `device_info` ADD CONSTRAINT `device_info_device_id_fkey` FOREIGN KEY (`device_id`) REFERENCES `device`(`device_id`) ON DELETE RESTRICT ON UPDATE CASCADE;
