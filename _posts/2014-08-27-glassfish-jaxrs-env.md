---
title: GlassFish + JAX-RS (Jersey) で REST なアプリを作ってみる (環境構築)
categories: tech
tags: glassfish java jax-rs jersey rest maven chef
header:
  teaser: /assets/posts/2014-08-27-glassfish-jaxrs-env-800x225.jpg
  og_image: /assets/posts/2014-08-27-glassfish-jaxrs-env-800x225.jpg
---

参考になる記事や書籍が少ないなーと思いつつ、
GlassFish + JAX-RS (Jersey) で REST なアプリを作ってみたのでメモ。

この記事では環境のインストールと設定までをまとめてみた。

<!--more-->

## 環境

* CentOS 6.5 (64bit)
* JDK 7 u67
* Maven 3.2.2
* GlassFish 4.0.1 (Java EE 7)
* Maven GlassFish プラグイン (maven-glassfish-plugin) 2.1

Gradle 使うことも考えたけど、 GlassFish プラグインを
使ってみたくて一旦 Maven にしてみた。

## JDK インストール

前に書いた記事を参考に。

[CentOS に Oracle JDK を curl コマンドでダウンロード, ついでに Chef レシピも]({% post_url 2014-07-17-curl-download-jdk %})

## Maven インストール

ダウンロードして展開してパスを通せば OK。
自分は `/opt` にインストールしてみた。

```console
$ wget http://ftp.meisei-u.ac.jp/mirror/apache/dist/maven/maven-3/3.2.2/binaries/apache-maven-3.2.2-bin.tar.gz
$ tar xfz apache-maven-3.2.2-bin.tar.gz -C /opt
$ export M2_HOME="/opt/apache-maven-3.2.2"
$ export PATH="${M2_HOME}/bin:${PATH}"
```

`mvn` コマンドが叩ければOK。

```console
$ mvn -v
Apache Maven 3.2.2 (45f7c06d68e745d05611f7fd14efb6594181933e; 2014-06-17T22:51:42+09:00)
Maven home: /opt/maven-3.2.2
Java version: 1.7.0_67, vendor: Oracle Corporation
Java home: /opt/jdk-1.7.0_67/jre
Default locale: ja_JP, platform encoding: UTF-8
OS name: "linux", version: "2.6.32-431.23.3.el6.x86_64", arch: "amd64", family: "unix"
```

Chef レシピで書くならこんな感じかなー。

```ruby
remote_file '/tmp/apache-maven-3.2.2-bin.tar.gz' do
  source 'http://ftp.meisei-u.ac.jp/mirror/apache/dist/maven/maven-3/3.2.2/binaries/apache-maven-3.2.2-bin.tar.gz'
  checksum 'cce5914cf8797671fc6e10c4e034b453d854edf711cbc664b478d0f04934cb76'
end

bash 'maven_extract' do
  not_if <<-EOC
    test -d /opt/maven-3.2.2
  EOC
  code <<-EOC
    tar xfz /tmp/apache-maven-3.2.2-bin.tar.gz -C /opt
  EOC
end

template '/etc/profile.d/maven.sh'
  # => export M2_HOME="/opt/apache-maven-3.2.2"
  #    export PATH="${M2_HOME}/bin:${PATH}"
```

## GlassFish インストール

Maven と同じノリで。

```console
$ wget http://dlc.sun.com.edgesuite.net/glassfish/4.0.1/promoted/glassfish-4.0.1-b10.zip
$ unzip -q -d /opt glassfish-4.0.1-b10.zip
$ export GLASSFISH_HOME="/opt/glassfish4"
$ export PATH="${GLASSFISH_HOME}/bin:${PATH}"
```

こっちは `asadmin` コマンドで動くか確認してみる。

```console
$ asadmin version
Version string could not be obtained from Server [localhost:4848].
(Turn debugging on e.g. by setting AS_DEBUG=true in your environment, to see the details.)
Using locally retrieved version string from version class.
Version = GlassFish Server Open Source Edition  4.0.1  (build 10)
Command version executed successfully.
```

Chef レシピはこんな感じかなー。

