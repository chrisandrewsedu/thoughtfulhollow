#!/bin/bash
# Double-click this file in Finder to start the admin tools.
# A terminal window opens, both servers start, and the admin pages open in your browser.
# Press Ctrl+C (or close the terminal) to stop everything.

cd "$(dirname "$0")"

# Clear any leftover processes on these ports
lsof -ti:4320 | xargs kill -9 2>/dev/null
lsof -ti:4321 | xargs kill -9 2>/dev/null

echo "Starting admin servers..."
node scripts/glossari-server.js &
GLOSSARI_PID=$!
node scripts/library-server.js &
LIBRARY_PID=$!

sleep 1

open "http://localhost:4321/admin/glossari-admin.html"
open "http://localhost:4320/sampler-picross-admin.html"

echo ""
echo "  Glossari admin  →  http://localhost:4321/admin/glossari-admin.html"
echo "  Glossari editor →  http://localhost:4321/admin/glossari-vet.html"
echo "  Picross admin   →  http://localhost:4320/sampler-picross-admin.html"
echo "  Picross author  →  http://localhost:4320/sampler-picross-author.html"
echo ""
echo "Press Ctrl+C to stop."

wait $GLOSSARI_PID $LIBRARY_PID
