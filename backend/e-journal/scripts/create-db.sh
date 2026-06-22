su postgres
psql
CREATE USER ejournal_usr WITH PASSWORD 'ejournal_pwd';
CREATE DATABASE ejournal OWNER ejournal_usr;
GRANT ALL PRIVILEGES ON DATABASE ejournal TO ejournal_usr;