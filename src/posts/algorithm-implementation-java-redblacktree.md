---
slug: --
title: 算法基础（1）——红黑树
createAt: 1570519363607
tag: [算法, java]
---

### 一、红黑树介绍

红黑树(Red-Black Tree，简称R-B Tree)，它一种特殊的二叉查找树。

红黑树是特殊的二叉查找树，意味着它满足二叉查找树的特征：任意一个节点所包含的键值，大于等于左孩子的键值，小于等于右孩子的键值。

红黑树区别于普通话二叉树在于每个节点上都有存储位表示节点的颜色，颜色是红(Red)或黑(Black)。

同时节点颜色有以下的特性:
(1) 每个节点或者是黑色，或者是红色。
(2) 根节点是黑色。
(3) 每个叶子节点是黑色。 [注意：这里叶子节点，是指为空的叶子节点！]
(4) 如果一个节点是红色的，则它的子节点必须是黑色的。[一条线上不会出现两个及以上连续的红色节点，可能出现连续黑色节点]
(5) 从一个节点到该节点的子孙节点的所有路径上包含相同数目的黑节点。

在二叉树和上述五个特性的限制下，从根节点到叶子节点的最长路径不多于最短路径的两倍。二叉树在极端情况下会退化成链表，此时查询的复杂度为O(n)，就没有了二叉树的特性减少时间复杂度的特点，如下图右侧，但红黑树会保证每个分枝的长度不会相差太多，确保时间性能在O(logN)左右。

![红黑树和二叉树](./images/red-black-tree/red-black-tree-1.png)


### 二、红黑树构建

红黑树的构建关键在于，添加和节点后，需要经过变色和旋转调整，以满足红黑树的五点要求，但不是每次添加节点都需要变色和旋转，需要判断不同情形，下面先介绍红黑树添加节点的情况处理：

为方便上下文结合代码理解，这里先给出基本的节点和树的代码：

- 节点颜色

```java
// NodeColor.java
public class NodeColor {
   public static String Red = "red";
   public static String Black = "black";
}
```

- 节点（使用lombok注解，省去了构造方法和getter，setter方法）

**注意：**空节点的默认颜色为黑色，新添加节点的默认颜色为红色
```java
// RedBlackTreeNode.java
import lombok.*;

@AllArgsConstructor
@NoArgsConstructor
public class RedBlackTreeNode {
   @Getter
   @Setter
   private String color = NodeColor.Black;

   @Getter
   @Setter
   private int key = 0;

   @Getter
   @Setter
   private RedBlackTreeNode left;

   @Getter
   @Setter
   private RedBlackTreeNode right;

   @Getter
   @Setter
   private RedBlackTreeNode parent;
}
```

