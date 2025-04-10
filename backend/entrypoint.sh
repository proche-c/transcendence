#!/bin/sh
set -e

APP_DIR="/home/node/app"
DB_DIR="$APP_DIR/sqlite_data"
DB_PATH="$DB_DIR/database.sqlite"
INIT_SQL="$APP_DIR/init.sql"

echo "Checking for the SQLite database file..."

# Crear directorio y asignar permisos
mkdir -p "$DB_DIR"
chmod 777 "$DB_DIR"  # Permisos temporalmente amplios

if [ ! -f "$DB_PATH" ]; then
    echo "Creating new database..."
    touch "$DB_PATH"
    chmod 666 "$DB_PATH"

    if [ -f "$INIT_SQL" ]; then
        echo "Initializing database..."
        sqlite3 "$DB_PATH" < "$INIT_SQL"
    else
        echo "ERROR: init.sql not found!"
        exit 1
    fi
else
    echo "Using existing database."
fi

exec "$@"
