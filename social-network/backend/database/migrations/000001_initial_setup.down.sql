-- down_migration.sql

-- Drop Messages
DROP TABLE IF EXISTS messages;

-- Drop ConversationRelationships
DROP TABLE IF EXISTS conversation_relationships;

-- Drop Conversations
DROP TABLE IF EXISTS conversations;

-- Drop Sessions
DROP TABLE IF EXISTS sessions;

-- Drop EventRelationships
DROP TABLE IF EXISTS event_relationships;

-- Drop Events
DROP TABLE IF EXISTS events;

-- Drop GroupRelationships
DROP TABLE IF EXISTS group_relationships;

-- Drop Groups
DROP TABLE IF EXISTS groups;

-- Drop Comments
DROP TABLE IF EXISTS comments;

-- Drop Posts
DROP TABLE IF EXISTS posts;

-- Drop Relationships
DROP TABLE IF EXISTS relationships;

-- Drop Users
DROP TABLE IF EXISTS users;
