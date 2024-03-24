/*
  Warnings:

  - You are about to drop the `ip_list` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `ip_list` DROP FOREIGN KEY `ip_list_userId_fkey`;

-- DropTable
DROP TABLE `ip_list`;
