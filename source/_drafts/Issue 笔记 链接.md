---
tags: [11月的]
title: Issue 笔记 链接
created: '2019-11-07T02:12:52.146Z'
modified: '2019-12-03T05:45:08.489Z'
---

# Issue 笔记 [链接](https://github.com/Advanced-Frontend/Daily-Interview-Question/issues?page=4&q=is%3Aissue+is%3Aopen)

### 1. [写 React / Vue 项目时为什么要在列表组件中写 key，其作用是什么?](https://github.com/Advanced-Frontend/Daily-Interview-Question/issues/1)

**key是给每一个vnode的唯一id,可以依靠key,更准确, 更快的拿到oldVnode中对应的vnode节点。**

1. 更准确
因为带key就不是就地复用了，在sameNode函数 a.key === b.key对比中可以避免就地复用的情况。所以会更加准确。

2. 更快
利用key的唯一性生成map对象来获取对应节点，比遍历方式更快。(这个观点，就是我最初的那个观点。从这个角度看，map会比遍历更快。)

### 2. [第 4 题：介绍下 Set、Map、WeakSet 和 WeakMap 的区别？](https://github.com/Advanced-Frontend/Daily-Interview-Question/issues/6)

- Set     成员不能重复，           可以遍历
- WeakSet 成员不能重复，且只能是对象 不能遍历

- Map     键值可以为任意类型           可以遍历
- WeakMap 键值只能是对象              不能遍历

### 3. [常见异步笔试题](https://github.com/Advanced-Frontend/Daily-Interview-Question/issues/7)

**执行了流程： (macro)task->渲染->(macro)task->...**

3.1 宏任务 macro task
主要包含：script(整体代码)、setTimeout、setInterval、I/O、UI交互事件、postMessage、MessageChannel、setImmediate(Node.js 环境)；

3.2 微任务 micro task
主要包含：Promise.then、 MutaionObserver、 process.nextTick(Node.js 环境)

### 4.[简单讲解一下 http2 的多路复用 ](https://github.com/Advanced-Frontend/Daily-Interview-Question/issues/14)
HTTP/1 的问题：
 - 每次请求都会建立一次HTTP连接，也就是我们常说的3次握手4次挥手，这个过程在一次请求过程中占用了相当长的时间；
 - 队头阻塞问题，即使开启了 Keep-Alive，串行的文件传输，后面的请求只能等前一个返回后，才能发出。
 - 服务器连接数过多。
 
HTTP/2 多路复用解决上述的两个性能问题：
- 在 HTTP/2 中，有两个非常重要的概念，分别是帧（frame）和流（stream）。
- 帧代表着最小的数据单位，每个帧会标识出该帧属于哪个流，流也就是多个帧组成的数据流。
- 多路复用，就是在一个 TCP 连接中可以存在多条流。换句话说，也就是可以发送多个请求，对端可以通过帧中的标识知道属于哪个请求。通过这个技术，可以避免 HTTP 旧版本中的队头阻塞问题，极大的提高传输性能。

### 5. [React 中 setState 什么时候是同步的，什么时候是异步的？](https://github.com/Advanced-Frontend/Daily-Interview-Question/issues/17)

如果是由React引发的事件处理（比如通过onClick引发的事件处理， 生命周期函数），调用setState不会同步更新this.state；
除此之外的setState调用会同步执行this.state。所谓“除此之外”，指的是绕过React通过addEventListener直接添加的事件处理函数，还有通过setTimeout/setInterval产生的异步调用。

### 6. [介绍下重绘和回流（Repaint & Reflow），以及如何进行优化 ](https://github.com/Advanced-Frontend/Daily-Interview-Question/issues/24)

1. 浏览器渲染机制
- 浏览器采用流式布局模型（Flow Based Layout）
- 浏览器会把HTML解析成DOM，把CSS解析成CSSOM，DOM和CSSOM合并就产生了渲染树（Render Tree）。
- 有了RenderTree，我们就知道了所有节点的样式，然后计算他们在页面上的大小和位置，最后把节点绘制到页面上。
- 由于浏览器使用流式布局，对Render Tree的计算通常只需要遍历一次就可以完成，但table及其内部元素除外，他们可能需要多次计算，通常要花3倍于同等元素的时间，这也是为什么要避免使用table布局的原因之一。

