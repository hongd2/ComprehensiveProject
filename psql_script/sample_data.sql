-- delete old users
DELETE FROM users;

-- create combined owner, waiter, diner
-- id: combine1@gmail.com
-- password: combine1 
INSERT INTO users (username, password, salt, manager_flag, waiter_flag, diner_flag) VALUES ( 'combine1@gmail.com', '$2a$10$AIvZaB0BFUkez8KpPIfD5.saKDTqUFDJxJ0mx4P7dGCn/7qJLV4.O', 'jps7TbmoKijlsUm5W+UVog==', TRUE, TRUE, TRUE );

-- create first restaurant owner only
-- id: owner1@gmail.com
-- password: owner1
INSERT INTO users (username, password, salt, manager_flag, waiter_flag, diner_flag) VALUES ( 'owner1@gmail.com', '$2a$10$29a3PIlKN3s8ykz6ktAdm.ajQi8vrR1RFy9.dmQoqvdJASxM.r7Qm', 'TOAU7oQB+jjAriCFWf2GsQ==', TRUE, FALSE, FALSE );

-- create first waiter only 
-- id: waiter1@gmail.com
-- password: waiter1
INSERT INTO users (username, password, salt, manager_flag, waiter_flag, diner_flag) VALUES ( 'waiter1@gmail.com', '$2a$10$2COuzfD8e6KD1UzezdDKh.FPV.9w2Wr4xH53evAexWuTYvRYN60ja', 'kYF65WJMmZBD7DurBNSdNg==', FALSE, TRUE, FALSE );

-- create first diner only
-- id: diner1@gmail.com
-- password: diner1
INSERT INTO users (username, password, salt, manager_flag, waiter_flag, diner_flag) VALUES ( 'diner1@gmail.com', '$2a$10$4RjFkaCZav7vGyt9zTFcbelLYZaUwIF5SatDcr8sy/LJ0wsFU3WUq', 'LJYmyyYG/8/jExmYThFUyA==', FALSE, FALSE, TRUE );

-- create second waiter only 
-- id: waiter2@gmail.com
-- password: waiter1
INSERT INTO users (username, password, salt, manager_flag, waiter_flag, diner_flag) VALUES ( 'waiter2@gmail.com', '$2a$10$DynW5RuzlI.CXLWPZYifK.V.rMSbzLTVNp0Z5LZBXsIzOV5rarlne', 'FJwSDuqJUyC5ngsi28l5vw==', FALSE, TRUE, FALSE );

-- create first diner only
-- id: diner1@gmail.com
-- password: diner1
INSERT INTO users (username, password, salt, manager_flag, waiter_flag, diner_flag) VALUES ( 'diner2@gmail.com', '$2a$10$PcRWK4GcjW7.92MvuirXY.DRR0vBuP6gp5LgZWZGoJPjNuyzwmstK', '3QYcniCmZnp9M1w4Fu9aWQ==', FALSE, FALSE, TRUE );

-- delete old restaurants
DELETE FROM restaurants;
DELETE FROM managers_manage_restaurant;

-- create first restaurant
INSERT INTO restaurants(name, address, picture, num_table) VALUES ('BJs Restaurant and Brewhouse', '939 Broxton Ave, Los Angeles, CA 90024', 'http://portlandbrewpubs.com/wp-content/uploads/2012/08/BJs-Restaurant-Logo.jpg', 30);
-- manage by first manager
INSERT INTO managers_manage_restaurant(manager_id, restaurant_id) VALUES (2, 1);

-- create 2nd restaurant
INSERT INTO restaurants(name, address, picture, num_table) VALUES ('GEN Korean BBQ House', '68 W Main St, Alhambra, CA 91801', 'http://s3-media2.ak.yelpcdn.com/bphoto/1SdOqT8q72ptwDl3vFP0zw/l.jpg', 22);
-- manage by first manager
INSERT INTO managers_manage_restaurant(manager_id, restaurant_id) VALUES (2, 2);


-- insert waiter employment with restaurant
INSERT INTO waiters_work_restaurants(waiter_id, restaurant_id, start_time)
    VALUES(3, 1, NOW());

-- let waiter 1 serve restaurant 1 and waiter 2 serve restaurant 2
DELETE FROM waiters_serve_tables;
INSERT INTO waiters_serve_tables(waiter_id, table_number, restaurant_id, serve_start_time, serve_end_time) VALUES (3, '{1,2,3,4,5,6,7,8}', 1, NOW(), NULL);
INSERT INTO waiters_serve_tables(waiter_id, table_number, restaurant_id, serve_start_time, serve_end_time) VALUES (5, '{5,6,7,8,11,12,13}', 2, NOW(), NULL);

-- insert sample waiter_info tuples
DELETE FROM waiter_info WHERE waiter_id = 3 OR waiter_id = 5;
INSERT INTO waiter_info(waiter_id, waiter_pic, waiter_profile, waiter_name) VALUES (3, 'http://www.bestresumeguru.com/wp-content/uploads/2014/10/waiter.jpg', 'I am a new waiter because I like food. :)', 'Robot Waiter');
INSERT INTO waiter_info(waiter_id, waiter_pic, waiter_profile, waiter_name) VALUES (5, 'http://www.jasoncapitaldating.com/wp-content/uploads/2013/03/waitress-500x300.jpeg', 'I am a new waitress because I want to eat all the food. >:)', 'Robot Waiteress');

-- insert some finished diner occupation
INSERT INTO diner_occupy_table(diner_id, restaurant_id, table_number, start_time, end_time) VALUES (1, 1, 3, NOW(), NOW());

-- insert some reviews about last occupation
INSERT INTO diners_review_waiters(diner_id, occupy_id, review, time, rating, review_type) VALUES
    (1, 1, 'Good job', NOW(), 4, 1);
INSERT INTO diners_review_waiters(diner_id, occupy_id, review, time, rating, review_type) VALUES
    (1, 1, 'Nice work', NOW(), 5, 2);
INSERT INTO diners_review_waiters(diner_id, occupy_id, review, time, rating, review_type) VALUES
    (1, 1, 'Mediocre', NOW(), 3, 3);

-- insert default watch responses for a waiter
INSERT INTO waiter_response_message(waiter_id, message_type, message, char_key) VALUES
    (3, 1, 'I''ll get it', 'G'),
    (3, 2, 'Hang on I''m busy', 'B'),
    (3, 3, 'OK', 'K');

