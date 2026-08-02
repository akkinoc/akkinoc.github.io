---
title: Spring Boot ログの出力先とフォーマットを環境によって切り替える
categories: tech
tags: spring-boot spring-framework logback
header:
  teaser: /assets/posts/2023-03-26-spring-boot-log-by-env-1200x630.png
  og_image: /assets/posts/2023-03-26-spring-boot-log-by-env-1200x630.png
---

Spring Boot アプリケーションでログの出力先やフォーマットを
環境によって切り替えたいことがよくあります。

自分の場合は、

- ローカル開発時は標準出力にテキスト出力
- 本番実行時は標準出力に JSON フォーマットで出力

とすることが多いです。

<!--more-->

(ローカル開発時まで JSON 出力するのは読みにくいため)

## 環境

- Java バージョン: 17
- Spring Boot バージョン: 3.0 (2.x でも OK)
- ビルドツール: Maven

## 方針

- ここではローカル開発時, 本番実行時の 2 環境の切り替えを想定します
- ローカル開発時以外の環境では Spring Profile に環境名を与えます (下表 A)
  - 📝 環境を増やしたい場合は、この値の種類を増やします
- `application(-{環境名}).yml` に Spring Property `app.log.appender` を定義します (下表 B)
  - 📝 出力先/フォーマットを増やしたい場合は、この値の種類を増やします
- Spring Property `app.log.appender` によって出力先/フォーマットを切り替えます (下表 C)
  - 📝 Spring Property 経由なので、環境変数 `APP_LOG_APPENDER` でも柔軟に切り替え可能です
  - 📝 標準出力のみ扱ってますが、実際はファイル出力やログサーバ送信等も想定できます

| 環境           | Spring Profile (A) | Spring Property (B) | 出力先 (C) | フォーマット (C) |
|----------------|--------------------|---------------------|------------|------------------|
| ローカル開発時 | なし               | `console-text`      | 標準出力   | テキスト         |
| 本番実行時     | `prod`             | `console-json`      | 標準出力   | JSON             |

## 実装方法

### 依存関係の追加

JSON 出力する場合は [logstash-logback-encoder] を使うのが楽なので、依存関係に追加します。

[logstash-logback-encoder]: https://github.com/logfellow/logstash-logback-encoder

```xml
<!-- pom.xml -->
<dependency>
  <groupId>net.logstash.logback</groupId>
  <artifactId>logstash-logback-encoder</artifactId>
  <version>7.3</version>
</dependency>
```

### 環境設定ファイルの作成

環境ごとの設定ファイル `application(-{環境名}).yml` をクラスパスルートに作成します。

```yml
# application.yml (デフォルト, ローカル開発時用)
app.log.appender: console-text
```

```yml
# application-prod.yml (本番実行時用)
app.log.appender: console-json
```

### Logback 設定ファイルの作成

Logback の設定ファイル `logback-spring.xml` をクラスパスルートに作成します。
Spring Boot が自動的に読み込んでくれるので、ここで Logback 設定をカスタマイズできます。
Spring Property の取得には、 Spring Boot 提供の Logback 拡張 `<springProperty>` タグが便利です。

```xml
<!-- logback-spring.xml -->
<configuration>

  <!-- Spring Boot が提供しているデフォルト設定を読み込み -->
  <include resource="org/springframework/boot/logging/logback/defaults.xml"/>

  <!-- Spring Property (application.yml, 環境変数等で指定) から設定値を取得 -->
  <springProperty name="APP_LOG_APPENDER" source="app.log.appender" defaultValue="console-text"/>

  <!-- 標準出力向けテキスト出力 (Spring Boot が提供しているデフォルト設定から name だけ変えてます) -->
  <!--include resource="org/springframework/boot/logging/logback/console-appender.xml" /-->
  <appender name="console-text" class="ch.qos.logback.core.ConsoleAppender">
    <encoder>
      <pattern>${CONSOLE_LOG_PATTERN}</pattern>
      <charset>${CONSOLE_LOG_CHARSET}</charset>
    </encoder>
  </appender>

  <!-- 標準出力向け JSON 出力 -->
  <appender name="console-json" class="ch.qos.logback.core.ConsoleAppender">
    <encoder class="net.logstash.logback.encoder.LogstashEncoder"/>
  </appender>

  <!-- Spring Property によって Appender を切り替えて出力 -->
  <root level="INFO">
    <appender-ref ref="${APP_LOG_APPENDER}"/>
  </root>

</configuration>
```

### サンプルコード全体

上記のサンプルコード全体はこちらに置いてます。

