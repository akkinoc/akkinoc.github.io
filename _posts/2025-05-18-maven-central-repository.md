---
title: OSSRH → Maven Central 移行メモ (2025, Maven)
categories: tech
tags: maven java kotlin
header:
  teaser: /assets/posts/2025-05-18-maven-central-repository-1200x630.png
  og_image: /assets/posts/2025-05-18-maven-central-repository-1200x630.png
---

OSSRH が 2025-06-30 に終了するそうです。
OSSRH は OSS を Maven Central Repository で公開するため利用していたサービスです。
新しいサービスである Maven Central Portal への移行の案内メールが届いていたので移行しました。

<!--more-->

## 移行作業

[Self-Service Migration] の案内に沿って作業しました。ボタン１つで簡単。

1. [Maven Central Portal] にログイン (Username / Password は Sonatype OSSRH で使ってたもの)
2. [Namespaces] ページを開く
3. 所有してるネームスペース (僕の場合は `dev.akkinoc`) が表示される
3. "Migrate Namespace" ボタンを押して移行 (エラーが出たが数回リトライすると成功した)

[Self-Service Migration]: https://central.sonatype.org/faq/what-is-different-between-central-portal-and-legacy-ossrh/#self-service-migration
[Maven Central Portal]: https://central.sonatype.com/
[Namespaces]: https://central.sonatype.com/publishing/namespaces

## その後の公開手順

僕は Maven プラグイン "nexus-staging-maven-plugin" を使ってデプロイと公開をしてました:
[2021-08-01 Maven Central Repository 公開手順]({% post_url 2021-08-01-maven-central-repository %})

この公開手順も変わったようです。
[Publishing By Using the Maven Plugin] の案内に沿って公開するようにしました。

1. [Maven Central Portal] の [My Account] で User Token を生成
2. 生成した UserToken を `~/.m2/settings.xml` に記載
3. `pom.xml` に `central-publishing-maven-plugin` を追加
4. `mvn deploy` コマンドでデプロイ

僕の個人プロジェクトでは、こちらの Pull Request のように `pom.xml` を書き換えました:
[#590 Migrate OSSRH to Maven Central - akkinoc/logback-access-spring-boot-starter]

このように書き換えた上で、いつも通り `mvn clean deploy -Prelease` を
実行するとデプロイと公開ができました。
(`-Prelease` は、これを付与したときだけデプロイするための独自オプションです。)

[Publishing By Using the Maven Plugin]: https://central.sonatype.org/publish/publish-portal-maven/
[My Account]: https://central.sonatype.com/account
[#590 Migrate OSSRH to Maven Central - akkinoc/logback-access-spring-boot-starter]: https://github.com/akkinoc/logback-access-spring-boot-starter/pull/590
