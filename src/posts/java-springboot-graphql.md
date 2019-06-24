---
slug: bushwick-artisan
title: GraphQL Java上手[译]
createAt: 1560507867060
---
<!-- https://www.graphql-java.com/tutorials/getting-started-with-spring-boot/ -->

这篇引导文章适合想在java中使用GraphQL的开发者。在开始之前，你需要有一些Spring Boot和Java的知识，在文中也会有一些关于GraphQL的简单的介绍，但这篇文章的重点仍然是使用Java开发一个GraphQL服务。

原文地址： [https://www.graphql-java.com/tutorials/getting-started-with-spring-boot/](https://www.graphql-java.com/tutorials/getting-started-with-spring-boot/)

### 3分钟了解GraphQL

GraphQL是一门从服务中查询数据的语言，在某些方面，他可以替代REST，SOAP或者gRPC。

假设我们想从一个在线后端存储中取回一本书的详细信息，在GraphQL中，你可以发送一个书的id是'123'的查询条件到服务器：

```javascript
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

```javascript
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

```javascript
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

```javascript
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

```javascript
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

```javascript
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

```javascript
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

![graphql](./images/graphql-schema.png)

### DataFetchers

GraphQL Java服务最重要的部分可能就是**DataFetcher**了：**DataFetcher**会在查询执行的时候，从一个field获取数据。

GraphQL Java 执行一个查询的时候，会对其中的每一个field调用对应的**DataFetcher**。一个***DataFetcher**就是一个Interface(Java 接口)，里面只有一个方法，对应的一个**DataFetcherEnvironment**类型的参数：

```javascript
public interface DataFetcher<T> {
    T get(DataFetchingEnvironment dataFetchingEnvironment) throws Exception;
}
```


注意：schema中的**每一个**field都有一个**DataFetcher**与之关。如果你没有指定field对应的任何**DataFetcher**，会使用默认的**PropertyDataFetcher**。更多的细节会在更多详情中加以讨论。

现在创建一个class **GraphQLDataFethcers**，包含一个简单的书籍列表和作者列表。

文件内容如下，其中的细节在下面会加以说明：

```javascript
@Component
public class GraphQLDataFetchers {

    private static List<Map<String, String>> books = Arrays.asList(
            ImmutableMap.of("id", "book-1",
                    "name", "Harry Potter and the Philosopher's Stone",
                    "pageCount", "223",
                    "authorId", "author-1"),
            ImmutableMap.of("id", "book-2",
                    "name", "Moby Dick",
                    "pageCount", "635",
                    "authorId", "author-2"),
            ImmutableMap.of("id", "book-3",
                    "name", "Interview with the vampire",
                    "pageCount", "371",
                    "authorId", "author-3")
    );

    private static List<Map<String, String>> authors = Arrays.asList(
            ImmutableMap.of("id", "author-1",
                    "firstName", "Joanne",
                    "lastName", "Rowling"),
            ImmutableMap.of("id", "author-2",
                    "firstName", "Herman",
                    "lastName", "Melville"),
            ImmutableMap.of("id", "author-3",
                    "firstName", "Anne",
                    "lastName", "Rice")
    );

    public DataFetcher getBookByIdDataFetcher() {
        return dataFetchingEnvironment -> {
            String bookId = dataFetchingEnvironment.getArgument("id");
            return books
                    .stream()
                    .filter(book -> book.get("id").equals(bookId))
                    .findFirst()
                    .orElse(null);
        };
    }

    public DataFetcher getAuthorDataFetcher() {
        return dataFetchingEnvironment -> {
            Map<String,String> book = dataFetchingEnvironment.getSource();
            String authorId = book.get("authorId");
            return authors
                    .stream()
                    .filter(author -> author.get("id").equals(authorId))
                    .findFirst()
                    .orElse(null);
        };
    }
}
```

### 数据源

下面将会从这个类的数组中获取静态的书籍和作者数据。这个只是为了演示用。当然，有一点必须很明确，GraphQL不过关心数据来自于哪里。GraphQL可以从内存中的数组中，从数据库或者其他服务获取数据。

### Book DataFetcher

我们的第一个方法**getBookByIdDataFetcher**返回一个**DataFetcher**的实现，**DataFetcher**有一个入参 **DataFetcherEnvironment**，并返回书籍内容。在我们的例子中，就是说我们需要从 **bookById**filed中拿到 **id**参数，然后通过这个**id**找到这本书的详细信息。如果没找到相关信息，会返回null。

**String bookId = dataFetchingEnvironment.getArgument("id");**中的"id" 就是从schema里的**bookById**field。

```javascript
type Query {
  bookById(id: ID): Book 
}
...
```

### Author DataFetcher

我们的第二个方法**getAuthorDataFetcher**，返回**DataFetcher**用于书籍对应的作者信息。对比上面提到的书籍的**DataFetcher**，这个地方没有参数，但是有一个书籍的instance(实例)。从父field的**DataFetcher**的结果可以通过**getSource**获取。这里有一个重要的概念：filed对应的**DataFetcher**方法是自上而下的执行，子孙的**DataFetcherEnvironment**的**source**属性对应着祖先的结果。

然后我们可以通过已经获取到的书籍信息，获取到**authorId**，然后以和查询书籍信息相同的方式查询作者信息。

### Default DataFetchers

我们只实现了两个**DataFetchers**。如上面提到的，如果你不指定对应的 **DataFetcher**，会使用默认的**PropertyDataFetcher**。在这个例子中，就是说 **Book.id**，**Book.name**，**Book.pageCount**，**Author.id**，**Author.firstName**，**Author.lastName**都使用的是 **PropertyDataFetcher**。

**PropertyDataFetcher** 尝试使用多种方式来查询Java object 的属性。比说 **java.util.Map**，他会简单的通过key的方式查询。这种方式在这个项目中可以正常使用，因为书籍和作者Maps和schema中定义的filed是一样的。举个例子，在schema中，我们定义了书籍的field **pageCount**，书籍的**DataFetcher**就会返回一个带有 **pageCount**key的Map结构。因为field的名字和**Map**中pageCount的key(键)是一样的，所以**PropertyDataFetcher**就能正常使用。

现在假设另外一种情形，我们定在book **Map**中定义了另外一个key **totalPage**，而不是之前的**pageCount**，这时就会返回book中的 **pageCount**为null，因为**PropertyDataFetcher**不能获取正确的值。为了修复这个问题，你得在为**Book.pageCount**注册一个新的 **DataFetcher**，像下面这样：

```javascript
    // In the GraphQLProvider class
    private RuntimeWiring buildWiring() {
        return RuntimeWiring.newRuntimeWiring()
                .type(newTypeWiring("Query")
                        .dataFetcher("bookById", graphQLDataFetchers.getBookByIdDataFetcher()))
                .type(newTypeWiring("Book")
                        .dataFetcher("author", graphQLDataFetchers.getAuthorDataFetcher())
                        // This line is new: we need to register the additional DataFetcher
                        .dataFetcher("pageCount", graphQLDataFetchers.getPageCountDataFetcher()))
                .build();
    }

    // In the GraphQLDataFetchers class
    // Implement the DataFetcher
    public DataFetcher getPageCountDataFetcher() {
        return dataFetchingEnvironment -> {
            Map<String,String> book = dataFetchingEnvironment.getSource();
            return book.get("totalPages");
        };
    }
...
```

这个**DataFetcher**就是修复这个问题，通过查询book **Map**中正确的 key。（重申一遍：在这个例子中，我们不需要这个，因为我们的键是对应的）

### 尝试一下接口

上面你就完成了创建一个可以使用的GraphQL API。启动Spring Boot 应用后，访问**http://localhost:8080/graphql**试下。

最简单的尝试和探索GraphQL API的方式就是使用一些工具，如 [**GraphQL Playground**](https://github.com/prisma/graphql-playground)。下载然后运行它。

启动后，在GraphQL Playground中访问[http://localhost:8080/graphql](http://localhost:8080/graphql)。

然后你就可以查看我们的示例API，可以获取到上面提到的结果。结果应该像下面这样：

![graphql-demo.png](./images/graphql-demo.png)

### 完整的示例代码和更多信息

项目完整的代码在这里：[https://github.com/graphql-java/tutorials/tree/master/book-details](https://github.com/graphql-java/tutorials/tree/master/book-details)。

更多关于GraphQL Java 的文档地址：[https://www.graphql-java.com/documentation/](https://www.graphql-java.com/documentation/)。

在这里可以提出任何问题：[spectrum chat](https://spectrum.chat/graphql-java)。

想要直接的回复，可以在 Twitter [@GraphQL Java Twitter account](https://twitter.com/graphql_java)。

> Note: graphql的接口不能用一般的http请求加载，可以先用GraphQL Playground 进行测试，[下载链接](https://github.com/prisma/graphql-playground/releases)