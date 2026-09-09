-- =======================================================
-- ChatApp: Complete MySQL Database Schema
-- Supports real-time WhatsApp-style messaging, user status,
-- direct chats, group chats, message statuses and reactions.
-- =======================================================

CREATE DATABASE IF NOT EXISTS `chatapp` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `chatapp`;

-- 1. Users Table
CREATE TABLE IF NOT EXISTS `users` (
  `id` VARCHAR(36) NOT NULL,
  `username` VARCHAR(50) NOT NULL,
  `email` VARCHAR(100) NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `profile_image` VARCHAR(500) DEFAULT NULL,
  `bio` VARCHAR(255) DEFAULT 'Hey there! I am using ChatApp.',
  `is_online` BOOLEAN DEFAULT FALSE,
  `last_seen` DATETIME DEFAULT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_users_username` (`username`),
  UNIQUE KEY `uq_users_email` (`email`),
  INDEX `idx_users_username` (`username`),
  INDEX `idx_users_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Conversations Table
CREATE TABLE IF NOT EXISTS `conversations` (
  `id` VARCHAR(36) NOT NULL,
  `type` ENUM('direct', 'group') NOT NULL DEFAULT 'direct',
  `name` VARCHAR(100) DEFAULT NULL,
  `image` VARCHAR(500) DEFAULT NULL,
  `created_by` VARCHAR(36) DEFAULT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_conversations_creator` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Conversation Members Table
CREATE TABLE IF NOT EXISTS `conversation_members` (
  `id` VARCHAR(36) NOT NULL,
  `conversation_id` VARCHAR(36) NOT NULL,
  `user_id` VARCHAR(36) NOT NULL,
  `role` ENUM('member', 'admin') DEFAULT 'member',
  `joined_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `last_read_at` DATETIME DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_conv_member` (`conversation_id`, `user_id`),
  INDEX `idx_conv_member_user` (`user_id`),
  CONSTRAINT `fk_cm_conversation` FOREIGN KEY (`conversation_id`) REFERENCES `conversations` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_cm_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Messages Table
CREATE TABLE IF NOT EXISTS `messages` (
  `id` VARCHAR(36) NOT NULL,
  `conversation_id` VARCHAR(36) NOT NULL,
  `sender_id` VARCHAR(36) NOT NULL,
  `message` TEXT DEFAULT NULL,
  `message_type` ENUM('text', 'image', 'file', 'audio') NOT NULL DEFAULT 'text',
  `media_url` VARCHAR(500) DEFAULT NULL,
  `reply_to_message_id` VARCHAR(36) DEFAULT NULL,
  `status` ENUM('sent', 'delivered', 'read') NOT NULL DEFAULT 'sent',
  `is_deleted` BOOLEAN DEFAULT FALSE,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_messages_conversation` (`conversation_id`, `created_at`),
  INDEX `idx_messages_sender` (`sender_id`),
  CONSTRAINT `fk_messages_conversation` FOREIGN KEY (`conversation_id`) REFERENCES `conversations` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_messages_sender` FOREIGN KEY (`sender_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_messages_reply` FOREIGN KEY (`reply_to_message_id`) REFERENCES `messages` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Message Status Table (for granular delivered/read tracking per recipient)
CREATE TABLE IF NOT EXISTS `message_status` (
  `id` VARCHAR(36) NOT NULL,
  `message_id` VARCHAR(36) NOT NULL,
  `user_id` VARCHAR(36) NOT NULL,
  `status` ENUM('sent', 'delivered', 'read') NOT NULL DEFAULT 'sent',
  `delivered_at` DATETIME DEFAULT NULL,
  `read_at` DATETIME DEFAULT NULL,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_msg_user_status` (`message_id`, `user_id`),
  INDEX `idx_msg_status_user` (`user_id`),
  CONSTRAINT `fk_ms_message` FOREIGN KEY (`message_id`) REFERENCES `messages` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_ms_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Message Reactions Table
CREATE TABLE IF NOT EXISTS `message_reactions` (
  `id` VARCHAR(36) NOT NULL,
  `message_id` VARCHAR(36) NOT NULL,
  `user_id` VARCHAR(36) NOT NULL,
  `reaction` VARCHAR(16) NOT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_msg_user_reaction` (`message_id`, `user_id`),
  CONSTRAINT `fk_mr_message` FOREIGN KEY (`message_id`) REFERENCES `messages` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_mr_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. 24-Hour WhatsApp Statuses / Stories Table
CREATE TABLE IF NOT EXISTS `statuses` (
  `id` VARCHAR(36) NOT NULL,
  `user_id` VARCHAR(36) NOT NULL,
  `media_url` VARCHAR(500) DEFAULT NULL,
  `text` TEXT DEFAULT NULL,
  `background_color` VARCHAR(20) DEFAULT '#005c4b',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_statuses_user_created` (`user_id`, `created_at`),
  CONSTRAINT `fk_statuses_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Starred Messages Table
CREATE TABLE IF NOT EXISTS `starred_messages` (
  `id` VARCHAR(36) NOT NULL,
  `user_id` VARCHAR(36) NOT NULL,
  `message_id` VARCHAR(36) NOT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_user_starred_msg` (`user_id`, `message_id`),
  CONSTRAINT `fk_sm_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_sm_message` FOREIGN KEY (`message_id`) REFERENCES `messages` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. Chat Preferences Table (Pin & Mute)
CREATE TABLE IF NOT EXISTS `chat_preferences` (
  `id` VARCHAR(36) NOT NULL,
  `user_id` VARCHAR(36) NOT NULL,
  `conversation_id` VARCHAR(36) NOT NULL,
  `is_pinned` BOOLEAN DEFAULT FALSE,
  `is_muted` BOOLEAN DEFAULT FALSE,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_user_conv_pref` (`user_id`, `conversation_id`),
  CONSTRAINT `fk_cp_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_cp_conv` FOREIGN KEY (`conversation_id`) REFERENCES `conversations` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
