CREATE TABLE `feedbackLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`noteId` int NOT NULL,
	`userId` int NOT NULL,
	`originalConfidence` decimal(3,2) NOT NULL,
	`aiCategory` enum('People','Projects','Ideas','Admin') NOT NULL,
	`userCategory` enum('People','Projects','Ideas','Admin') NOT NULL,
	`correctionTimestamp` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `feedbackLogs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`content` text NOT NULL,
	`category` enum('People','Projects','Ideas','Admin') NOT NULL,
	`confidence` decimal(3,2) NOT NULL,
	`reasoning` text NOT NULL,
	`isCorrected` int NOT NULL DEFAULT 0,
	`originalCategory` enum('People','Projects','Ideas','Admin'),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `notes_id` PRIMARY KEY(`id`)
);
