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
