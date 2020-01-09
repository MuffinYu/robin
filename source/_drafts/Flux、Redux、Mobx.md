---
tags: [11月的]
title: Flux、Redux、Mobx
created: '2019-11-17T06:19:14.373Z'
modified: '2019-11-17T06:52:37.347Z'
---

# Flux、Redux、Mobx

### Mobx 

1. MobX背后的哲学很简单：任何源自应用状态的东西都应该自动地获得。译成人话就是状态只要一变，其他用到状态的地方就都跟着自动变。
2. MobX 更接近于面向对象编程，它把 state 包装成可观察的对象，这个对象会驱动各种改变；

### 对比 Mobx 和 Redux

1. Redux 数据流流动很自然，可以充分利用时间回溯的特征，增强业务的可预测性；MobX 没有那么自然的数据流动，也没有时间回溯的能力，但是 View 更新很精确，粒度控制很细。
2. Redux 通过引入一些中间件来处理副作用；MobX 没有中间件，副作用的处理比较自由，比如依靠 autorunAsync 之类的方法。
3. Redux 的样板代码更多，看起来就像是我们要做顿饭，需要先买个调料盒装调料，再买个架子放刀叉。。。做一大堆准备工作，然后才开始炒菜；而 MobX 基本没啥多余代码，直接硬来，拿着炊具调料就开干，搞出来为止。




## Redux
### Redux 流程：

1. 用户通过 View 发出 Action，Action 必须有一个 type 属性，代表 Action 的名称，其他可以设置一堆属性，作为参数供 State 变更时参考：
```javascript
const aciton = {
  type: 'ADD_TODO',
  payload: 'Learn Redux'
};
store.dispatch(action);
```
2. 然后 Store 自动调用 Reducer，并且传入两个参数：当前 State 和收到的 Action。 Reducer 会返回新的 State 。
```javascript
let nextState = xxxReducer(previousState, action);
```

3. State 一旦有变化，Store 就会调用监听函数，比如 React 的 setState 和 render 方法；
```javascript
store.subscribe(listener);
```

4. listener可以通过 store.getState() 得到当前状态。如果使用的是 React，这时可以触发重新渲染 View。
```javascript
function listerner() {
  let newState = store.getState();
  component.setState(newState);   
}
```

### 对比 Flux

1. 和 Flux 比较一下：Flux 中 Store 是各自为战的，每个 Store 只对对应的 View 负责，每次更新都只通知对应的View：
2. Redux 中各子 Reducer 都是由根 Reducer 统一管理的，每个子 Reducer 的变化都要经过根 Reducer 的整合：

简单来说，Redux有三大原则： Redux 单一数据源，Flux 的数据源可以是多个。 
State 是只读的：Flux 的 State 可以随便改。
Redux 使用纯函数来执行修改：Flux 执行修改的不一定是纯函数。

### 参考资料

https://zhuanlan.zhihu.com/p/53599723



