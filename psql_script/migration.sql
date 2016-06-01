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