2. 重绘
由于节点的几何属性发生改变或者由于样式发生改变而不会影响布局的，称为重绘；

3. 回流
回流是布局或者几何属性需要改变就称为回流；
**大部分的回流将导致页面的重新渲染。**
**回流必定会发生重绘，重绘不一定会引发回流。**

4. 减少回流和重绘

- CSS：  
    - 使用 transform 替代 top;
    - 使用 visibility 替换 display: none ，因为前者只会引起重绘，后者会引发回流（改变了布局);
    - 避免使用table布局，可能很小的一个小改动会造成整个 table 的重新布局;
    - 尽可能在DOM树的最末端改变class;
    - 避免设置多层内联样式，CSS 选择符从右往左匹配查找，避免节点层级过多;
    - 将动画效果应用到position属性为absolute或fixed的元素上，避免影响其他元素的布局，这样只是一个重绘，而不是回流；
    - 同时，控制动画速度可以选择 requestAnimationFrame；
    - 避免使用CSS表达式；
    - 将频繁重绘或者回流的节点设置为图层，图层能够阻止该节点的渲染行为影响别的节点，例如will-change、video、iframe等标签，浏览器会自动将该节点变为图层；
    - CSS3 硬件加速（GPU加速），使用css3硬件加速，可以让transform、opacity、filters这些动画不会引起回流重绘；

- JavaScript：
    - 避免频繁操作样式，最好一次性重写style属性，或者将样式列表定义为class并一次性更改class属性。
    - 避免频繁操作DOM，创建一个documentFragment，在它上面应用所有DOM操作，最后再把它添加到文档中。
    - 避免频繁读取会引发回流/重绘的属性，如果确实需要多次使用，就用一个变量缓存起来。
    - 对具有复杂动画的元素使用绝对定位，使它脱离文档流，否则会引起父元素及后续元素频繁回流。

### 7. [介绍下 BFC 及其应用](https://github.com/Advanced-Frontend/Daily-Interview-Question/issues/59)
- BFC 就是块级格式上下文（Block Formatting Context，BFC），是页面盒模型布局中的一种 CSS 渲染模式，相当于一个独立的容器，里面的元素和外部的元素相互不影响。创建 BFC 的方式有：
  - html 根元素；
  - float 浮动；
  - 绝对定位(position为absolute或者fixed)；
  - overflow 不为 visiable；
  - display 为表格布局或者弹性布局；

- BFC 主要的作用是：
    - 清除浮动；
    - 防止同一 BFC 容器中的相邻元素间的外边距重叠问题；

### 8. [怎么让一个 div 水平垂直居中](https://github.com/Advanced-Frontend/Daily-Interview-Question/issues/92)

```html
<div class="parent">
  <div class="child"></div>
</div>
```

1. flex 弹性布局
```css
div.parent {
    display: flex;
    justify-content: center;
    align-items: center;
}
```

2. 绝对定位 + margin 或者 transform 偏移
```css
div.parent {
    position: relative; 
}
div.child {
    position: absolute; 
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);  
}
/* 或者 */
div.child {
    width: 50px;
    height: 10px;
    position: absolute;
    top: 50%;
    left: 50%;
    margin-left: -25px;
    margin-top: -5px;
}
/* 或 */
div.child {
    width: 50px;
    height: 10px;
    position: absolute;
    left: 0;
    top: 0;
    right: 0;
    bottom: 0;
    margin: auto;
}
```

3.  grid 布局
```css
div.parent {
    display: grid;
}
div.child {
    justify-self: center;
    align-self: center;
}
```
4.  行高
```css
div.parent {
    font-size: 0;
    text-align: center;
    &::before {
        content: "";
        display: inline-block;
        width: 0;
        height: 100%;
        vertical-align: middle;
    }
}
div.child{
  display: inline-block;
  vertical-align: middle;
}
```

