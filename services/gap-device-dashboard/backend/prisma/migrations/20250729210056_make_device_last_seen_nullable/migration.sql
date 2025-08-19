-- AlterTable
ALTER TABLE `device_status` MODIFY `last_seen` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3);

-- AlterTable
ALTER TABLE `gateway_status` MODIFY `last_seen` DATETIME(3) NULL;
