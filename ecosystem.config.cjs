module.exports = {
  apps: [
    {
      name: "web",
      cwd: "/app",
      script: "dist/server.js",
      env: {
        NODE_ENV: "production",
        PORT: "3000"
      }
    },
    {
      name: "metadata-worker",
      script: "dist/src/workers/metadata-worker.js"
    },
    {
      name: "publish-worker",
      script: "dist/src/workers/publish-worker.js"
    }
  ]
};
