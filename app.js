const express = require("express");
const crypto = require("crypto");

const app = express();

const hostname = "localhost";
const port = 3033;
const pid = process.pid;

app.get("/fast", (req, res) => {
  const start = Date.now();

  return res.send(
    `Hello, fast! from pid ${pid} after an execution time of ${
      Date.now() - start
    } seconds\n started at ${start} and ended at ${Date.now()}`
  );
});

app.get("/slow", (req, res) => {
  const start = Date.now();

  for (let i = 0; i <= 200; i++) {
    const salt = crypto.randomBytes(128).toString("base64");
    crypto.pbkdf2Sync("stringToEncrypt", salt, 10000, 512, "sha512");
  }

  return res.send(
    `Hello, Slow! from pid ${pid} after an execution time of ${
      Date.now() - start
    } seconds\n started at ${start} and ended at ${Date.now()}`
  );
});

app.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/ on pid ${pid}`);
});
