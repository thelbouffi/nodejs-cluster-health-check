const cluster = require("cluster");

module.exports = class WorkerInstantiator {
  constructor() {
    this._workers = [];
  }

  forkWorker() {
    if (!cluster.isMaster) {
      throw new Error("Only master worker is allowed to fork");
    }

    const w = {
      worker: cluster.fork(),
      available: true,
      lastHC: Date.now(),
      // lastHC: process.hrtime()[0]*1000000+process.hrtime()[1]/1000, // in µs
      // lastHC: process.hrtime()[0]*1000000000+process.hrtime()[1], // in ns
    };

    w.worker.on("message", (data) => {
      if (data && typeof data === "object" && data.type === "pong") {
        w.available = true;
        w.lastHC = Date.now();
      }
    });

    this._workers.push(w);
  }

  killWorker() {
    if (!cluster.isMaster) {
      throw new Error("Only master worker is allowed to fork");
    }

    if (!this._workers.length) {
      throw new Error("No workers to kill");
    }

    const w = this._workers.findIndex((w) => {
      if (
        typeof w !== "object" ||
        !w.worker ||
        typeof w.worker !== "object" ||
        w.available === undefined
      ) {
        throw new Error("Worker object is not correct");
      }

      return w.available === true;
    });

    this._workers[w].worker.kill();
    this._workers.splice(w, 1);
  }

  getTotalWorkersSize() {
    return this._workers.length;
  }

  getUnvailableWorkersSize() {
    if (!this._workers.length) {
      throw new Error("No workers to ping");
    }

    const workers = this._workers.filter((w) => {
      if (
        typeof w !== "object" ||
        !w.worker ||
        typeof w.worker !== "object" ||
        w.available === undefined
      ) {
        throw new Error("Worker object is not correct");
      }

      return w.available === false;
    });

    return workers.length;
  }

  pingSlaveWorkers() {
    if (!this._workers.length) {
      throw new Error("No workers to ping");
    }

    this._workers.forEach((w) => {
      if (
        typeof w !== "object" ||
        !w.worker ||
        typeof w.worker !== "object" ||
        w.available === undefined
      ) {
        throw new Error("Worker object is not correct");
      }

      if (w.available === true) {
        w.lastHC = Date.now();
        w.worker.send({ type: "ping", pid: w.worker.process.pid });
      }
    });
  }

  evaluateWorkersAvailability(delay, opts = 0) {
    if (!delay) {
      throw new Error("delay argument is missing");
    }
    if (!this._workers.length) {
      throw new Error("No worker exists");
    }
    this._workers.forEach((w) => {
      if (
        typeof w !== "object" ||
        !w.lastHC ||
        !w.worker ||
        typeof w.worker !== "object" ||
        w.available === undefined
      ) {
        throw new Error("Worker object is not correct");
      }

      if (opts) for (let i = 0; i <= opts; i++) {}

      if (Date.now() - w.lastHC >= delay) {
        w.available = false;
      }
    });
  }

  logSlaveWorkers() {
    console.info(
      `\x1b[33m::::::::::::::::: workers @${new Date()}  :::::::::::::::::\x1b[0m`
    );
    const w = this._workers.map((w) => {
      return {
        id: w.worker.id,
        pid: w.worker.process.pid,
        available: w.available,
        lastHC: w.lastHC,
      };
    });
    console.info(w);
  }
};
