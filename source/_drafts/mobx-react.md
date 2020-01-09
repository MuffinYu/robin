---
tags: [11月的]
title: mobx-react
created: '2019-11-20T07:42:38.073Z'
modified: '2019-11-20T07:44:36.632Z'
---

# mobx-react
### observable 实现 class 组件监听核心 实现核心

```javascript
import { Component } from 'react';
import { createAtom, _allowStateChanges, Reaction, $mobx } from "mobx";

function makeComponentReactive(render) {
  let isRenderingPending = false;
  const baseRender = render.bind(this);
  let initialName = "test";
  const reaction = new Reaction(`${initialName}.render()`, () => {
    if (!isRenderingPending) {
      isRenderingPending = true;
      let hasError = true;
      try {
        Component.prototype.forceUpdate.call(this);
        hasError = false;
      } finally {
        if (hasError) reaction.dispose();
      }
    }
  });

  function reactiveRender() {
    isRenderingPending = false;
    let exception = undefined;
    let rendering = undefined;
    reaction.track(() => {
      try {
        rendering = _allowStateChanges(false, baseRender);
      } catch (e) {
        exception = e;
      }
    });
    if (exception) {
      throw exception;
    }
    return rendering;
  }
  this.render = reactiveRender;
  return reactiveRender.call(this);
}

function makeClassComponentObserver(com) {
  const target = com.prototype;
  console.log("makeClassComponentObserver");
  console.log(target);
  
  const baseRender = target.render;
  target.render = function() {
    return makeComponentReactive.call(this, baseRender);
  };
  return com;
}

export default makeClassComponentObserver;
```
