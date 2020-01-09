---
tags: [Node]
title: Node 进程和线程
created: '2019-12-31T09:31:04.084Z'
modified: '2020-01-07T03:02:17.274Z'
---

# Node 进程和线程

### 1. 进程和线程定义

  - 进程： **资源分配的最小单位；**

  - 线程： **任务调度的最小单位；**

### 2. Node 和单线程

 Node 进程一般包含7个线程：
 - 1 个 Javascript 执行主线程；
 - 1 个 watchdog 监控线程用于处理调试信息；
 - 1 个 v8 task scheduler 线程用于调度任务优先级，加速延迟敏感任务执行；
 - 4 个 v8 线程，主要用来执行代码调优与 GC 等后台任务；
 - 默认为 4个的异步 I/O 线程池；如果执行程序中不包含 I/O 操作如文件读写等，则默认线程池大小为 0；

### 3.Node 解决高并发问题

 **I/O 密集**：**事件循环机制** ，Node 进程中通过 libuv 实现了一个事件循环机制（uv_event_loop），当执行主线程发生阻塞事件，如 I/O 操作时，主线程会将耗时的操作放入事件队列中，然后继续执行后续程序，uv_event_loop 尝试从 libuv 的线程池（uv_thread_pool）中取出一个空闲线程去执行队列中的操作，执行完毕获得结果后，通知主线程，主线程执行相关回调，并且将线程实例归还给线程池。通过此模式循环往复，来保证非阻塞 I/O，以及主线程的高效执行。

 **CPU 密集**： **子进程**，解决 CPU 密集型场景，同时充分发挥 CPU 多核性能；

### 4.子进程

#### 4.1 进程间通信方式与 IPC

  - 进程间痛惜信技术： 命名管道、匿名管道、socket、信号量、共享内存、消息队列、Domain Socket等；

  - IPC： Inter-Process Commumication，采用管道（pipe()）技术，这个‘管道’是个抽象层面的称呼，具体实现细节由 libuv 提供，在 window 下由命名管道（named pipe）实现，\*unix 系统则采用 *Unix Domain Socket* 实现；在应用层上的进程间通信只有简单的 message() 事件和 send() 方法，通过 *process.send* 发送消息，通过监听 *message* 事件接收消息；

#### 4.2 child_process

 - spawn： 子进程以流的形式返回 data 和 error 信息；
 - exec： 对 spawn 的封装，可直接执行命令，以 callback 形式返回 error stdout stderr 信息；
 - execFile： 类似于 exec，但默认不会创建命令行环境，将直接以传入文件创建新进程，性能略优于 exec；
 - fork： 是 spawn 的特殊场景，只能用于创建 node 程序的子进程，默认会创建父子进程的 IPC 信道来传递消息；

#### 4.3 集群模式

为了更加方便的管理进程、负载均衡以及实现端口复用，Node 在 v0.6 之后引入了 cluster 模块；

相对于子进程模块，cluster 实现了单 master 主控节点和多 worker 执行节点的通用集群模式。cluster master 节点可以创建销毁进程并与子进程通信，子进程之间不能直接通信；worker 节点则负责执行耗时的任务；

cluster 模块同时实现了负载均衡调度算法，在 *unix 系统中，cluster 使用**轮转调度（round-robin）**，node 中维护一个可用 worker 节点的队列 free，和一个任务队列 handles。当一个新的任务到来时，节点队列队首节点出队，处理该任务，并返回确认处理标识，依次调度执行。而在 win 系统中，Node 通过 **Shared Handle** 来处理负载，通过将文件描述符、端口等信息传递给子进程，子进程通过信息创建相应的 SocketHandle / ServerHandle，然后进行相应的端口绑定和监听，处理请求；

#### 4.4 工作线程

Node v10 引入 **工作线程(work_threads)**，可以在进程内创建多个线程，主线程与 worker 线程使用 parentPort 通信，worker 线程之间可以通过 MessageChannel 直接通信。


### 5.面试题

#### 5.1 孤儿进程

父进程创建子进程之后，父进程退出了，但是父进程对应的一个或多个子进程还在运行，这些子进程会被系统的 init 进程收养，对应的进程 ppid 为 1，这就是孤儿进程；

#### 5.2 创建多进程时，代码里有 `app.listen(port)` 在进行 fork 时，为什么没有报端口被占用？

当父子进程之间建立 IPC 通道之后，通过子进程对象的 send 方法 发送消息，第二个参数 sendHandle 就是句柄，可以是 TCP 套接字、TCP 服务器、UDP 套接字等；

当建立子进程时，将 TCP 服务器通过 IPC 发送给子进程，就可以实现子进程和父进程监听同一个端口；

