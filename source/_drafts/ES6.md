---
tags: [11月的]
title: ES6
created: '2019-10-31T06:22:37.467Z'
modified: '2019-12-31T09:27:15.364Z'
---

# ES6


ES6

<!-- more -->

### call、apply 和 bind

1. call 的实现

```javascript
Function.prototype.myCall = function(context) {
  if (typeof this !== 'function') {
    throw new TypeError('Error')
  }
  context = context || window;
  context.fn = this;
  var result;
  var args = [];
  for(var i = 1, len = arguments.length; i < len; i++) {
    args.push('arguments[' + i + ']');
  }

  var result = eval('context.fn(' + args +')');
  delete context.fn;
  return result;
}
```

2. apply 的实现

```javascript
Function.prototype.myApply = function(context) {
  if (typeof this !== 'function') {
    throw new TypeError('Error')
  }
  context = context || window;
  context.fn = this;
  var result;
  if (arguments[1]) {
    result = context.fn(...arguments[1]);
  } else {
    result = context.fn();
  }
  delete context.fn;
  return result;
}

```
3. bind 特点：
  - 函数调用，改变this ；
  - 返回一个绑定this的函数；
  - 接收多个参数 ；
  - 支持柯里化形式传参 ，如 fn(1)(2)；

实现 bind 时注意以下要点：
- 箭头函数的 **this** 永远指向它所在的作用域；
- 函数作为构造函数用 **new** 关键字调用时，不应该改变其 **this** 指向，因为 **new绑定** 的优先级高于 **显示绑定** 和 **硬绑定**；

[MDN bind Polyfill](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Function/bind)

```javascript
// bind 

if(!Function.prototype.bind) {
  Function.prototype.bind = function(oThis) {
    // 待绑定对象 不是函数，抛出错误
    if (typeof this !== 'function') {
      throw new TypeError("Function.prototype.bind - what is trying to be bound is not callable");
    }
    // 获取 绑定对象后的参数
    var aArgs = Array.prototype.slice.call(arguments, 1),
    // 待绑定对象 即待绑定函数
      fToBind = this,

      fNOP = function() {},
      // 返回一个函数
      fBound = function() {
        //同样因为支持柯里化形式传参我们需要再次获取存储参数
        var newArgs = Array.prototype.slice.call(arguments);
         // 执行时的this指针时函数，指向原this;
         // 否则指向新this对象
         // this instanceof fNOP === true时,说明返回的fBound被当做new的构造函数调用 
        return fToBind.apply(
          this instanceof fNOP ? this : oThis,
          aArgs.concat(newArgs)
        );
      };
     // 维护原型关系
     // 箭头函数没有 prototype，箭头函数this永远指向它所在的作用域
    if (this.prototype) {
      // 当执行Function.prototype.bind()时, this为Function.prototype 
      // this.prototype(即Function.prototype.prototype)为undefined
      fNOP.prototype = this.prototype; 
    }
    // 下行的代码使fBound.prototype是fNOP的实例,因此
    // 返回的fBound若作为new的构造函数,new生成的新对象作为this传入fBound,新对象的__proto__就是fNOP的实例
    fBound.prototype = new fNOP();
    return fBound;
  }
}
```
### Set、WeakSet、Map、WeakMap

1. Set
- 成员不能重复
- 只有健值，没有健名，有点类似数组。
- 可以遍历，方法有add, delete, has
- 有 size、clear 方法

2. WeakSet
和 Set 类似，是不重复的值的集合，但有两个区别：
- 成员都是对象
- 成员都是弱引用，随时可以消失。 

弱引用，如果其他对象都不再引用该对象，gc直接回收， 因此不能遍历，方法有add, delete,has

WeakSet的一个用处，是储存DOM节点，而不用担心这些节点从文档移除时，会引发内存泄漏

3. Map
- 本质上是健值对的集合，类似集合，但是“键”的范围不限于字符串，各种类型的值（包括对象）都可以当作键。
- 可以遍历，方法很多，可以跟各种数据格式转换
- 有 size()、set(key, value)、get(key)、has(key)、delete(key)、clear()
- 遍历方式： keys()、values()、entries()、forEach()

