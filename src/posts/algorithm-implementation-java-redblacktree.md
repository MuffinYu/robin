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


  情况1下，需要找到d节点的后继节点，即d右子树的最小节点，将后继节点的值替换到删除节点位置，颜色不需要变化，然后将删除d节点的情况变为删除后继节点的情况，即将后继节点赋值给d，因为后继节点肯定只有右子树，符合情况2下的一种情况，下面再详细介绍；

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

  情况2下分为多种情况，下面一一介绍：

  如果d为红色节点或者为根节点，直接删除；

  如果d为黑色节点，先考虑d是左节点的情况（d是右节点的情况是镜像的处理方式）；
  情况2-1：兄弟节点s为红色，s的子节点一定为黑色；d的父节点p左旋，p节点变为红色，s节点变为黑色，变换后 d的兄弟节点变为s的左节点，肯定为黑色，变成情况2-3或情况2-5；

  ![情况2-1：兄弟节点s为红色](./images/red-black-tree/red-black-tree-11.png)
  
  情况2-3：兄弟节点s为黑色（情况1下经过变换后，s变成之前s的左子节点，也为黑色，如下图），近侄子为红色，即s左节点；s节点右旋，s变为红色，sl变为黑色（因为之前s一定为黑色，sl一定为红色），变成情况2-5继续处理；
  ![情况2-3：兄弟节点s为黑色，近侄子为红色](./images/red-black-tree/red-black-tree-12.png)

  情况2-5：兄弟节点为黑色，远侄子（兄弟节点右节点）为红色；将p节点左旋，兄弟节点设为p节点颜色，p节点设置为黑色，删除d节点，完成删除。
  ![情况2-5：兄弟节点s为黑色，远侄子为红色](./images/red-black-tree/red-black-tree-13.png)

  情况2-2，2-4，2-6即是1，3，5的镜像对称，d为右节点，请自行思考下；

  情况2-7：兄弟节点和兄弟节点子节点均为黑色：

    情况2-7-1：父节点为红色；将父节点变为黑色，兄弟节点变为红色，删除d节点，结束；

  ![情况2-7-1：父节点为红色](./images/red-black-tree/red-black-tree-14.png)

    情况2-7-2：父节点为黑色；将兄弟节点变为红色，删除d节点，从父节点开始，进行树的平衡操作；

  ![情况2-7-1：父节点为黑色黑色](./images/red-black-tree/red-black-tree-15.png)

  具体实现代码如下：

  ```java
    // RedBlackTree.java

   /**
    * 删除节点
    * @param T
    * @param d
    */
   public void RB_DELETE(RedBlackTree T, RedBlackTreeNode d) {
      RedBlackTreeNode nil = RedBlackTree.nil;
      RedBlackTreeNode y = null;

      if (IsNil(d.getRight()) == false && IsNil(d.getLeft()) == false) {
         /**
          * 情形1：有左右节点
          * 后继节点是右子树中最小的值
          * 找到后继节点，后继节点的值替换当前节点值，只替换值，不替换颜色
          * 并把后继节点设为待删除节点，继续下述判断
          * 注意：此时待删除节点变为了后继节点
          * 后继节点只有右子树
          *
          */
         y = TREE_MINIMUM(d.getRight());
         d.setKey(y.getKey());
         d = y;
      }
      if (IsNil(d.getLeft()) == true && IsNil(d.getRight()) == true) {
         /**
          * 情形2：没有左右节点
          */
         if (d.getParent() == null || IsNil(d.getParent())) {
            // 根节点 直接删除
            T.setRoot(nil);
         } else {
            // 非根节点
            if (d.getColor() == NodeColor.Red) {
               // 红色节点 直接删除
               if (d.getParent().getLeft() == d){
                  // d是左节点
                  d.getParent().setLeft(nil);
               } else {
                  // d是右节点
                  d.getParent().setRight(nil);
               }
            } else {
               // d 黑色节点
               // 父亲节点
               RedBlackTreeNode p = d.getParent();
               // 兄弟节点
               RedBlackTreeNode s = null;

               if (p.getLeft() == d) {
                  // d 是父节点左节点
                  s = p.getRight();
                  if (s.getColor() == NodeColor.Red) {
                     /**
                      * 情况2-1
                      * d 是父节点左节点，兄弟节点是红色
                      * p节点左旋，p节点变为红色，s节点变为黑色
                      * 变换后 d的兄弟节点肯定为黑色，变成情况2-3或情况2-5
                      */
                     RedBlackTreeNode sl = s.getLeft();
                     LEFT_ROTATE(T, p);
                     p.setColor(NodeColor.Red);
                     s.setColor(NodeColor.Black);
                     // d的兄弟节点变为之前兄弟节点的左节点，一定为黑色
                     s = d.getParent().getRight();
                  }
                  if (s.getLeft().getColor() == NodeColor.Red){
                     /**
                      * 情况2-3
                      * 兄弟节点为黑色，近侄子节点为红色
                      * 即兄弟节点右节点为黑色，左节点为红色
                      * s节点右旋， s和sl换色
                      * 变换前 s一定为黑色，sl一定为红色
                      * 变换后  s为红色，sl为黑色
                      * d的兄弟节点变为之前兄弟节点的左节点sl
                      * 变成情况2-5继续处理
                      */
                     RedBlackTreeNode sl = s.getLeft();
                     s.setColor(NodeColor.Red);
                     s.getLeft().setColor(NodeColor.Black);
                     s = sl;
                     RIGHT_ROTATE(T, s);
                  }
                  if (s.getRight().getColor() == NodeColor.Red){
                     /**
                      * 情况2-5
                      * 兄弟节点为黑色，远侄子为红色
                      * 即兄弟节点右节点为红色
                      * p右旋， s设为p的颜色，p设为黑色，sr设为黑色，删除d节点
                      */
                     LEFT_ROTATE(T, p);
                     s.setColor(p.getColor());
                     p.setColor(NodeColor.Black);
                     s.getRight().setColor(NodeColor.Black);
                     // 删除d，完成删除操作
                     d.getParent().setLeft(nil);
                     return;
                  }
                  /**
                   * 情况2-7右节点和右节点子节点均为黑色
                   */
                  if (p.getColor() == NodeColor.Red) {
                     /**
                      * 情况2-7-1
                      * 父节点为红色
                      * 将父节点变为黑色
                      * 兄弟节点变为红色
                      * 删除节点 结束
                      */
                     p.setColor(NodeColor.Black);
                     s.setColor(NodeColor.Red);
                     p.setLeft(nil);
                     return;
                  } else {
                     /**
                      * 情况2-7-2
                      * 父节点为黑色
                      * s类似新插入的节点
                      * 进行变色插入变色调整
                      * 删除 d节点
                      */
                     p.setLeft(nil);
                     s.setColor(NodeColor.Red);
                     RB_DELETE_FIXUP(T, p);
                     return;
                  }

               } else {
                  // d 是父节点右节点
                  s = p.getLeft();
                  if (s.getColor() == NodeColor.Red) {
                     /**
                      * 情况2-2
                      * d 是父节点右节点，兄弟节点是红色
                      * p节点右旋，p节点变为红色，s节点变为黑色
                      * 变换后 d的兄弟节点肯定为黑色，变成情况2-4或情况2-6
                      */
                     RIGHT_ROTATE(T, p);
                     p.setColor(NodeColor.Red);
                     s.setColor(NodeColor.Black);
                     // d的兄弟节点变为之前兄弟节点的右节点，一定为黑色
                     s = s.getRight();
                  }
                  if (s.getRight().getColor() == NodeColor.Red) {
                     /**
                      * 情况2-4
                      * d 是父节点右节点， 兄弟节点为黑色，近侄子节点为红色，?远侄子节点为黑色
                      * s 节点左旋，s和sr换色
                      * 变色前 s 一定为黑色，sr一定为红色
                      * 变色后 s 一定为红色，sr一定为黑色
                      * d的兄弟节点变为之前兄弟节点的右节点
                      * 变成情况2-6继续处理
                      */
                     RedBlackTreeNode sr = s.getRight();
                     s.setColor(NodeColor.Red);
                     s.getRight().setColor(NodeColor.Black);
                     LEFT_ROTATE(T, s);
                     s = sr;
                  }
                  if (s.getLeft().getColor() == NodeColor.Red) {
                     /**
                      * 情况2-6
                      * 兄弟节点为黑色，且远侄子为红色
                      * 即兄弟节点左节点为红色
                      * s设为p颜色，p设为黑色，sl设为黑色，删除节点d
                      */
                     LEFT_ROTATE(T, p);
                     s.setColor(p.getColor());
                     p.setColor(NodeColor.Black);
                     s.getLeft().setColor(NodeColor.Black);
                     // 删除d，完成删除操作
                     d.getParent().setRight(nil);
                     return;
                  }

                  /**
                   * 情况2-8 兄弟节点和兄弟节点子节点均为黑色
                   */
                  if (p.getColor() == NodeColor.Red) {
                     /**
                      * 父节点为红色
                      * 将父节点变为黑色
                      * 兄弟节点变为红色
                      * 删除节点 结束
                      */
                     p.setColor(NodeColor.Black);
                     s.setColor(NodeColor.Red);
                     p.setRight(nil);
                     return;
                  } else {
                     /**
                      * 父节点为黑色
                      * s类似新插入的节点
                      * 进行变色插入变色调整 ？？？？？？
                      * 删除 d节点
                      */
                     p.setRight(nil);
                     s.setColor(NodeColor.Red);
                     RB_DELETE_FIXUP(T, p);
                     return;
                  }
               }
            }
         }
      }
      /**
       * 情形3：d节点只有一个左节点或者一个右节点
       * 此时d节点一定是黑色，左节点或者右节点为空，其他情况不会出现
       * 左子树或者右子树根节点为红色
       * 这种情况下的处理方式就是
       * 用存在的左子树或者右子树替换d节点
       */
      if (IsNil(d.getLeft()) == false) {
         // 左子树存在
         RedBlackTreeNode dl = d.getLeft();
         dl.setColor(NodeColor.Black);
         RB_TRANSPLANT(T, d, dl);
      } else {
         // 右子树存在
         RedBlackTreeNode dr = d.getRight();
         dr.setColor(NodeColor.Black);
         RB_TRANSPLANT(T, d, dr);
      }
   }
  ```

  情况2-7-2的情况，进行树平衡代码实现如下：

  ```java
    // RedBlackTree.java
   /**
    * 删除节点调整
    * @param T
    * @param x
    */
   public void RB_DELETE_FIXUP(RedBlackTree T, RedBlackTreeNode x){
      //临时结点
      RedBlackTreeNode w = null;
      //非根结点且为黑色
      while( x != T.getRoot() && x.getColor() == NodeColor.Black ){
         //x为父结点左孩子
         if( x == x.getParent().getLeft() ){
            //w为兄弟结点
            w = x.getParent().getRight();
            //case1：w兄弟结点为红色， w一定有两个子节点
            if( w.getColor() == NodeColor.Red ){
               //w设为黑色
               w.setColor(  NodeColor.Black );
               //被删结点的父结点设为黑色
               x.getParent().setColor( NodeColor.Red );
               //对x的父结点左旋
               LEFT_ROTATE(T, x.getParent());
               //更新x的兄弟结点
               w = x.getParent().getRight();
            }
            //case2：w兄弟结点和两个孩子结点都为黑
            if( w.getLeft().getColor() == NodeColor.Black && w.getRight().getColor() == NodeColor.Black ){
               //w设为黑色
               w.setColor(NodeColor.Red);
               //重设x为x的父结点
               x = x.getParent();
            }
            //case3：w兄弟结点为黑，w的左孩子为红，右孩子为黑
            else if( w.getRight().getColor() == NodeColor.Black ){
               //w的左孩子设为黑
               w.getLeft().setColor(NodeColor.Black);
               //w设为红
               w.setColor(NodeColor.Red);
               //右旋
               RIGHT_ROTATE(T, w);
               //更新w
               w = x.getParent().getRight();
            }
            //case4：w兄弟结点为黑，w的右孩子为红
            w.setColor(x.getParent().getColor());
            x.getParent().setColor(NodeColor.Black);
            w.getRight().setColor(NodeColor.Black);
            LEFT_ROTATE(T, x.getParent());
            x = T.getRoot();
         }
         //x为父结点右孩子
         else{
            w = x.getParent().getLeft();
            if( w.getColor() == NodeColor.Red ){
               w.setColor(  NodeColor.Black );
               x.getParent().setColor( NodeColor.Red );
               RIGHT_ROTATE(T, x.getParent());
               w = x.getParent().getLeft();
            }
            if( w.getRight().getColor() == NodeColor.Black && w.getLeft().getColor() == NodeColor.Black ){
               w.setColor(NodeColor.Red);
               x = x.getParent();
            }
            else if( w.getLeft().getColor() == NodeColor.Black ){
               w.getRight().setColor(NodeColor.Black);
               w.setColor(NodeColor.Red);
               LEFT_ROTATE(T, w);
               w = x.getParent().getLeft();
            }
            w.setColor(x.getParent().getColor());
            x.getParent().setColor(NodeColor.Black);
            w.getLeft().setColor(NodeColor.Black);
            RIGHT_ROTATE(T, x.getParent());
            x = T.getRoot();
         }
      }
      x.setColor(NodeColor.Black);
   }

  ```



### 参考资料

- [【算法】红黑树插入数据的情况与实现（三）](https://blog.csdn.net/lsr40/article/details/85266069)

- [csxiaoyao 博客 —— 红黑树算法的Java实现 【原创】](https://www.csxiaoyao.cn/blog/index.php/2016/10/23/java/)

- [红黑树之删除节点](https://www.cnblogs.com/qingergege/p/7351659.html)