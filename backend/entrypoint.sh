#!/bin/sh
set -e

# Define application and database paths
APP_DIR="/home/node/app"
DB_DIR="$APP_DIR/sqlite_data"
DB_PATH="$DB_DIR/database.sqlite"
INIT_SQL="$APP_DIR/backend/init.sql"

echo "${YELLOW}Checking for the SQLite database file...${RESET}"
mkdir -p "$DB_DIR"

# If the database file does not exist, create and initialize it
if [ ! -f "$DB_PATH" ]; then
    touch "$DB_PATH"
    chmod 666 "$DB_PATH"
    echo "${YELLOW}Initializing SQLite (Normal Mode)${RESET}"
    if [ -f "$INIT_SQL" ]; then
        sqlite3 "$DB_PATH" < "$INIT_SQL"
    else
        echo "${RED}Initialization file not found at backend/init.sql!${RESET}"
        exit 1
    fi
else
    echo "${GREEN}SQLite database already exists.${RESET}"
fi

# Execute the CMD provided in the Dockerfile
exec "$@"
