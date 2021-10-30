---
title: logback-access-spring-boot-starter を Kotlin で書き直した
categories: tech
tags: logback-access-spring-boot-starter kotlin java spring-boot spring-framework logback-access logback maven kotest github-actions
header:
  teaser: /assets/posts/2021-10-30-rewrote-logback-access-spring-boot-starter-in-kotlin-1200x630.png
  og_image: /assets/posts/2021-10-30-rewrote-logback-access-spring-boot-starter-in-kotlin-1200x630.png
---

先日の記事に続き、ずっと放置してしまっていた
logback-access-spring-boot-starter もアップデートしました (v3.0.0)。
今回も Kotlin で全て書き直しました。

<!--more-->

先日の記事:

* [yaml-resource-bundle を Kotlin で書き直した]({% post_url 2021-07-17-rewrote-yaml-resource-bundle-in-kotlin %})
* [orika-spring-boot-starter を Kotlin で書き直した]({% post_url 2021-08-29-rewrote-orika-spring-boot-starter-in-kotlin %})

## logback-access-spring-boot-starter とは

Java フレームワーク Spring Boot の拡張ライブラリです。
Logback-access という Web アクセスのロギングライブラリがあるのですが、
このライブラリを Spring Boot に自動で組み込み、使いやすくします。
Logback-access の設定は、クラスパス上に "logback-access.xml" を配置すれば自動認識します。

