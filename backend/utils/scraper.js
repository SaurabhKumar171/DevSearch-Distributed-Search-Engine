const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const axios = require("axios");
const cheerio = require("cheerio"); // Imported the Cheerio module to prevent ReferenceError crashes
const https = require("https"); // Node.js native HTTPS module to support custom agents

// Create a custom HTTPS Agent to emulate browser-like TLS (JA3 fingerprint bypass) and avoid certificate rejections
const customAgent = new https.Agent({
  rejectUnauthorized: false, // Ignore self-signed certificate errors to prevent handshake failures
  keepAlive: true, // Persist socket connections to optimize scraping performance
  // Force Chrome/Firefox cipher suites to match desktop browser signatures
  ciphers: [
    "TLS_AES_256_GCM_SHA384",
    "TLS_CHACHA20_POLY1305_SHA256",
    "TLS_AES_128_GCM_SHA256",
    "ECDHE-ECDSA-AES256-GCM-SHA384",
    "ECDHE-RSA-AES256-GCM-SHA384",
    "ECDHE-ECDSA-CHACHA20-POLY1305",
    "ECDHE-RSA-CHACHA20-POLY1305",
    "ECDHE-ECDSA-AES128-GCM-SHA256",
    "ECDHE-RSA-AES128-GCM-SHA256",
  ].join(":"),
  honorCipherOrder: true,
  minVersion: "TLSv1.2",
});

const scrapePage = async (url) => {
  // 1. Emulate a modern desktop browser and attach our customized TLS handshaking agent
  const response = await axios.get(url, {
    httpsAgent: customAgent, // Inject the customized browser-like TLS handshake configuration to bypass WAFs
    headers: {
      // Standard desktop User-Agent string
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
      "Accept-Language": "en-US,en;q=0.9",
      "Cache-Control": "max-age=0",
      // Modern browser Client Hints
      "sec-ch-ua":
        '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": '"Windows"',
      // Modern fetch metadata headers to mimic real human navigation
      "sec-fetch-dest": "document",
      "sec-fetch-mode": "navigate",
      "sec-fetch-site": "none",
      "sec-fetch-user": "?1",
      "Upgrade-Insecure-Requests": "1",
    },
    timeout: 8000, // Slightly relaxed timeout to handle cold WAF handshakes
    responseType: "text", // Expect simple HTML plain text content
  });

  const htmlContent = response.data;

  // 2. Local storage with a deterministic, Git-like 2-tier subdirectory hash structure (SHA-256)
  const hash = crypto.createHash("sha256").update(url).digest("hex");
  const folder1 = hash.substring(0, 2);
  const folder2 = hash.substring(2, 4);
  const storageDir = path.join(__dirname, "../data/html", folder1, folder2);

  // Synchronously ensure directory creation to support concurrent async file writes
  fs.mkdirSync(storageDir, { recursive: true });
  const filePath = path.join(storageDir, `${hash}.html`);
  fs.writeFileSync(filePath, htmlContent, "utf8");

  // 3. Document Parsing and outbound link extraction (Cheerio)
  const $ = cheerio.load(htmlContent);
  const pageTitle = $("title").text().trim() || "Untitled Document";

  const discoveredUrls = [];
  $("a[href]").each((_, element) => {
    try {
      const href = $(element).attr("href");
      if (!href) return;

      // Resolve and normalize absolute paths relative to parent URL
      const resolvedUrl = new URL(href, url).href;

      // Ensure we only queue standard protocols (ignore mailto, javascript, ftp schemas)
      if (
        resolvedUrl.startsWith("http://") ||
        resolvedUrl.startsWith("https://")
      ) {
        discoveredUrls.push(resolvedUrl);
      }
    } catch {
      // Gracefully ignore corrupt href parameters
    }
  });

  return {
    pageTitle,
    hash,
    discoveredUrls,
  };
};

module.exports = { scrapePage };
