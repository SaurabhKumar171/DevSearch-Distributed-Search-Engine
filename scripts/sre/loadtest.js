import http from "k6/http";
import { check } from "k6";

// 1. Read directly from k6's __ENV object, providing safe fallbacks
const HOST = __ENV.HOST || "localhost";
const INGEST_PORT = __ENV.INGEST_PORT || "3002";

export const options = {
  vus: 500, // 500 concurrent virtual users
  duration: "30s", // Blast the API for 30 seconds
};

export default function () {
  // Generate random IDs to simulate a mix of new and duplicate URLs
  const urlId = Math.floor(Math.random() * 20000);
  const payload = JSON.stringify({
    url: `https://docs.developer.com/api/v1/resource/${urlId}`,
  });

  const params = {
    headers: {
      "Content-Type": "application/json",
    },
  };

  // 2. Construct the URL dynamically
  const url = `http://${HOST}:${INGEST_PORT}/ingest`;

  // POST to your Express endpoint
  const res = http.post(url, payload, params);

  // Verify the server is actually accepting the load (HTTP 202 Accepted)
  check(res, {
    "is status 202": (r) => r.status === 202,
  });
}