[akkinoc/logback-access-spring-boot-starter - GitHub](https://github.com/akkinoc/logback-access-spring-boot-starter)

Kotlin で書き直しましたが、 Java からも使えます。

## 使い方

依存関係を追加するだけで、

```xml
<dependency>
  <groupId>dev.akkinoc.spring.boot</groupId>
  <artifactId>logback-access-spring-boot-starter</artifactId>
  <version>3.0.0</version>
</dependency>
```

Spring Boot Web アプリケーションへアクセスした時に、
こんなアクセスログ (Common Log Format) が標準出力に流れます。

```console
0:0:0:0:0:0:0:1 - - [24/Oct/2021:15:32:03 +0900] "GET / HTTP/1.1" 200 319
0:0:0:0:0:0:0:1 - - [24/Oct/2021:15:32:03 +0900] "GET /favicon.ico HTTP/1.1" 404 111
0:0:0:0:0:0:0:1 - - [24/Oct/2021:15:32:04 +0900] "GET / HTTP/1.1" 304 0
```

出力先や出力フォーマットをカスタマイズしたい場合は、
クラスパス直下に "logback-access.xml" を配置/設定すれば OK です。

```xml
<configuration>
  <!-- ex) 標準出力に Common Log Format, ファイルに Combined Log Format で出力 -->
  <appender name="console" class="ch.qos.logback.core.ConsoleAppender">
    <encoder>
      <pattern>common</pattern>
    </encoder>
  </appender>
  <appender name="file" class="ch.qos.logback.core.FileAppender">
    <file>access.log</file>
    <encoder>
      <pattern>combined</pattern>
    </encoder>
  </appender>
  <appender-ref ref="console"/>
  <appender-ref ref="file"/>
</configuration>
```

設定ファイルの書き方の詳細は Logback-access 公式ドキュメントを参照ください:

* [Logback-access configuration](https://logback.qos.ch/access.html#configuration)

また、通常のロギングの Logback 設定 ("logback-spring.xml") と同様に、
`<springProfile>`, `<springProperty>` タグも使えるように拡張してあります。
実行環境によって出力先や出力フォーマットを変えたい場合に便利だと思います :)

> ```xml
> <springProfile name="staging">
>   <!-- configuration to be enabled when the "staging" profile is active -->
> </springProfile>
> <springProfile name="dev | staging">
>   <!-- configuration to be enabled when the "dev" or "staging" profiles are active -->
> </springProfile>
> <springProfile name="!production">
>   <!-- configuration to be enabled when the "production" profile is not active -->
> </springProfile>
> ```
>
> <footer><cite><a href="https://docs.spring.io/spring-boot/docs/2.5.6/reference/html/features.html#features.logging.logback-extensions.profile-specific">Spring Boot Logback Extension "Profile-specific Configuration"</a></cite></footer>

> ```xml
> <springProperty scope="context" name="fluentHost" source="myapp.fluentd.host" defaultValue="localhost"/>
> <appender name="FLUENT" class="ch.qos.logback.more.appenders.DataFluentAppender">
>   <remoteHost>${fluentHost}</remoteHost>
>   ...
> </appender>
> ```
>
> <footer><cite><a href="https://docs.spring.io/spring-boot/docs/2.5.6/reference/html/features.html#features.logging.logback-extensions.environment-properties">Spring Boot Logback Extension "Environment Properties"</a></cite></footer>

## コンセプトと頑張ってるところ

このライブラリには自分の中でいくつかコンセプトがあって、
そのために頑張って開発してる部分もあるので、ここで書き出しておきます。

### 通常のロギングの Logback 設定 ("logback-spring.xml") と同じ使い勝手

クラスパス上の設定ファイル ("logback-access(-test)(-spring).xml") を探して自動検知してます。
また、前記した通り `<springProfile>`, `<springProperty>` タグをサポートしています。

### Spring Boot がサポートしている Web サーバをサポート

現状だと Tomcat, Jetty, Undertow をサポートしています。
生の Logback-access だと Tomcat, Jetty しかサポートされていませんが、
Spring Boot がサポートしている Web サーバなら、できるだけ多くサポートしたいと思ってます。

これをやるには、 Tomcat, Jetty, Undertow 等、
各 Web サーバに備わっているロギング機能がどう実装されているのか参考にするため、
それぞれの内部実装まで個別に理解する必要があるのが大変なところです。

### WebFlux (リアクティブ) サポート

Spring Boot で Web アプリケーション開発する場合、
Web MVC (Servlet Stack) の他に WebFlux (Reactive Stack) が選べます。
生の Logback-access だとサーブレットベースしかサポートされていませんが、
できるだけ多くの WebFlux での実装をサポートしたいと思ってます。

現状だと Tomcat, Jetty, Undertow ベースの WebFlux をサポートしています。
Tomcat, Jetty は Spring Boot が WebFlux な実装にラップしてるだけで、
内部的にはサーブレットベースなので楽に対応できました。
Undertow は内部的にはサーブレットベースではなく独自仕様で動いているため、
Logback-access を結構改造する必要があり大変でした (^^;

### ネイティブのロギング実装 (各 Web サーバに備わっている実装) に近い実装

次の理由から、各 Web サーバのネイティブに近い部分まで潜り込んでロギングしています。

* 生の Logback-access の実装と合わせるため
* Spring Boot 標準のプロパティ (ex: "server.tomcat.accesslog.*") で動く実装と合わせるため
* リクエスト開始〜レスポンス終了の末端に一番近い部分で処理時間を計測するため

例えば Tomcat なら専用の Valve, Jetty なら専用の RequestLog を実装しています。
そのため、ここでも Web サーバごとの内部まで個別に理解して実装する必要があるので大変です。

色々な Web サーバや WebFlux に対応するなら、
サーブレットフィルタや WebFlux WebFilter でリクエスト/レスポンスを補足＋ロギングして、
Web サーバの違いを一気に吸収できる形で実装した方が良かったかな？
とは今でも考えたりしてます。
(上記した理由を諦めることにはなりますが...)

### 全ての Web サーバでテスト

次の理由から、全ての Web サーバに対して、 Web MVC 用, WebFlux 用の
全パターンを網羅してテストするようにしています。

* 前記した通り Web サーバごとの実装を書いてる部分があるため
* Web サーバに依存しない共通のインターフェイスを通して処理した場合でも、
  Web サーバによって微妙に挙動が異なる場合があるため

Spring Boot はクラスパスに存在するクラスによって自動で Web サーバを選択/起動するため、
これを上手く切り替えてテストすることに苦労しました。

今はテスト開始時に Spring コンテキストのクラスローダをゴニョゴニョして、
テスト対象以外の Web サーバのクラスを見つけられないようにして切り替えています。
(例えば Tomcat でテストするなら、 Jetty, Undertow, Netty のクラスを隠してます。)

### フォワードヘッダ ("X-Forwarded-*") をサポート

ロードバランサを使っている場合に、全てのアクセスログの接続元ホストが
ロードバランサの IP アドレスで記録されてしまう、ということがよくあると思います。
生の Logback-access on Tomcat でも、これは発生していました。

Spring Boot にはフォワードヘッダをサポートするプロパティ
("server.forward-headers-strategy") があるので、これと連動して、
リモートホスト等の一部の出力項目を書き換える、といったことをしてます。

### Tee Filter をサポート

Logback-access には、デバッグ用に TeeFilter という
リクエスト/レスポンスのコンテンツ部分までロギングする機能があります。

現状まだサーブレットベースで使った場合しか動きませんが、
これを簡単に組み込めるように、
プロパティ ("logback.access.tee-filter.*") を用意しています。

### 追加の Logback Appender はサポートしない

このライブラリは Spring Boot x Logback-access を繋ぐものなので、
出力先や出力フォーマットをカスタマイズするような、
追加の Logback Appender はサポートしないようにしています。

過去に JSON で出力したい, SYSLOG に出力したい, という要望をいただきました。
こういった要件は、他のライブラリも組み合わせるか、
独自で Logback Appender を実装いただけたら、と思っています。
JSON 出力なら [logstash-logback-encoder] の "LogstashAccessEncoder" が便利そうです。

[logstash-logback-encoder]: https://github.com/logstash/logstash-logback-encoder

## 今回アップデートしたこと

* Kotlin で書き直した
* Maven Group ID と Java パッケージを変更
* Java 11, 17 のサポートを追加
* 最新の Spring Boot に対応
* Undertow x WebFlux のサポートを追加
* Configuration Properties の名前/構成を一部見直し
* `@Bean` Lite Mode (`@Configuration(proxyBeanMethods = false)`) を使用
* テストに Kotest を導入
* CI を CircleCI から GitHub Actions へ移行
* 依存関係の更新

## 今後

次は Reactor Netty もサポートしたいところです。
(WebFlux の標準選択ですし、 [Issue #53] で要望もいただいてますし。)

[Issue #53]: https://github.com/akkinoc/logback-access-spring-boot-starter/issues/53