```ruby
remote_file '/tmp/glassfish-4.0.1-b10.zip' do
  source 'http://dlc.sun.com.edgesuite.net/glassfish/4.0.1/promoted/glassfish-4.0.1-b10.zip'
  checksum '11f9440739cd96aad9f0032152718682afdc69c4ce817210f8e74a106ae9a20d'
end

bash 'glassfish_extract' do
  not_if <<-EOC
    test -d /opt/glassfish4
  EOC
  code <<-EOC
    unzip -q -d /opt /tmp/glassfish-4.0.1-b10.zip
  EOC
end

template '/etc/profile.d/glassfish.sh'
  # => export GLASSFISH_HOME="/opt/glassfish4"
  #    export PATH="${GLASSFISH_HOME}/bin:${PATH}"
```

## Maven プロジェクト 作成

プロジェクトを作る。
グループ ID, アーティファクト ID は適宜書き換える感じで :)
途中、バージョン番号と各設定確認が OK か訊かれたので、そのまま Enter 押して進めた。

```console
$ mvn archetype:generate -DgroupId=akihyro -DartifactId=try-rest -DarchetypeArtifactId=maven-archetype-webapp
```

こんなツリーが出来た。

```console
$ tree try-rest
try-rest
|-- pom.xml
`-- src
    `-- main
        |-- resources
        `-- webapp
            |-- WEB-INF
            |   `-- web.xml
            `-- index.jsp

5 directories, 3 files
```

自動作成された `pom.xml` はこんな感じ。

```xml
<project xmlns="http://maven.apache.org/POM/4.0.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/maven-v4_0_0.xsd">
  <modelVersion>4.0.0</modelVersion>
  <groupId>akihyro</groupId>
  <artifactId>try-rest</artifactId>
  <packaging>war</packaging>
  <version>1.0-SNAPSHOT</version>
  <name>try-rest Maven Webapp</name>
  <url>http://maven.apache.org</url>
  <dependencies>
    <dependency>
      <groupId>junit</groupId>
      <artifactId>junit</artifactId>
      <version>3.8.1</version>
      <scope>test</scope>
    </dependency>
  </dependencies>
  <build>
    <finalName>try-rest</finalName>
  </build>
</project>
```

## 文字コード 設定

このまま Maven でコンパイルすると警告が出てしまった。

```console
[WARNING] Using platform encoding (UTF-8 actually) to copy filtered resources, i.e. build is platform dependent!
```

ここでは文字コードを UTF-8 に設定してあげる。
`pom.xml` にこんなプロパティを追加した。

```xml
<project ..>
  ...
  <properties>
    <project.build.sourceEncoding>utf-8</project.build.sourceEncoding>
  </properties>
  ...
</project>
```

## Java バージョン 設定

Maven でのコンパイルは Java バージョン 1.5 がデフォっぽい ([参考][Maven Compiler Plugin])。
`pom.xml` のプロパティで 1.7 を明示してあげた。

[Maven Compiler Plugin]: http://maven.apache.org/plugins/maven-compiler-plugin/compile-mojo.html

```xml
<project ..>
  ...
  <properties>
    ...
    <maven.compiler.source>1.7</maven.compiler.source>
    <maven.compiler.target>1.7</maven.compiler.target>
  </properties>
  ...
</project>
```

## Java EE 7 Web API クラスパス 追加

Java EE 7 Web API を使う為、クラスパスに通してやる。
`pom.xml` の依存ライブラリに `javaee-web-api` を追加。
GlassFish には Java EE が載ってるので、 `scope` は `provided` で。

```xml
<project ..>
  ...
  <dependencies>
    <dependency>
      <groupId>javax</groupId>
      <artifactId>javaee-web-api</artifactId>
      <version>7.0</version>
      <scope>provided</scope>
    </dependency>
    ...
  </dependencies>
  ...
</project>
```

## web.xml バージョンアップ

自動作成される `web.xml` のバージョンが少し古いのでバージョンアップする。

元の内容はこんなだった。

```xml
<!DOCTYPE web-app PUBLIC
 "-//Sun Microsystems, Inc.//DTD Web Application 2.3//EN"
 "http://java.sun.com/dtd/web-app_2_3.dtd" >

<web-app>
  <display-name>Archetype Created Web Application</display-name>
</web-app>
```

これを、 DTD は削除して XML スキーマへ。
ついでなので `display-name` も書き換えてみた。

```xml
<web-app xmlns="http://xmlns.jcp.org/xml/ns/javaee"
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    xsi:schemaLocation="http://xmlns.jcp.org/xml/ns/javaee http://xmlns.jcp.org/xml/ns/javaee/web-app_3_1.xsd"
    version="3.1">
  <display-name>Try REST Application</display-name>