### 9.[箭头函数与普通函数（function）的区别是什么？构造函数（function）可以使用 new 生成实例，那么箭头函数可以吗？为什么？](https://github.com/Advanced-Frontend/Daily-Interview-Question/issues/101)

箭头函数是普通函数的简写，可以更优雅的定义一个函数，和普通函数相比，有以下几点差异：

- 1、函数体内的 this 对象，就是定义时所在的对象，而不是使用时所在的对象。
- 2、不可以使用 arguments 对象，该对象在函数体内不存在。如果要用，可以用 rest 参数代替。
- 3、不可以使用 yield 命令，因此箭头函数不能用作 Generator 函数。
- 4、不可以使用 new 命令，因为：
    - 没有自己的 this，无法调用 call，apply。
    - 没有 prototype 属性 ，而 new 命令在执行时需要将构造函数的 prototype 赋值给新的对象的 **\_\_proto__**。
    
### 10. [ 介绍下 webpack 热更新原理，是如何做到在不刷新浏览器的前提下更新页面](https://github.com/Advanced-Frontend/Daily-Interview-Question/issues/118)

1. 当修改了一个或多个文件；
2. 文件系统接收更改并通知webpack；
3. webpack重新编译构建一个或多个模块，并通知 HMR Server 进行更新；
4. HMR Server 使用webSocket通知 HMR runtime 需要更新，HMR runtime 通过HTTP请求更新jsonp；
5. HMR运行时替换更新中的模块，如果确定这些模块无法更新，则触发整个页面刷新。

[Webpack HMR 原理解析](https://zhuanlan.zhihu.com/p/30669007)

1. 文件更改后，webpack对模块重新编译打包，并将打包后的代码保存到内存中；
2. WDS 对文件变化监控，（这里监控的不是监控文件变化后打包，而是监控静态文件变化，通知浏览器 live reload）；
3. 通过 sockjs 建立的 websocket 长链接，将 webpack 编译状态和模块变化的hash值传递给浏览器，浏览器根据hash变化进行模块热替换；
4. HotModuleReplacement.runtime 是客户端 HMR 的中枢，将接收到的新模块的hash值，通过 JsonpMainTemplate.runtime 向 server 端发送 Ajax 请求，服务端返回一个 json，该 json 包含了所有要更新的模块的 hash 值，获取到更新列表后，该模块再次通过 jsonp 请求，获取到最新的模块代码。
5. HotModulePlugin 将会对新旧模块进行对比，决定是否更新模块，在决定更新模块后，检查模块之间的依赖关系，更新模块的同时更新模块间的依赖引用。

### 11. [介绍下 BFC、IFC、GFC 和 FFC](https://github.com/Advanced-Frontend/Daily-Interview-Question/issues/122)

- BFC（Block formatting contexts）：块级格式上下文
页面上的一个隔离的渲染区域，那么他是如何产生的呢？可以触发BFC的元素有float、position、overflow、display：table-cell/ inline-block/table-caption ；BFC有什么作用呢？比如说实现多栏布局’

- IFC（Inline formatting contexts）：内联格式上下文
IFC的line box（线框）高度由其包含行内元素中最高的实际高度计算而来（不受到竖直方向的padding/margin影响)IFC中的line box一般左右都贴紧整个IFC，但是会因为float元素而扰乱。float元素会位于IFC与与line box之间，使得line box宽度缩短。 同个ifc下的多个line box高度会不同
IFC中时不可能有块级元素的，当插入块级元素时（如p中插入div）会产生两个匿名块与div分隔开，即产生两个IFC，每个IFC对外表现为块级元素，与div垂直排列。
那么IFC一般有什么用呢？
水平居中：当一个块要在环境中水平居中时，设置其为inline-block则会在外层产生IFC，通过text-align则可以使其水平居中。
垂直居中：创建一个IFC，用其中一个元素撑开父元素的高度，然后设置其vertical-align:middle，其他行内元素则可以在此父元素下垂直居中。