```java
// RedBlackTree.java
import lombok.Getter;
import lombok.Setter;
public class RedBlackTree {
    /**
    * 空节点
    * 默认颜色为黑色
    */
   private static RedBlackTreeNode nil = new RedBlackTreeNode();

   /**
    * 记录根节点
    */
   @Getter
   @Setter
   private RedBlackTreeNode root = new RedBlackTreeNode();

   /**
    * 构造空树
    */
   public RedBlackTree() {
      root = nil;
   }

   /**
    * 生成一个新节点，默认颜色为红色
    * @param key
    * @return
    */
   public RedBlackTreeNode RB_NODE(int key) {
      RedBlackTreeNode node = new RedBlackTreeNode(NodeColor.Red, key, nil, nil, nil);
      return node;
   }

   /**
    * 判断节点是否为空
    * @param node
    * @return
    */
   public boolean IsNil(RedBlackTreeNode node) {
      if (node == nil) {
         return true;
      }else {
         return false;
      }
   }
}
```
#### （1）、添加节点

  1. 首先找到节点的添加位置，插入节点

  ```java
     /**
    * 插入节点
    * @param T
    * @param z
    */
   public void RB_INSERT(RedBlackTree T, RedBlackTreeNode z) {
      // 临时变量节点y,存储临时节点，默认为nil
      RedBlackTreeNode y = RedBlackTree.nil;
      // 获取根节点，从根节点开始遍历查询
      RedBlackTreeNode x = T.getRoot();
      // 循环二分查找合适的插入点
      while (IsNil(x) == false) {
         // 保存当前节点，作为结果的根节点
         y = x;
         if (z.getKey() < x.getKey()){
            // 添加节点值小于节点的值，查找左子树
            x = x.getLeft();
         }else {
            // 添加节点值大于节点的值，查找右子树
            x = x.getRight();
         }
      }
      // 临时节点y设置为插入点的父节点
      z.setParent(y);

      if (IsNil(y) == true) {
         // 空树时设置z为根节点
         T.setRoot((z));
      }else if (z.getKey() < y.getKey()){
         // 新节点为左子节点
         y.setLeft(z);
      }else {
         // 新节点为右子节点
         y.setRight(z);
      }
      // 将插入节点的左右子树设为nil，颜色为红色，已经在构造时设置过，可以省略
      z.setLeft(RedBlackTree.nil);
      z.setRight(RedBlackTree.nil);
      z.setColor(NodeColor.Red);
      // 插入调整
      RB_INSERT_FIXUP(T, z);
   }
  ```
  2. 根据不同情况，进行变色和旋转

  2.1 插入情况总结

  - **情况1：**如果是根节点，直接插入就完事了（插入还是固定为红色，然后在代码的最后把根目录设置为黑色）

  - **情况2：**插入节点的父亲，为黑色，也一样，插入就完事了，不用做任何的改动

  - **情况3：**插入节点的父亲为红色，叔叔节点（插入节点的爷爷的另一个子节点）的颜色也是红色

  - **情况4：**插入节点的父亲为红色，叔叔节点节点为黑色

  情况4最麻烦，因为需要再做一次判断，

  **（爷爷节点用G表示，父：F，叔叔：U，插入节点：M）**

  注意，下面四张图U节点都是Nil节点（也就是一个不能存在的节点，根据红黑树的特点，这个节点的颜色也是黑色），下图中画出来是为了便于理解。

![F是左节点，M是右节点](./images/red-black-tree/red-black-tree-2.png)
![F是左节点，M是左节点](./images/red-black-tree/red-black-tree-3.png)
![F是右节点，M是左节点](./images/red-black-tree/red-black-tree-4.png)
![F是右节点，M是右节点](./images/red-black-tree/red-black-tree-5.png)

四张图从左到右，从上到下：

图1：父节点是爷爷节点左节点，插入节点是父节点的右节点；
图2：父节点是爷爷节点左节点，插入节点是父节点的左节点；
图3：父节点是爷爷节点右节点，插入节点是父节点的左节点；
图4：父节点是爷爷节点右节点，插入节点是父节点的右节点；

四种情况总结来说，主要是**爷爷节点、爸爸节点和插入节点是否是三点一线**，如果不是三点一线，如图1和图3，就属于情况4的阶段1；如果是三点一线，如图2和图4，就属于情况4的阶段2。

阶段1和阶段2有什么联系吗？阶段1的处理方式，就是经过旋转变成阶段2后，再做阶段2的旋转处理。

2.2 插入情况处理

情况1：表示插入的根节点，直接把新节点的红色变成黑色就可以了。

情况2：父节点是黑色，直接插入，不做任何旋转和变色处理。

情况3：父节点是红色，叔叔节点也是红色，直接把叔叔节点和父节点的颜色变成黑色，爷爷节点变成红色，并由爷爷节点继续上溯判断，爷爷节点的父节点颜色，做类似的处理。（因为太爷爷节点可能为红色，将爷爷节点变成红色，可能会和特性4冲突，必须向上继续判断）。

情况4：父节点是红色，叔叔节点是黑色，这种情况较为复杂，先判断处于那个阶段。

 - 如果符合阶段1，图1和图3情形，图1就对F节点做左旋，图3就对F节点右旋，如下图，经过旋转，变成阶段2，即插入节点、父节点和爷爷节三点一线。


