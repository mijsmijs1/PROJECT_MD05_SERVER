-- AlterTable
ALTER TABLE `product` MODIFY `status` ENUM('active', 'inactive', 'done', 'delete', 'deny') NOT NULL DEFAULT 'inactive';
