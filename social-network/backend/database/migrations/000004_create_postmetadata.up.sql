CREATE TABLE post_meta (
    postId INTEGER,
    allowedViewers TEXT,
    PRIMARY KEY (postId),
    FOREIGN KEY (postId) REFERENCES posts (id)
)
