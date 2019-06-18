---
slug: bushwick-artisan
title: java-spring-boot和graphql上手
createAt: 1560507867060
---
<!-- https://www.graphql-java.com/tutorials/getting-started-with-spring-boot/ -->

这篇引导文章适合想在java中使用GraphQL的开发者。在开始之前，你需要有一些Spring Boot和Java的知识，在文中也会有一些关于GraphQL的简单的介绍，但这篇文章的重点仍然是使用Java开发一个GraphQL服务。

### 3分钟了解GraphQL

GraphQL是一门从服务中查询数据的语言，在某些方面，他可以替代REST，SOAP或者gRPC。

假设我们想从一个在线后端存储中取回一本书的详细信息，在GraphQL中，你可以发送一个书的id是'123'的查询条件到服务器：

```jsx
{
  bookById(id: "book-1"){
    id
    name
    pageCount
    author {
      firstName
      lastName
    }
  }
}
```

这不是JSON格式的数据（是故意设计成和JSON有点类型的格式），这是GraphQL查询。它大大致意思是：

- 查询一本书通过一个具体的id

- 返回id, name, pageCount和author字段

- author字段中，需要firstName和lastName字段

返回结果是普通的JSON结构：

```jsx
{ 
  "bookById":
  {
    "id":"book-1",
    "name":"Harry Potter and the Philosopher's Stone",
    "pageCount":223,
    "author": {
      "firstName":"Joanne",
      "lastName":"Rowling"
    }
  }
}
```

GraphQL的一个非常重要的特性就是，它是静态类型的：服务准确的知道你能查询的每个对象，客户端
其实是询问服务端，并且请求所谓的“schema”。schema描述所能进行的查询，和能够返回的字段。（注意：这里提到的schema,是指“GraphQL Schema”, 和其他类型的schema有点类似，比如 “JSON schema”和“Database Schema”）

上述查询的schema结构如下所示：

```jsx
type Query {
  bookById(id: ID): Book 
}

type Book {
  id: ID
  name: String
  pageCount: Int
  author: Author
}

type Author {
  id: ID
  firstName: String
  lastName: String
}
```

本文会着重于阐述，究竟如何用Java实现这个schema的GraphQL服务。

