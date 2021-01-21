exports.pong = function () {
  process.on("message", (data) => {
    if (data && typeof data === "object" && data.type === "ping") {
      process.send({ type: "pong", pid: process.pid });
    }
  });
};
