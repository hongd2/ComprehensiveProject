CREATE OR REPLACE FUNCTION add_new_waiters_work_restaurants()
  RETURNS trigger AS
$BODY$
BEGIN
 IF NEW.state = (SELECT id FROM waiter_request_work_state WHERE waiter_request_work_state.state = 'approved') THEN
 INSERT INTO waiters_work_restaurants(waiter_id,restaurant_id,start_time)
 VALUES(NEW.waiter_id,NEW.restaurant_id,now());
 END IF;
 RETURN NEW;
END;
$BODY$
LANGUAGE plpgsql;




CREATE TRIGGER approve_waiter_request_work AFTER UPDATE ON waiter_request_work_restaurant
FOR EACH ROW 
EXECUTE PROCEDURE add_new_waiters_work_restaurants();
