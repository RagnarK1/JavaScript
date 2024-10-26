CREATE TABLE users
(
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    nickname    TEXT NOT NULL,
    email       TEXT NOT NULL,
    password    TEXT NOT NULL,
    firstname   TEXT,
    lastname    TEXT,
    dob_day     INTEGER,
    dob_month   INTEGER,
    dob_year    INTEGER,
    about_me    TEXT,
    avatar_path TEXT,
    is_private  INTEGER CHECK (is_private IN (0, 1))
);
CREATE TABLE relationships
(
    follower_id  INTEGER,
    following_id INTEGER,
    timestamp    INTEGER,
    PRIMARY KEY (follower_id, following_id),
    FOREIGN KEY (follower_id) REFERENCES users (id),
    FOREIGN KEY (following_id) REFERENCES users (id)
);
CREATE TABLE posts
(
    id        INTEGER PRIMARY KEY AUTOINCREMENT ,
    group_id  INTEGER,
    title     TEXT NOT NULL,
    content   TEXT NOT NULL,
    timestamp INTEGER,
    FOREIGN KEY (group_id) REFERENCES groups (id)
);
CREATE TABLE comments
(
    id         INTEGER PRIMARY KEY AUTOINCREMENT ,
    post_id    INTEGER NOT NULL,
    content    TEXT    NOT NULL,
    timestamp  INTEGER,
    image_path TEXT,
    privacy    INTEGER CHECK (privacy IN (0, 1, 2)),
    FOREIGN KEY (post_id) REFERENCES posts (id)
);
CREATE TABLE groups
(
    id          INTEGER PRIMARY KEY AUTOINCREMENT ,
    name        TEXT NOT NULL,
    description TEXT,
    creator_id  INTEGER,
    FOREIGN KEY (creator_id) REFERENCES users (id)
);
CREATE TABLE group_relationships
(
    id       INTEGER PRIMARY KEY AUTOINCREMENT ,
    group_id INTEGER,
    user_id  INTEGER,
    status   INTEGER CHECK (status IN (0, 1, 2)),
    FOREIGN KEY (group_id) REFERENCES groups (id),
    FOREIGN KEY (user_id) REFERENCES users (id)
);
CREATE TABLE events
(
    id          INTEGER PRIMARY KEY,
    title       TEXT NOT NULL,
    description TEXT,
    timestamp   INTEGER
);
CREATE TABLE event_relationships
(
    id     INTEGER PRIMARY KEY AUTOINCREMENT ,
    status INTEGER CHECK (status IN (0, 1))
);
CREATE TABLE sessions
(
    session_id       TEXT PRIMARY KEY,
    user_id          INTEGER,
    expiry_timestamp INTEGER,
    FOREIGN KEY (user_id) REFERENCES users (id)
);
CREATE TABLE conversations
(
    id   INTEGER PRIMARY KEY AUTOINCREMENT ,
    type TEXT CHECK (type IN ('direct', 'group'))
);
CREATE TABLE conversation_relationships
(
    user_id         INTEGER,
    conversation_id INTEGER,
    timestamp       INTEGER,
    PRIMARY KEY (user_id, conversation_id),
    FOREIGN KEY (user_id) REFERENCES users (id),
    FOREIGN KEY (conversation_id) REFERENCES conversations (id)
);
CREATE TABLE messages
(
    id              INTEGER PRIMARY KEY AUTOINCREMENT ,
    conversation_id INTEGER,
    author_id       INTEGER,
    content         TEXT NOT NULL,
    timestamp       INTEGER,
    FOREIGN KEY (conversation_id) REFERENCES conversations (id),
    FOREIGN KEY (author_id) REFERENCES users (id)
);
