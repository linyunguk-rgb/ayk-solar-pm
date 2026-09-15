#!/bin/bash
# AYK dev server startup script — fully detached
cd /home/z/my-project
pkill -f "next-server" 2>/dev/null
pkill -f "next dev" 2>/dev/null
sleep 2

setsid nohup bash -c 'exec node_modules/.bin/next dev -p 3000 --webpack' </dev/null >/home/z/my-project/dev.log 2>&1 &

echo "Server started, PID group: $!"
sleep 15

if pgrep -f "next-server" > /dev/null; then
  echo "Server is running"
  curl -s -o /dev/null -w "Page: HTTP %{http_code}\n" --max-time 20 http://localhost:3000/
else
  echo "Server failed to start"
  tail -10 /home/z/my-project/dev.log
fi