- GFC（GrideLayout formatting contexts）：网格布局格式化上下文
当为一个元素设置display值为grid的时候，此元素将会获得一个独立的渲染区域，我们可以通过在网格容器（grid container）上定义网格定义行（grid definition rows）和网格定义列（grid definition columns）属性各在网格项目（grid item）上定义网格行（grid row）和网格列（grid columns）为每一个网格项目（grid item）定义位置和空间。那么GFC有什么用呢，和table又有什么区别呢？首先同样是一个二维的表格，但GridLayout会有更加丰富的属性来控制行列，控制对齐以及更为精细的渲染语义和控制。

- FFC（Flex formatting contexts）:自适应格式上下文
display值为flex或者inline-flex的元素将会生成自适应容器（flex container），可惜这个牛逼的属性只有谷歌和火狐支持，不过在移动端也足够了，至少safari和chrome还是OK的，毕竟这俩在移动端才是王道。Flex Box 由伸缩容器和伸缩项目组成。通过设置元素的 display 属性为 flex 或 inline-flex 可以得到一个伸缩容器。设置为 flex 的容器被渲染为一个块级元素，而设置为 inline-flex 的容器则渲染为一个行内元素。伸缩容器中的每一个子元素都是一个伸缩项目。伸缩项目可以是任意数量的。伸缩容器外和伸缩项目内的一切元素都不受影响。简单地说，Flexbox 定义了伸缩容器内伸缩项目该如何布局。


### 12. [使用 JavaScript Proxy 实现简单的数据绑定](https://github.com/Advanced-Frontend/Daily-Interview-Question/issues/123)

```html
<html>
<body>
  
  <input type="text" id="model"></input>
  <p id="word"></p>
</body>
<script>
  const model = document.getElementById("model")
  const word = document.getElementById("word")
  var obj= {};

  const newObj = new Proxy(obj, {
      get: function(target, key, receiver) {
        console.log(`getting ${key}!`);
        return Reflect.get(target, key, receiver);
      },
      set: function(target, key, value, receiver) {
        console.log('setting',target, key, value, receiver);
        if (key === "text") {
          model.value = value;
          word.innerHTML = value;
        }
        return Reflect.set(target, key, value, receiver);
      }
    });

  model.addEventListener("keyup",function(e){
    newObj.text = e.target.value
  })
</script>
</html>
```

### 13. [永久性重定向（301）和临时性重定向（302）对 SEO 有什么影响](https://github.com/Advanced-Frontend/Daily-Interview-Question/issues/241)
301重定向可促进搜索引擎优化效果
从搜索引擎优化角度出发，301重定向是网址重定向最为可行的一种办法。当网站的域名发生变更后，搜索引擎只对新网址进行索引，同时又会把旧地址下原有的外部链接如数转移到新地址下，从而不会让网站的排名因为网址变更而收到丝毫影响。同样，在使用301永久性重定向命令让多个域名指向网站主域时，亦不会对网站的排名产生任何负面影响。

302重定向可影响搜索引擎优化效果
迄今为止，能够对302重定向具备优异处理能力的只有Google。也就是说，在网站使用302重定向命令将其它域名指向主域时，只有Google会把其它域名的链接成绩计入主域，而其它搜索引擎只会把链接成绩向多个域名分摊，从而削弱主站的链接总量。既然作为网站排名关键因素之一的外链数量受到了影响，网站排名降低也是很自然的事情了。

理解301（永久重定向）是旧地址的资源已经被永久地删除了，搜索引擎在抓取新内容的同时也将旧的网站替换为重定向后的地址

302（临时重定向）旧地址的资源还在，这个重定向的只是临时从旧地址跳转到新地址，搜索引擎会抓取新的内容而保存旧的地址

### 14. [从URL输入到页面展现到底发生什么？](https://juejin.im/post/5c7646f26fb9a049fd108380)

