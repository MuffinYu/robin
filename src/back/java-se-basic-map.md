---
slug: bushwick-artisan
title: Java SE 基础Map之HashMap和ConcurrentHashMap
createAt: 1566546718119
tag: [ Java, Map]
---

本文的源码是基于JDK8，不同版本的细节实现可能存在细小差别。

### 一、HashMap概述

HashMap是Java Collection Framework的重要成员，继承自AbstractMap，实现Map、Cloneable、Serializable接口，底层结构如下图：
![HashMap-structure](./images/java-se-basic-map/HashMap-structure.png)

可以看出：
 - 1. HashMap实现采用了（数组+链表+红黑树）的复杂结构，数组的查询效率是O(1)，链表的查询效率是O(n)，当桶中的链表长度大于8时，且数组的容量大于64时，链表会进行树化(treeifyBin)，红黑树的查询效率是O(log n)；链表长度大于8，但是数组容量未达到64，会对数组进行扩容。
 
 - 2. 数组的一个元素又称作桶，数组和链表的节点是一个Node类型的节点，其中包含键key，值Value，指向下一个节点的next指针，以及当前节点key值计算出来的hash值。

#### HashMap具有一下特点：

- 1. HashMap的初始默认容量(capicity)是16(即数组大小)，每次扩容(resize)后将容量扩大为之前的2倍，因此容量总是2的n次幂。负载因子因子默认是0.75，key-value的数量超过容量*负载因子后，会进行扩容操作。负载因子过大，会使key的hash碰撞的机会会变大，将在链表或红黑树上查找元素，降低效率；负载因子过小，比较浪费数组空间，数组元素占有率比较低的情况下就需要扩容。0.75是一种折中的方案。

- 2. 根据hash算法来计算key-value的存储位置，实现快速存取。
  根据Key的hash值计算对应的在数组中的index(计算方法采用的是与运算，即hash & (capicity - 1)， 计算结果与 hash % capicity 一样，因为capicity始终是2的n次幂，这也是为什么默认容量是16，而且每次扩容都是之前的2倍，是HasMap的速度优化的一个点)。

- 3. HashMap的key可以是null值，此时这对key-value将被放在数组的第一个位置；value可以为任意数量的null值，没有限制（当通过一个key获取value时，如果返回值是null，无法判断是不存在这个键值对，还是key对应的value本身为空）。

- 4. HashMap是非线程安全的，主要表现在：当需要扩容时，线程1得到一个元素的引用，此时线程1被刮起，线程2执行扩容，完成扩容后，线程1继续执行，此时之前的元素的next指针的元素可能已经变成这个的元素的前驱元素，形成互相引用的循环，当获取这个元素的值时，会导致死循环。

### 二、ConcurrentHashMap概述

ConcurrentHashMap 同样继承自AbstractMap，实现了ConcurrentMap、Serializable接口，和HashMap十分相似，是HashMap的一个线程安全的、支持高效并发的版本。在默认理想状态下，ConcurrentHashMap可以支持16个线程执行并发写操作及任意数量线程的读操作。

#### ConcurrentHashMap具有一下特点：

 - 1. ConcurrentHashMap没有扩容上限(threshold)和负载因子(loadFactor)，而是改用了sizeCtl来控制，官方给出的解释如下：(1）-1，表示有线程正在进行初始化操作;（2）-(1 + nThreads)，表示有n个线程正在一起扩容;（3）0，默认值，后续在真正初始化的时候使用默认容量;（4）> 0，初始化或扩容完成后下一次的扩容门槛。

- 2. ConcurrentHashMap中添加元素的时候，会按一下步骤执行：

（1）如果桶数组未初始化，则初始化；

（2）如果待插入的元素所在的桶为空，则尝试把此元素直接插入到桶的第一个位置；（CAS乐观锁，认为对于同一个数据的并发操作不一定会发生修改，在更新数据的时候，尝试去更新数据，如果失败就不断尝试）

（3）如果正在扩容，则当前线程一起加入到扩容的过程中；

（4）如果待插入的元素所在的桶不为空且不在迁移元素，则锁住这个桶（分段锁）；

（5）如果当前桶中元素以链表方式存储，则在链表中寻找该元素或者插入元素；

（6）如果当前桶中元素以红黑树方式存储，则在红黑树中寻找该元素或者插入元素；

（7）如果元素存在，则返回旧值；

（8）如果元素不存在，整个Map的元素个数加1，并检查是否需要扩容；

- 3. ConcurrentHashMap既不允许key为null，也不允许value为null。

#### ConcurrentHashMap性能优化：

- 1. CAS + 自旋，乐观锁的思想，减少线程上下文切换的时间；

- 2. 分段锁的思想，减少同一把锁争用带来的低效问题；

- 3. CounterCell，分段存储元素个数，减少多线程同时更新一个字段带来的低效；

- 4. @sun.misc.Contended（CounterCell上的注解），避免伪共享；

- 5. 多线程协同进行扩容；