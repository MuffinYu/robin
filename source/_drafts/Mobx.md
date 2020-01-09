---
tags: [11月的]
title: Mobx
created: '2019-11-17T01:38:13.891Z'
modified: '2019-11-18T05:46:59.209Z'
---

# Mobx
## mobx-react 工作原理：

1. observe组件会用 reactiveRender 重写render方法，reactiveRender 中的 reaction.track 建立与 observable 值的联系；
2. observe组件第一次渲染的时候，会创建Reaction，组件的render处于当前这个Reaction的上下文中，并通过track建立render中用到的observable建立关系；

3. 当observable属性修改的时候，会触发onInvalidate方法，实际上就是组件的forceupdate,然后触发组件渲染，又回到了第一步

## 优化和最佳实践

1. 使用transaction进行高级渲染性能优化；
2. 延迟对象属性地解引用；
3. 不要吝啬使用@observer，observer对性能的影响可以忽略不计，借助于精确的依赖分析，mobx可以得出组件对@observable变量（应用状态）的依赖图谱，对使用@observer进行标记的组件，实现精准的 shouldComponentUpdate 函数，保证组件100%无浪费渲染。
4. 不要吝啬使用@action；action中封装了 transaction，对函数使用action修饰符后，无论函数中对 @observable 变量（应用状态）有多少次修改，都只会在函数执行完成后，触发一次对应的监听者；


### observable
1.  createObservable(v, arg2, arg3)
  - 第一个参数是 待监视对象，这个对象分为几种情况进行考虑：
    1. 对象， 如 {} , 判断方式 Object.getPrototypeOf(value) === Object.prototype || === null；
    2. 数组；Array.isArray
    3. ES6 的 Map，
    4. ES6 的 Set，

2. observable 上有对不同类型的监视对象的处理方法（这些方法定义在 observableFactories 对象上，再赋值到 observable 上）；asCreateObservableOptions 处理 createObservable 的第二个参数，返回值赋值给 o；

3. 如果 arg2 是未定义，返回默认的 defaultCreateObservableOptions； 
```javascript
 // o
var defaultCreateObservableOptions = {
    deep: true,
    name: undefined,
    defaultDecorator: undefined,
    proxy: true
};
```

4. getDefaultDecoratorFromObjectOptions(o)， deepDecorator = createDecoratorForEnhancer(deepEnhancer)；

5. var base = extendObservable({}, undefined, undefined, o)；asObservableObject();

6. var proxy = createDynamicObservableObject(base);

7. extendObservableObjectWithProperties(proxy, props, decorators, defaultDecorator)；

8. asObservableObject


ObservableObjectAdministration(), addHiddenProp(), startBatch()

new Proxy(base, objectProxyTraps)

defaultDecorator **decorator(target, key, descriptor, true)**