4. WeakMap
- 直接受对象作为健名（null除外），不接受其他类型的值作为健名
健名所指向的对象，不计入垃圾回收机制
不能遍历，方法同get,set,has,delete

### new 关键字

#### 1. new 的作用

```javascript
// 实现一个new
var Dog = function(name) {
  this.name = name
}
Dog.prototype.bark = function() {
  console.log('wangwang')
}
Dog.prototype.sayName = function() {
  console.log('my name is ' + this.name)
}
let sanmao = new Dog('三毛')
sanmao.sayName();
sanmao.bark();
```

- 创建一个新对象obj；
- 把 obj 的 _\_proto__ 指向 Dog.prototype 实现继承；
- 执行构造函数，传递参数，改变this指向 ：Dog.call(obj, ...args)；
- 若 Dog 函数的返回值是对象，则返回该对象，否则返回 obj；
- 最后把 obj 赋值给sanmao；

#### 2. 实现
```javascript
function _new(fn, ...arg) {
    const obj = Object.create(fn.prototype);
    const ret = fn.apply(obj, arg);
    return ret instanceof Object ? ret : obj;
}
```

### Promise

```javascript
// 判断变量否为function
const isFunction = variable => typeof variable === 'function'
// 定义Promise的三种状态常量
const PENDING = 'PENDING'
const FULFILLED = 'FULFILLED'
const REJECTED = 'REJECTED'

class MyPromise {
  constructor (handle) {
    if (!isFunction(handle)) {
      throw new Error('MyPromise must accept a function as a parameter')
    }
    // 添加状态
    this._status = PENDING
    // 添加状态
    this._value = undefined
    // 添加成功回调函数队列
    this._fulfilledQueues = []
    // 添加失败回调函数队列
    this._rejectedQueues = []
    // 执行handle
    try {
      handle(this._resolve.bind(this), this._reject.bind(this)) 
    } catch (err) {
      this._reject(err)
    }
  }
  // 添加resovle时执行的函数
  _resolve (val) {
    const run = () => {
      if (this._status !== PENDING) return
      // 依次执行成功队列中的函数，并清空队列
      const runFulfilled = (value) => {
        let cb;
        while (cb = this._fulfilledQueues.shift()) {
          cb(value)
        }
      }
      // 依次执行失败队列中的函数，并清空队列
      const runRejected = (error) => {
        let cb;
        while (cb = this._rejectedQueues.shift()) {
          cb(error)
        }
      }
      /* 如果resolve的参数为Promise对象，则必须等待该Promise对象状态改变后,
        当前Promsie的状态才会改变，且状态取决于参数Promsie对象的状态
      */
      if (val instanceof MyPromise) {
        val.then(value => {
          this._value = value
          this._status = FULFILLED
          runFulfilled(value)
        }, err => {
          this._value = err
          this._status = REJECTED
          runRejected(err)
        })
      } else {
        this._value = val
        this._status = FULFILLED
        runFulfilled(val)
      }
    }
    // 为了支持同步的Promise，这里采用异步调用
    setTimeout(run, 0)
  }
  // 添加reject时执行的函数
  _reject (err) { 
    if (this._status !== PENDING) return
    // 依次执行失败队列中的函数，并清空队列
    const run = () => {
      this._status = REJECTED
      this._value = err
      let cb;
      while (cb = this._rejectedQueues.shift()) {
        cb(err)
      }
    }
    // 为了支持同步的Promise，这里采用异步调用
    setTimeout(run, 0)
  }
  // 添加then方法
  then (onFulfilled, onRejected) {
    const { _value, _status } = this
    // 返回一个新的Promise对象
    return new MyPromise((onFulfilledNext, onRejectedNext) => {
      // 封装一个成功时执行的函数
      let fulfilled = value => {
        try {
          if (!isFunction(onFulfilled)) {
            onFulfilledNext(value)
          } else {
            let res =  onFulfilled(value);
            if (res instanceof MyPromise) {
              // 如果当前回调函数返回MyPromise对象，必须等待其状态改变后在执行下一个回调
              res.then(onFulfilledNext, onRejectedNext)
            } else {
              //否则会将返回结果直接作为参数，传入下一个then的回调函数，并立即执行下一个then的回调函数
              onFulfilledNext(res)
            }
          }
        } catch (err) {
          // 如果函数执行出错，新的Promise对象的状态为失败
          onRejectedNext(err)
        }
      }
      // 封装一个失败时执行的函数
      let rejected = error => {
        try {
          if (!isFunction(onRejected)) {
            onRejectedNext(error)
          } else {
              let res = onRejected(error);
              if (res instanceof MyPromise) {
                // 如果当前回调函数返回MyPromise对象，必须等待其状态改变后在执行下一个回调
                res.then(onFulfilledNext, onRejectedNext)
              } else {
                //否则会将返回结果直接作为参数，传入下一个then的回调函数，并立即执行下一个then的回调函数
                onFulfilledNext(res)
              }
          }
        } catch (err) {
          // 如果函数执行出错，新的Promise对象的状态为失败
          onRejectedNext(err)
        }
      }
      switch (_status) {
        // 当状态为pending时，将then方法回调函数加入执行队列等待执行
        case PENDING:
          this._fulfilledQueues.push(fulfilled)
          this._rejectedQueues.push(rejected)
          break
        // 当状态已经改变时，立即执行对应的回调函数
        case FULFILLED:
          fulfilled(_value)
          break
        case REJECTED:
          rejected(_value)
          break
      }
    })
  }
  // 添加catch方法
  catch (onRejected) {
    return this.then(undefined, onRejected)
  }
  // 添加静态resolve方法
  static resolve (value) {
    // 如果参数是MyPromise实例，直接返回这个实例
    if (value instanceof MyPromise) return value
    return new MyPromise(resolve => resolve(value))
  }
  // 添加静态reject方法
  static reject (value) {
    return new MyPromise((resolve ,reject) => reject(value))
  }
  // 添加静态all方法
  static all (list) {
    return new MyPromise((resolve, reject) => {
      /**
       * 返回值的集合
       */
      let values = []
      let count = 0
      for (let [i, p] of list.entries()) {
        // 数组参数如果不是MyPromise实例，先调用MyPromise.resolve
        this.resolve(p).then(res => {
          values[i] = res
          count++
          // 所有状态都变成fulfilled时返回的MyPromise状态就变成fulfilled
          if (count === list.length) resolve(values)
        }, err => {
          // 有一个被rejected时返回的MyPromise状态就变成rejected
          reject(err)
        })
      }
    })
  }
  // 添加静态race方法
  static race (list) {
    return new MyPromise((resolve, reject) => {
      for (let p of list) {
        // 只要有一个实例率先改变状态，新的MyPromise的状态就跟着改变
        this.resolve(p).then(res => {
          resolve(res)
        }, err => {
          reject(err)
        })
      }
    })
  }
  finally (cb) {
    return this.then(
      value  => MyPromise.resolve(cb()).then(() => value),
      reason => MyPromise.resolve(cb()).then(() => { throw reason })
    );
  }
}

```

### prototype、_\_proto__

当谈到继承时，JavaScript 只有一种结构：对象。每个实例对象（ object ）都有一个私有属性（称之为 **_\_proto__** ）指向它的构造函数的原型对象（ **prototype** ）。该原型对象也有一个自己的原型对象( **_\_proto__** ) ，层层向上直到一个对象的原型对象为 null。根据定义，null 没有原型，并作为这个**原型链**中的最后一个环节。

在 JavaScript 中，函数（function）是允许拥有属性的。所有的函数会有一个特别的属性 —— **prototype** 。

```javascript
function doSomething(){}
console.log( doSomething.prototype );
// 和声明函数的方式无关，
// JavaScript 中的函数永远有一个默认原型属性。
var doSomething = function(){};
console.log( doSomething.prototype );
```
