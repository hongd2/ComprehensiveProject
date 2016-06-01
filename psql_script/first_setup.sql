DROP SCHEMA public CASCADE;
CREATE SCHEMA public;

CREATE TABLE IF NOT EXISTS users (
    user_id              SERIAL,
    username             VARCHAR(100) UNIQUE,
    password             VARCHAR(100),
    salt                 VARCHAR(32),
    manager_flag         BOOLEAN NOT NULL,
    waiter_flag          BOOLEAN NOT NULL,
    diner_flag           BOOLEAN NOT NULL,
    PRIMARY KEY (user_id)
);

CREATE TABLE IF NOT EXISTS facebook (
    user_id         SERIAL,
    token           TEXT NOT NULL,
    facebook_id     VARCHAR(100) UNIQUE,
    display_name    VARCHAR(100),
    PRIMARY KEY (user_id),
    FOREIGN KEY (user_id) REFERENCES users
    ON DELETE CASCADE
    ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS google (
    user_id         SERIAL,
    token           VARCHAR(100) NOT NULL,
    google_id       VARCHAR(100) UNIQUE,
    email           VARCHAR(100),
    name            VARCHAR(100),
    PRIMARY KEY (user_id),
    FOREIGN KEY (user_id) REFERENCES users
    ON DELETE CASCADE
    ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS restaurants(
    restaurant_id          SERIAL,
    name                   VARCHAR(200),
    address                VARCHAR(200),
    picture                VARCHAR(200),
    num_table              INTEGER,
    PRIMARY KEY (restaurant_id)
);

CREATE TABLE IF NOT EXISTS diners_communicate_waiters(
    communicate_id          SERIAL,
    diner_id                SERIAL,
    waiter_id               SERIAL,
    message                 VARCHAR(50) NOT NULL,
    response                VARCHAR(50),
    FOREIGN KEY (diner_id) REFERENCES users (user_id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (waiter_id) REFERENCES users (user_id) ON DELETE CASCADE ON UPDATE CASCADE,
    PRIMARY KEY (communicate_id)
);

CREATE TABLE IF NOT EXISTS diner_occupy_table(
    occupy_id                   SERIAL,
    diner_id                    INTEGER NOT NULL,
    restaurant_id               INTEGER NOT NULL,
    table_number                INTEGER NOT NULL,
    start_time                  TIMESTAMPTZ NOT NULL,
    end_time                    TIMESTAMPTZ,
    FOREIGN KEY (diner_id) REFERENCES users (user_id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (restaurant_id) REFERENCES restaurants (restaurant_id) ON DELETE CASCADE ON UPDATE CASCADE,
    PRIMARY KEY (occupy_id)
);

CREATE TABLE diner_review_type (
    id SERIAL PRIMARY KEY NOT NULL,
    type TEXT
);

INSERT INTO diner_review_type (type) VALUES
    ('private_waiter'),
    ('private_manager'),
    ('public');

CREATE TABLE IF NOT EXISTS diners_review_waiters(
    review_id               SERIAL,
    diner_id                SERIAL,
    occupy_id               SERIAL,
    review                  VARCHAR(50) NOT NULL,
    time                    TIMESTAMPTZ NOT NULL,
    rating                  INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    review_type             INTEGER NOT NULL,
    FOREIGN KEY (diner_id) REFERENCES users (user_id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (occupy_id) REFERENCES diner_occupy_table (occupy_id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (review_type) REFERENCES diner_review_type (id) ON DELETE CASCADE ON UPDATE CASCADE,
    PRIMARY KEY (review_id)
);

CREATE TABLE IF NOT EXISTS managers_manage_restaurant(
    management_id           SERIAL,
    manager_id              INTEGER,
    restaurant_id           INTEGER,
    FOREIGN KEY (manager_id) REFERENCES users (user_id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (restaurant_id) REFERENCES restaurants (restaurant_id) ON DELETE CASCADE ON UPDATE CASCADE,
    PRIMARY KEY (management_id)
);

CREATE TABLE IF NOT EXISTS waiters_work_restaurants(
    waiter_restaurant_id    SERIAL,
    waiter_id               SERIAL,
    restaurant_id           SERIAL,
    start_time              TIMESTAMPTZ NOT NULL,
    end_time                TIMESTAMPTZ,
    FOREIGN KEY (waiter_id) REFERENCES users (user_id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (restaurant_id) REFERENCES restaurants (restaurant_id) ON DELETE CASCADE ON UPDATE CASCADE,
    PRIMARY KEY (waiter_restaurant_id)
);

CREATE OR REPLACE VIEW current_waiters_work_restaurants AS 
SELECT waiter_restaurant_id, waiter_id, restaurant_id FROM waiters_work_restaurants
WHERE end_time IS NULL OR end_time > NOW();


CREATE TABLE IF NOT EXISTS waiter_info(
	waiter_id					INTEGER UNIQUE,
	waiter_pic					VARCHAR(200),
	waiter_profile				VARCHAR(500),
	waiter_name					VARCHAR(30),
	FOREIGN KEY (waiter_id) REFERENCES users (user_id) ON DELETE CASCADE ON UPDATE CASCADE,
	PRIMARY KEY (waiter_id)
);

CREATE TABLE IF NOT EXISTS waiters_serve_tables(
    shift_id                    SERIAL,
    waiter_id                   INTEGER,
    table_number                INTEGER[],
    restaurant_id               INTEGER,
    serve_start_time            TIMESTAMPTZ,
    serve_end_time              TIMESTAMPTZ,
    FOREIGN KEY (waiter_id) REFERENCES users (user_id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (restaurant_id) REFERENCES restaurants (restaurant_id) ON DELETE CASCADE ON UPDATE CASCADE,
    PRIMARY KEY (shift_id)
);


CREATE OR REPLACE VIEW current_waiters_serve_tables AS 
SELECT shift_id, waiter_id, table_number, restaurant_id FROM waiters_serve_tables
WHERE serve_end_time IS NULL OR serve_end_time > NOW();


CREATE TABLE waiter_request_work_state (
    id SERIAL PRIMARY KEY NOT NULL,
    state TEXT UNIQUE
);

INSERT INTO waiter_request_work_state (state) VALUES
    ('pending'),
    ('approved'),
    ('rejected');

CREATE TABLE IF NOT EXISTS waiter_request_work_restaurant(
    request_id              SERIAL,
    waiter_id               INTEGER NOT NULL,
    restaurant_id           INTEGER NOT NULL,
    state                   INTEGER  NOT NULL,
    request_time_stamp      TIMESTAMPTZ NOT NULL,
    decision_time_stamp     TIMESTAMPTZ,
    FOREIGN KEY (waiter_id) REFERENCES users (user_id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (restaurant_id) REFERENCES restaurants (restaurant_id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (state) REFERENCES waiter_request_work_state (id) ON DELETE CASCADE ON UPDATE CASCADE,
    PRIMARY KEY (request_id)
);

CREATE TABLE diner_request_occupy_state (
    id SERIAL PRIMARY KEY NOT NULL,
    state TEXT UNIQUE
);

INSERT INTO diner_request_occupy_state (state) VALUES
    ('pending'),
    ('approved'),
    ('rejected');

CREATE TABLE IF NOT EXISTS diner_request_occupy_table(
    request_id              SERIAL,
    diner_id                INTEGER NOT NULL,
    restaurant_id           INTEGER NOT NULL,
    table_number            INTEGER NOT NULL,
    state                   INTEGER  NOT NULL,
    request_time_stamp      TIMESTAMPTZ NOT NULL,
    decision_time_stamp     TIMESTAMPTZ,
    FOREIGN KEY (diner_id) REFERENCES users (user_id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (restaurant_id) REFERENCES restaurants (restaurant_id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (state) REFERENCES diner_request_occupy_state (id) ON DELETE CASCADE ON UPDATE CASCADE,
    PRIMARY KEY (request_id)
);

-- **************************************************
-- Table to store each waiter's custom message associated with buttons on the watch
CREATE TABLE IF NOT EXISTS waiter_response_message(
    message_id              SERIAL,
    waiter_id               INTEGER NOT NULL,
    message_type            INTEGER NOT NULL,
    char_key                CHAR(1) NOT NULL,
    message                 VARCHAR(50) NOT NULL,
    FOREIGN KEY (waiter_id) REFERENCES users (user_id) ON DELETE CASCADE ON UPDATE CASCADE,
    PRIMARY KEY (message_id),
    UNIQUE (waiter_id, message_type)
);

CREATE INDEX ON waiter_response_message (waiter_id);
-- **************************************************

-- **************************************************
-- SQL view to get rating/review of each waiter
CREATE OR REPLACE VIEW ratings_and_waiter AS 
SELECT 
    waiters_serve_tables.waiter_id AS waiter_id, 
    waiters_serve_tables.restaurant_id AS restaurant_id,
    diners_review_waiters.rating AS rating, 
    diners_review_waiters.review AS review, 
    diners_review_waiters.review_type AS review_type, 
    diners_review_waiters.diner_id AS diner_id,
    diners_review_waiters.time AS time 
FROM waiters_serve_tables, diner_occupy_table, diners_review_waiters 
WHERE 
    waiters_serve_tables.restaurant_id = diner_occupy_table.restaurant_id AND
    diner_occupy_table.table_number = ANY(waiters_serve_tables.table_number) AND
    diner_occupy_table.occupy_id = diners_review_waiters.occupy_id AND
    diner_occupy_table.start_time > waiters_serve_tables.serve_start_time AND
    ( waiters_serve_tables.serve_end_time IS NULL OR
    waiters_serve_tables.serve_end_time > diner_occupy_table.start_time)
ORDER BY time DESC;
-- **************************************************

-- Using trigger to automatically insert into diner_occupy_table each time
-- waiter approve (from pending -> approved) diner_request_occupy_table
-- seems OK. But the probem is that we don't have the newly inserted row id
-- and that is important for subsequent actions.
-- The triggers are left here as example of how it looks like


-- add trigger so that if manager approves waiter's request to work
-- it automatically add to waiters_work_restaurants
--  CREATE OR REPLACE FUNCTION add_new_waiters_work_restaurants()
--      RETURNS trigger AS
--  $BODY$
--  BEGIN
--      IF NEW.state =
--          (SELECT id FROM waiter_request_work_state
--              WHERE waiter_request_work_state.state = 'approved')
--      AND OLD.state =
--          (SELECT id FROM waiter_request_work_state
--              WHERE waiter_request_work_state.state = 'pending')
--          THEN
--              INSERT INTO waiters_work_restaurants
--                  (waiter_id,restaurant_id,start_time)
--              VALUES(NEW.waiter_id,NEW.restaurant_id,now());
--      END IF;
--      RETURN NEW;
--  END;
--  $BODY$
--  LANGUAGE plpgsql;

--  CREATE TRIGGER approve_waiter_request_work
--      AFTER UPDATE ON waiter_request_work_restaurant
--      FOR EACH ROW
--      EXECUTE PROCEDURE add_new_waiters_work_restaurants();

--  -- add trigger so that if waiter approves diner's request to occupy
--  -- it automatically add to diner_request_occupy_table
--  CREATE OR REPLACE FUNCTION add_new_diner_occupy_table()
--      RETURNS trigger AS
--  $BODY$
--  BEGIN
--      IF NEW.state =
--          (SELECT id FROM diner_request_occupy_state
--              WHERE diner_request_occupy_state.state = 'approved')
--      AND OLD.state =
--          (SELECT id FROM diner_request_occupy_state
--              WHERE diner_request_occupy_state.state = 'pending')
--          THEN
--              INSERT INTO diner_occupy_table
--                  (diner_id,restaurant_id, table_number, start_time)
--              VALUES(NEW.diner_id, NEW.restaurant_id, NEW.table_number, now())
--              RETURNING occupy_id;
--      END IF;
--      RETURN occupy_id;
--  END;
--  $BODY$
--  LANGUAGE plpgsql;

--  CREATE TRIGGER approve_diner_request_occupy
--      AFTER UPDATE ON diner_request_occupy_table
--      FOR EACH ROW
--      EXECUTE PROCEDURE add_new_diner_occupy_table();

