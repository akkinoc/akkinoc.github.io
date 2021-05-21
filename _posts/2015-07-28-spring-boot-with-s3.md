---
title: Java - Spring Boot で Amazon S3 にアクセスする！
categories: tech
tags: java spring-boot spring-framework amazon-s3 aws
header:
  teaser: /assets/posts/2015-07-28-spring-boot-with-s3-800x300.png
---

Spring Boot アプリケーションから、 Amazon S3 上のファイルを読み書きしたメモです。
Amazon 公式の AWS SDK は直接は使わず、
Spring Framework の Resource インターフェイスを使いました。

<!--more-->

## 環境

* CentOS 6.6
* Java 1.8.0 update 51
* Maven 3.3.3
* Spring Boot 1.2.5
* Spring Cloud AWS 1.0.2
* AWS CLI 1.7.39 (準備＆確認用に使用, 本題ではないです)

## AWS アクセスキーを定義

ここでは AWS アクセスキーは環境変数に定義して使いました。
IAM ロール (インスタンスプロファイル) でも出来そうでしたが、未確認です (^^;

```console
$ export AWS_ACCESS_KEY_ID="..."
$ export AWS_SECRET_ACCESS_KEY="..."
```

ついでにリージョンも環境変数に入れておきます。

```console
$ export AWS_DEFAULT_REGION="ap-northeast-1"  # Tokyo Region
```

## テスト用のバケットを作成

テスト用の S3 バケットを作成しておきます。
ここでは AWS CLI で `try-spring-boot-with-s3` というバケットを作成しました。
AWS Management Console から作っても大丈夫 :)

```console
$ aws s3 mb s3://try-spring-boot-with-s3
```

## 依存関係

`pom.xml` の `dependencies` に `spring-cloud-aws-autoconfigure` を追加します。

```xml
<dependency>
  <groupId>org.springframework.cloud</groupId>
  <artifactId>spring-cloud-aws-autoconfigure</artifactId>
  <version>1.0.2.RELEASE</version>
</dependency>
```

## Spring Cloud AWS 設定

AWS アクセスキーとリージョンは、環境変数を使うように設定します。
ここでは `application.yml` に書きました。
`.properties` にするなり、 Java 実行パラメータ (`-D`) で渡すなりはお好みで。

```yaml
cloud.aws:
  credentials:
    accessKey: ${AWS_ACCESS_KEY_ID}
    secretKey: ${AWS_SECRET_ACCESS_KEY}
  region:
    static: ${AWS_DEFAULT_REGION}
```

## S3 上のファイルを読み書きする

REST コントローラ経由で、 S3 上の `hoge` ファイルを
アップロード/ダウンロードしてみます。
PUT でアップロード, GET でダウンロードです。

```java
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.core.io.ResourceLoader;
import org.springframework.core.io.WritableResource;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/hoge")
public class S3RefController {

  @Autowired
  private ResourceLoader resourceLoader;

  @RequestMapping(method = RequestMethod.PUT)
  public void put(InputStream req) throws Exception {
    WritableResource resource = getResource();
    try (OutputStream out = resource.getOutputStream()) {
      copy(req, out);
    }
  }

  @RequestMapping(method = RequestMethod.GET)
  public void get(OutputStream res) throws Exception {
    Resource resource = getResource();
    try (InputStream in = resource.getInputStream()) {
      copy(in, res);
    }
  }

  private WritableResource getResource() {
    return (WritableResource)
      resourceLoader.getResource("s3://try-spring-boot-with-s3/hoge");
  }

  private void copy(InputStream in, OutputStream out) throws IOException {
    byte[] buff = new byte[1024];
    for (int len = in.read(buff); len > 0; len = in.read(buff)) {
      out.write(buff, 0, len);
    }
  }

}
```

適当なファイルを作成して、 PUT でアップロードを実行してみると。

```console
$ cat <<-EOC >/tmp/hoge
> hoge
> fuga
> piyo
> EOC

$ curl -X PUT "http://localhost:8080/hoge" --data-binary @/tmp/hoge
```

GET でダウンロードを実行してみると。

```console
$ curl "http://localhost:8080/hoge"
hoge
fuga
piyo
```

いちお AWS CLI 経由でもアップロード内容を確認すると。

```console
$ aws s3 cp s3://try-spring-boot-with-s3/hoge -
hoge
fuga
piyo
```

## コード

[akihyro/try-spring-boot-with-s3 - GitHub](https://github.com/akihyro/try-spring-boot-with-s3)

## 参考

* [Spring Cloud AWS Reference](http://cloud.spring.io/spring-cloud-aws/spring-cloud-aws.html)
* [6. Resources - Spring Framework Reference Documentation](http://docs.spring.io/autorepo/docs/spring/4.1.x/spring-framework-reference/html/resources.html)
