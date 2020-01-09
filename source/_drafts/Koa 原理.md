---
tags: [Node]
title: Koa 原理
created: '2020-01-03T06:19:18.306Z'
modified: '2020-01-03T06:34:46.878Z'
---

# Koa 原理

[参考文章](https://segmentfault.com/a/1190000020848655)
本地实现代码位置： ~/workspace/OtherProject/OpenSource/koa

### 1. 四个核心文件：

  application.js、context.js、request.js、response.js

  #### 1.1 application.js
  koa 的入口文件，它向外导出了创建class实例的构造函数，并且继承 events，实现框架事件监听和事件触发的能力；
  还暴露一些常用的 api，如 toJSON、listen、use 等等；
  `listen` 的实现原理其实就是对 `http.createServer` 进行了一个封装，重点是这个函数中传入的 callback，它里面包含了中间件的合并，上下文的处理，对 res 的特殊处理。

  `use` 是收集中间件，将多个中间件放入一个缓存队列中，然后通过 `koa-compose` 这个插件进行递归组合调用这一些列的中间件。

  #### 1.2 context.js
  koa 应用上下文 ctx，就是一个简单的对象暴露，里面的重点在 `delegate`，就是代理，为了开发者方便使用，如需要访问 `ctx.repsponse.status`，通过 `delegate`，就可以直接访问 `ctx.status`。

  #### 1.3 request.js、response.js
  这两部分就是对原生的res、req的一些操作了，大量使用es6的get和set的一些语法，去取headers或者设置headers、还有设置body等等。

  ### 2. 实现 Koa 的四大模块

  理解和实现一个 koa 框架需要实现四大模块，分别是：
  - 封装 node http server、创建 Koa 类构造函数；
  - 构造 request、response、context 对象；
  - 中间件机制和洋葱模型；
  - 错误捕获和错误处理；

  ### 2.1 疯转 node http server 和创建 Koa 类构造函数

  ### 2.2 构造 request、response、context 对象

  context 就是我们平时写koa代码时的 ctx，它相当于一个全局的 koa 实例上下文 this，它连接了 request、response 两个功能模块，将 request、response 对象挂载到 ctx 上面，并且暴露给 koa 的实例和中间件等回调函数的参数中，起到承上启下的作用。

  request、response 两个功能模块分别对 node 的原生 request、response 进行了一个功能的封装，使用了 getter 和 setter 属性，基于 node 的对象 req/res 对象封装 koa 的 request/response 对象。

  ### 2.3 中间件机制和剥洋葱模型的实现

  koa 的中间件机制是一个剥洋葱式的模型，多个中间件通过 use 放进一个数组队列然后从外层开始执行，遇到 next 后进入队列中的下一个中间件，所有中间件执行完后开始回帧，执行队列中之前中间件中未执行的代码部分，这就是剥洋葱模型，koa 的中间件机制。

   koa 通过 `use` 函数，把所有的中间件push到一个内部数组队列 `this.middlewares` 中，剥洋葱模型能让所有的中间件依次执行，每次执行完一个中间件，遇到 `next()` 就会将控制权传递到下一个中间件，下一个中间件的 `next` 参数，剥洋葱模型的最关键代码是 `compose` 这个函数：

   ```javascript
    compose() {
      return async ctx => {
        function createNext(middleware, oldNext) {
          return async () => {
            await middleware(ctx, oldNext);
          };
        }
        const len = this.middlewares.length;
        let next = async () => {
          return Promise.resolve();
        };
        for (let i = len - 1; i >= 0; i--) {
          const currentMiddleware = this.middlewares[i];
          next = createNext(currentMiddleware, next);
        }
        await next();
      };
    }
   ```
