const port = 3033;
const pid = process.pid;

const server = http.createServer((req, res) => {
  // some piece of code to slow down the event loop
  const start = new Date().getTime();

  res.statusCode = 200;
  res.setHeader("Content-Type", "text/plain");
  if (req.url === "/fast") {
    return res.end(`hello fast ${pid}`);
  }
  if (req.url === "/slow") {
    for (let i = 0; i <= 200; i++) {
      const salt = crypto.randomBytes(128).toString("base64");
      crypto.pbkdf2Sync("stringToEncrypt", salt, 10000, 512, "sha512");
    }
    const end = new Date().getTime();
    return res.end(
      `Hello, Slow! from pid ${pid} after an execution time of ${
        (end - start) / 1000
      } seconds\n`
    );
  }
});

server.listen(port, hostname, () => {
  console.log(
    `Server running at http://${hostname}:${port}/ on pid ${process.pid}`
  );
});
