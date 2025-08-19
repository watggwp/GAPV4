/*
  Warnings:

  - A unique constraint covering the columns `[device_id]` on the table `device_last_seen` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[device_id]` on the table `device_status` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `device_last_seen` MODIFY `last_seen` TIMESTAMP(6) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX `device_id` ON `device_last_seen`(`device_id`);

-- CreateIndex
CREATE UNIQUE INDEX `device_id` ON `device_status`(`device_id`);
