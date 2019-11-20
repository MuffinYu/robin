---
title: Webpack的基石——tapable
date: 2019-10-27 17:23:55
tags:
---

webpack 已经是毫无争议的目前主流的前端打包工具，在深入理解webpack的需求下，有一个绕不开的基础，就是深入理解 tapable 库，整个 webpack 的可扩展的插件系统和其内部的插件系统，都是基于这个库中提供的接口实现的，在webpack源码中，也随处可见 tapable 身影，因此理解 tapable 的插件实现机制是深入理解 webpack 机制的前提。
<!-- more -->

写本文时，webpack的稳定版本是 v4.41.2，对应的 [github webpack webpack-4 分支](https://github.com/webpack/webpack/tree/webpack-4) ，webpack 4 所采用的 tapable 版本是 v1.1.3 以上的版本，v1.* 版本有较大改变，目前 tapable 的稳定版本就是 v1.1.3，对应 [github tapable tapable-1 分支](https://github.com/webpack/tapable/tree/tapable-1)，本文也会主要以v1.1.3版本的代码和文档为主，进行分析。

本文先基本翻译 tapable 的文档，然后结合一个简单的例子，深入理解其 Hook 机制。

[文中的示例代码在此处](https://github.com/MuffinYu/robin/tree/hexo/example/Webpack的基石——tapable)

## 一、基本文档翻译

tapable 是为插件系统写的一个模块；

tapable 暴露出了很多的 Hook（钩子）类，这些钩子可以用来为插件制造钩子函数；

全部钩子函数如下：

```javascript
const {
  SyncHook,
  SyncBailHook,
  SyncWaterfallHook,
  SyncLoopHook,
  AsyncParallelHook,
  AsyncParallelBailHook,
  AsyncSeriesHook,
  AsyncSeriesBailHook,
  AsyncSeriesWaterfallHook
} = require("tapable");
```

### 使用方式

所有的钩子函数都可以接受一个可选的参数，这个参数是一个参数名的字符串列表；

```javascript
const hook = new SyncHook(["arg1", "arg2", "arg3"]);
```

最佳实践是将一个类的所有钩子所有的放放到 **hooks** 这个属性中：

```javascript
class Car {
  constructor() {
    this.hooks = {
      accelerate: new SyncHook(["newSpeed"]),
      brake: new SyncHook(),
      calculateRoutes: new AsyncParallelHook(["source", "target", "routesList"])
    };
  }

  /* 其他的代码... */
}
```

然后就可以使用这些钩子了：

```javascript
const myCar = new Car();

// 使用 tap 方法添加一个消费者
myCar.hooks.brake.tap("WarningLampPlugin", () => warningLamp.on());
```
这里需要传入一个名字，来区分不同的插件。

下面将会接受这些参数：

```javascript
myCar.hooks.accelerate.tap("LoggerPlugin", newSpeed => console.log(`Accelerating to ${newSpeed}`));
```

对于 sync hooks（同步钩子)，只能使用 tap 方法来添加插件。async hooks（异步钩子）支持异步的插件：

```javascript
  myCar.hooks.calculateRoutes.tapPromise("GoogleMapsPlugin", (source, target, routesList) => {
    // return a promise
    return google.maps.findRoute(source, target).then(route => {
      routesList.add(route);
    });
  });
  myCar.hooks.calculateRoutes.tapAsync("BingMapsPlugin", (source, target, routesList, callback) => {
    bing.findRoute(source, target, (err, route) => {
      if(err) return callback(err);
      routesList.add(route);
      // call the callback
      callback();
    });
  });

  // 异步钩子也可以使用同步方式添加消费者
  myCar.hooks.calculateRoutes.tap("CachedRoutesPlugin", (source, target, routesList) => {
    const cachedRoute = cache.get(source, target);
    if(cachedRoute)
      routesList.add(cachedRoute);
  })
```

这个类声明这些钩子必须调用他们：

```javascript
  class Car {

   /**
    * SyncHook(同步钩子)和 AsyncParallelHook(同步并行钩子)不会有返回值
    * 如果需要获取返回值，可以使用 SyncWaterfallHook (同步瀑布流式钩子) 和 AsyncSeriesWaterfallHook (同步瀑布流式串行钩子) 来代替
    **/ 
    setSpeed(newSpeed) {
      // 这种调用方式会返回undefined，即使你在消费者函数中有返回值
      this.hooks.accelerate.call(newSpeed);
    }

    useNavigationSystemPromise(source, target) {
      const routesList = new List();
      return this.hooks.calculateRoutes.promise(source, target, routesList).then((res) => {
        // res is undefined for AsyncParallelHook
        return routesList.getRoutes();
      });
    }

    useNavigationSystemAsync(source, target, callback) {
      const routesList = new List();
      this.hooks.calculateRoutes.callAsync(source, target, routesList, err => {
        if(err) return callback(err);
        callback(null, routesList.getRoutes());
      });
    }
  }
```

Hook 将使用运行你的插件的最高效的方法来编译出一个方法，它产生的代码取决于以下几点：

- 注册是插件数量（一个没有，有一个，很多）；
- 注册的插件的种类（sync(异步的)，async(同步的)，promise)
- 被调用的方式（sync(异步的)，async(同步的)， promise）
- 参数数量
- 是否使用了 interception (监听器)