[akkinoc/try-spring-boot-log-by-env - GitHub](https://github.com/akkinoc/try-spring-boot-log-by-env)

## 実行イメージ

### ローカル開発時

Spring Profile の指定なしで実行すると、テキストフォーマットで出力されます。

```console
$ mvn spring-boot:run
... (中略)
2023-03-26T14:21:28.360+09:00  INFO 77469 --- [           main] sample.App                               : Running App!
```

### 本番実行時

Spring Profile に `prod` を指定して実行すると、 JSON フォーマットで出力されます。

```console
$ SPRING_PROFILES_ACTIVE=prod mvn spring-boot:run
... (中略)
{"@timestamp":"2023-03-26T14:21:48.269814+09:00","@version":"1","message":"Running App!","logger_name":"sample.App","thread_name":"main","level":"INFO","level_value":20000}
```

### 環境変数で切り替え

環境変数を指定して柔軟に切り替えることも可能です (一時的に上書き変更したい場合等)。

```console
$ APP_LOG_APPENDER=console-json mvn spring-boot:run
... (中略)
{"@timestamp":"2023-03-26T14:22:20.356888+09:00","@version":"1","message":"Running App!","logger_name":"sample.App","thread_name":"main","level":"INFO","level_value":20000}
```

## Tips

### ログレベルの設定

`application.yml`, `logback-spring.xml`, どちらでも設定できます。

```yml
# application.yml
logging.level.your.package=debug
logging.level.root=warn
```

```xml
<!-- logback-spring.xml -->
<logger name="your.package" level="DEBUG"/>
<root level="WARN">...</root>
```

片方に集約されていれば、どちらで設定しても良いと思います。
個人的には `application.yml` の方が、環境別に基本の値を定義できるので好きです。

どちらでも、環境変数 `LOGGING_LEVEL_ROOT`, `LOGGING_LEVEL_YOUR_PACKAGE` 等で
一時的な上書き変更も可能です。

### テキストフォーマットのカスタマイズ

Spring Property `logging.pattern.console` が用意されてます。
指定可能なパターンは [Logback Manual: PatternLayout] が参考になります。

[Logback Manual: PatternLayout]: https://logback.qos.ch/manual/layouts.html#ClassicPatternLayout

```yml
# application.yml
logging.pattern.console: "%d{yyyy-MM-dd HH:mm:ss.SSS} %-5p [%t] [%c{30}] %m - %C.%M \\(%F:%L\\)%n%ex"
```

```console
$ mvn spring-boot:run
... (中略)
2023-03-26 15:23:28.421 INFO  [main] [sample.App] Running App! - sample.App.run (App.java:19)
```

### JSON フォーマットのカスタマイズ

[logstash-logback-encoder: Usage] に詳細に記載されています。

[logstash-logback-encoder: Usage]: https://github.com/logfellow/logstash-logback-encoder/tree/logstash-logback-encoder-7.3#usage

JSON を整形して読みやすくしたい場合は `jsonGeneratorDecorator` が使えます。

```xml
<!-- logback-spring.xml -->
<appender name="console-json" class="ch.qos.logback.core.ConsoleAppender">
  <encoder class="net.logstash.logback.encoder.LogstashEncoder">
    <jsonGeneratorDecorator class="net.logstash.logback.decorate.PrettyPrintingJsonGeneratorDecorator"/>
  </encoder>
</appender>
```

```console
$ APP_LOG_APPENDER=console-json mvn spring-boot:run
... (中略)
{
  "@timestamp" : "2023-03-26T16:04:04.654775+09:00",
  "@version" : "1",
  "message" : "Running App!",
  "logger_name" : "sample.App",
  "thread_name" : "main",
  "level" : "INFO",
  "level_value" : 20000
}
```

もし Logstash を無視したオリジナルのフォーマットにしたい場合は
`LoggingEventCompositeJsonEncoder` が使えます。

```xml
<!-- logback-spring.xml -->
<appender name="console-json" class="ch.qos.logback.core.ConsoleAppender">
  <encoder class="net.logstash.logback.encoder.LoggingEventCompositeJsonEncoder">
    <providers>
      <pattern>
        <pattern>
          {
            "timestamp": "%d{yyyy-MM-dd'T'HH:mm:ss.SSSZZ}",
            "level": "%p",
            "thread": "%t",
            "logger": "%c",
            "message": "%m",
            "class": "%C",
            "method": "%M",
            "file": "%F",
            "line": "%L",
            "exception": "%ex"
          }
        </pattern>
        <omitEmptyFields>true</omitEmptyFields>
      </pattern>
    </providers>
    <jsonGeneratorDecorator class="net.logstash.logback.decorate.PrettyPrintingJsonGeneratorDecorator"/>
  </encoder>
</appender>
```

```console
$ APP_LOG_APPENDER=console-json mvn spring-boot:run
... (中略)
{
  "timestamp" : "2023-03-26T16:05:04.684+0900",
  "level" : "INFO",
  "thread" : "main",
  "logger" : "sample.App",
  "message" : "Running App!",
  "class" : "sample.App",
  "method" : "run",
  "file" : "App.java",
  "line" : "19"
}
```

## 参考リンク

- [Spring Boot Reference Documentation (v3.0.5)](https://docs.spring.io/spring-boot/docs/3.0.5/reference/htmlsingle/)
  - [Configure Logback for Logging](https://docs.spring.io/spring-boot/docs/3.0.5/reference/htmlsingle/#howto.logging.logback)
  - [Logback Extensions](https://docs.spring.io/spring-boot/docs/3.0.5/reference/htmlsingle/#features.logging.logback-extensions)
  - [Log Levels](https://docs.spring.io/spring-boot/docs/3.0.5/reference/htmlsingle/#features.logging.log-levels)
  - [Custom Log Configuration](https://docs.spring.io/spring-boot/docs/3.0.5/reference/htmlsingle/#features.logging.custom-log-configuration)
- [GitHub spring-projects/spring-boot (v3.0.5)](https://github.com/spring-projects/spring-boot/tree/v3.0.5)
  - [org/springframework/boot/logging/logback/defaults.xml](https://github.com/spring-projects/spring-boot/blob/v3.0.5/spring-boot-project/spring-boot/src/main/resources/org/springframework/boot/logging/logback/defaults.xml)
  - [org/springframework/boot/logging/logback/console-appender.xml](https://github.com/spring-projects/spring-boot/blob/v3.0.5/spring-boot-project/spring-boot/src/main/resources/org/springframework/boot/logging/logback/console-appender.xml)
- [Logback Manual](https://logback.qos.ch/manual/)
  - [Configuration](https://logback.qos.ch/manual/configuration.html)
  - [Layouts](https://logback.qos.ch/manual/layouts.html)
