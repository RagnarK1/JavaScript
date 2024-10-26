-- Create a temporary table with the previous constraint
CREATE TABLE temp_event_relationships (
                                          id INTEGER PRIMARY KEY AUTOINCREMENT,
                                          status INTEGER CHECK (status IN (0, 1)),
                                          userId INTEGER,
                                          eventId INTEGER
);

-- Copy data from the original table to the temporary table
INSERT INTO temp_event_relationships (id, status, userId, eventId)
SELECT id, status, userId, eventId
FROM event_relationships;

-- Drop the original table
DROP TABLE event_relationships;

-- Rename the temporary table to the original table name
ALTER TABLE temp_event_relationships RENAME TO event_relationships;