这些决定了产生可能的最快的可执行方法。

### Hook 类型

每个钩子可以被 tapped（注册）一个或者多个方法。他们如何执行取决于钩子的类型：

- Basic hook: 基础的钩子（名字中没有 “Waterfall”, “Bail” 或者 “Loop” 关键字的）。这种类型会连续简单的执行每一个注册于其上方法。

- **Waterfall**: 这种类型的钩子也会连续的执行每一个注册于其上的方法，与基础钩子不同的是，它会将每一个方法的执行返回值传给下一个方法。

- **Bail**：这种类型的钩子可以提前结束。当任意一个注册的方法执行时返回了一些值，这种类型的钩子会取消执行其余的方法。

- **Loop**: TODO

另外，钩子有 synchronous （同步）和 asynchronous（异步）之分。基于这种情况，有 “Sync”, “AsyncSeries”, 和 “AsyncParallel” 类型的钩子：

- **Sync**: 同步的钩子只能注册同步的方法（使用 myHook.tap()）。

- **AsyncSeries**: 一个  async-series（同步串行）的钩子可以注册 synchronous（同步的）, callback-based（回调方式） 和 promise-based（基于 promise的）(使用 myHook.tap(), myHook.tapAsync() 和 myHook.tapPromise() 注册)。它将串行的执行每一个异步方法。

- **AsyncParallel**: 一个  async-parallel（同步并行）的钩子可以注册 synchronous（同步的）, callback-based（回调方式） 和 promise-based（基于 promise的）(使用 myHook.tap(), myHook.tapAsync() 和 myHook.tapPromise() 注册)。它将并行的执行每一个异步方法。

钩子的类型可以从它的名字中看出来，比如，**AsyncSeriesWaterfallHook** 可以注册异步的方法，串行的执行，每个函数的返回值会传递给下一个方法。

### Interception (监听)

所有的钩子提供一个监听的接口：

```javascript
  myCar.hooks.calculateRoutes.intercept({
    call: (source, target, routesList) => {
      console.log("Starting to calculate routes");
    },
    register: (tapInfo) => {
      // tapInfo = { type: "promise", name: "GoogleMapsPlugin", fn: ... }
      console.log(`${tapInfo.name} is doing its job`);
      return tapInfo; // may return a new tapInfo object
    }
  })
```
**call**: (...args) => void 添加 call 到监听器，当钩子执行的时候会被触发。这里可以获取到钩子的参数。

**tap**: (tap: Tap) => void 添加 tap 到监听器，当插件注册到钩子的时候会被触发。参数是 Tap 对象，这个对象可以被改变。

**loop**: (...args) => void 添加 loop 到监听器，会在每个 looping 钩子循环的时候被触发。

**register**: (tap: Tap) => Tap | undefined 添加 register 到监听器，每当注册新的方法的时候会被触发，还可以修改它。


### Context

