const cluster = require("cluster");
const WorkerInstantiator = require("./lib/workers-instanciator");
const { pong } = require("./helpers/communication-helper");

const config = {
  poolSize: 1,
  maxPoolSize: 3,
  hcTime: 1000, // in ms
  delay: 1, // in ms
  precision: 0,
};

if (cluster.isMaster) {
  console.log(`Master ${process.pid} is running`);
  // initialise slave workers array
  const workers = new WorkerInstantiator();

  // frok slave workers corresponding to pool size
  for (let i = 0; i < config.poolSize; i++) {
    workers.forkWorker();
  }

  // set a watcher that manage slave workers (health check manager)
  const watcher = setInterval(() => {
    // ping each existing worker
    workers.pingSlaveWorkers();

    // evaluate all workers availability
    workers.evaluateWorkersAvailability(config.delay, config.precision);

    // get unvailable workers size
    const unavailableWrkrsSize = workers.getUnvailableWorkersSize();
    // console.log({unavailableWrkrsSize});

    // get total workers size
    const totalWorkersSize = workers.getTotalWorkersSize();

    // fork workers if unavailable workers exceed pool size and max pool size is still not reached
    if (
      unavailableWrkrsSize >= config.poolSize &&
      totalWorkersSize < config.maxPoolSize
    ) {
      workers.forkWorker();
    }

    // kill exessive workers if unvailabale workers are less than pool size and total existent workers is over pool size
    if (
      unavailableWrkrsSize < config.poolSize &&
      totalWorkersSize > config.poolSize
    ) {
      for (i = 0; i < totalWorkersSize - config.poolSize; i++) {
        workers.killWorker();
      }
    }

    // log the state of forked workers
    workers.logSlaveWorkers();
  }, config.hcTime);

  // when process is killed disconnect cluster and kill watcher
  process.on("SIGINT", () => {
    clearInterval(watcher);
    cluster.disconnect();
  });
} else {
  // run server
  require("./app");

  // pong whenever slave recieves ping from master worker
  pong();
}
