---
title: Java - Spring Boot で REST なアプリを作ってみる
categories: tech
tags: java spring-boot spring-framework rest maven lombok
header:
  teaser: /assets/posts/2014-11-23-java-spring-boot-rest-800x369.png
  og_image: /assets/posts/2014-11-23-java-spring-boot-rest-800x369.png
---

Spring Boot が熱そうなので試してみた。
それっぽいところまでは動いたのでメモ。

<!--more-->

## 作るもの

以前の記事と同じものを Spring Boot で実装してみる。

[GlassFish + JAX-RS (Jersey) で REST なアプリを作ってみる (Java)]({% post_url 2014-10-28-glassfish-jaxrs-java %})

* `POST /hoges` で Hoge データを登録する。
* `GET /hoges` で Hoge データのリストを取得する。
* `GET /hoges/{id}` で Hoge データを取得する。
* データは XML or JSON で返す。

## プロジェクト作成

ここではビルドツールには Maven を使う。
`pom.xml` はこんな感じ。

```xml
<project
  xmlns="http://maven.apache.org/POM/4.0.0"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">

  <modelVersion>4.0.0</modelVersion>
  <groupId>akihyro</groupId>
  <artifactId>try-spring-boot</artifactId>
  <version>1.0-SNAPSHOT</version>
  <packaging>jar</packaging>

  <name>try-spring-boot</name>
  <url>http://maven.apache.org</url>

  <properties>
    <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
  </properties>

  <parent>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-parent</artifactId>
    <version>1.1.9.RELEASE</version>
  </parent>

  <dependencies>
    <dependency>
      <groupId>org.projectlombok</groupId>
      <artifactId>lombok</artifactId>
      <version>1.14.8</version>
      <scope>provided</scope>
    </dependency>
    <dependency>
      <groupId>org.springframework.boot</groupId>
      <artifactId>spring-boot-starter-web</artifactId>
    </dependency>
  </dependencies>

  <build>
    <plugins>
      <plugin>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-maven-plugin</artifactId>
      </plugin>
    </plugins>
  </build>

</project>
```

* 親プロジェクトに `spring-boot-starter-parent`
* 依存関係に `spring-boot-starter-web`
* ビルドプラグインに `spring-boot-maven-plugin`

を指定してるのが今回のメイン。
`lombok` は本題と直接関係ないけど、実装を楽する為に入れてる。

## アプリケーションクラス作成

アプリのエントリポイントになるクラスを作る。
コンテナが必要なタイプと違って `main` メソッドを書く。

```java
package akihyro.tryspringboot;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.EnableAutoConfiguration;
import org.springframework.context.annotation.ComponentScan;

@ComponentScan
@EnableAutoConfiguration
public class Application {
  public static void main(String[] args) {
    SpringApplication.run(Application.class, args);
  }
}
```

`@ComponentScan` は、この後書くコントローラを認識して貰う為に必要っぽい。
`@EnableAutoConfiguration` は、 Spring の自動設定に必要みたい。
この辺がどう動いてるのかは別の機会に追いかけてみたいなー。

## データクラス作成

1つのデータを表すクラスを用意する。単純な Bean。

Getter/Setter は Lombok の `@Data` で楽する。
あとレスポンスを XML でも返せるように、 JAXB の `@XmlRootElement` も付けてる。

```java
package akihyro.tryspringboot.hoges;
import java.util.List;
import javax.xml.bind.annotation.XmlRootElement;
import lombok.Data;

@Data @XmlRootElement
public class HogeData {
  private Integer integer;
  private String string;
  private List<String> strings;
}
```

## コントローラ作成

リクエストを捌くクラス。

`@RestController` で REST コントローラであることを
フレームワークに教えてあげてるんだと思う。
パスや HTTP メソッド (GET/POST) は `@RequestMapping` でマッピングする。

```java
package akihyro.tryspringboot.hoges;
import java.util.ArrayList;
import java.util.List;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.util.UriComponentsBuilder;
import lombok.val;

@RestController
@RequestMapping("/hoges")
public class HogeController {
  private static List<HogeData> store = new ArrayList<HogeData>();

  @RequestMapping(method = RequestMethod.POST)
  public ResponseEntity<HogeData> post(@ModelAttribute HogeData data, UriComponentsBuilder uriComponentsBuilder) {
    store.add(data);
    val headers = new HttpHeaders();
    headers.setLocation(uriComponentsBuilder.path("/hoges/{id}").buildAndExpand(store.size()).toUri());
    return new ResponseEntity<HogeData>(data, headers, HttpStatus.CREATED);
  }

  @RequestMapping(method = RequestMethod.GET)
  public List<HogeData> get() {
    return store;
  }

  @RequestMapping(value = "{id}", method = RequestMethod.GET)
  public HogeData get(@PathVariable int id) {
    return store.get(id - 1);
  }

}
```