1. DNS 解析:将域名解析成 IP 地址：
  - DNS缓存 DNS存在着多级缓存，从离浏览器的距离排序的话，有以下几种: 浏览器缓存，系统缓存，路由器缓存，IPS服务器缓存，根域名服务器缓存，顶级域名服务器缓存，主域名服务器缓存。
  - DNS负载均衡(DNS重定向) DNS负载均衡技术的实现原理是在DNS服务器中为同一个主机名配置多个IP地址，在应答DNS查询时， DNS服务器对每个查询将以DNS文件中主机记录的IP地址按顺序返回不同的解析结果，将客户端的访问 引导到不同的机器上去，使得不同的客户端访问不同的服务器，从而达到负载均衡的目的。

2. TCP 连接：TCP 三次握手
3. 发送 HTTP 请求
4. 服务器处理请求并返回 HTTP 报文
5. 浏览器解析渲染页面
6. 断开连接：TCP 四次挥手

### 15.[你要的 React 面试知识点，都在这了](https://juejin.im/post/5cf0733de51d4510803ce34e)

### 16. [跨域]()

整个CORS通信过程，都是浏览器自动完成，不需要用户参与。对于开发者来说，CORS通信与同源的AJAX通信没有差别，代码完全一样。浏览器一旦发现AJAX请求跨源，就会自动添加一些附加的头信息，有时还会多出一次附加的请求，但用户不会有感觉。

因此，实现CORS通信的关键是服务器。只要服务器实现了CORS接口，就可以跨源通信。

1. 简单请求

（1) 请求方法是以下三种方法之一：
  - HEAD
  - GET
  - POST
（2）HTTP的头信息不超出以下几种字段：
  - Accept
  - Accept-Language
  - Content-Type： 只限于三个值 application/x-www-form-urlencoded、multipart/form-data、text/plain
  - Content-Language
  - Last-Event-ID

服务端返回请求需有以下头部：
（1）Access-Control-Allow-Origin： 必须；
（2）Access-Control-Allow-Credentials： 该字段可选。它的值是一个布尔值，表示是否允许发送Cookie；
（3）Access-Control-Expose-Headers： 该字段可选；

2. 非简单请求

非简单请求是那种对服务器有特殊要求的请求，比如请求方法是PUT或DELETE，或者Content-Type字段的类型是application/json。

非简单请求的CORS请求，会在正式通信之前，增加一次HTTP查询请求，称为"预检"请求（preflight）。

浏览器先询问服务器，当前网页所在的域名是否在服务器的许可名单之中，以及可以使用哪些HTTP动词和头信息字段。只有得到肯定答复，浏览器才会发出正式的XMLHttpRequest请求，否则就报错。

JSONP：最大特点就是简单适用，老式浏览器全部支持，服务器改造非常小；
它的基本思想是，网页通过添加一个 <\script> 元素，向服务器请求JSON数据，这种做法不受同源政策限制；服务器收到请求后，将数据放在一个指定名字的回调函数里传回来。
```javascript
function addScriptTag(src) {
  var script = document.createElement('script');
  script.setAttribute("type","text/javascript");
  script.src = src;
  document.body.appendChild(script);
}

window.onload = function () {
  addScriptTag('http://example.com/ip?callback=foo');
}

function foo(data) {
  console.log('Your public IP address is: ' + data.ip);
};
```
### 17. css 选择器优先级
从高到低：
1.id选择器（#myid）

2.类选择器（.myclassname）

3.标签选择器（div,h1,p）

4.子选择器（ul < li）

5.后代选择器（li a）

6.伪类选择（a:hover,li:nth-child）

### 18. http 状态码

301： 永久移动；
302： 临时移动；
303: 查看其它地址。与301类似。使用GET和POST请求查看；
304：未修改；
305： 使用代理；
307： 临时重定向。与302类似。使用GET请求重定向；
400： 客户端请求的语法错误，服务器无法理解；
401： 请求要求用户的身份认证；
403： 服务器理解请求客户端的请求，但是拒绝执行此请求；
404： 服务器无法根据客户端的请求找到资源（网页）；
405： 客户端请求中的方法被禁止；
406： 服务器无法根据客户端请求的内容特性完成请求；
407： 请求要求代理的身份认证，与401类似，但请求者应当使用代理进行授权；
...
500：服务器内部错误，无法完成请求；
501： 服务器不支持请求的功能，无法完成请求；
502： 作为网关或者代理工作的服务器尝试执行请求时，从远程服务器接收到了一个无效的响应；
504： 充当网关或代理的服务器，未及时从远端服务器获取请求；