插件和监听器可以选择性的接受一个 context（上下文）对象，这个对象可以用来传递任意的值给接下来的插件和监听器。

```javascript
myCar.hooks.accelerate.intercept({
  context: true,
  tap: (context, tapInfo) => {
    // tapInfo = { type: "sync", name: "NoisePlugin", fn: ... }
    console.log(`${tapInfo.name} is doing it's job`);

    // `context` starts as an empty object if at least one plugin uses `context: true`.
    // If no plugins use `context: true`, then `context` is undefined.
    if (context) {
      // Arbitrary properties can be added to `context`, which plugins can then access.
      context.hasMuffler = true;
    }
  }
});

myCar.hooks.accelerate.tap({
  name: "NoisePlugin",
  context: true
}, (context, newSpeed) => {
  if (context && context.hasMuffler) {
    console.log("Silence...");
  } else {
    console.log("Vroom!");
  }
});
```

### HookMap

HookMap 是一个辅助类，以 Map（es6的一种新数据结构，[文档](http://caibaojian.com/es6/set-map.html)）的方式保存所有的钩子。

```javascript
const keyedHook = new HookMap(key => new SyncHook(["arg"]))
```

```javascript
keyedHook.for("some-key").tap("MyPlugin", (arg) => { /* ... */ });
keyedHook.for("some-key").tapAsync("MyPlugin", (arg, callback) => { /* ... */ });
keyedHook.for("some-key").tapPromise("MyPlugin", (arg) => { /* ... */ });
```

```javascript
const hook = keyedHook.get("some-key");
if(hook !== undefined) {
  hook.callAsync("arg", err => { /* ... */ });
}
```

### Hook/HookMap interface

Public:

```javascript
interface Hook {
  tap: (name: string | Tap, fn: (context?, ...args) => Result) => void,
  tapAsync: (name: string | Tap, fn: (context?, ...args, callback: (err, result: Result) => void) => void) => void,
  tapPromise: (name: string | Tap, fn: (context?, ...args) => Promise<Result>) => void,
  intercept: (interceptor: HookInterceptor) => void
}

interface HookInterceptor {
  call: (context?, ...args) => void,
  loop: (context?, ...args) => void,
  tap: (context?, tap: Tap) => void,
  register: (tap: Tap) => Tap,
  context: boolean
}

interface HookMap {
  for: (key: any) => Hook,
  intercept: (interceptor: HookMapInterceptor) => void
}

interface HookMapInterceptor {
  factory: (key: any, hook: Hook) => Hook
}

interface Tap {
  name: string,
  type: string
  fn: Function,
  stage: number,
  context: boolean,
  before?: string | Array
}
```

Protected (只用拥有这类钩子的类可以使用):
```javascript
interface Hook {
  isUsed: () => boolean,
  call: (...args) => Result,
  promise: (...args) => Promise<Result>,
  callAsync: (...args, callback: (err, result: Result) => void) => void,
}

interface HookMap {
  get: (key: any) => Hook | undefined,
  for: (key: any) => Hook
}
```
### MultiHook

一个类似 Hook 的类，用来重定向 taps 到其他的钩子。

```javascript
const { MultiHook } = require("tapable");

this.hooks.allHooks = new MultiHook([this.hooks.hookA, this.hooks.hookB]);
```

## 二、深化用法和意义

以上就是 [webpack/tapable tapable-1分支](https://github.com/webpack/tapable/tree/tapable-1)的文档说明，下面将通过几个小例子，进一步来说明 tapable 的钩子的用法；

### 钩子基础用法

不讨论 context 和 Interception 的话，添加钩子分为两部：

- 1. 在一个类上添加钩子属性（最佳实践是，把所有的钩子属性放到对象 hooks 属性中），这个钩子有一个可选的数组类型的参数，这表示后续所有添加在这个钩子上的事件（或者说插件），都会接受这个参数列表个数的参数，具体参数的值，是通过事件（插件）的触发时指明，这里没有指定参数，如：
```javascript
class SomeObj {
  constructor() {
    this.hooks = {
      someHooks: new SyncHook(),
    }
  }

