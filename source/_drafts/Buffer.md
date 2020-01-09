---
tags: [Node]
title: Buffer
created: '2020-01-08T09:04:53.499Z'
modified: '2020-01-09T02:47:13.816Z'
---

# Buffer

## Buffer 分配方法

1. `Buffer.from()`：返回一个新的 Buffer；
  - `Buffer.from(array)`： 包含提供的八位字节数组的副本；
  - `Buffer.from(arrayBuffer[, byteOffset [, length]])`：它与给定的 `ArrayBuffer` 共享相同的已分配内存；
  - `Buffer.from(buffer)`：包含给定 `Buffer` 的内容的副本；
  - `Buffer.from（string[, encoding]）`：包含提供的字符串的副本；
2. `Buffer.alloc(size [, fill[, encoding]])`：返回一个指定大小的新建的已初始化的 Buffer，此方法比 `Buffer.allocUnsafe(size)` 慢，但能确保新建的 Buffer 实例永远不会包含可能敏感的就数据。

3. `Buffer.allocUnsafe(size)` 和 `Buffer.allocUnsafeSlow(size) ` 分别返回一个指定大小的新建的未初始化的 Buffer。由于 Buffer 是 __未初始化__ 的，因此分配的内存片段可能包含敏感的就数据。

如果 size 小于或等于 `Buffer.poolSize` 的一半，则 `Buffer.alloUnsafe()` 返回的 Buffer 实例可能是从共享的内部内存池中分配。
`Buffer.allocUnsafeSlow()` 返回的实例则从不使用共享的内部内存池。

## 总结
1. 在初次加载时就会初始化 1 个 8KB 的内存空间，buffer.js 源码有体现；

```javascript
Buffer.poolSize = 8 * 1024;
var poolSize, poolOffset, allocPool;
// ...
// 中间代码省略

function createPool() {
  poolSize = Buffer.poolSize;
  allocPool = createUnsafeArrayBuffer(poolSize);
  poolOffset = 0;
}
createPool();

// 129 行
```

2. 根据申请的内存大小分为 小 Buffer 对象 和 大 Buffer 对象：当前申请的大小，小于 Buffer.poolSize 的一半，则为小对象，否则为大对象；；

```javascript
// https://github.com/nodejs/node/blob/v10.x/lib/buffer.js#L318
function allocate(size) {
  if (size <= 0) {
    return new FastBuffer();
  }
  // 当分配的空间小于 Buffer.poolSize 向右移位，这里得出来的结果为 4KB
  if (size < (Buffer.poolSize >>> 1)) { // 当前申请的大小，小于 Buffer.poolSize 的一半，则为小对象，否则为大对象；
    if (size > poolSize - poolOffset) createPool();
    var b = new FastBuffer(allocPool, poolOffset, size);
    poolOffset += size; // 已使用空间累加
    alignPool(); // 8 字节内存对齐处理
    return b;
  } else {
    // C++ 层面申请
    return createUnsafeBuffer(size);
  }
}
```

3. 小 Buffer 情况，会继续判断这个 slab 空间是否足够：
  - 如果空间足够就去使用剩余空间同时更新 slab 分配状态，偏移量会增加；
  - 如果空间不足，slab 空间不足，就会去创建一个新的 slab 空间用来分配

4. 大 Buffer 情况，则会直接走 `createUnsafeBuffer(size)` 函数；

5. 不论是小 Buffer 对象还是大 Buffer 对象，内存分配是在 C++ 层面完成，内存管理在 JavaScript 层面，最终还是可以被 V8 的垃圾回收标记所回收。

## 示例

```javascript
const http = require("http");
let s = "";
for (let i = 0; i < 1024 * 10; i++) {
  s += "a";
}

const str = s;
const bufStr = Buffer.from(s);
const server = http.createServer((req, res) => {
  console.log(req.url);

  if (req.url === "/buffer") {
    res.end(bufStr);
  } else if (req.url === "/string") {
    res.end(str);
  }
});

server.listen(3000);
```
