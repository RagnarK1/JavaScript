-- Create a temporary table with the modified constraint
CREATE TABLE temp_group_relationships (
                                          id INTEGER PRIMARY KEY AUTOINCREMENT,
                                          group_id INTEGER,
                                          user_id INTEGER,
                                          status INTEGER CHECK (status IN (0, 1, 2, 3)),
                                          FOREIGN KEY (group_id) REFERENCES groups (id),
                                          FOREIGN KEY (user_id) REFERENCES users (id)
);

-- Copy data from the original table to the temporary table
INSERT INTO temp_group_relationships (id, group_id, user_id, status)
SELECT id, group_id, user_id, status
FROM group_relationships;

-- Drop the original table
DROP TABLE group_relationships;

-- Rename the temporary table to the original table name
ALTER TABLE temp_group_relationships RENAME TO group_relationships;
