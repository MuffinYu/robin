---
slug: bushwick-artisan
title: 从一个需求开始学babel插件开发
createAt: 1558594795356
---

### 前言

基于现在JS这门语言快速发展的现状，很多还处于[TC39 提案](https://github.com/tc39/proposals)的新语法，或者已经写入新的语言规则的语法提案但在浏览器的支持度上不是十分普及， 以及JS的运行环境，也就是用户的浏览器碎片化的分布，无法保证我们在开发过程中写的JS代码在客户端一致正常的运行，这种情况肯定是不能接受的。

而这正是Babel存在的价值，Babel可以把新的语法编译成能在不同浏览器中运行一致的兼容语法。开发者可以尽情的享受新的语法在开发中带来的爽快，如使用React的jsx语法，ES6的模块方案，class，箭头函数等，而在生产环境中只需要按照需求，配置好Babel的presets和plugins等配置，把项目代码编译成生产代码就可以了。

因此了解一些Babel插件的编写方法绝对是有必要的。

### 需求

通常，我们使用Babel是在node的环境下，在项目代码运行前就按照一定的配置将代码编译打包好，但这次需要在客户端实时的将用户输入的代码编译成可运行的代码，而其中有一类代码是模块引入的代
码，代码编译成浏览器端的属性读取代码， 例如:

```javascript
  import { prop } from 'modules';
```

编译成 

```javascript
  var { prop } = window['modules'];
```

因此就需要用一个插件来执行这种编译操作；

### 实现方式

1. 通过Google的 (CDN)[https://unpkg.com/] ，在页面的script标签中加载Babel包，如下 ：

```js
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
```

  这样在浏览器的window全局对象里，就会注册一个Babel对象，在这个对象中，有包含transform（编译）、registerPlugin（注册插件）、registerPreset（注册preset）等方法，而在这个需求中，所需要的就是 transform 和 registerPlugin 两个方法了。

2. 接下来就是在Babel里面注册一个插件，主要功能是在 Visitors（访问者）“进入”一个节点时，如果是"ImportDeclaration"节点，即引入包的语法，将会进行处理，将该语句替换成属性读取的方式。代码如下：

```js
Babel.registerPlugin("babel-module", function (babel) {
  var t = babel.types; // AST模块
  return {
    visitor: {
      ImportDeclaration(path) {
        const { node } = path;
        const {
          objectPattern,
          objectProperty,
          variableDeclaration,
          variableDeclarator
        } = t;
        var specifiers = node.specifiers.filter(
          specifier => specifier.type === "ImportSpecifier"
        );
        var memberExp = t.memberExpression(
          t.identifier("window"),
          node.source,
          true
        ); // 成员表达式
        var varDeclare = variableDeclaration("var", [
          variableDeclarator(
            objectPattern(
              specifiers.map(specifier =>
                objectProperty(
                  specifier.local,
                  specifier.local,
                  false,
                  true
                )
              )
            ),
            memberExp
          )
        ]);
        path.replaceWith(varDeclare);
      }
    }
  };
});
```

3. 注册完插件后，就可以利于用Babel里的transform方法和刚才的插件，来进行编译了，除了注册的插件以外，还可以利用babel内置的其他插件和preset，如下：

```js
window.Babel.transform(sourceCode, {
        presets: ['react'],
        plugins: ['babel-module', 'proposal-class-properties'],
        ast: true,
      }).code
```

> 注意：plugins和presets的执行顺序<br>
>- plugin在preset前执行
>- plugin是从前到后依次执行，即写在前面的先执行
>- preset是从后到前依次执行，即写在后面的先执行

4. 这样就完成了一个在客户端注册babel插件的过程，在项目中使用自定义的Babel插件方式大同小异，在配置中加上presets和plugins的参数就可以了，参数可以是npm包的名字，也可以是本地文件的相对或者绝对路径，具体参考Babel文档中的 [**pulgins/presets Path**](https://babel.docschina.org/docs/en/plugins#plugin-preset-paths)

### 参考资料

- babel插件开发手册 [中文版](https://github.com/jamiebuilds/babel-handbook/blob/master/translations/zh-Hans/plugin-handbook.md#builders) [英文版](https://github.com/jamiebuilds/babel-handbook/blob/master/translations/en/plugin-handbook.md)

- 查看AST和节点对应关系 [在线结果网站](https://astexplorer.net/)