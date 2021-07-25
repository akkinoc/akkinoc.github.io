---
title: Maven Central Repository 公開手順 (2021, Maven, Java/Kotlin)
categories: tech
tags: maven java kotlin
header:
  teaser: /assets/posts/2021-08-01-maven-central-repository-1200x630.png
  og_image: /assets/posts/2021-08-01-maven-central-repository-1200x630.png
---

Maven Central Repository への公開をアカウント登録とリポジトリ登録申請からやり直しました。
公開までの手順や設定が前とは少しだけ変わっていたので、改めてメモとして残しておきます。

<!--more-->

アカウント登録とリポジトリ登録申請からやり直したのは、こんな理由です。

* Sonatype のユーザ名を変更したかった (akihyro → akkinoc)
* 公開先の Group Id を変更したかった (net.rakugakibox.util → dev.akkinoc.util)

## 環境

* macOS Big Sur 11.4
* AdoptOpenJDK 11.0.11+9
* GnuPG 2.3.1
* Maven 3.8.1

AdoptOpenJDK, GnuPG, Maven は、 macOS なら Homebrew で楽にインストールできます。

```console
$ /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
$ brew tap adoptopenjdk/openjdk
$ brew install --cask adoptopenjdk11
$ brew install gnupg
$ brew install maven
```

## 公開したもの

