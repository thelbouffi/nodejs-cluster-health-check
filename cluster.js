const cluster = require("cluster");

const config = {
  poolSize: /*5*/ 2,
  maxPoolSize: 5,
  hcTime: 1000,
  delay: 1,
};

if (cluster.isMaster) {
  console.log(`Master ${process.pid} is running`);
  // initialise slave workers array
  const workers = [];

  // frok slave workers corresponding to pool size
  for (let i = 0; i < config.poolSize; i++) {
    const w = {
      worker: cluster.fork(),
      available: true,
      lastHC: Date.now(),
    };

    // push slave forker worker into their array
    workers.push(w);

    // master worker listen for pong comming from each slave worker
    w.worker.on("message", (data) => {
      if (data && typeof data === "object" && data.type === "pong") {
        w.available = true;
        w.lastHC = Date.now();
        console.log("slave pong", data.pid);
      }
    });
  }

  setInterval(() => {
    // ping ech existing worker
    workers.forEach((w) => {
      if (w.available === true) {
        w.lastHC = Date.now(); // ping without being sure that we the pong will immediatly be recieved
        // w.worker.process.send({ type: "ping", worker: w.worker.id });
        w.worker.send({ type: "ping", pid: w.worker.process.pid });
        console.log("master ping ", w.worker.process.pid);
      }
    });

    // find not available workers
    workers.forEach((w) => {
      if (Date.now() - w.lastHC >= config.delay) {
        console.log(
          `${Date.now()}-${w.lastHC} = ${Date.now() - w.lastHC} > ${
            config.delay
          }`
        );
        w.available = false;
      }
      // console.log(`=====> id: ${w.worker.id} pid: ${w.worker.process.pid}`);
    });

    // list available and not available workers
    const unavailableWrkrs = workers.filter((w) => w.available === false);
    console.log("unavailableWrkrs.length ", unavailableWrkrs.length);
    console.log({
      workers: workers.map((w) => {
        return {
          id: w.worker.id,
          pid: w.worker.process.pid,
          available: w.available,
          lastHC: w.lastHC,
        };
      }),
    });
    if (
      unavailableWrkrs.length >= config.poolSize &&
      workers.length < config.maxPoolSize
    ) {
      console.log("FORK FORK FORK");
      const w = {
        worker: cluster.fork(),
        available: true,
        lastHC: Date.now(),
      };
      w.worker.on("message", (data) => {
        if (data && typeof data === "object" && data.type === "pong") {
          w.available = true;
          w.lastHC = Date.now();
          console.log("slave pong", data.pid);
        }
      });
      workers.push(w);
    } else if (
      unavailableWrkrs.length < config.poolSize &&
      workers.length > config.poolSize
    ) {
      for (i = 0; i < workers.length - config.poolSize; i++) {
        console.log("KILL KILL KILL");
        const w = workers.findIndex((w) => w.available === true);
        workers[w].worker.kill();
        workers.splice(w, 1);
      }
    }
  }, config.hcTime);

  process.on("SIGINT", () => {
    cluster.disconnect();
  });
} else {
  // run server
  require("./app");

  // recieve ping from master worker
  process.on("message", (data) => {
    console.log(`worker with pid ${data.pid} or process ${process.pid}`);
    if (data && typeof data === "object" && data.type === "ping") {
      process.send({ type: "pong", pid: process.pid });
    }
  });
}
