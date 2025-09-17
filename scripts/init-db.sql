-- Initialize databases
CREATE DATABASE group_pay;
CREATE DATABASE group_pay_test;

-- Create user for the application (optional but recommended)
CREATE USER group_pay_user WITH ENCRYPTED PASSWORD 'group_pay_password';
GRANT ALL PRIVILEGES ON DATABASE group_pay TO group_pay_user;
GRANT ALL PRIVILEGES ON DATABASE group_pay_test TO group_pay_user;