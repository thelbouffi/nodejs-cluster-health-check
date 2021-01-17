const cluster = require("cluster");

const config = {
  poolSize: /*5*/ 1,
  maxPoolSize: 10,
  hcTime: 1000,
  delay: 2000,
};

if (cluster.isMaster) {
  console.log(`Master ${process.pid} is running`);
  const workers = [];

  for (let i = 0; i < config.poolSize; i++) {
    const w = {
      available: true,
      worker: cluster.fork(),
      lastCheck: Date.now(),
    };

    w.worker.on("message", (data) => {
      if (data && typeof data === "object" && data.type === "pong") {
        w.available = true;
        console.log(
          w.worker.id,
          " --- listner date to respond for worker is ",
          Date.now(),
          "---",
          w.lastCheck,
          Date.now() - w.lastCheck
        );
        w.lastCheck = Date.now();
      }
    });

    workers.push(w);
  }

  setInterval(() => {
    console.log(`${workers.length}`);
    workers.forEach((w) => {
      console.log(
        `${w.worker.id} --- setinterval ${Date.now()} ---- ${
          w.lastCheck
        } ---- ${Date.now() - w.lastCheck} ---- ${config.hcTime}`
      );
      if (Date.now() - w.lastCheck > config.delay && w.available === true) {
        w.available = false;
        console.info("You should fork");
        // Fork...
        return;
      }

      // const { worker, ...rest } = w;
      // console.log(rest);

      // w.lastCheck = Date.now();
      if (w.available === true) {
        w.worker.process.send({ type: "ping", worker: w.worker.id });
        console.log("master ping slave", w.worker.id, w.available);
      }
    });
  }, config.hcTime);

  process.on("SIGINT", () => {
    cluster.disconnect();
  });
} else {
  require("./app");

  process.on("message", (data) => {
    if (data && typeof data === "object" && data.type === "ping") {
      process.send({ type: "pong" });
      console.log("slave pong master", data.worker);
    }
  });
  // client.SET(`${process.ppid}_${cluster.worker.id}`, process.pid);
}
