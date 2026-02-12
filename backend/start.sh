#!/bin/sh

# Wait for DB to be ready is handled by docker depends_on + healthcheck, but good to have a retry here if needed.
# For simplicity, we assume DB is up because of depends_on condition: service_healthy

echo "Running Migrations..."
# We need a way to run sql files. We can use a simple node script or psql if installed.
# Since we are in a node container, let's write a small runner script or use the db connection.
# Migration is handled by server.js -> initDb
# node src/utils/migrate.js

echo "Starting Server..."
npm start
