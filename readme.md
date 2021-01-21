### scenario to implement

- Params:

  - Pool size: 5 => Always I have at least 5 workers running
  - Max Pool Size: 10 => I cannot create more than 10 workers
  - Health check time: 10ms (setInterval in the main thread)
  - delay: 1ms

- Strategy

  - each 10ms checkout workers that are available and workers that are not available
  - if none of the existing workers is available and max pool size is not reached => we should fork
  - if at least one worker of workers of the pool is available => we should not fork
  - if total number of workers exceed pool size and unavailable workers are less than pool size => we have to kill exessive free workers

- algorithm

```
const config = {
  poolSize: /*5*/ 1,
  maxPoolSize: 10,
  hcTime: 1000,
  delay: 2000,
};

if(worker.isMaster){
  // initialise slave workers array
  const workers = [];

  // frok slave workers corresponding to pool size
  for(let i=0; i< config.poolSize; i++){
    const w = {
      worker: cluster.fork(),
      available = true,
      lastHC = Date.now()
    }

    // push slave forker worker into their array
    workers.push(w);

    // master workerlisten for pong comming from each slave worker
    w.worker.on("message", (data)=>{
      if(data && typeof data === "object" data.type==="pong"){
        w.available = true;
        // w.lastHC = Date.now();
      }
    });
  }

  setIntervale(()=>{
    // ping ech existing worker
    workers.forEach((w) => {
      // w.worker.process.send({ type: "ping", worker: w.worker.id });
      w.lastHC = Date.now();
      w.worker.send({type: "ping"})
    });

    // find not available workers
    workers.forEach((w) => {
      if(Date.now()-w.lastHC > delay) {
        w.available = false;
      }
    });

    // list available and not available workers
    const unavailableWrkrs = workers.map(w => w.available === false);
    if((unavailableWrkrs.length >= config.poolSize) && (workers.length <= config.maxPoolSize)){
      const w = {
        worker: cluster.fork(),
        available = true,
        lastHC = Date.now()
      }
      workers.push(w);
    } else if((unavailableWrkrs.length < config.poolSize)&&(workers.length > config.poolSize)) {
      for(i=0; i<workers.length-config.poolSize;i++) {
        const w = workers.find(w => w.available === true);
        // w.kill();
        // workers.splice(w);
      }
    }



  }, config.hcTime);

} else {
  // run server

  // recieve ping from master worker
  process.on("message", (data)=>{
    if(data && typeof data === "object" data.type==="ping"){
      process.send({ type: "pong" });
    }
  })
}
```
