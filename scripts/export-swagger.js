#!/usr/bin/env node
// Export swagger.json by starting the NestJS app and fetching the OpenAPI document
// Usage: node scripts/export-swagger.js
// Requires: built dist/ (run `npm run build` first)

const { spawn } = require("child_process");
const http = require("http");
const fs = require("fs");
const path = require("path");

// Start the app in background
const app = spawn("node", ["dist/src/main.js"], {
  env: { ...process.env, PORT: "31337", NODE_ENV: "production" },
  cwd: path.resolve(__dirname, ".."),
  stdio: ["ignore", "ignore", "pipe"],
});

let exited = false;
app.on("exit", () => { exited = true; });
app.stderr.on("data", () => {});

function cleanup() {
  if (!exited) app.kill("SIGTERM");
}

// Poll until server is ready
function waitForServer(retries) {
  return new Promise((resolve, reject) => {
    if (retries <= 0) { cleanup(); reject(new Error("Server did not start")); return; }
    http.get("http://localhost:31337/api-json", (res) => {
      let data = "";
      res.on("data", (chunk) => data += chunk);
      res.on("end", () => {
        // Got the swagger JSON
        fs.writeFileSync(path.resolve(__dirname, "..", "docs", "swagger.json"), data);
        console.log("swagger.json exported successfully");
        cleanup();
        resolve();
      });
    }).on("error", () => {
      // Server not ready yet, retry
      setTimeout(() => waitForServer(retries - 1).then(resolve).catch(reject), 500);
    });
  });
}

waitForServer(30).catch(() => {
  console.error("Failed to export swagger.json");
  process.exit(1);
});
