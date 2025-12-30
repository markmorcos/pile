import { spawn } from "child_process";

spawn("node", ["server.js"], {
  stdio: "inherit",
  env: process.env,
});