</web-app>
```

## Maven GlassFish プラグイン (maven-glassfish-plugin) 導入

Maven GlassFish プラグイン (maven-glassfish-plugin) を導入する。
このプラグインでは下記の操作が出来る。
簡単な作業は `asadmin` コマンドが不要になるので楽ちんになる。

* ドメイン操作
  * 作成 (glassfish:create-domain)
  * 起動 (glassfish:start-domain)
  * 停止 (glassfish:stop-domain)
  * 削除 (glassfish:delete-domain)
* アプリケーション操作
  * デプロイ (glassfish:deploy)
  * リデプロイ (glassfish:redeploy)
  * アンデプロイ (glassfish:undeploy)

`pom.xml` にプラグインと作成するドメインの情報を設定する。
ここではプロジェクトディレクトリ配下に
ドメインディレクトリ (glassfish-domain) を配置する設定にしてみる。

```xml
<project ..>
  ...
  <properties>
    ...
    <glassfish.home>${env.GLASSFISH_HOME}</glassfish.home>
    <glassfish.domain.name>${project.artifactId}</glassfish.domain.name>
    <glassfish.domain.dir>${basedir}/glassfish-domain</glassfish.domain.dir>
    <glassfish.domain.admin-user>admin</glassfish.domain.admin-user>
    <glassfish.domain.admin-password>adminadmin</glassfish.domain.admin-password>
    <glassfish.domain.admin-port>4848</glassfish.domain.admin-port>
    <glassfish.domain.http-port>8080</glassfish.domain.http-port>
  </properties>
  ...
  <build>
    ...
    <plugins>
      <plugin>
        <groupId>org.glassfish.maven.plugin</groupId>
        <artifactId>maven-glassfish-plugin</artifactId>
        <version>2.1</version>
        <configuration>
          <glassfishDirectory>${glassfish.home}</glassfishDirectory>
          <domainDirectory>${glassfish.domain.dir}</domainDirectory>
          <user>${glassfish.domain.admin-user}</user>
          <adminPassword>${glassfish.domain.admin-password}</adminPassword>
          <domain>
            <name>${glassfish.domain.name}</name>
            <adminPort>${glassfish.domain.admin-port}</adminPort>
            <httpPort>${glassfish.domain.http-port}</httpPort>
          </domain>
          <components>
            <component>
              <name>${project.artifactId}</name>
              <artifact>${project.build.directory}/${project.build.finalName}.war</artifact>
            </component>
          </components>
        </configuration>
      </plugin>
    </plugins>
  </build>
</project>
```

## コンパイル＆パッケージング

コンパイルして WAR ファイルを作成する。
成功すればプロジェクトディレクトリ配下に `target/try-rest.war` が出来上がる。

```console
$ mvn compile package
```

## GlassFish ドメイン 作成

GlassFish ドメインを作成する。
成功すればプロジェクトディレクトリ配下に `glassfish-domain` ディレクトリが出来あがる。

```console
$ mvn glassfish:create-domain
```

## GlassFish ドメイン 起動

GlassFish ドメインを起動する。

```console
$ mvn glassfish:start-domain
```

成功すれば GlassFish サーバをブラウザで開けるようになる。

http://your-host:8080

[![Image: Your server is now running]][Image: Your server is now running]

[Image: Your server is now running]: {% link assets/posts/2014-08-27-glassfish-jaxrs-env-server-running-686x447.png %}

停止する場合はこれで OK。

```console
$ mvn glassfish:stop-domain
```

## アプリケーション デプロイ

アプリケーションをデプロイする。

```console
$ mvn glassfish:deploy
```

成功すればアプリケーションもブラウザで開けるようになる。
Maven で生成された `index.jsp` が出てくるはず。

http://your-host:8080/try-rest

[![Image: Hello World]][Image: Hello World]

[Image: Hello World]: {% link assets/posts/2014-08-27-glassfish-jaxrs-env-hello-world-686x447.png %}

次からはソース変更した後はこのコマンドで再デプロイ出来る。

```console
$ mvn compile package glassfish:redeploy
```

## 今回はここまで

次は REST な処理の実装方法をまとめたい。

## 追記 (2014-10-24)

コードを GitHub で公開してみた。

[Release rbox-20140827 - akihyro/try-jaxrs](https://github.com/akihyro/try-jaxrs/releases/tag/rbox-20140827)
