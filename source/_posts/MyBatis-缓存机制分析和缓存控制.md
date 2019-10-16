---
title: MyBatis 缓存机制分析和缓存控制
date: 2019-09-11 17:30:46
tags:
---


### 前言

  > MyBatis 是一款优秀的持久层框架，它支持定制化 SQL、存储过程以及高级映射。MyBatis 避免了几乎所有的 JDBC 代码和手动设置参数以及获取结果集。MyBatis 可以使用简单的 XML 或注解来配置和映射原生类型、接口和 Java 的 POJO（Plain Old Java Objects，普通老式 Java 对象）为数据库中的记录。
                                               <p align="right">-- [MyBatis官网](http://www.mybatis.org/mybatis-3/zh/index.html)</p>

  Spring 系列的框架搭配 MyBatis 进行项目开发也是一种比较主流的项目开发模式，因此去了解 MyBatis 底层的数据缓存机制、Mapper 映射、会话管理等机制，对项目优化非常重要。本文将简要介绍 MyBatis 的两个等级数据缓存，以及谈谈如何定制细粒度，符合项目实际需求的二级缓存方案。
  
<!-- more -->

### MyBatis 两个等级缓存

#### 1. MyBatis 工作流程简单介绍

  每个基于 MyBatis 的应用都是以一个 SqlSessionFactory 的实例为核心的。SqlSessionFactory 的实例可以通过 SqlSessionFactoryBuilder 获得。而 SqlSessionFactoryBuilder 则可以从 XML 配置文件或一个预先定制的 Configuration 的实例构建出 SqlSessionFactory 的实例。

```java
/* mybatis 配置文件, 主要包含一下配置信息：
  properties（属性）
  settings（设置）
  typeAliases（类型别名）
  typeHandlers（类型处理器）
  objectFactory（对象工厂）
  plugins（插件）
  environments（环境配置）
    environment（环境变量）
      transactionManager（事务管理器）
      dataSource（数据源）
  databaseIdProvider（数据库厂商标识）
  mappers（映射器）
  **/
String resource = "org/mybatis/example/mybatis-config.xml";
// 读取配置文件
InputStream inputStream = Resources.getResourceAsStream(resource);
// 解析配置文件，通过 SqlSessionFactoryBuilder 类的 build 方法构建出 SqlSessionFactory
SqlSessionFactory sqlSessionFactory = new SqlSessionFactoryBuilder().build(inputStream);

// 从 SqlSessionFactory 中获取 SqlSession 会话
// SqlSession 完全包含了面向数据库执行 SQL 命令所需的所有方法。你可以通过 SqlSession 实例来直接执行已映射的 SQL 语句
try (SqlSession sqlSession = sqlSessionFactory.openSession()) {
  Blog blog = (Blog) sqlSession.selectOne("org.mybatis.example.BlogMapper.selectBlog", 101);
}

```

同时，上面代码需要定义，并在 mybatis-config.xml 中包含了对应的 mapper 文件：

```xml
<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE mapper
  PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN"
  "http://mybatis.org/dtd/mybatis-3-mapper.dtd">
<mapper namespace="org.mybatis.example.BlogMapper">
  <select id="selectBlog" resultType="Blog">
    select * from Blog where id = #{id}
  </select>
</mapper>
```

从上面的简单的代码中，已经完成了 MyBatis 的加载配置、开启会话、执行sql语句操作，SqlSession 内部的映射对应 mapper 文件和语句解析，则是一个更大的话题，这里不继续深入研究。

**注意：**
**1. SqlSessionFactory 是创建 SqlSession 的工厂，在应用生命周期内，创建后不应该被丢弃或者多次创建，也就是 SqlSessionFactory 的生命周期最好存在于整个应用的生命周期内。**
**2. 通常而言，每有一个请求，就开启一次 SqlSession，完成 Http 响应后，就关闭这次会话，也意味着这个 SqlSession 的生命周期结束。**

#### 2. 基于 SqlSession 的一级缓存

  上面提及到的 SqlSession 是一次数据库会话或者一次数据库事务的最小单位，在创建 SqlSession 的同时，会在其内部创建一个 Exector 执行器，Exector 内部的 PerpetualCache 中有一个 HashMap 对象，这就是一级缓存数据最终保存的位置，如下代码：

```java
// DefaultSqlSessionFactory.java 
  @Override
  public SqlSession openSession() {
    return openSessionFromDataSource(configuration.getDefaultExecutorType(), null, false);
  }

  private SqlSession openSessionFromDataSource(ExecutorType execType, TransactionIsolationLevel level, boolean autoCommit) {
    Transaction tx = null;
    try {
      final Environment environment = configuration.getEnvironment();
      final TransactionFactory transactionFactory = getTransactionFactoryFromEnvironment(environment);
      tx = transactionFactory.newTransaction(environment.getDataSource(), level, autoCommit);
      final Executor executor = configuration.newExecutor(tx, execType);
      return new DefaultSqlSession(configuration, executor, autoCommit);
    } catch (Exception e) {
      closeTransaction(tx); // may have fetched a connection so lets call close()
      throw ExceptionFactory.wrapException("Error opening session.  Cause: " + e, e);
    } finally {
      ErrorContext.instance().reset();
    }
  }
```

```java
// DefaultSqlSession.java
  public DefaultSqlSession(Configuration configuration, Executor executor, boolean autoCommit) {
    this.configuration = configuration;
    this.executor = executor;
    this.dirty = false;
    this.autoCommit = autoCommit;
  }
```

```java
// BaseExecutor.java
  protected BaseExecutor(Configuration configuration, Transaction transaction) {
    this.transaction = transaction;
    this.deferredLoads = new ConcurrentLinkedQueue<>();
    this.localCache = new PerpetualCache("LocalCache");
    this.localOutputParameterCache = new PerpetualCache("LocalOutputParameterCache");
    this.closed = false;
    this.configuration = configuration;
    this.wrapper = this;
  }
```

```java
// PerpetualCache.java
public class PerpetualCache implements Cache {

  private final String id;

  private Map<Object, Object> cache = new HashMap<>();

  public PerpetualCache(String id) {
    this.id = id;
  }

  @Override
  public String getId() {
    return id;
  }

  @Override
  public int getSize() {
    return cache.size();
  }

  @Override
  public void putObject(Object key, Object value) {
    cache.put(key, value);
  }

  @Override
  public Object getObject(Object key) {
    return cache.get(key);
  }

  @Override
  public Object removeObject(Object key) {
    return cache.remove(key);
  }

  @Override
  public void clear() {
    cache.clear();
  }

  @Override
  public boolean equals(Object o) {
    if (getId() == null) {
      throw new CacheException("Cache instances require an ID.");
    }
    if (this == o) {
      return true;
    }
    if (!(o instanceof Cache)) {
      return false;
    }

    Cache otherCache = (Cache) o;
    return getId().equals(otherCache.getId());
  }

  @Override
  public int hashCode() {
    if (getId() == null) {
      throw new CacheException("Cache instances require an ID.");
    }
    return getId().hashCode();
  }

}
```

在 SqlSession 执行查询任务时，根据statementId,params,rowBounds来构建一个key值，根据这个key值将结果缓存 Cache 中；下次再执行查询时，判断对应key值缓存中是否有数据，如果有，直接返回结果；如果没有，会去数据库中查询数据。

这个缓存在 SqlSession 中执行了任何一个update操作(update()、delete()、insert()) 后都会清空数据。同时也可以手动的清空其中缓存的数据。

一级缓存是MyBatis内部实现的一个特性，用户不能配置，默认情况下自动支持的缓存，用户没有定制它的权利。


#### 3. 应用级别的二级缓存

一级缓存是 SqlSession实现的，随着 SqlSession 生命周期的结束，也将失效。而二级缓存则是 MyBatis 设计的，在整个生命周期内，都可用的数据缓存，前提是设置 "cacheEnabled=true"， 默认下是开启的。

在 DefaultSqlSessionFactory 生成 SqlSession 的时候，如果 cacheEnabled 开启，会对Executor对象加上一个装饰者：CachingExecutor，这时SqlSession使用CachingExecutor对象来完成操作请求。CachingExecutor对于查询请求，会先判断该查询请求在Application级别的二级缓存中是否有缓存结果，如果有查询结果，则直接返回缓存结果；如果缓存中没有，再交给真正的Executor对象来完成查询操作，之后CachingExecutor会将真正Executor返回的查询结果放置到缓存中，然后在返回给用户。

```java
// Config.java
  public Executor newExecutor(Transaction transaction, ExecutorType executorType) {
    executorType = executorType == null ? defaultExecutorType : executorType;
    executorType = executorType == null ? ExecutorType.SIMPLE : executorType;
    Executor executor;
    if (ExecutorType.BATCH == executorType) {
      executor = new BatchExecutor(this, transaction);
    } else if (ExecutorType.REUSE == executorType) {
      executor = new ReuseExecutor(this, transaction);
    } else {
      executor = new SimpleExecutor(this, transaction);
    }
    if (cacheEnabled) {
      executor = new CachingExecutor(executor);
    }
    executor = (Executor) interceptorChain.pluginAll(executor);
    return executor;
  }
```

二级缓存存在于整个应用的生命周期，但是其内部缓存的数据根据 mapper 的命名空间，进行了更细致的划分，默认一个 mapper 一个命名空间，但可以 通过 **<cache-ref namespace="mapper-namespace"></cache-ref>** 指定多个 mapper 公用一个命名空间。

<!-- 同时 MyBatis 可以对一条查询语句设置是否启用缓存， 使用**<select ... useCache="true">...</select>** -->
同时 MyBatis 可以对一条查询语句设置是否启用缓存， 使用&lt;select  useCache="true"&gt;...&lt;/select&gt;