##### 1. 端口被占用情况：
  ```javascript
    // master.js
    const fork = require("child_process").fork;
    const cpus = require("os").cpus();

    for (let i = 0; i < cpus.length; i++) {
      const worker = fork("worker.js");
      console.log(
        "worker process created, pid: %s ppid: %s",
        worker.pid,
        process.pid
      );
    }
  ```
  ```javascript
  //worker.js
  const http = require("http");
  http
    .createServer((req, res) => {
      res.end("I am worker, pid: " + process.pid + ", ppid: " + process.ppid);
    })
    .listen(3000);
  ```
  以上代码示例，控制台执行 node master.js 只有一个 worker 可以监听到 3000 端口，其余将会抛出 Error:listen EADDRINUSE:::3000 错误；

  ##### 2. 通过句柄传递，发送 TCP 套接字、TCP 服务器、UDP 套接字等，实现进程端口占用问题

  - 1. 通过 child_process 实现
  ```javascript
    //master.js
    const fork = require("child_process").fork;
    const cpus = require("os").cpus();
    const server = require("net").createServer();
    server.listen(3000);
    process.title = "node-master";

    for (let i = 0; i < cpus.length; i++) {
      const worker = fork("worker.js");
      worker.send("server", server);
      console.log(
        "worker process created, pid: %s ppid: %s",
        worker.pid,
        process.pid
      );
    }

  ```
  ```javascript
    // worker.js
    const http = require("http");
    const server = http.createServer((req, res) => {
      res.end("I am worker, pid: " + process.pid + ", ppid: " + process.ppid);
    });

    let worker;
    process.title = "node-worker";
    process.on("message", function(message, sendHandle) {
      if (message === "server") {
        worker = sendHandle;
        worker.on("connection", function(socket) {
          server.emit("connection", socket);
        });
      }
    });

  ```

  - 2. 通过 cluster 实现
  cluster 模块就是 child_process 和 net 模块的组合应用。cluster 启动时，他会在内部启动 TCP 服务器，在 cluster.fork() 子进程时，将这个 TCP 服务器端 socket 的文件描述符发送给工作进程。
  如果进程是通过 cluster.fork() 复制出来的，那么它的环境变量就存在 NODE_UNIQUE_ID，如果工作进程中存在 listen() 侦听网络端口的调用，它将拿到该文件描述符，通过 SO_REUSEADDR 端口重用，从而实现多个子进程共享端口。对于普通方式启动的进程，则不存在文件描述符传递共享等事情。
```javascript
  const cluster = require('cluster');
  const http = require('http');
  const numCPUs = require('os').cpus().length;

  if (cluster.isMaster) {
    console.log(`主进程 ${process.pid} 正在运行`);

    // 衍生工作进程。
    for (let i = 0; i < numCPUs; i++) {
      cluster.fork();
    }

    cluster.on('exit', (worker, code, signal) => {
      console.log(`工作进程 ${worker.process.pid} 已退出`);
    });
  } else {
    // 工作进程可以共享任何 TCP 连接。
    // 在本例子中，共享的是 HTTP 服务器。
    http.createServer((req, res) => {
      res.writeHead(200);
      res.end('你好世界\n');
    }).listen(8000);

    console.log(`工作进程 ${process.pid} 已启动`);
  }
```
#### 5.3 关于守护进程，是什么、为什么、怎么编写？

采用守护进程进程方式，这个终端执行 `node app.js` 开启一个服务进程之后，还可以在这个终端上做些别的事情，且不会相互影响。
  四个步骤：
  - 1. 创建子进程
  - 2. 在子进程中创建新会话（调用系统函数 setsid）
  - 3. 改变子进程工作目录（如：“/” 或 “/usr/ 等）
  - 4. 父进程终止

```javascript
// index.js
const spawn = require("child_process").spawn;
function startDaemon() {
  const daemon = spawn(
    "node",
    ["daemon.js"],
    {
      cwd: "/usr", // 指定当前子进程工作目录若不做设置默认继承当前工作目录
      detached: true, // 子进程在后台运行
      stdio: "ignore"
    }
  );

  console.log(
    "守护进程开启 父进程 pid: %s, 守护进程 pid: %s",
    process.pid,
    daemon.pid
  );
  daemon.unref(); // 退出父进程
}

startDaemon();
```


#### 5.4 如何让一个 js 文件在 Linux 下成为一个可执行命令程序?

  - 1. 新建 `hello.js` 文件，头部须加上 `#!/usr/bin/env node`，表示当前脚本使用 Node.js 进行解析；
  - 2. 赋予文件可执行权限 `chmod +x chmod +x /${dir}/hello.js`，目录自定义；
  - 3. 在 `/usr/local/bin` 目录下创建一个软链文件 `sudo ln-s/${dir}/hello.js/usr/local/bin/hello`，文件名就是我们在终端使用的名字；
  - 4. 终端执行 *hello* 相当于输入 `node hello.js`；









  <br/>

  <br/>




  <br/>





