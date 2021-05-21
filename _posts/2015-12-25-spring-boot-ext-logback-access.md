---
title: Spring Boot - Logback-access が使いやすくなる自動設定を作って公開した
categories: tech
tags: spring-boot spring-framework logback-access logback maven java
header:
  teaser: /assets/posts/2015-12-25-spring-boot-ext-logback-access-800x300.jpg
---

[Logback-access] を Spring Boot の組込み Tomcat or Jetty で
使いやすくする自動設定ライブラリを作りました。
Maven Central Repository に公開もしてみました。

[Logback-access]: http://logback.qos.ch/access.html

<!--more-->

## Logback-access とは

サーブレットコンテナの HTTP アクセスログを採るライブラリです。

簡単なアクセスログなら `server.tomcat.accesslog.*` あたりをいじれば
採れそうでしたが、自分の興味から Logback-access を使ってみました。

自前の Encoder や Layout を使いたい場合にいいかも。かも。

## 経緯

`LogbackValve` を Spring Boot の組込み Tomcat に仕込んでみました。

が、 LogbackValve はデフォルトで
`$TOMCAT_HOME/conf/logback-access.xml` を参照するようです。
組込み Tomcat だとテンポラリフォルダを参照しにいきました...

`LogbackValve#setFilename(String)` でファイルパスの変更も試しましたが、
残念なことに内部で `new File(String)` してて、
JAR ファイル内のリソースは使えませんでした...

* Spring Boot アプリなら JAR ファイル1つで動くようにしたい！
* 前々から Spring Boot の自動設定の仕組み
  (`@Conditional` 系アノテーション等) を使ってみたかった！

とゆーことで、今回 Logback-access の Auto-Configuration を作ってみました。

<blockquote class="twitter-tweet"><p lang="ja" dir="ltr">半分学習目的で Spring Boot の俺俺自動設定を作ってみてる。Conditional系アノテーションで色々な条件指定出来るの面白いなぁ。すごいなぁ。</p>&mdash; Akihiro Kondo (@akkinoc) <a href="https://twitter.com/akkinoc/status/676740259024015360?ref_src=twsrc%5Etfw">December 15, 2015</a></blockquote> <script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>

## 作ったもの

[akihyro/spring-boot-ext-logback-access - GitHub](https://github.com/akihyro/spring-boot-ext-logback-access)

クラスパスに加えれば、クラスパス直下の設定ファイル `logback-access.xml` を使って、
Tomcat の場合は LogbackValve, Jetty の場合は RequestLogImpl を自動で仕込みます。

## 使い方

### spring-boot-starter-web プロジェクトを用意

Tomcat ならこちら。

```xml
<dependency>
  <groupId>org.springframework.boot</groupId>
  <artifactId>spring-boot-starter-web</artifactId>
</dependency>
```

Jetty ならこちら。

```xml
<dependency>
  <groupId>org.springframework.boot</groupId>
  <artifactId>spring-boot-starter-web</artifactId>
  <exclusions>
    <exclusion>
      <groupId>org.springframework.boot</groupId>
      <artifactId>spring-boot-starter-tomcat</artifactId>
    </exclusion>
  </exclusions>
</dependency>
<dependency>
  <groupId>org.springframework.boot</groupId>
  <artifactId>spring-boot-starter-jetty</artifactId>
</dependency>
```

### 依存関係に spring-boot-ext-logback-access を追加

```xml
<dependency>
    <groupId>net.rakugakibox.springbootext</groupId>
    <artifactId>spring-boot-ext-logback-access</artifactId>
    <version>1.0</version>
</dependency>
```

### クラスパス直下に設定ファイル logback-access.xml を配置

common パターンでコンソールに吐きだすだけならこんな感じ。
詳しい設定方法は [Logback-access 公式ページ] に載ってます。

[Logback-access 公式ページ]: http://logback.qos.ch/access.html

```xml
<configuration>
  <appender name="CONSOLE" class="ch.qos.logback.core.ConsoleAppender">
    <encoder>
      <pattern>common</pattern>
    </encoder>
  </appender>
  <appender-ref ref="CONSOLE" />
</configuration>
```

`application.yml` 等でプロパティを調整すれば、ファイルパスは変更できます :)

```yaml
logback.access.config: "classpath:your-logback-access.xml"
```

以上！
