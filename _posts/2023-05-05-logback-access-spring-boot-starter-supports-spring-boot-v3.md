---
title: logback-access-spring-boot-starter - Spring Boot 3 をサポートしました
categories: tech
tags: logback-access-spring-boot-starter spring-boot spring-framework logback-access logback
header:
  teaser: /assets/posts/2023-05-05-logback-access-spring-boot-starter-supports-spring-boot-v3-1200x630.png
  og_image: /assets/posts/2023-05-05-logback-access-spring-boot-starter-supports-spring-boot-v3-1200x630.png
---

Spring Boot 3 へのアップデートに必要だった変更をまとめました。

今回の変更は殆ど Pull Request でいただきました。感謝です。
リリース直後には初めて GitHub Sponsor までいただけました。
とても嬉しいし励みになります。ありがとうございます。

<!--more-->

## logback-access-spring-boot-starter とは

前に投稿した記事をご参照ください:
[logback-access-spring-boot-starter を Kotlin で書き直した]({% post_url 2021-10-30-rewrote-logback-access-spring-boot-starter-in-kotlin %})

GitHub リポジトリはこちら:
[![Image: logback-access-spring-boot-starter]][logback-access-spring-boot-starter]

[logback-access-spring-boot-starter]: https://github.com/akkinoc/logback-access-spring-boot-starter
[Image: logback-access-spring-boot-starter]: {% link assets/posts/2023-05-05-logback-access-spring-boot-starter-supports-spring-boot-v3-repo-500x250.png %}

## Spring Boot 3 へのアップデートに必要だった変更内容

### Java 17 未満のサポート廃止

Java 17 以上が必須となったため、 Java 8 と 11 のサポートは廃止しました。

### @ConstructorBinding の廃止

Immutable な `@ConfigurationProperties` クラスにおいて、
`@ConstructorBinding` の付与が不要になったので削除しました。

### Auto-configuration ファイルの変更

`META-INF/spring.factories` にクラス名を記載しておくと
そのモジュールを使う時に自動的に `@Configuration` を走らせてくれる、
というライブラリ向けの機能がありました。

このファイルのパスとフォーマットが変わったので、新しい形に変更しました。

* 旧) `META-INF/spring.factories`
* 新) `META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports`

### Servlet API の変更 (Java EE → Jakarta EE)

Servlet API のバージョンが v4 → v6 に更新され、 Java EE は Jakarta EE になりました。
これに伴い、 `javax.*` パッケージの `import` を `jakarta.*` に変更しました。

バージョンが一気に 2 つ上がってますが、
v5 は Jakarta EE 移管によるパッケージの変更のみのようです。
v6 は機能が増えてるようですが影響ありませんでした。

注意点として、 Spring Boot Starter の Jetty 11 では Servlet API 6.0 に対応していません。
(Tomcat 10, Undertow 2 では対応しています。)
そのため、 `spring-boot-starter-jetty` を使う場合は、
`jakarta.servlet-api` のバージョンを `5.0.0` に落とす必要がありました。

📝 背景:
本ライブラリは Tomcat, Jetty, Undertow をサポートしており、
どの Web サーバが使われているか判別して実装を切り替えてます。

### Logback Joran の変更

Logback のバージョンが v1.2 → v1.4 に更新され、 Joran の作りが大きく変わりました。
これに伴い、新しい Joran のインターフェイスに合わせ実装を変更しました。

📝 Joran とは:
Logback の設定ファイルパース部分のフレームワークを [Joran] と呼ぶようです。

[Joran]: https://logback.qos.ch/manual/onJoran.html

📝 背景:
Spring Boot 本体の Logback ロギングの内部実装では、
Joran に踏み込んで `<springProfile>`, `<springProperty>` タグを拡張していました。
それを参考に、本ライブラリでも Joran に踏み込んで同タグをサポートしています。

### Logback Access の変更

Logback のバージョンアップで、 [SequenceNumberGenerator] という機能が増えました。
ロギングイベントにシーケンス番号を付与できるようです。
イベントインターフェイス (`IAccessEvent`) にこの関数が増えているため、実装を追加しました。

[SequenceNumberGenerator]: https://logback.qos.ch/manual/configuration.html#sequenceNumberGenerator

### Deprecated 関数の置き換え

Deprecated となった関数があったので置き換えました。
本ライブラリでは次の関数が対象でした。

* `org.springframework.http.ResponseEntity#getStatusCodeValue()`
* `org.springframework.util.SerializationUtils#deserialize(byte[])`

## 関連リンク

### Release

[![Image: Release v4.0.0]][Release v4.0.0]

[Release v4.0.0]: https://github.com/akkinoc/logback-access-spring-boot-starter/releases/tag/v4.0.0
[Image: Release v4.0.0]: {% link assets/posts/2023-05-05-logback-access-spring-boot-starter-supports-spring-boot-v3-release-500x250.png %}

### Pull Requests

[![Image: Pull Request #280 Upgrade to support Spring boot 3 by Pirayya]][Pull Request #280 Upgrade to support Spring boot 3 by Pirayya]

[Pull Request #280 Upgrade to support Spring boot 3 by Pirayya]: https://github.com/akkinoc/logback-access-spring-boot-starter/pull/280
[Image: Pull Request #280 Upgrade to support Spring boot 3 by Pirayya]: {% link assets/posts/2023-05-05-logback-access-spring-boot-starter-supports-spring-boot-v3-pr280-500x250.png %}

[![Image: Pull Request #336 Release version 4 to support Spring Boot 3 by akkinoc]][Pull Request #336 Release version 4 to support Spring Boot 3 by akkinoc]

[Pull Request #336 Release version 4 to support Spring Boot 3 by akkinoc]: https://github.com/akkinoc/logback-access-spring-boot-starter/pull/336
[Image: Pull Request #336 Release version 4 to support Spring Boot 3 by akkinoc]: {% link assets/posts/2023-05-05-logback-access-spring-boot-starter-supports-spring-boot-v3-pr336-500x250.png %}

### 参考

* [Spring Boot 3.0 Migration Guide - spring-projects/spring-boot](https://github.com/spring-projects/spring-boot/wiki/Spring-Boot-3.0-Migration-Guide)
* [Upgrading to Spring Framework 6.x - spring-projects/spring-framework](https://github.com/spring-projects/spring-framework/wiki/Upgrading-to-Spring-Framework-6.x)
* [Spring Boot Reference Documentation](https://docs.spring.io/spring-boot/docs/3.0.6/reference/htmlsingle/)
