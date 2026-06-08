#!/bin/bash

# ==============================================================================
# DEVSEARCH SRE CHAOS TEST RUNBOOK
# This script automates a catastrophic network failure to prove BullMQ's
# exponential backoff and self-healing architecture works without data loss.
# ==============================================================================

echo "========================================="
echo "🚦 PHASE 1: Setting up the Toxiproxy Bridge"
echo "========================================="
# Build the proxy on port 26380 routing to 6379. 
# (We ignore errors here just in case the proxy is already built from a previous run)
curl -s -X POST -d '{"name": "redis_proxy", "listen": "[::]:26380", "upstream": "redis:6379"}' -H "Content-Type: application/json" http://localhost:8474/proxies > /dev/null
echo "✅ Proxy bridge active on port 26380."
echo ""

echo "========================================="
echo "🚀 PHASE 2: Starting k6 Load Generation"
echo "========================================="
echo "Pumping jobs into the API for 15 seconds..."
# Run k6 in the background (&) so the script can continue
k6 run -e HOST=localhost -e INGEST_PORT=3002 loadtest.js --vus 50 --duration 15s > /dev/null 2>&1 &
K6_PID=$!

# Let the system run healthy for a few seconds
sleep 3
echo ""

echo "========================================="
echo "💥 PHASE 3: SEVERING THE DATABASE CONNECTION"
echo "========================================="
echo "Simulating a physical switch failure. Dropping all TCP connections..."
curl -s -X POST -d '{"enabled": false}' -H "Content-Type: application/json" http://localhost:8474/proxies/redis_proxy > /dev/null
echo "💀 DATABASE IS DEAD! Watch your Node.js terminal for ECONNRESET errors!"
echo ""

echo "⏳ Waiting 8 seconds to allow BullMQ to catch failures and move to 'delayed'..."
sleep 8
echo ""

echo "========================================="
echo "🩹 PHASE 4: HEALING THE NETWORK"
echo "========================================="
echo "Fixing the hardware. Restoring the proxy connection..."
curl -s -X POST -d '{"enabled": true}' -H "Content-Type: application/json" http://localhost:8474/proxies/redis_proxy > /dev/null
echo "✅ DATABASE IS BACK ONLINE!"
echo "🔄 Watch your Node.js terminal. BullMQ will now self-heal and process the delayed jobs."
echo ""

# Wait for the background k6 process to officially finish
wait $K6_PID

echo "========================================="
echo "🎉 CHAOS TEST COMPLETE!"
echo "Run 'node check-queue.js' to verify all jobs safely reached the 'completed' state."
echo "========================================="