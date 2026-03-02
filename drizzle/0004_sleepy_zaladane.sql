CREATE TABLE `noteLinks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`sourceId` int NOT NULL,
	`targetId` int NOT NULL,
	`strength` decimal(3,2) NOT NULL DEFAULT '0.50',
	`reason` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `noteLinks_id` PRIMARY KEY(`id`)
);
