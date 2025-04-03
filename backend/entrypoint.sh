#!/bin/sh
set -e

# Define rutas
APP_DIR="/home/node/app"
DB_DIR="$APP_DIR/sqlite_data"
DB_PATH="$DB_DIR/database.sqlite"
INIT_SQL="$APP_DIR/init.sql"

echo "Checking for the SQLite database file..."

# Crea el directorio de la base de datos si no existe
mkdir -p "$DB_DIR"

# Si la base de datos no existe, la crea y da permisos
if [ ! -f "$DB_PATH" ]; then
    echo "Database does not exist. Creating..."
    sqlite3 "$DB_PATH" "PRAGMA user_version;"  # Fuerza la creación de la base de datos
    chmod 666 "$DB_PATH"  # Permisos para lectura/escritura

    echo "Initializing SQLite (Normal Mode)"
    if [ -f "$INIT_SQL" ]; then
        chmod 644 "$INIT_SQL"  # Asegura que init.sql sea legible
        sqlite3 "$DB_PATH" < "$INIT_SQL"  # Ejecuta init.sql para inicializar la base de datos
        echo "Database initialized"
    else
        echo "ERROR: Initialization file not found at $INIT_SQL!"
        ls -l "$APP_DIR"  # Muestra el contenido del directorio de la app para depuración
        exit 1
    fi
else
    echo "SQLite database already exists."
fi

# Ejecuta el CMD del Dockerfile
exec "$@"