[akkinoc/yaml-resource-bundle - GitHub](https://github.com/akkinoc/yaml-resource-bundle)

```xml
<dependency>
  <groupId>dev.akkinoc.util</groupId>
  <artifactId>yaml-resource-bundle</artifactId>
  <version>${yaml-resource-bundle.version}</version>
</dependency>
```

## 公式ドキュメント

* [Producers - The Central Repository Documentation](https://central.sonatype.org/publish/)
* [OSSRH Guide - The Central Repository Documentation](https://central.sonatype.org/publish/publish-guide/)
* [Requirements - The Central Repository Documentation](https://central.sonatype.org/publish/requirements/)
* [Choosing your Coordinates - The Central Repository Documentation](https://central.sonatype.org/publish/requirements/coordinates/)
* [Working with PGP Signatures - The Central Repository Documentation](https://central.sonatype.org/publish/requirements/gpg/)
* [Apache Maven - The Central Repository Documentation](https://central.sonatype.org/publish/publish-maven/)

## 公開手順

### アカウント登録

Sonatype JIRA へサインアップして、アカウント登録します。

[Sign up for Jira - Sonatype JIRA](https://issues.sonatype.org/secure/Signup!default.jspa)

ここで登録するアカウントは、 JIRA へのログインだけでなく、
Nexus Repository Manager へのログイン, Maven コマンドでのデプロイにも使います。

### リポジトリ登録申請

新規プロジェクトの Issue を作成して、リポジトリ登録申請します。

[New Project - Sonatype JIRA](https://issues.sonatype.org/secure/CreateIssue.jspa?issuetype=21&pid=10134)

入力項目の Group Id はプロジェクトを一意に識別するための名前空間で、
自分が所有している Web ドメイン由来 (ドット区切りの逆順) である必要があります。
GitHub 等のユーザごとのサブドメイン (ex: "io.github.USERNAME") も使えます。

僕の場合はこんな感じで Issue を書きました。
Group Id には、自分のドメイン "dev.akkinoc" を使っています。
＊英語苦手なので英文は変かもしれません。ご容赦を...

[OSSRH-71149 Create repository for dev.akkinoc - Sonatype JIRA](https://issues.sonatype.org/browse/OSSRH-71149)

[![Image: Issue Created]][Image: Issue Created]

[Image: Issue Created]: {% link assets/posts/2021-08-01-maven-central-repository-issue-created-894x508.png %}

### Group Id 所有者チェック

Group Id の所有者かチェックされるので、次のどれかで証明します。

* 自分のドメインなら:
  * ドメインサービスに TXT レコードで Issue 番号 (OSSRH-XXXXX) を設定
  * プロジェクトホスティングサービスの URL へリダイレクトを設定
* GitHub 等のユーザごとのサブドメインなら:
  * Issue 番号で空のリポジトリを作成 (ex: github.com/USERNAME/OSSRH-XXXXX)

僕の場合は TXT レコードで設定しました。

```console
$ dig -t TXT akkinoc.dev
akkinoc.dev. 3600 IN TXT "OSSRH-71149"
```

10 分ほどでチェックが通り、準備できたとコメントがきました。速い！
TXT レコードはチェック通過後は削除して大丈夫です。

[![Image: Issue Prepared]][Image: Issue Prepared]

[Image: Issue Prepared]: {% link assets/posts/2021-08-01-maven-central-repository-issue-prepared-894x433.png %}

ここまでの申請は初回だけやれば大丈夫で、同じ Group Id 配下なら、
今後は別プロジェクトでも自由に公開できます。
(ex: "dev.akkinoc" で通ったなら "dev.akkinoc" と "dev.akkinoc.*" で公開できます。)

### GPG キー生成

公開には GPG/PGP 署名が必要なので、 GnuPG でキーペアを用意します。
Git コミット署名等で既に持っているなら、それを使い回しても良いと思います。

僕の場合はこんな感じで作成しました。
途中で入力するパスフレーズは、今後の署名時に必要になるので覚えておきます。

```console
$ gpg --full-gen-key

ご希望の鍵の種類を選択してください:
   (1) RSA と RSA
   (2) DSA と Elgamal
   (3) DSA (署名のみ)
   (4) RSA (署名のみ)
   (9) ECC (署名と暗号化) *デフォルト
  (10) ECC (署名のみ)
  (14) カードに存在する鍵
あなたの選択は? 1

RSA 鍵は 1024 から 4096 ビットの長さで可能です。
鍵長は? (3072) 4096

鍵の有効期限を指定してください。
         0 = 鍵は無期限
      <n>  = 鍵は n 日間で期限切れ
      <n>w = 鍵は n 週間で期限切れ
      <n>m = 鍵は n か月間で期限切れ
      <n>y = 鍵は n 年間で期限切れ
鍵の有効期間は? (0) 10y

本名: Akihiro Kondo
電子メール・アドレス: akkinoc@gmail.com
コメント:
```

### GPG キー配布

他の人が署名を検証できるように、作成したキーペアの公開鍵を
Maven Central Repository 推奨のキーサーバへ配布します。

> * keyserver.ubuntu.com
> * keys.openpgp.org
> * pgp.mit.edu
>
> <footer><cite><a href="https://central.sonatype.org/publish/requirements/gpg/#distributing-your-public-key">Distributing Your Public Key - The Central Repository Documentation</a></cite></footer>

各キーサーバは同期されるらしいのですが、
タイムラグがありそうだったので僕は全てに送りました。

```console
$ gpg -k --keyid-format long
pub   rsa4096/C1C97CE293FB5803 2021-04-12 [SC] [有効期限: 2031-04-10]
      8CF0151763C741B898013592C1C97CE293FB5803
uid                 [  究極  ] Akihiro Kondo <akkinoc@gmail.com>
sub   rsa4096/532C94339BB63D3A 2021-04-12 [E] [有効期限: 2031-04-10]

$ gpg --keyserver keyserver.ubuntu.com --send-keys C1C97CE293FB5803
$ gpg --keyserver keys.openpgp.org     --send-keys C1C97CE293FB5803
$ gpg --keyserver pgp.mit.edu          --send-keys C1C97CE293FB5803
```

### メタデータ設定

公開に必要なメタデータを `pom.xml` ファイルに設定します。

今回のプロジェクトならこんな感じです。
`<groupId>` には登録申請した Group Id (またはその配下) を設定します。

```xml
<groupId>dev.akkinoc.util</groupId>
<artifactId>yaml-resource-bundle</artifactId>
<version>2.0.0</version>
<name>yaml-resource-bundle</name>
<description>Java ResourceBundle for YAML format.</description>
<url>https://github.com/akkinoc/yaml-resource-bundle</url>

<scm>
  <url>https://github.com/akkinoc/yaml-resource-bundle</url>
  <connection>scm:git:git@github.com:akkinoc/yaml-resource-bundle.git</connection>
  <developerConnection>scm:git:git@github.com:akkinoc/yaml-resource-bundle.git</developerConnection>
</scm>

<developers>
  <developer>
    <id>akkinoc</id>
    <name>Akihiro Kondo</name>
    <email>akkinoc@gmail.com</email>
    <url>https://akkinoc.dev</url>
  </developer>
</developers>

<licenses>
  <license>
    <name>Apache License, Version 2.0</name>
    <url>https://www.apache.org/licenses/LICENSE-2.0.txt</url>
  </license>
</licenses>
```

### ソース JAR 作成設定

公開にはソース JAR ファイルの添付が必要なので、
作成するよう `pom.xml` ファイルに設定します。

```xml
<build>
  <plugins>
    <plugin>
      <artifactId>maven-source-plugin</artifactId>
      <version>3.2.1</version>
      <executions>
        <execution>
          <id>jar</id>
          <goals>
            <goal>jar</goal>
          </goals>
        </execution>
      </executions>
    </plugin>
  </plugins>
</build>
```

### Javadoc JAR 作成設定

公開には Javadoc JAR ファイルの添付が必要なので、
作成するよう `pom.xml` ファイルに設定します。

Java なら標準のプラグインを使います。

```xml
<build>
  <plugins>
    <plugin>
      <groupId>org.apache.maven.plugins</groupId>
      <artifactId>maven-javadoc-plugin</artifactId>
      <version>3.3.0</version>
      <executions>
        <execution>
          <id>jar</id>
          <goals>
            <goal>jar</goal>
          </goals>
        </execution>
      </executions>
    </plugin>
  </plugins>
</build>
```

Kotlin なら Dokka で作成できます。

```xml
<build>
  <plugins>
    <plugin>
      <groupId>org.jetbrains.dokka</groupId>
      <artifactId>dokka-maven-plugin</artifactId>
      <version>1.5.0</version>
      <executions>
        <execution>
          <id>javadocJar</id>
          <phase>package</phase>
          <goals>
            <goal>javadocJar</goal>
          </goals>
        </execution>
      </executions>
    </plugin>
  </plugins>
</build>
```

### GPG 署名設定

公開する各ファイルを GPG 署名するよう、 `pom.xml` ファイルに設定します。

```xml
<build>
  <plugins>
    <plugin>
      <groupId>org.apache.maven.plugins</groupId>
      <artifactId>maven-gpg-plugin</artifactId>
      <version>3.0.1</version>
      <executions>
        <execution>
          <id>sign</id>
          <goals>
            <goal>sign</goal>
          </goals>
        </execution>
      </executions>
    </plugin>
  </plugins>
</build>
```

### デプロイ先設定

`pom.xml` ファイルにデプロイ先を設定します。

```xml
<distributionManagement>
  <repository>
    <id>ossrh</id>
    <url>https://s01.oss.sonatype.org/service/local/staging/deploy/maven2</url>
  </repository>
  <snapshotRepository>
    <id>ossrh</id>
    <url>https://s01.oss.sonatype.org/content/repositories/snapshots</url>
  </snapshotRepository>
</distributionManagement>
```

### デプロイ設定

`pom.xml` ファイルにデプロイするためのプラグインを仕込みます。

```xml
<build>
  <plugins>
    <plugin>
      <groupId>org.sonatype.plugins</groupId>
      <artifactId>nexus-staging-maven-plugin</artifactId>
      <version>1.6.8</version>
      <extensions>true</extensions>
      <configuration>
        <serverId>ossrh</serverId>
        <nexusUrl>https://s01.oss.sonatype.org</nexusUrl>
        <autoReleaseAfterClose>true</autoReleaseAfterClose>
      </configuration>
    </plugin>
  </plugins>
</build>
```

デフォルトの maven-deploy-plugin も使えるのですが、
それだと毎回デプロイ後に [Nexus Repository Manager] にログインして
Staging Repositories から Close → Release する必要があります。
nexus-staging-maven-plugin なら、そこまで全部やってくれるので楽です。

[Nexus Repository Manager]: https://s01.oss.sonatype.org/

### OSSRH 認証設定

デプロイ先である OSSRH の認証情報を設定します。
`~/.m2/settings.xml` ファイルに Sonatype JIRA アカウントの情報を記載すれば OK です。

```xml
<settings>
  <servers>
    <server>
      <id>ossrh</id>
      <username>USERNAME</username>
      <password>PASSWORD</password>
    </server>
  </servers>
</settings>
```

### デプロイ

ここまで準備すると、やっとデプロイできます。
Maven コマンドで deploy フェーズまで実行しましょう。
途中 GPG 署名のためパスフレーズを訊かれるので、適宜入力してやります。

```console
mvn clean deploy
```

### 初回リリース報告

JIRA Issue のコメントに従い、初回リリースしたことを Issue コメントで報告します。

[![Image: Issue Released]][Image: Issue Released]

[Image: Issue Released]: {% link assets/posts/2021-08-01-maven-central-repository-issue-released-894x92.png %}

### 公開完了

数時間ほど待って、次のサイトへ反映されれば公開完了です。

* [Maven Central Repository](https://repo1.maven.org/maven2/) (通常 30 分以内で公開とのこと)
* [Maven Central Repository Search](https://search.maven.org/) (最大 4 時間で公開とのこと)

## 公開手順 (2 回目以降)

### バージョン更新

`pom.xml` の `<version>` を書き換えます。
エディタで書き換えても良いですし、 versions プラグインを使っても良いと思います。

```xml
$ mvn versions:set
```

### デプロイ

あとは初回同様、 Maven コマンドを実行して数時間ほど待てば OK です。

```console
mvn clean deploy
```

## その他メモ

### GPG キーのバックアップ方法

PC の乗り換え時など、 GPG キーペアは次のコマンドでエクスポート/インポートできます。

```console
$ gpg -K --keyid-format long           # ID 確認
$ gpg --export-secret-keys -a ID >key  # key ファイルにエクスポート
```

```console
$ gpg --import <key                                # key ファイルをインポート
$ echo "FINGERPRINT:6:" | gpg --import-ownertrust  # key を信頼
```

### GitHub ドメインで使える Group Id

GitHub ドメインを Group Id とする場合、
"*com*.github.USERNAME" での新規登録は現在は不可なようです。
"*io*.github.USERNAME" を使いましょう。

> 2021-04-01 - com.github.* is not supported anymore as a valid coordinate
>
> <footer><cite><a href="https://central.sonatype.org/changelog/#2021-04-01-comgithub-is-not-supported-anymore-as-a-valid-coordinate">Central Repository Changelog - The Central Repository Documentation</a></cite></footer>

### CI では GPG 署名をスキップ

GitHub Actions や CircleCI 等, クラウドの CI 環境には、できれば秘密鍵は置きたくありません。
しかし GPG キーペアがない場合、 maven-gpg-plugin が失敗してしまいます。

僕は `pom.xml` にリリース用のプロファイルを用意し、
普段は GPG 署名をスキップすることで回避しています。

```xml
<properties>
  <gpg.skip>true</gpg.skip>
</properties>

<profiles>
  <profile>
    <id>release</id>
    <properties>
      <gpg.skip>false</gpg.skip>
    </properties>
  </profile>
</profiles>
```

```console
$ mvn clean deploy            # CI 環境を含む通常時 (GPG 署名なし)
$ mvn clean deploy -Prelease  # ローカル環境でのリリース時 (GPG 署名あり)
```

### OSSRH 認証に使えるユーザトークン

`~/.m2/settings.xml` ファイルに記載する Sonatype JIRA アカウント情報は、
[Nexus Repository Manager] の Profile → User Token から発行できるトークンが使えます。
ログインパスワードを使わずにデプロイできるため、ﾁｮｯﾄ意識高くできます。

[Nexus Repository Manager]: https://s01.oss.sonatype.org/

[![Image: OSSRH Token]][Image: OSSRH Token]

[Image: OSSRH Token]: {% link assets/posts/2021-08-01-maven-central-repository-ossrh-token-865x478.png %}

### Sonatype ユーザ名の変更方法

今回、自分は Sonatype ユーザ名も変更しました。
過去の Issue を参考にしたところ、こんな手順が採られていました。

1. 新しいユーザ名で新規アカウントを登録
2. 新しいユーザ名へ旧ユーザ名の権限を付与
3. 旧ユーザ名を無効化

僕の場合はこんな Issue を立てて対応いただきました。

* [OSSRH-69348 Change username - Sonatype JIRA](https://issues.sonatype.org/browse/OSSRH-69348)
* [OSSRH-69387 Delete my account - Sonatype JIRA](https://issues.sonatype.org/browse/OSSRH-69387)

## 前に書いた記事

[2015-12-24 Maven Central Repository 公開メモ]({% post_url 2015-12-24-maven-central-repository %})
