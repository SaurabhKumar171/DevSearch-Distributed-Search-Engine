require("dotenv").config();

const frontierQueue = require("./queues/frontier"); // Ensure correct path to your ingestion queue
const logger = require("./lib/logger");

async function seed() {
  logger.info(
    "Generating high-density developer documentation URLs for load testing...",
  );

  const urls = [
    // === REACT REFERENCE & LEARNING GUIDES ===
    "https://react.dev",
    "https://react.dev/learn",
    "https://react.dev/learn/describing-the-ui",
    "https://react.dev/learn/adding-interactivity",
    "https://react.dev/learn/managing-state",
    "https://react.dev/learn/escape-hatches",
    "https://react.dev/reference/react",
    "https://react.dev/reference/react/useState",
    "https://react.dev/reference/react/useEffect",
    "https://react.dev/reference/react/useMemo",
    "https://react.dev/reference/react/useCallback",
    "https://react.dev/reference/react/useRef",
    "https://react.dev/reference/react/createContext",
    "https://react.dev/reference/react/useContext",
    "https://react.dev/reference/react/useReducer",
    "https://react.dev/reference/react/useLayoutEffect",
    "https://react.dev/reference/react/useDebugValue",
    "https://react.dev/reference/react/useDeferredValue",
    "https://react.dev/reference/react/useTransition",
    "https://react.dev/reference/react/useId",
    "https://react.dev/reference/react/useSyncExternalStore",
    "https://react.dev/reference/react/useInsertionEffect",
    "https://react.dev/reference/react-dom",
    "https://react.dev/reference/react-dom/client/createRoot",
    "https://react.dev/reference/react-dom/client/hydrateRoot",
    "https://react.dev/reference/react-dom/server",
    "https://react.dev/reference/react-dom/components/common",
    "https://react.dev/reference/react/Component",
    "https://react.dev/reference/react/PureComponent",
    "https://react.dev/reference/react/memo",
    "https://react.dev/reference/react/lazy",
    "https://react.dev/reference/react/Suspense",
    "https://react.dev/reference/react/StrictMode",
    "https://react.dev/reference/react/Fragment",
    "https://react.dev/reference/react/Children",
    "https://react.dev/community",
    "https://react.dev/warnings/invalid-hook-call-warning",

    // === MDN JAVASCRIPT CORE REFERENCE ===
    "https://developer.mozilla.org/en-US/docs/Web/JavaScript",
    "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference",
    "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array",
    "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/map",
    "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/filter",
    "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/reduce",
    "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/forEach",
    "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort",
    "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object",
    "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/keys",
    "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/values",
    "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/entries",
    "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/assign",
    "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String",
    "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/split",
    "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/replace",
    "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/substring",
    "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise",
    "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/all",
    "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/race",
    "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/allSettled",
    "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/any",
    "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map",
    "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set",
    "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON",
    "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math",
    "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number",
    "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function",
    "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/await",
    "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules",
    "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Closures",
    "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Inheritance_and_the_prototype_chain",

    // === MDN HTML & CSS CORE REFERENCE ===
    "https://developer.mozilla.org/en-US/docs/Web/HTML",
    "https://developer.mozilla.org/en-US/docs/Web/HTML/Element",
    "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/a",
    "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/div",
    "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/span",
    "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/img",
    "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/script",
    "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/link",
    "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/meta",
    "https://developer.mozilla.org/en-US/docs/Web/CSS",
    "https://developer.mozilla.org/en-US/docs/Web/CSS/Flexbox",
    "https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Grid",
    "https://developer.mozilla.org/en-US/docs/Web/CSS/Layout_cookbook",

    // === NODE.JS STANDARD API REFERENCE ===
    "https://nodejs.org/api/fs.html",
    "https://nodejs.org/api/path.html",
    "https://nodejs.org/api/crypto.html",
    "https://nodejs.org/api/http.html",
    "https://nodejs.org/api/https.html",
    "https://nodejs.org/api/url.html",
    "https://nodejs.org/api/querystring.html",
    "https://nodejs.org/api/stream.html",
    "https://nodejs.org/api/buffer.html",
    "https://nodejs.org/api/process.html",
    "https://nodejs.org/api/os.html",
    "https://nodejs.org/api/child_process.html",
    "https://nodejs.org/api/worker_threads.html",
    "https://nodejs.org/api/events.html",
    "https://nodejs.org/api/dns.html",
    "https://nodejs.org/api/net.html",
    "https://nodejs.org/api/cluster.html",
    "https://nodejs.org/api/v8.html",
    "https://nodejs.org/api/vm.html",
    "https://nodejs.org/api/zlib.html",
    "https://nodejs.org/api/util.html",
    "https://nodejs.org/api/perf_hooks.html",
    "https://nodejs.org/api/async_hooks.html",
    "https://nodejs.org/api/cli.html",
    "https://nodejs.org/api/diagnostics_channel.html",
    "https://nodejs.org/api/globals.html",
    "https://nodejs.org/api/readline.html",
    "https://nodejs.org/api/repl.html",
  ];

  // Map the URLs into standard, active present-tense verb job names ("ingest-url") to match our naming audit
  const jobs = urls.map((url) => ({
    name: "ingest-url",
    data: { url },
  }));

  logger.info(
    `Sending ${jobs.length} high-density documentation jobs to BullMQ...`,
  );

  // Enqueue in bulk to minimize Redis network round-trips
  await frontierQueue.addBulk(jobs);

  logger.info(
    `✅ Successfully seeded ${jobs.length} unique documentation URLs into the url-frontier queue!`,
  );

  const connection = require("./lib/redis");
  await connection.quit();
}

seed().catch((err) => {
  logger.error(err);
  process.exit(1);
});
