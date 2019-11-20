

function throttle(fn, wait = 500) {
  let lastCall = 0; // 上次执行时间
  let timer = null;
  return function() {
    let now = Date.now();
    if (timer) {
      // 取消倒计时任务
      clearTimeout(timer);
      timer = null;
    }
    if (now - lastCall < wait) {
      // wait 内再次调用
      timer = setTimeout(() => {
        fn.apply(this, arguments);
        lastCall = Date.now();
        clearTimeout(timer);
        timer = null;
      }, wait - (now - lastCall));
    } else {
      // 立即执行函数
      // 此次执行后，n 秒内不能重复执行
      fn.apply(this, arguments);
      lastCall = now;
    }
  };
}

function a(q) {
  console.log(Date.now(), q);
}

var c = throttle(a, 5000);
console.log(Date.now(), "1");
c(1111);
console.log(Date.now(), "2");
c(2222);

setTimeout(() => {
  console.log(Date.now(), "3");
  c(3333);
  setTimeout(() => {
    console.log(Date.now(), "4");
    c(4444);
  }, 1000);
}, 1000);