### 19. webpack 打包优化
1. babel-loader 缓存；
2. 抽离，一是webpack-dll-plugin，在首次构建时候就将这些静态依赖单独打包，后续只需要引用这个早就被打好的静态依赖包即可，有点类似“预编译”的概念；或者采用 Externals 的方式，我们将这些不需要打包的静态资源从构建逻辑中剔除出去，而使用 CDN 的方式，去引用它们；
3. 在生产环境，避免使用 压缩，混淆等开发模式下不需要的功能；
4. 选用合适的 devtool 配置（此选项控制是否生成，以及如何生成 source map），"eval" 具有最好的性能，但并不能帮助你转译代码。在大多数情况下，cheap-module-eval-source-map 是最好的选择；

### 20. webpack 的 loader 和 plugin 工作原理

1. loader 
loader 用于对模块的源代码进行转换。loader 可以使你在 import 或"加载"模块时预处理文件。因此，loader 类似于其他构建工具中“任务(task)”，并提供了处理前端构建步骤的强大方法。loader 可以将文件从不同的语言（如 TypeScript）转换为 JavaScript，或将内联图像转换为 data URL。loader 甚至允许你直接在 JavaScript 模块中 import CSS文件！
  - 编写 loader:
    - loader 是导出为一个函数的 node 模块。该函数在 loader 转换资源的时候调用。给定的函数将调用 loader API，并通过 this 上下文访问；
2. plugin

插件是 webpack 的支柱功能。webpack 自身也是构建于，你在 webpack 配置中用到的相同的插件系统之上！插件目的在于解决 loader 无法实现的其他事。
  - webpack 插件由以下组成：
    - 一个 JavaScript 命名函数。
    - 在插件函数的 prototype 上定义一个 apply 方法。
    - 指定一个绑定到 webpack 自身的事件钩子。
    - 处理 webpack 内部实例的特定数据。
    - 功能完成后调用 webpack 提供的回调。
```javascript
// 一个 JavaScript 命名函数。
function MyExampleWebpackPlugin() {

};

// 在插件函数的 prototype 上定义一个 `apply` 方法。
MyExampleWebpackPlugin.prototype.apply = function(compiler) {
  // 指定一个挂载到 webpack 自身的事件钩子。
  compiler.plugin('webpacksEventHook', function(compilation /* 处理 webpack 内部实例的特定数据。*/, callback) {
    console.log("This is an example plugin!!!");

    // 功能完成后调用 webpack 提供的回调。
    callback();
  });
```
- compiler 对象代表了完整的 webpack 环境配置。这个对象在启动 webpack 时被一次性建立，并配置好所有可操作的设置，包括 options，loader 和 plugin。当在 webpack 环境中应用一个插件时，插件将收到此 compiler 对象的引用。可以使用它来访问 webpack 的主环境。
- compilation 对象代表了一次资源版本构建。当运行 webpack 开发环境中间件时，每当检测到一个文件变化，就会创建一个新的 compilation，从而生成一组新的编译资源。一个 compilation 对象表现了当前的模块资源、编译生成资源、变化的文件、以及被跟踪依赖的状态信息。compilation 对象也提供了很多关键时机的回调，以供插件做自定义处理时选择使用。


### 20. 把 list 专化成树形结构
```javascript
const fn = arr => {
  const res = [];
  const map = arr.reduce((res, item) => ((res[item.id] = item), res), {});
  for (const item of Object.values(map)) {
    if (!item.pId) {
      res.push(item);
    } else {
      const parent = map[item.pId];
      parent.child = parent.child || [];
      parent.child.push(item);
    }
  }
  return res;
};

const arr = [
  { id: 1 },
  { id: 2, pId: 1 },
  { id: 3, pId: 2 },
  { id: 4 },
  { id: 3, pId: 2 },
  { id: 5, pId: 4 }
];
fn(arr);
```

