#!/bin/sh

# Launch the server
node server.js &

# Wait for the server to start
sleep 2

# Launch ngrok to expose the server
ngrok http 8000 --log=stdout

