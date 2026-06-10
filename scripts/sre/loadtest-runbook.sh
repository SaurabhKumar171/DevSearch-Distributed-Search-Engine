#!/bin/bash

# ==============================================================================
# DEVSEARCH SRE BASELINE LOAD TEST
# This script blasts the ingestion API under perfect network conditions to 
# establish our maximum baseline throughput (Operations Per Second).
# ==============================================================================

echo "========================================="
echo "🚦 PREPARATION: Ensuring Perfect Network"
echo "========================================="
# Delete any lingering latency rules just to be safe
curl -s -X DELETE http://localhost:8474/proxies/redis_proxy/toxics/latency_downstream > /dev/null
echo "✅ Network is clean and healthy."
echo ""

echo "========================================="
echo "🚀 INITIATING MASS INGESTION"
echo "========================================="
echo "Firing k6 load generator (500 Virtual Users for 15s)..."
# Run k6 in the foreground so we can see the HTTP metrics
k6 run -e HOST=localhost -e INGEST_PORT=3002 loadtest.js --vus 500 --duration 15s

echo ""
echo "========================================="
echo "📊 TEST COMPLETE!"
echo "Run 'cd ../../backend && node check-queue.js' to see how fast the worker drained the queue."
echo "========================================="