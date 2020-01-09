---
tags: [11月的]
title: React
created: '2019-10-31T02:34:13.808Z'
modified: '2019-11-17T05:58:23.419Z'
---

# React 
1. key 相关；

https://reactjs.org/docs/lists-and-keys.html#keys
https://medium.com/@robinpokorny/index-as-a-key-is-an-anti-pattern-e0349aece318
https://reactjs.org/docs/reconciliation.html#recursing-on-children



### 事件循环

1. 关于微任务和宏任务在浏览器的执行顺序是这样的：

执行一只task（宏任务）
执行完micro-task队列 （微任务）
如此循环往复下去


常见的 task（宏任务） 比如：setTimeout、setInterval、script（整体代码）、 I/O 操作、UI 渲染等。
常见的 micro-task 比如: new Promise().then(回调)、MutationObserver(html5新特性) 等。


### 相关 api

1. React.memo
  - 类似于 React.PureComponent，用于函数式组建，相同的 props 渲染相同的内容
  - 浅对比；shallowly compare complex objects in the props object；
  - 第二个参数可以接受对比函数，自定义对比结果，返回布尔值，true表示重新选择，false表示使用之前的渲染结果

2. 
