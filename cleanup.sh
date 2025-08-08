#!/bin/bash

PORT=9003

# Find the process using the port
PID=$(lsof -t -i :$PORT)

# Check if a process was found
if [ -z "$PID" ]; then
  echo "/cleanup.sh: No process found using port $PORT."
else
  echo "/cleanup.sh: Process with PID $PID found using port $PORT. Killing process..."
  echo "/cleanup.sh: PID value: $PID"
  # Kill the process
  sleep 1
  kill -9 $PID
  echo "/cleanup.sh: Attempted to kill process with PID $PID."
  echo "/cleanup.sh: Confirming kill attempt for PID $PID."
  sleep 1
  # Second attempt to kill in case it didn't fully stop
  if ps -p $PID > /dev/null; then
    kill -9 $PID
  fi
fi