上面的例子仅对GraphQL的能力进行了初步的说明，可以在官网深入了解更多信息：[https://graphql.github.io/learn/](https://graphql.github.io/learn/)。

### GraphQL Java 概览

[GraphQL Java](https://www.graphql-java.com/) 是使用Java server对GraphQL的实现。在GraphQL Java的Github账户中，有几个仓库，其中最重要的一个就是[GraphQL Java Engine](https://github.com/graphql-java/graphql-java)，这是所有其他功能的基础。

GraphQL Java Engine 本身仅关注查询条件的执行，不会处理和HTTP或者JSON相关的问题。因此，可以采用[GraphQL Java Spring Boot](https://github.com/graphql-java/graphql-java-spring)项目，通过Spring Boot把API暴露到HTTP层面。

创建一个GraphQL Java server的主要步骤：

- 1. 定义一个GraphQL Schema

- 2. 定义查询返回的具体的数据

示例API：获取一本书的详情

这里的示例API就是一个简单的获取一本书的详细信息。这不算是一个全面的API，但对于这篇示例文章来说够用了。

### 创建一个Spring Boot应用

最简单的创建一个Spring Boot app的工具就是使用“Spring Initializr”网站的工具，在线生成：[ https://start.spring.io/]( https://start.spring.io/)。

选择以下选项：

- Gradle Project
- Java
- Spring Boot 2.1.x

使用以下项目元信息：

- Group: com.graphql-java.tutorial
- Artifact: book-details

项目的依赖，选择**Web**。

然后点击 **Generate Project**就会下载一个可以启动的Spring Boot app了。接下来提到的文件和路径，都会和这个项目相关联。

我们需要添加三个新的依赖到我们项目的**buidl.gradle**:

第一个是GraphQL Java，第二个是GraphQL Java Spring，第三个是[Google Guava](https://github.com/google/guava)。Guava 不是必须的，但是可以使我们的开发简单点。

添加后，项目依赖变成下面的样子：

```jsx
dependencies {
    implementation 'com.graphql-java:graphql-java:11.0' // NEW
    implementation 'com.graphql-java:graphql-java-spring-boot-starter-webmvc:1.0' // NEW
    implementation 'com.google.guava:guava:26.0-jre' // NEW
    implementation 'org.springframework.boot:spring-boot-starter-web'
    testImplementation 'org.springframework.boot:spring-boot-starter-test'
}
```

### Schema

在**src/main/resources**文件夹下添加一个文件**schema.graphql**，复制以下内容到文件中：

```jsx
type Query {
  bookById(id: ID): Book 
}

type Book {
  id: ID
  name: String
  pageCount: Int
  author: Author
}

type Author {
  id: ID
  firstName: String
  lastName: String
}
```

这个schema定义了一个顶级值域（在type **Query**中）：**bookById**会返回一本书的详情。

同时，其中也定义了 type **Book** 有下列值域：**id**、**name**、**pageCount**和**anthor**。**author**也是一个 type **Author**，定义在**Book**后面。

> 上面用于描述schema的语言称为 Schema Definition Language 或者 SDL。更多文档查看[这里](https://graphql.org/learn/schema/)。

现在有了这个文件，就需要通过读取这个文件来实现他，解析他，通过添加代码来加载数据。

在package **com.graphqljava.tutorial.bookdetails** 中新建一个 **GraphQLProvider**class，在里面添加一个**init**方法，来创建 **GraphQL**实例：

```jsx
@Component
public class GraphQLProvider {

    private GraphQL graphQL;

    @Bean
    public GraphQL graphQL() { 
        return graphQL;
    }

    @PostConstruct
    public void init() throws IOException {
        URL url = Resources.getResource("schema.graphqls");
        String sdl = Resources.toString(url, Charsets.UTF_8);
        GraphQLSchema graphQLSchema = buildSchema(sdl);
        this.graphQL = GraphQL.newGraphQL(graphQLSchema).build();
    }

    private GraphQLSchema buildSchema(String sdl) {
      // TODO: we will create the schema here later 
    }
}
```

使用Guava **Resources** 来读取这个文件，从类路径中，然后创建一个 **GraphQLSchema**和**GraphQL** 实例。这个 **GraphQL**实例通过**@Bean**注解 **graphQL()**方法暴露给Spring Bean。GraphQL Java Spring适配器会使用**GraphQL**实例将schema暴露给HTTP，默认路径是 **/graphql**。

还需要做的是实现 **buildSchema**方法，来创建**GraphQLSchema**实例，链接代码查询数据：

```jsx
    @Autowired
    GraphQLDataFetchers graphQLDataFetchers;

    private GraphQLSchema buildSchema(String sdl) {
        TypeDefinitionRegistry typeRegistry = new SchemaParser().parse(sdl);
        RuntimeWiring runtimeWiring = buildWiring();
        SchemaGenerator schemaGenerator = new SchemaGenerator();
        return schemaGenerator.makeExecutableSchema(typeRegistry, runtimeWiring);
    }

    private RuntimeWiring buildWiring() {
        return RuntimeWiring.newRuntimeWiring()
                .type(newTypeWiring("Query")
                        .dataFetcher("bookById", graphQLDataFetchers.getBookByIdDataFetcher()))
                .type(newTypeWiring("Book")
                        .dataFetcher("author", graphQLDataFetchers.getAuthorDataFetcher()))
                .build();
    }
```

**TypeDefinitionRegistry**是解析后的schema文件，**SchemaGenerator**将**RuntimeWiring**和**RuntimeWiring**结合，最终生成**GraphQLSchema**。

**buildRuntimeWiring**使用**graphQLDataFetchers**bean来注册两个**DataFetcher**：

- 一个取回书信息通过一个ID
- 一个用来查询书的作者信息

**DataFetcher**和如何实现**GraphQLDataFetchers** bean在下章讲解。

最终这个过程创建一个 **GraphQL**和一个 **GraphQLSchema**实例，如下图：