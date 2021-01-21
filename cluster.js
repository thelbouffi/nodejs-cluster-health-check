const cluster = require("cluster");
const WorkerInstantiator = require("./lib/workers-instanciator");
const { pong } = require("./helpers/communication-helper");

const config = {
  poolSize: 2,
  maxPoolSize: 8,
  hcTime: 1000,
  delay: 1, // in ms
  // delay: 70, // in µs
  // delay: 200000, // in ns,
  precision: 400,
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
    // workers.evaluateWorkersAvailability(config.delay);

    // get unvailable workers size
    const unavailableWrkrsSize = workers.getUnvailableWorkersSize();
    // console.log({unavailableWrkrsSize});

    // get total workers size
    const totalWorkersSize = workers.getTotalWorkersSize();
    // console.log({totalWorkersSize})

    // fork workers if unavailable workers exceed pool size and max pool size is still not reached
    // console.log(unavailableWrkrsSize >= config.poolSize && totalWorkersSize < config.maxPoolSize);
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
    // console.log(process.hrtime());
    // console.log(Date.now())
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
