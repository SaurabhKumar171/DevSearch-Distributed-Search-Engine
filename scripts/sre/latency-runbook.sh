#!/bin/bash

# ==============================================================================
# DEVSEARCH SRE CIRCUIT BREAKER TEST
# This script injects 500ms of latency into the Redis connection to trigger
# the Opossum Circuit Breaker, proving the system prevents OOM crashes.
# ==============================================================================

echo "========================================="
echo "🚦 PHASE 1: Setting up the Toxiproxy Bridge"
echo "========================================="
# Ensure proxy exists
curl -s -X POST -d '{"name": "redis_proxy", "listen": "[::]:26380", "upstream": "redis:6379"}' -H "Content-Type: application/json" http://localhost:8474/proxies > /dev/null
echo "✅ Proxy bridge active on port 26380."
echo ""

echo "========================================="
echo "🚀 PHASE 2: Starting k6 Load Generation"
echo "========================================="
echo "Pumping jobs into the API for 20 seconds..."
k6 run -e HOST=localhost -e INGEST_PORT=3002 loadtest.js --vus 100 --duration 20s > /dev/null 2>&1 &
K6_PID=$!
sleep 2

echo "========================================="
echo "🐢 PHASE 3: INJECTING 500ms LATENCY"
echo "========================================="
curl -s -X POST -d '{"type": "latency", "attributes": {"latency": 500}}' -H "Content-Type: application/json" http://localhost:8474/proxies/redis_proxy/toxics > /dev/null
echo "⚠️ POISON INJECTED! The database is now extremely slow."
echo "👀 Watch your Node terminal for: '🚨 CIRCUIT BREAKER TRIPPED!'"
echo ""

echo "⏳ Letting the system struggle for 10 seconds..."
sleep 10
echo ""

echo "========================================="
echo "🩹 PHASE 4: REMOVING LATENCY"
echo "========================================="
echo "Healing the network to test the Circuit Breaker's 'Half-Open' recovery..."
curl -s -X DELETE http://localhost:8474/proxies/redis_proxy/toxics/latency_downstream > /dev/null
echo "✅ LATENCY REMOVED!"
echo "👀 Watch your Node terminal for: '✅ CIRCUIT BREAKER CLOSED.'"
echo ""

wait $K6_PID

echo "========================================="
echo "🎉 CIRCUIT BREAKER TEST COMPLETE!"
echo "========================================="