他、細かいとこを説明すると...

* `@ModelAttribute` でリクエストパラメータを引数で受け取ってる。
  * デフォルトではフィールド名がパラメータ名として使われる。
  * JAX-RS の `@QueryParam`/`@FormParam` と違って、パラメータ名を省略出来ていい！
* POST の返却値は、 `Location` ヘッダも返したくて `ResponseEntity` にしてる。
  * `Location` ヘッダを付けないなら、 `HogeData` をそのまま返しても大丈夫。
* `UriComponentsBuilder` は、 `Location` ヘッダ用にアプリのルート URL を取得したくて使ってる。

## 動かしてみる

以上のソースで動かせた。
JAR を作って `java` コマンドで起動する。

```console
$ mvn package
$ java -jar target/try-spring-boot-1.0-SNAPSHOT.jar
```

前の記事と同じようにデータを POST で登録してみる。
XML/JSON 両方試す。

```console
$ curl -i -H "Accept: application/json" \
       -d "integer=1" \
       -d "string=aaa" \
       -d "strings=AAA1" -d "strings=AAA2" -d "strings=AAA3" \
       http://localhost:8080/hoges
HTTP/1.1 201 Created
Server: Apache-Coyote/1.1
Location: http://localhost:8080/hoges/1
Content-Type: application/json;charset=UTF-8
Transfer-Encoding: chunked
Date: Sat, 22 Nov 2014 20:39:34 GMT

{"integer":1,"string":"aaa","strings":["AAA1","AAA2","AAA3"]}

$ curl -i -H "Accept: application/xml" \
       -d "integer=2" \
       -d "string=bbb" \
       -d "strings=BBB1" -d "strings=BBB2" -d "strings=BBB3" \
       http://localhost:8080/hoges
HTTP/1.1 201 Created
Server: Apache-Coyote/1.1
Location: http://localhost:8080/hoges/2
Content-Type: application/xml
Transfer-Encoding: chunked
Date: Sat, 22 Nov 2014 20:40:48 GMT

<?xml version="1.0" encoding="UTF-8" standalone="yes"?><hogeData><integer>2</integer><string>bbb</string><strings>BBB1</strings><strings>BBB2</strings><strings>BBB3</strings></hogeData>
```

GET も XML/JSON 両方試す。

```console
$ curl -i -H "Accept: application/json" http://localhost:8080/hoges/1
HTTP/1.1 200 OK
Server: Apache-Coyote/1.1
Content-Type: application/json;charset=UTF-8
Transfer-Encoding: chunked
Date: Sat, 22 Nov 2014 20:41:51 GMT

{"integer":1,"string":"aaa","strings":["AAA1","AAA2","AAA3"]}

$ curl -i -H "Accept: application/xml" http://localhost:8080/hoges/2
HTTP/1.1 200 OK
Server: Apache-Coyote/1.1
Content-Type: application/xml
Transfer-Encoding: chunked
Date: Sat, 22 Nov 2014 20:42:05 GMT

<?xml version="1.0" encoding="UTF-8" standalone="yes"?><hogeData><integer>2</integer><string>bbb</string><strings>BBB1</strings><strings>BBB2</strings><strings>BBB3</strings></hogeData>
```

出来た!!

## はじめての Spring Boot

本当はこちらを拝読しながら試してみたかったけど、在庫切れでまだ買えてまへん...

<iframe style="width:120px;height:240px;" marginwidth="0" marginheight="0" scrolling="no" frameborder="0" src="//rcm-fe.amazon-adsystem.com/e/cm?lt1=_blank&bc1=000000&IS2=1&bg1=FFFFFF&fc1=000000&lc1=0000FF&t=akkinoc.dev-22&language=ja_JP&o=9&p=8&l=as4&m=amazon&f=ifr&ref=as_ss_li_til&asins=4777518655&linkId=1d67988c40924a8f2fb18be2aecea74b"></iframe>

## コード (GitHub)

[Release rbox-20141123 - akihyro/try-spring-boot](https://github.com/akihyro/try-spring-boot/releases/tag/rbox-20141123)