![F是左节点，M是右节点，F左旋](./images/red-black-tree/red-black-tree-6.png)
![F是右节点，M是左节点，F右旋](./images/red-black-tree/red-black-tree-7.png)

 - 如果符合阶段2，图2和图4情形，图2就对G节点右旋，然后将G变为红色，如下图：

![F是左节点，M是左节点，G右旋，F黑色，G红色](./images/red-black-tree/red-black-tree-8.png)
![F是右节点，M是右节点，G左旋，F黑色，G红色](./images/red-black-tree/red-black-tree-9.png)

 3. 代码实现

 综合上述的不同场景，整体逻辑流程总结如下图：

![逻辑流程图](./images/red-black-tree/red-black-tree-10.png)

  具体代码实现代码如下：

```java
// RedBlackTree.java

public void RB_INSERT_FIXUP(RedBlackTree T, RedBlackTreeNode m) {

  // 父节点是红色
  while (m != null && IsNil(m) == false &&  m.getParent().getColor() == NodeColor.Red) {
      // 父节点
      RedBlackTreeNode f = m.getParent();
      // 爷爷节点
      RedBlackTreeNode g = f.getParent();
      // 叔叔节点
      RedBlackTreeNode u = RedBlackTree.nil;
      if (f == g.getLeft()) {
        // 父节点是左节点

        u = g.getRight();
        if (u.getColor() == NodeColor.Red){
            // 叔叔节点是红色
            /**
            * 属于情况3，即叔叔节点也为红色，执行以下操作，并继续循环
            * f节点设为黑色
            * u节点设为黑色
            * g节点设为红色
            * 从g节点继续上溯循环判断，是否满足红黑树特性4
            */
            f.setColor(NodeColor.Black);
            u.setColor(NodeColor.Black);
            g.setColor(NodeColor.Red);
            m = g;
            continue;
        } else {
            // 叔叔节点是黑色
            // 判断插入节点是否是右节点
            if (m == f.getRight()) {
              // 父节点是左节点，插入节点是右节点，叔叔节点是黑色
              /**
                * 图1类型，属于情况4，插入节点、父节点和祖父节点三点不一线，属于阶段1，做以下操作：
                * f节点左旋
                * 变成图2类型，情况4的阶段2，继续操作
                */
              RedBlackTreeNode tmp = m;
              m = f;
              f = tmp;
              LEFT_ROTATE(T, m);
            }
            /**
            * 图2类型，情况4的阶段2，执行以下操作：
            * 父节点颜色设为黑色
            * 祖父节点颜色设为红色
            * 对祖父节点右旋
            */
            f.setColor(NodeColor.Black);
            g.setColor(NodeColor.Red);
            RIGHT_ROTATE(T, g);
        }
      } else {
        // 父节点是右节点
        u = g.getLeft();
        if (u.getColor() == NodeColor.Red) {
            // 叔叔节点是红色
            /**
            * 属于情况3，即叔叔节点也为红色，执行以下操作，并继续循环
            * f节点设为黑色
            * u节点设为黑色
            * g节点设为红色
            * 从g节点继续上溯循环判断，是否满足红黑树特性4
            */
            f.setColor(NodeColor.Black);
            u.setColor(NodeColor.Black);
            g.setColor(NodeColor.Red);
            m = g;
            continue;
        } else {
            // 叔叔节点是黑色
            // 判断插入节点是否是右节点
            if (m == f.getLeft()) {
              // 父节点是右节点，插入节点是左节点，叔叔节点是黑色
              /**
                * 图3类型，属于情况4，插入节点、父节点和祖父节点三点不一线，属于阶段1，做以下操作：
                * f节点右旋
                * 变成图4类型，情况4的阶段2，继续操作
                */
              RedBlackTreeNode tmp = m;
              m = f;
              f = tmp;
              RIGHT_ROTATE(T, m);
            }
            /**
            * 图4类型，情况4的阶段2，执行以下操作：
            * 父节点颜色设为黑色
            * 祖父节点颜色设为红色
            * 对祖父节点左旋
            */

            f.setColor(NodeColor.Black);
            g.setColor(NodeColor.Red);
            LEFT_ROTATE(T, g);
        }
      }
  }
  // 根节点设为黑色
  T.getRoot().setColor(NodeColor.Black);
}


  /**
    *  左旋示意图
    * 对节点x进行左旋：
    *      px                              px
    *     /                               /
    *    x                               y
    *   /  \       --(左旋)--            / \
    *  lx   y                          x  ry
    *     /   \                       /  \
    *    ly   ry                     lx  ly
    *
    */
   public void LEFT_ROTATE(RedBlackTree T, RedBlackTreeNode x){
      // 定义y节点
      RedBlackTreeNode y = x.getRight();
      // y 左节点 设为 x右节点
      x.setRight((y.getLeft()));
      // x 设为 y左节点父节点
      y.getLeft().setParent(x);
      // x父节点 设为y父节点
      y.setParent(x.getParent());
      // y 设为x父节点左/右节点或者根节点
      if (IsNil(x.getParent()) == true) {
         // x为根节点， y设为根节点
         T.setRoot(y);
      } else if (x.getParent().getLeft() == x) {
         // x为左节点，y设为左节点
         x.getParent().setLeft(y);
      } else {
         // x为右节点，y设为右节点
         x.getParent().setRight(y);
      }
      // x 设为 y左节点
      y.setLeft(x);
      // y 设为x父节点
      x.setParent(y);
   }

   /**
    * 右旋示意图
    * 对节点x进行右旋：
    *            px                               px
    *           /                                /
    *          x                                y
    *         /  \      --(右旋)--             /  \
    *        y   rx                          ly   x
    *       / \                                  / \
    *      ly  ry                               ry  rx
    */
   public void RIGHT_ROTATE(RedBlackTree T, RedBlackTreeNode x){
      // 左节点
      RedBlackTreeNode y = x.getLeft();
      // y的右节点 设为 x左节点
      x.setLeft(y.getRight());
      y.getRight().setParent(x);
      // x节点父节点设为 y父节点
      y.setParent(x.getParent());
      if (IsNil(y.getParent()) == true){
         T.setRoot(y);
      }
      else if (x.getParent().getRight() == x) {
         x.getParent().setRight(y);
      } else {
         x.getParent().setLeft(y);
      }
      // x设为y右节点
      y.setRight(x);
      // y设为x父节点
      x.setParent(y);
   }
```

