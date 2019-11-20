---
title: JS工具函数
date: 2019-10-31 11:11:51
tags:
---

节流、防抖等原理和实现
<!-- more -->

### 防抖

#### 1. 原理

- 触发高频事件后 n 秒内函数只会执行一次；

- 如果 n 秒内高频事件再次被触发，则取消之前的延时调用方法， 重新计算时间
 
#### 2. 实现

- 设定延迟，延迟 n 秒执行，执行最后一次调用；

- 延迟期间有调用，取消延迟，并重新设定延迟 n 秒执行； 

```javascript
function debounce(fn) {
  // 创建一个标记用来存放定时器的返回值
  let timeout = null;
    return function () {
      if(timeout) {
         // 每当用户输入的时候把前一个 setTimeout clear 掉
        clearTimeout(timeout);
        timeout = null;
      }
      timeout = setTimeout(() => { // 然后又创建一个新的 setTimeout, 这样就能保证输入字符后的 interval 间隔内如果还有字符输入的话，就不会执行 fn 函数
        fn.apply(this, arguments);
      }, 500);
    };
  }

  // 需要防抖的函数例子
  function sayHi() {
    console.log('防抖成功');
  }
  // 使用方式
  var inp = document.getElementById('inp');
  inp.addEventListener('input', debounce(sayHi)); // 防抖
```

### 节流

#### 1. 原理

 - 高频事件触发，但在 n 秒内只会执行一次，所以节流会稀释函数的执行频率；

 - 每次触发事件时都判断当前是否有等待执行的延时函数

#### 2. 实现

- 调用后，立即执行一次；

- n 秒内再次调用不执行，但执行最后一次的调用；

```javascript

function throttle(fn, wait = 500) {
  let lastCall = 0; // 上次执行时间
  let timer = null;
  return function() {
    let now = Date.now();
    if (timer) { // 取消倒计时任务
      clearTimeout(timer);
      timer = null;
    }
    if (now - lastCall < wait) { // wait 内再次调用
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

// expect：
// x ms 1
// x ms 1111
// x ms 2
// x + 1000 ms 3
// x + 2000 ms 4
// x + 5000 ms 4444

```

### 浅拷贝

```javascript
function shallowCopy(src) {
  var dst = {};
  for (var prop in src) {
      if (src.hasOwnProperty(prop)) {
          dst[prop] = src[prop];
      }
  }
  return dst;
}
```
### 深拷贝
#### 1. JSON.parse(JSON.stringify())

  这种方法虽然可以实现数组或对象深拷贝,但不能处理函数，同时有以下问题：

  - 在数组中
    - 存在 undefined/Symbol/Function 数据类型时会变为 null；
    - 存在 Infinity/NaN 也会变成 null；
  - 在对象中
    - 属性值为 undefined/Symbol/Function 数据类型时，属性和值都不会转为字符串；
    - 属性值为 Infinity/NaN ，属性值会变为 null；
  - 日期数据类型的值会调用 toISOString
  - 非数组/对象/函数/日期的复杂数据类型会变成一个空对象
  - 循环引用会抛出错误

#### 2. 手写递归方法
  递归方法实现深度克隆原理： 遍历对象、数组直到里边都是基本数据类型，然后再去复制，就是深度拷贝

```javascript
//定义检测数据类型的功能函数
function checkedType(target) {
  return Object.prototype.toString.call(target).slice(8, -1)
}
//实现深度克隆---对象/数组
function clone(target) {
  //判断拷贝的数据类型
  //初始化变量result 成为最终克隆的数据
  let result, targetType = checkedType(target)
  if (targetType === 'Object') {
    result = {}
  } else if (targetType === 'Array') {
    result = []
  } else {
    return target
  }
  //遍历目标数据
  for (let key in target) {
    //获取遍历数据结构的每一项值。
    let value = target[key]
    //判断目标结构里的每一值是否存在对象/数组
    if (checkedType(value) === 'Object' ||
      checkedType(value) === 'Array') { //对象/数组里嵌套了对象/数组
      //继续遍历获取到value值
      result[key] = clone(value)
    } else { //获取到value值是基本的数据类型或者是函数。
      result[key] = value;
    }
  }
  return result
}
```

### 函数柯里化
#### 1. 一般柯里化

```javascript
function curry(fn) {
  // fn.length 获取的是 fn 参数的个数 
  if (fn.length <= 1) return fn;
  function generator(...args) {
    if (fn.length === args.length) {
      // 参数个数达到了 fn 要求个数，执行 fn
      return fn(...args);
    } else {
      // 未传完，递归执行 generator 并将此次参数合并传给下次 generator
      return (...args2) => {
        return generator(...args, ...args2);
      }
    }
  }
  return generator;
}

// test 
let add = (a, b, c, d) => a + b + c + d;
const curriedAdd = curry(add);
curriedAdd(6)(5)(7)(8);
```