### 21. [JavaScript深入之4类常见内存泄漏及如何避免](https://github.com/yygmind/blog/issues/16)

1. 垃圾回收算法

常用垃圾回收算法叫做**标记清除 （Mark-and-sweep）**，算法由以下几步组成：

1、垃圾回收器创建了一个“roots”列表。roots 通常是代码中全局变量的引用。JavaScript 中，“window” 对象是一个全局变量，被当作 root 。window 对象总是存在，因此垃圾回收器可以检查它和它的所有子对象是否存在（即不是垃圾）；

2、所有的 roots 被检查和标记为激活（即不是垃圾）。所有的子对象也被递归地检查。从 root 开始的所有对象如果是可达的，它就不被当作垃圾。

3、所有未被标记的内存会被当做垃圾，收集器现在可以释放内存，归还给操作系统了。

2. **四种常见的JS内存泄漏**

- 1、意外的全局变量
```javascript
// 情况1: 未定义的变量会在全局对象创建一个新变量，如下
function foo(arg) {
    bar = "this is a hidden global variable";
}
// 效果同下：
function foo(arg) {
    window.bar = "this is an explicit global variable";
}
// 情况2: this 指向了全局对象（window）
function foo() {
    this.variable = "potential accidental global";
}
```

**解决方法：** 在 JavaScript 文件头部加上 'use strict'，使用严格模式避免意外的全局变量，此时上例中的this指向undefined。如果必须使用全局变量存储大量数据时，确保用完以后把它设置为 null 或者重新定义。

- 2、被遗忘的计时器或回调函数

- 3、脱离 DOM 的引用

如果把DOM 存成字典（JSON 键值对）或者数组，此时，同样的 DOM 元素存在两个引用：一个在 DOM 树中，另一个在字典中。那么将来需要把两个引用都清除。

如果代码中保存了表格某一个 <td> 的引用。将来决定删除整个表格的时候，直觉认为 GC 会回收除了已保存的 <td> 以外的其它节点。实际情况并非如此：此 <td> 是表格的子节点，子元素与父元素是引用关系。由于代码保留了 <td> 的引用，导致整个表格仍待在内存中。所以保存 DOM 元素引用的时候，要小心谨慎。

- 4、闭包

### 22. [JavaScript常用八种继承方案](https://github.com/yygmind/blog/issues/7)

1. 原型链继承
构造函数、原型和实例之间的关系：每个构造函数都有一个原型对象，原型对象都包含一个指向构造函数的指针，而实例都包含一个原型对象的指针。
继承的本质就是**复制，即重写原型对象，代之以一个新类型的实例**。
原型链方案存在的缺点：多个实例对引用类型的操作会被篡改。

```javascript
function Parent() {
    this.property = true;
}

Parent.prototype.getParentValue = function() {
    return this.property;
}

function Child() {
    this.subproperty = false;
}

// 这里是关键，创建SuperType的实例，并将该实例赋值给SubType.prototype
Child.prototype = new Parent(); 

Child.prototype.getChildValue = function() {
    return this.subproperty;
}

var instance = new Child();
console.log(instance.getParentValue()); // true
```

2. 借用构造函数继承
使用父类的构造函数来增强子类实例，等同于复制父类的实例给子类（不使用原型）

```javascript
function  SuperType(){
    this.color=["red","green","blue"];
}
function  SubType(){
    //继承自SuperType
    SuperType.call(this);
}
var instance1 = new SubType();
instance1.color.push("black");
alert(instance1.color);//"red,green,blue,black"

var instance2 = new SubType();
alert(instance2.color);//"red,green,blue"
```
核心代码是SuperType.call(this)，创建子类实例时调用SuperType构造函数，于是SubType的每个实例都会将SuperType中的属性复制一份。
缺点：
- 只能继承父类的实例属性和方法，不能继承原型属性/方法
- 无法实现复用，每个子类都有父类实例函数的副本，影响性能