  doSome() {
    this.hooks.someHooks.call();
  }
} 
```

- 2. 在实例化的对象上，添加不同的插件到对应的钩子上（三种添加方式：tap,tapAsync, tapPromise，不同钩子有所限制），如：

```javascript
const instanceObj = new SomeObj();
instanceObj.someHooks.tap("plugin1", () => {
  console.log('在instaneObj 的 someHooks 上添加了一个插件');
})
```
- 3. 实例在执行一个方法的时候，触发钩子，会调用这个钩子上的所有插件执行。

```javascript
// 同时 plugin1 会执行
instanceObj.doSome();
```

### 最简单的钩子——SyncHook

SyncHook 应该算是所有钩子中最简单的一种了：同步的，按顺序连续执行，没有返回值；

看下面代码：

```javascript
const { SyncHook } = require("tapable");
class Car {
  constructor() {
    this.hooks = {
      accelerate: new SyncHook(["newSpeed"])
    };
  }
  setSpeed(newSpeed) {
    /*
    (function anonymous(newSpeed) {
        "use strict";
        var _context;
        var _x = this._x;
        var _fn0 = _x[0];
        _fn0(newSpeed);
        var _fn1 = _x[1];
        _fn1(newSpeed);
      })
    */
    this.hooks.accelerate.call(newSpeed);
  }
}

const myCar = new Car();

myCar.hooks.accelerate.tap("Plugin1", newSpeed =>
  console.log(`Accelerating to ` + newSpeed)
);
myCar.hooks.accelerate.tap("Plugin2", newSpeed =>
  console.warn('speed too fast')
);
myCar.setSpeed(100);
```

首先声明了一个 Car 的类，Car 的类中有 setSpeed 方法，同时添加一个类型为 SyncHook 的 accelerate 钩子，这个例子，就是 accelerate 上添加的所有事件，都会接受一个参数——newSpeed。

然后实例化一个对象 —— myCar，在 myCar 的 accelerate 钩子上添加了两个事件：Plugin1 和 Plugin2，两个插件的事件都会接受一个 newSpeed参数。

调用 myCar 上的 setSpeed 方法，setSpeed 方法内通过 **this.hooks.accelerate.call(newSpeed)** 触发钩子函数，Plugin1 和 Plugin2 方法会依次执行。

**注意** ：这里的 call 并不是 ES6 的 call 的用法了，所有的钩子都继承了 **Hook** 这个类，在这个类里，重新定义了 call 属性的含义，也就是每个钩子的 call 都会执行 Hook 上的 call 函数，截取了部分关键代码：

```javascript
class Hook {
  constructor(args) {
    // ...
    this.call = this._call;
    // ...
  }
    // ...
}

Object.defineProperties(Hook.prototype, {
  _call: {
    value: createCompileDelegate("call", "sync"),
    configurable: true,
    writable: true
  }
});
```

在 this.hooks.accelerate.call(newSpeed) 的时候，如何触发钩子上面的所有方法呢？ 答案是通过构造函数 —— new Function()，在执行 call 后首先根据不同的钩子类型，生成不同的代码，通过代码构造出一个方法，来执行钩子上的所有插件的方法，在这个例子中，通过 debug，发现构造出的函数如下：

```javascript
function anonymous(newSpeed) {
  "use strict";
  var _context;
  var _x = this._x;
  var _fn0 = _x[0];
  _fn0(newSpeed);
  var _fn1 = _x[1];
  _fn1(newSpeed);
}
```

这里的 this 指向 this.hooks.accelerate，this._x 就是所有的插件的方法组成的数组，看到例子中有两个插件，生成的方法中，两个插件也依次执行了，并在执行时传入了钩子初始化时指定的参数 —— newSpeed；

这样就达到了前面提到的目标 —— 触发钩子上的所有插件的事件。

不同的钩子，执行的逻辑大同小异，就是构造出的执行插件方法的函数有所区别而已。

### 结语

webpack 也正是利用这个基础模块所提供的丰富的钩子函数实现其插件功能，有了插件功能，webpack 就变得非常具有可扩展性和定制性。 