#### 2. 支持占位符
```javascript
function curry(fn, placeholder = "_") {
  curry.placeholder = placeholder;
  if (fn.length <= 1) return fn;
  let argList = [];
  function generator(...args) {
    // 记录了非当前轮最近的一个占位符下标，防止当前轮元素覆盖了当前轮的占位符
    let currentPlaceholderIndex = -1; 
    args.forEach(arg => {
      let placeholderIndex = argList.findIndex(
        item => item === curry.placeholder
      );
      if (placeholderIndex < 0) {
        // 如果数组中没有占位符， 直接往数组末尾放入一个元素
        currentPlaceholderIndex = argList.push(arg) - 1;
        // 防止将元素填充到当前轮参数的占位符
        // （1, "_"）('_', 2) 数字 2 应该填充 1 后面的占位符，不能是 2 前面的占位符
      } else if (placeholderIndex !== currentPlaceholderIndex) {
        argList[placeholderIndex] = arg;
      } else {
        // 当前元素是占位符的情况
        argList.push(arg);
      }
    });
    // 过滤出不含占位符的数组
    let realArgsList = argList.filter(arg => arg !== curry.placeholder);
    if (realArgsList.length === fn.length) {
      return fn(...argList);
    } else if (realArgsList.length > fn.length) {
      throw new Error('超出初始函数参数的最大值')
    } else {
      return generator;
    }
  }
  return generator;
}

// test 
let add2 = (a, b, c, d) => a + b + c + d;
const curriedAdd = curry(add2);
curriedAdd("_", 6)(5, "_")(7)(8);
```
### 双向数据绑定

#### 1. `defineProperty` 版本：
```javascript
// 数据
const data = {
  text: 'default'
};
const input = document.getElementById('input');
const span = document.getElementById('span');
// 数据劫持
Object.defineProperty(data, 'text', {
  // 数据变化 --> 修改视图
  set(newVal) {
    input.value = newVal;
    span.innerHTML = newVal;
  }
});
// 视图更改 --> 数据变化
input.addEventListener('keyup', function(e) {
  data.text = e.target.value;
});
```

#### 2. `Proxy` 版本：

```javascript
// 数据
const data = {
  text: 'default'
};
const input = document.getElementById('input');
const span = document.getElementById('span');
// 数据劫持
const handler = {
  set(target, key, value) {
    target[key] = value;
    // 数据变化 --> 修改视图
    input.value = value;
    span.innerHTML = value;
    return value;
  }
};
const proxy = new Proxy(data);

// 视图更改 --> 数据变化
input.addEventListener('keyup', function(e) {
  proxy.text = e.target.value;
});
```

### 图片懒加载

```javascript
const imgList = [...document.querySelectorAll("img")];
const num = imgList.length;

const lazyLoad = (function() {
  let count = 0;
  return function() {
    let deleteIndexList = [];
    imgList.forEach((img, index) => {
      let rect = img.getBoundingClientRect();
      if (rect.top < window.innerHeight) {
        img.src = img.dataset.src;
        deleteIndexList.push(index);
        count++;
      }
      if (count === num) {
        // 图片都加载完成后，删除滚动监听事件
        document.removeEventListener("scroll", lazyLoad);
      }
    });
    imgList = imgList.filter((_, index) => !deleteIndexList.includes(index));
  };
})();

document.addEventListener('scroll', lazyLoad);
```

### 深度优先和广度优先遍历

```html
<div class="root">
  <div class="container">
    <section class="sidebar">
      <ul class="menu"></ul>
    </section>
    <section class="main">
      <article class="post"></article>
      <p class="copyright"></p>
    </section>
  </div>
</div>
```

对这颗 DOM 树，期望给出广度优先遍历（BFS）的代码实现，遍历到每个节点时，打印出当前节点的类型及类名，例如上面的树广度优先遍历结果为：

```
div .root
  div .container
    section .sidebar
    section .main
      ul .menu
      article .post
      p .copyright
```
#### 广度优先

**概念：** 从图中某顶点v出发，在访问了v之后，依次访问v的各个未曾访问过的邻接点，然后分别从这些邻接点出发依次访问它们的邻接点，并使得“先被访问的顶点的邻接点先于后被访问的顶点的邻接点被访问，直至图中所有已被访问的顶点的邻接点都被访问到；

广度优先则需要使用队列这种数据结构来管理待遍历的节点，实现如下：

```javascript
const printInfo = (node) => {
  console.log(node.tagName, `.${node.className}`);
};

const BFStraverse = (ndRoot) => {
  const queue = [ndRoot];
  while (queue.length) {
    const node = queue.shift();
    printInfo(node);
    if (!node.children.length) {
      continue;
    }
    Array.from(node.children).forEach(x => queue.push(x));
  }
};

BFStraverse(document.querySelector('.root'));
```
#### 深度优先
**概念：** 从某个顶点v出发，首先访问该顶点，然后依次从它的各个未被访问的邻接点出发深度优先搜索遍历图，直至图中所有和v有路径相通的顶点都被访问到。

深度优先直接使用迭代方式遍历节点，实现如下：

```javascript
const printInfo = (node) => {
  console.log(node.tagName, `.${node.className}`);
};

const DFStraverse = (ndRoot) => {
  if (!ndRoot) return;
  printInfo(ndRoot);
  if(ndRoot.children.length > 0) {
    Array.from(ndRoot.children).forEach(DFStraverse);
  }
}
```
