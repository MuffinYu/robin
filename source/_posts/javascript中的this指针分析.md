---
title: javascript中的this指针分析
date: 2019-07-16 17:16:13
tags: javascript
---



### 前言
this 一直是js中容易让初学者产生疑惑的一个点，本文将试图从js的底层，通过以下三个问题，来分析以下关于this指针的指向问题：
- 为什么需要this
- 为什么函数执行时的this指针指向不同
- this指针的指向判断规则和优先级

<!-- more -->
### 为什么需要this

在js中，函数在执行的时候，首先会需要传入的参数，用于变量引用查找，此外还需要作用域链，用于查找除了参数以外的，在可访问的作用域中的变量引用的查找，这两者是很比较显而易见的要素，比较容易理解。除此之外，还有一个要素就是this，或者说函数执行上下文，为什么需要这个上下文呢？查看以下代码：


```js
function fun(this) {
  console.log(this.a);
}

var obj = {
  a: 'a in obj',
  fun: fun,
};

var obj2 = {
  a: 'a in obj2',
  fun: fun,
}
obj.fun(obj);

obj2.fun(obj2)
```

上述定义了一个方法fun，并将其引用为obj中的一个方法，在调用obj.fun(obj)时，为了能访问到obj中的其他属性或方法，不得不显示的设置一个参数————this，同样obj2在使用fun方法时，也需要这样的一个实参，是不是看起来有点冗余？如果能直接通过调用obj.fun()和obj2.fun()，函数内部有个形参指向调用对象，代码会不会显得更加简洁？

当然，这个理由可能无法说服你，就算每次调用对象的fun方法时传入一个实参，也没多大影响。然而在另一个场景中，确是不得不使用this。查看以下代码：

```js
function DOG(name) {
  this.name = name;
}

var myDog = new DOG('pony');

console.log(myDog.name) // pony
```

js中没有类的概念（ES6中添加的class关键字仅仅是一个语法糖），只有对象，在基于一个对象，实例化一个新对象的时候，除了继承原有的属性，如何通过引用新建实例对象，在新实例对象中添加新的属性呢？这时候this再次派上了用场，上述代码中，DOG在被new关键字调用，新建对象的时候，其中的this就会指向新建的对象，这样就可以在新对象中添加属性了。

this关键字使得js项目具有可扩展性，提高了代码的复用性，而且在实现多范式时发挥了重要作用。

### 为什么函数执行时的this指针指向不同及规则判断

函数执行时的this指针指向不同的主要原因是函数的调用方式不同，总结而言，函数可以有以下4中情形的调用方式：

- 情形一： 纯粹的函数调用
- 情形二： 作为对象方法的调用
- 情况三： 作为构造函数调用
- 情况四： apply或call调用
 
情形一和情形二应该是项目开发时最常见的调用方式了，如以下例子：

```js
var a = 'window a';
function fun() {
  console.log('foo', this.a);
}

// 例子一
// 情形一： 纯粹的函数调用
foo(); // this -> window(在严格模式下指向undefined), 输出的是window.a => 'window a'

var obj = {
  a: 'obj a',
  foo: foo 
};

// 例子二
// 情形二： 作为对象方法的调用
obj.foo();  // this指向函数最近的对象，即this -> obj，输出的是obj.a => 'obj a'

// 例子三
// 情形一： 纯粹的函数调用
var foo2 = obj.foo;

foo2(); //this -> window(在严格模式下指向undefined), 输出的是window.a => 'window a'
```

在例子三中，可能会使很多人疑惑，obj.foo被赋值给变量foo2，在js中对象类型的变量是按引传递的，函数作为一种对象，此时foo2变量得到的是foo函数的引用，因此当foo2执行的时候，执行环境是window，this指向的是windowm，和foo作为函数调用的情形并没有差异。

同时需要注意，即使foo函数定义在obj中，被赋值给foo2后，foo2得到的仍然是obj.foo对应函数的引用，this仍然指向window，如下面例子：

```js
var a = 'window a';

var obj = {
  a: 'obj a',
  foo: function () {
    console.log('foo', this.a);
  } 
}

var foo2 = obj.foo;

foo2(); //this -> window(在严格模式下指向undefined), 输出的是window.a => 'window a'
```

如果不想在对象内引用函数，而想把this绑定到某个对象上，js提供了两种方法：call和apply，它们的第一个参数是一个对象，会把这个对象绑定到this，函数执行时指定这个this，这种方式称为显示绑定，如下面列子：

```js
function foo(x, y) {
  console.log('foo', this.a);
}

var obj = {
  a: 'obj a',
}
// call 方式显示绑定
foo.call(obj, 1, 2); // this->obj,输出 'obj a'

// apply 方式显示绑定
foo.apply(obj, [1, 2]); // this->obj,输出 'obj a'
```
**注意：** <br/>

1. 如果第一个参数不是对象类型，会被转化成对象类型（也就是 new String(...)、new Boolean(...)或者new Number(...)），这通常被称为"装箱"。如果是null或者undefined，会指向window，严格模式下报错；

2. call的非第一个参数，作为参数传递个函数，apply的第二个参数是一个数组，会结构后传递给函数，这是两者之间的区别；

3. 还有一种改变this的方式是使用bind，bind不同于call和apply，不会立即执行函数，但函数执行时候this指针会改变；


最后一种是作为构造函数调用的时候，也称为new 绑定，在这种情况下，会自动执行下面操作：

1. 创建一个全新的对象；
2. 这个对象被执行[[__proto__]]连接；
3. 这个新对象会绑定到函数调用的this；
4. 如果函数没有返回其他对象，那么new 表达式中的函数调用会自动放回这个新对象；

这个过程的伪代码如下：

```js
var a = new myFunction("Li","Cherry");

new myFunction{
  var obj = {};
  obj.__proto__ = myFunction.prototype;
  var result = myFunction.call(obj, "Li", "Cherry");
  return typeof result === 'obj'? result : obj;
}

```

### 规则判断优先级

现在我们可以根据优先级来判断函数在某个调用位置应用的是哪条规则。可以按照下面的
顺序来进行判断：

1. 函数是否在new中调用(new绑定)?如果是的话thts绑定的是新创建的对象。
```js
var bar = new foo()
```
2. 函数是否通过call、 apply(显式绑定)或者硬绑定调用?如果是的话,this绑定的是指定的对象。
```js
var bar = foo.call(obj2)
```
3. 函数是否在某个上下文对象中调用(隐式绑定)?如果是的话,this绑定的是那个上下文对象。
```js
var bar = obj1.food()
```
4. 如果都不是的话,使用默认绑定。如果在严格模式下,就绑定到 undefined,否则绑定到全局对象。
```js
var bar = foo()
```

### 补充说明

#### bind实现方式
```js
if(!Function.prototype.bind) {
  Function.prototype.bind = function(oThis) {
    if (typeof this !== 'function') {
      throw new TypeError("Function.prototype.bind - what is trying to be bound is not callable");
    }
  var aArgs = Array.prototype.slice.call(arguments, 1),
    fToBind = this,
    fNOP = function() {},
    fBound = function() {
      return fToBind.apply(
        this instanceof fNOP && oThis ? this : oThis,
        aArgs.concat(Array.prototype.slice.call(arguments))
      );
    };
  fNOP.prototype = this.prototype;
  fBound.prototype = new fNOP();
  return fBound;
  }
}
```