#### （2）、删除节点


  删除节点的情况略复杂于添加节点，和添加节点类似，分两步进行，首先删除节点，然后对删除后结果进行平衡。
  1. 删除节点

  删除节点可以分几种情况加以处理：

  **情况1：**d节点两个子节点都有；
  **情况2：**d节点一个子节点也没有；
  **情况3：**d节点有一个子节点；


  情况1下，先找到d节点的后继节点，即d右子树的最小节点，将后继节点的值替换到删除节点位置，颜色不需要变化，然后将删除d节点的情况变为删除后继节点的情况，即将后继节点赋值给d，因为后继节点肯定只有右子树，符合情况2下的一种情况，下面再详细介绍；

  查找后继节点的代码实现：
  
  ```java

    // RedBlackTree.java
    /**
    * 查找 x 左子树最小的节点
    * @param x
    * @return
    */
   public RedBlackTreeNode TREE_MINIMUM(RedBlackTreeNode x) {
      while (IsNil(x.getLeft()) == false) {
         x = x.getLeft();
      }
      return x;
   }
  ```

   删除节点代码实现：

  ```java
    // RedBlackTree.java
   /**
    * 删除节点
    * @param T
    * @param z
    */
   /**
    * 删除节点
    * @param T
    * @param z
    */
   public void RB_DELETE(RedBlackTree T, RedBlackTreeNode z) {
      RedBlackTreeNode y = z;
      RedBlackTreeNode x = RedBlackTree.nil;
      String yOriginColor = y.getColor();
      if (z.getLeft() == RedBlackTree.nil) {
         // z没有左节点
         x = z.getRight();
         RB_TRANSPLANT(T, z, z.getRight());
      } else if (z.getRight() == RedBlackTree.nil) {
         // z没有右节点
         x = z.getLeft();
         RB_TRANSPLANT(T, z, z.getLeft());
      } else {
         y = TREE_MINIMUM(z.getRight());
         yOriginColor = y.getColor();
         x = y.getRight();
         if (y.getParent() == z) {
            // y就是 z 的右节点
            x.setParent(y);
         } else {
            // y 是 z 右子树的最小节点
            // 用 y 的值替换 z位置的值
            RB_TRANSPLANT(T, y, y.getRight());
            y.setRight(z.getRight());
            y.getRight().setParent(y);
         }
         RB_TRANSPLANT(T, z, y);
         y.setLeft(z.getLeft());
         y.getLeft().setParent(y);
         y.setColor(z.getColor());
         if (yOriginColor == NodeColor.Black) {
            // y 是红色，直接删除 y
            // 否则需要重新平衡树
            RB_DELETE_FIXUP(T, x);
         }
      }
   }
  ```

  重新平衡树有多种情形 ，下面一一介绍：

  情形1: d节点兄弟节点w为红色，此时s一定有两个子节点，如下图；
  ![情况1：兄弟节点s为红色](./images/red-black-tree/red-black-tree-11.png)

   操作：改变w和d的父节点p的颜色，改变后s为黑色，p为红色，p节点左旋一次，d节点的兄弟节点变为w节点的右子节点，一定为黑色，变成情形2、情形3或者情形4继续处理；

  情形2： s和两个子节点均为黑色，如下图：

  ![情况2：父节点为黑色黑色，s和两个子节点均为黑色](./images/red-black-tree/red-black-tree-15.png)

  操作：将s变为红色，此时，x的父节点两个子树的黑色都减少一层（相对于整个树的其他路径），为了补偿这层减少的黑色，将d置为d的父节点，继续遍历，直到遇到第一个红色节点，变为黑色，此时，减少的一层黑色补充回来，达到平衡状态（此时也不关心p节点的颜色，只要在上层找到一个红色节点，变为黑色，整个树就可以达到平衡状态）；

  情形3：d节点兄弟节点s是黑色，s的左孩子是红色，右孩子是黑色，如下图：
  ![情况2：兄弟节点s为黑色，近侄子为红色](./images/red-black-tree/red-black-tree-12.png)


   操作：将s和s的左节点颜色互换，s进行右旋，然后d的兄弟节点变为之前s的左节点为黑色，兄弟节点的右节点变为黑色，变成情形4继续处理；

  情形4：d节点的兄弟节点s是黑色，s的右节点是红色，如下图：
  ![情况2-5：兄弟节点s为黑色，远侄子为红色](./images/red-black-tree/red-black-tree-13.png)

  操作：兄弟节点s设为d节点父节点的颜色，父节点p设为黑色，s节点的右节点设为黑色，p节点右旋，达到平衡状态；（这时，不论p节点的颜色是红还是黑，包含d路径的减少的黑色由右旋并设为黑色的p节点补充，d兄弟节点s一侧的黑色由s节点的右孩子补充，s节点变为之前的父节点，p子树达到和之前相同状态，平衡结束）;



### 参考资料

- [java实现源码](https://github.com/MuffinYu/algorithm-implementation-java)

- [【算法】红黑树插入数据的情况与实现（三）](https://blog.csdn.net/lsr40/article/details/85266069)

- [csxiaoyao 博客 —— 红黑树算法的Java实现 【原创】](https://www.csxiaoyao.cn/blog/index.php/2016/10/23/java/)

- [红黑树之删除节点](https://www.cnblogs.com/qingergege/p/7351659.html)

- 算法导论-第13章红黑树 删除