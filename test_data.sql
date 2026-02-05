-- Sample test data for Lychee export testing
-- This creates a test user and sample notes across all categories

-- Insert test user (if not exists)
INSERT IGNORE INTO users (id, openId, name, email, loginMethod, role, createdAt, updatedAt, lastSignedIn)
VALUES (999, 'test-user-999', 'Test User', 'test@example.com', 'email', 'user', NOW(), NOW(), NOW());

-- Insert sample notes with varying categories and confidence levels

-- People category (3 notes - should get dedicated workspace)
INSERT INTO notes (userId, content, category, confidence, reasoning, isCorrected, createdAt, updatedAt)
VALUES 
(999, 'Meeting with John tomorrow at 2pm to discuss Q1 roadmap. TODO: Prepare presentation slides', 'People', 0.92, 'Mentions a specific person (John) and a meeting context', 0, NOW(), NOW()),
(999, 'Sarah from marketing wants to collaborate on the new campaign. Need to schedule a call next week.', 'People', 0.88, 'References a person (Sarah) and collaboration context', 0, NOW(), NOW()),
(999, 'Follow up with Mike about the budget approval. He mentioned getting back to me by Friday.', 'People', 0.85, 'Mentions a person (Mike) and follow-up action', 0, NOW(), NOW());

-- Projects category (4 notes - should get dedicated workspace)
INSERT INTO notes (userId, content, category, confidence, reasoning, isCorrected, createdAt, updatedAt)
VALUES 
(999, 'Website redesign project: Complete wireframes by end of week. Review with design team on Monday.', 'Projects', 0.95, 'Clear project context with deliverables and timeline', 0, NOW(), NOW()),
(999, 'Mobile app development - Sprint 3 goals:\n- [ ] Implement user authentication\n- [ ] Add push notifications\n- [ ] Fix navigation bugs', 'Projects', 0.93, 'Project-specific tasks with technical details', 0, NOW(), NOW()),
(999, 'Q2 Marketing Campaign launched successfully. Track metrics: 10k impressions, 2.5% CTR, 150 conversions.', 'Projects', 0.90, 'Project update with measurable outcomes', 0, NOW(), NOW()),
(999, 'Database migration project delayed. Need to: 1) Assess risks 2) Update timeline 3) Communicate to stakeholders', 'Projects', 0.87, 'Project status update with action items', 0, NOW(), NOW());

-- Ideas category (1 note - should go to Single Items)
INSERT INTO notes (userId, content, category, confidence, reasoning, isCorrected, createdAt, updatedAt)
VALUES 
(999, 'New product idea: AI-powered task prioritization tool that learns from user behavior and suggests optimal work schedules.', 'Ideas', 0.94, 'Creative concept for a new product', 0, NOW(), NOW());

-- Admin category (1 note - should go to Single Items)
INSERT INTO notes (userId, content, category, confidence, reasoning, isCorrected, createdAt, updatedAt)
VALUES 
(999, 'Action: Submit expense report by Friday. Include receipts from client dinner ($250) and conference travel ($800).', 'Admin', 0.91, 'Administrative task with financial details', 0, NOW(), NOW());

-- Additional note with correction (to test isCorrected functionality)
INSERT INTO notes (userId, content, category, confidence, reasoning, isCorrected, originalCategory, createdAt, updatedAt)
VALUES 
(999, 'Team building event next month - organize venue, catering, and activities. Budget: $5000', 'Projects', 0.78, 'Initially classified as Admin but corrected to Projects', 1, 'Admin', NOW(), NOW());

-- Low confidence note (to demonstrate review queue scenario)
INSERT INTO notes (userId, content, category, confidence, reasoning, isCorrected, createdAt, updatedAt)
VALUES 
(999, 'Coffee with Alex', 'People', 0.65, 'Ambiguous context - could be personal or professional', 0, NOW(), NOW());