3. 组合继承
组合上述两种方法就是组合继承。用原型链实现对原型属性和方法的继承，用借用构造函数技术来实现实例属性的继承。

```javascript
function SuperType(name){
  this.name = name;
  this.colors = ["red", "blue", "green"];
}
SuperType.prototype.sayName = function(){
  alert(this.name);
};

function SubType(name, age){
  // 继承属性
  // 第二次调用SuperType()
  SuperType.call(this, name);
  this.age = age;
}

// 继承方法
// 构建原型链
// 第一次调用SuperType()
SubType.prototype = new SuperType(); 
// 重写SubType.prototype的constructor属性，指向自己的构造函数SubType
SubType.prototype.constructor = SubType; 
SubType.prototype.sayAge = function(){
    alert(this.age);
};

var instance1 = new SubType("Nicholas", 29);
instance1.colors.push("black");
alert(instance1.colors); //"red,blue,green,black"
instance1.sayName(); //"Nicholas";
instance1.sayAge(); //29

var instance2 = new SubType("Greg", 27);
alert(instance2.colors); //"red,blue,green"
instance2.sayName(); //"Greg";
instance2.sayAge(); //27
```
缺点：
- 第一次调用SuperType()：给SubType.prototype写入两个属性name，color。
- 第二次调用SuperType()：给instance1写入两个属性name，color。

4. 原型式继承
利用一个空对象作为中介，将某个对象直接赋值给空对象构造函数的原型。
```javascript
function object(obj){
  function F(){}
  F.prototype = obj;
  return new F();
}
```
object()对传入其中的对象执行了一次浅复制，将构造函数F的原型直接指向传入的对象。

```javascript
var person = {
  name: "Nicholas",
  friends: ["Shelby", "Court", "Van"]
};

var anotherPerson = object(person);
anotherPerson.name = "Greg";
anotherPerson.friends.push("Rob");

var yetAnotherPerson = object(person);
yetAnotherPerson.name = "Linda";
yetAnotherPerson.friends.push("Barbie");

alert(person.friends);   //"Shelby,Court,Van,Rob,Barbie"
```
缺点：
- 原型链继承多个实例的引用类型属性指向相同，存在篡改的可能。
- 无法传递参数；
另外，ES5中存在Object.create()的方法，能够代替上面的object方法。

### 23. [给定两个数组，写一个方法来计算它们的交集](https://github.com/Advanced-Frontend/Daily-Interview-Question/issues/102)
```javascript
function intersection(x, y) {
  var m = x.length;
  var n = y.length;
  // c 是 (m + 1) * (n + 1) 的二维数组
  var c = [];
  for (var i = 0; i <= m; i++) {
    c[i] = [0];
  }
  for (var j = 0; j <= n; j++) {
    c[0][j] = 0;
  }
  
  // 利用动态规划，自底向上求解
  for(var i = 1; i <= m; i++) {
    for(var j = 1; j <= n; j++) {
      if (x[i-1] == y[j-1]) {
        c[i][j] = c[i-1][j-1] + 1;
      } else if (c[i - 1][j] >= c[i][j - 1]) {
        c[i][j] = c[i - 1][j];
      } else {
        c[i][j] = c[i][j - 1];
      }
    }
  }
  
  print(c, x, y, m, n);
}

function print(c, x, y, i, j) {
  if (i == 0 || j == 0) {
    return;
  }
  if (x[i-1] == y[j-1]) {
    print(c, x, y, i-1, j-1);
    // console.log(x[i-1]);
    intersectionArr.push(x[i - 1]);
  } else if (c[i - 1][j] >= c[i][j - 1]) {
    print(c, x, y, i - 1, j);
  } else {
    print(c, x, y, i, j - 1);
  }
}
// 交集结果
var intersectionArr = [];
intersection([1, 2, 2, 1], [2, 2]);
// intersection([1, 2, 2, 1, 4, 5], [2, 2, 1, 3, 5]);
```










