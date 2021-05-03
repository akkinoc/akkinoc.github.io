---
title: Java - Spring Boot のログ出力実装に Log4j2 を使う
categories: tech
tags: java spring-boot spring-framework log4j slf4j logback
header:
  teaser: /assets/posts/2014-12-09-spring-boot-log4j2-800x200.png
  overlay_image: /assets/posts/2014-12-09-spring-boot-log4j2-800x200.png
---

Spring Boot (1.1.9) のデフォルトのログ出力実装には [Logback] が使われてる。
自分は Log4j の設定方法に慣れてるので、 [Log4j2] に切り替えてみる。

[Logback]: http://logback.qos.ch
[Log4j2]: http://logging.apache.org/log4j/2.x

<!--more-->

## Spring Boot のデフォルトは SLF4J + Logback

依存関係を見てみるとこんな感じ。

```text
org.springframework.boot:spring-boot-starter:jar:1.1.9.RELEASE:compile
+- org.springframework.boot:spring-boot-starter-logging:jar:1.1.9.RELEASE:compile
   +- org.slf4j:jcl-over-slf4j:jar:1.7.7:compile
   |  \- (org.slf4j:slf4j-api:jar:1.7.7:compile - version managed from 1.7.5; omitted for duplicate)
   +- org.slf4j:jul-to-slf4j:jar:1.7.7:compile
   |  \- (org.slf4j:slf4j-api:jar:1.7.7:compile - omitted for duplicate)
   +- org.slf4j:log4j-over-slf4j:jar:1.7.7:compile
   |  \- (org.slf4j:slf4j-api:jar:1.7.7:compile - omitted for duplicate)
   \- ch.qos.logback:logback-classic:jar:1.1.2:compile
      +- ch.qos.logback:logback-core:jar:1.1.2:compile
      \- (org.slf4j:slf4j-api:jar:1.7.7:compile - version managed from 1.7.6; omitted for duplicate)
```

[SLF4J の図](http://www.slf4j.org/legacy.html) ではこれに当たる。

[![Image: Logback]][Image: Logback]

[Image: Logback]: {% link assets/posts/2014-12-09-spring-boot-log4j2-logback-641x426.jpg %}

JUL (java.util.logging) とか JCL (Apache Commons Logging) とか Log4j とか、
主要なのは全部かき集めてくれてていい感じ。

## Log4j 1.x 系に切り替えるのは簡単 (だと思う)

依存関係から `spring-boot-starter-logging` を外して、
`spring-boot-starter-log4j` を追加すれば良さそう (試してないけど)。

[Guide 61. Logging - Spring Boot Reference](http://docs.spring.io/spring-boot/docs/current/reference/html/howto-logging.html)

```xml
<dependency>
  <groupId>org.springframework.boot</groupId>
  <artifactId>spring-boot-starter</artifactId>
  <exclusions>
    <exclusion>
      <groupId>org.springframework.boot</groupId>
      <artifactId>spring-boot-starter-logging</artifactId>
    </exclusion>
  </exclusions>
</dependency>
<dependency>
  <groupId>org.springframework.boot</groupId>
  <artifactId>spring-boot-starter-log4j</artifactId>
</dependency>
```

[SLF4J の図](http://www.slf4j.org/legacy.html) ではこれに当たるんだと思う。

[![Image: Log4j]][Image: Log4j]

[Image: Log4j]: {% link assets/posts/2014-12-09-spring-boot-log4j2-log4j-588x464.jpg %}

でも今回使いたいのは Log4j2!

## Log4j2 に切り替える

ちょっと長いけどこんな。

1.x 系と同じように `spring-boot-starter-logging` を外して、
あとは Log4j2 を使うのに必要なものを1つずつ追加していく。
依存関係を一発解決してくれる Spring Boot らしさは損なっちゃうけど。

```xml
<dependency>
  <groupId>org.springframework.boot</groupId>
  <artifactId>spring-boot-starter</artifactId>
  <exclusions>
    <exclusion>
      <groupId>org.springframework.boot</groupId>
      <artifactId>spring-boot-starter-logging</artifactId>
    </exclusion>
  </exclusions>
</dependency>
<dependency>
  <groupId>org.slf4j</groupId>
  <artifactId>jul-to-slf4j</artifactId>
</dependency>
<dependency>
  <groupId>org.slf4j</groupId>
  <artifactId>jcl-over-slf4j</artifactId>
</dependency>
<dependency>
  <groupId>org.apache.logging.log4j</groupId>
  <artifactId>log4j-slf4j-impl</artifactId>
  <version>2.1</version>
</dependency>
<dependency>
  <groupId>org.apache.logging.log4j</groupId>
  <artifactId>log4j-core</artifactId>
  <version>2.1</version>
</dependency>
```

処理の流れは `spring-boot-starter-log4j` とほぼ同じ。
Log4j の部分が Log4j2 に変わっただけ。

あと Log4j 1.x 系のインターフェイスも残すなら、
`log4j-1.2-api` を追加すればいいと思う。
Log4j 2.x 系に内部で転送してくれるみたい。

```xml
<dependency>
  <groupId>org.apache.logging.log4j</groupId>
  <artifactId>log4j-1.2-api</artifactId>
  <version>2.1</version>
</dependency>
```

## Spring Boot 1.2 では楽できそうな予感

こんなの出来てた！
Spring Boot 1.2 からは楽に使えそうな予感。

[spring-boot-starter-log4j2 at v1.2.0.RC2 - spring-projects/spring-boot](https://github.com/spring-projects/spring-boot/tree/v1.2.0.RC2/spring-boot-starters/spring-boot-starter-log4j2)
