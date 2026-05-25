#!/usr/bin/env bash

set -e

API_URL="${API_URL:-http://localhost:8080}"

echo "Creating room..."
ROOM_RESPONSE=$(curl -s -X POST "$API_URL/rooms")
ROOM_ID=$(echo "$ROOM_RESPONSE" | jq -r '.id')

echo "Room ID: $ROOM_ID"

echo "Creating player 1..."
PLAYER_1_RESPONSE=$(curl -s -X POST "$API_URL/rooms/$ROOM_ID/join" \
  -H "Content-Type: application/json" \
  -d '{"name":"Mihail"}')

PLAYER_1_ID=$(echo "$PLAYER_1_RESPONSE" | jq -r '.player.id')

echo "Player 1 ID: $PLAYER_1_ID"

echo "Creating player 2..."
PLAYER_2_RESPONSE=$(curl -s -X POST "$API_URL/rooms/$ROOM_ID/join" \
  -H "Content-Type: application/json" \
  -d '{"name":"Anna"}')

PLAYER_2_ID=$(echo "$PLAYER_2_RESPONSE" | jq -r '.player.id')

echo "Player 2 ID: $PLAYER_2_ID"

echo "Marking player 1 ready..."
curl -s -X POST "$API_URL/rooms/$ROOM_ID/ready" \
  -H "Content-Type: application/json" \
  -d "{\"player_id\":\"$PLAYER_1_ID\"}" >/dev/null

echo "Marking player 2 ready..."
curl -s -X POST "$API_URL/rooms/$ROOM_ID/ready" \
  -H "Content-Type: application/json" \
  -d "{\"player_id\":\"$PLAYER_2_ID\"}" >/dev/null

echo "Starting game..."
START_RESPONSE=$(curl -s -X POST "$API_URL/rooms/$ROOM_ID/start")

echo
echo "Game started."
echo
echo "Room ID: $ROOM_ID"
echo "Player 1 ID: $PLAYER_1_ID"
echo "Player 2 ID: $PLAYER_2_ID"
echo
echo "Connect player 1:"
echo "wscat -c \"ws://localhost:8080/rooms/$ROOM_ID/ws?player_id=$PLAYER_1_ID\""
echo
echo "Connect player 2:"
echo "wscat -c \"ws://localhost:8080/rooms/$ROOM_ID/ws?player_id=$PLAYER_2_ID\""
echo
echo "Start response:"
echo "$START_RESPONSE" | jq
