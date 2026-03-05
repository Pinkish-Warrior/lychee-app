ALTER TABLE `users` ADD `subscriptionStatus` enum('trialing','active','past_due','canceled','none','lifetime') DEFAULT 'none';--> statement-breakpoint
ALTER TABLE `users` ADD `subscriptionPlan` enum('standard','student') DEFAULT 'standard';--> statement-breakpoint
ALTER TABLE `users` ADD `trialEndsAt` timestamp;--> statement-breakpoint
ALTER TABLE `users` ADD `stripeCustomerId` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD `stripeSubId` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD `aiProvider` enum('openai','gemini','claude') DEFAULT 'gemini';--> statement-breakpoint
ALTER TABLE `users` ADD `openaiApiKey` varchar(500);--> statement-breakpoint
ALTER TABLE `users` ADD `geminiApiKey` varchar(500);--> statement-breakpoint
ALTER TABLE `users` ADD `claudeApiKey` varchar(500);