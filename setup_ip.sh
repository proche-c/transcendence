#!/bin/bash

# Detecta la IP segons el sistema operatiu
get_ip() {
  if [ "$(uname)" = "Darwin" ]; then
    # Mac OS X
    IP=$(ipconfig getifaddr en0)
  elif [ "$(uname)" = "Linux" ]; then
    # Linux
    IP=$(hostname -I | awk '{print $1}')
  else
    echo "Sistema operatiu no suportat"
    exit 1
  fi
  echo $IP
}

# Guarda la IP a la configuració
SERVER_IP=$(get_ip)
echo "IP detectada: $SERVER_IP"

# Crea arxiu de configuració pel frontend
cat > frontend/app/config.ts << EOF
// Arxiu generat automàticament - No editar manualment
export const SERVER_IP = '$SERVER_IP';
EOF

cat > frontend/app/config.js << EOF
// Arxiu generat automàticament - No editar manualment
export const SERVER_IP = '$SERVER_IP';
EOF

echo "Arxiu de configuració del frontend generat: frontend/app/config.js"

# Crea arxiu de configuració pel backend
cat > backend/config.js << EOF
// Arxiu generat automàticament - No editar manualment
module.exports = {
  SERVER_IP: '$SERVER_IP',
};
EOF

echo "Arxiu de configuració del backend generat: backend/config.js"

# Actualitza el fitxer .env si existeix
if [ -f ".env" ]; then
  grep -v "SERVER_IP=" .env > .env.tmp
  echo "SERVER_IP=$SERVER_IP" >> .env.tmp
  mv .env.tmp .env
  echo "Fitxer .env actualitzat"
fi

echo "Utilitza https://$SERVER_IP:8443 per accedir a la web del pong"