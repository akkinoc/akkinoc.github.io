---
title: GlassFish + JAX-RS (Jersey) で REST なアプリを作ってみる (Java)
categories: tech
tags: glassfish java jax-rs jersey rest maven lombok
header:
  teaser: /assets/posts/2014-10-28-glassfish-jaxrs-java-800x225.jpg
---

前回の記事の続き。

[GlassFish + JAX-RS (Jersey) で REST なアプリを作ってみる (環境構築)]({% post_url 2014-08-27-glassfish-jaxrs-env %})

この記事では REST っぽく GET/POST するところまでまとめた。

<!--more-->

## ここでやること

* `POST /hoges` で Hoge データを登録する。
* `GET /hoges` で Hoge データのリストを取得する。
* `GET /hoges/{id}` で Hoge データを取得する。
* データストアは Java のメモリ上に持つ。
  * 本来なら DB 保存が殆どだろうけど、本題じゃないので横着。
  * 本来ならスレッドセーフにすべきだけど、本題じゃないので横着。
* データは XML or JSON で返す。

## 環境 (前回の記事からの差分)

いくつか新しいバージョンが出てたのでインストールし直した。

* JDK 7 u67 => JDK 8 u25
* Maven 3.2.2 => Maven 3.2.3
* GlassFish 4.0.1 => GlassFish 4.1

## 依存ライブラリ Jersey core Servlet 3.x 追加

まずは GlassFish のサーブレットベースで動かすのに必要となる、
Jersey のライブラリをクラスパスに追加してあげる。

この内容を `pom.xml` の依存関係に追加すれば OK。
GlassFish には元から Jersey が搭載されてるので、 `scope` は `provided` にする。

```xml
<project ..>
  ...
  <dependencies>
    ...
    <dependency>
      <groupId>org.glassfish.jersey.containers</groupId>
      <artifactId>jersey-container-servlet</artifactId>
      <version>2.10.4</version>
      <scope>provided</scope>
    </dependency>
    ...
  </dependencies>
  ...
</project>
```

## 依存ライブラリ Lombok 追加

今回のお題とは関係ないのだけど、
後で Getter/Setter を楽に作れるように、 Lombok を使えるようにしておく。

この内容を `pom.xml` の依存関係に追加すれば OK。
コンパイル時にだけ動けば良いので、 `scope` は `provided` にする。

```xml
<project ..>
  ...
  <dependencies>
    ...
    <dependency>
      <groupId>org.projectlombok</groupId>
      <artifactId>lombok</artifactId>
      <version>1.14.8</version>
      <scope>provided</scope>
    </dependency>
    ...
  </dependencies>
  ...
</project>
```

## Jersey ServletContainer 設定

Jersey を動かす方法には、

1. サーブレットで動かす方法: `web.xml` に書く
2. サーブレットで動かす方法: `@ApplicationPath` を使う
3. フィルタで動かす方法: `web.xml` に書く

があるっぽい。

このうち、ここではフィルタで動かす方法を選んだ。
後々は "Jersey JSP MVC Templates" ってので
レスポンスのレンダリングもやってみたいと考えてるのだけど、
これを使うには [ServletFilter を web.xml に登録しないといけない] らしいので。

[ServletFilter を web.xml に登録しないといけない]: http://qiita.com/opengl-8080/items/f4c25ad671e8a6dac743#4-2

フィルタで動かすには、下記内容を `web.xml` に追加すればOK。
`tryrest.TryRestApplication` の部分には、
この後自分の作成するクラスの名前を指定しておく。

```xml
<web-app ...>
  ...
  <filter>
    <filter-name>servlet-container</filter-name>
    <filter-class>org.glassfish.jersey.servlet.ServletContainer</filter-class>
    <init-param>
      <param-name>javax.ws.rs.Application</param-name>
      <param-value>tryrest.TryRestApplication</param-value>
    </init-param>
  </filter>
  <filter-mapping>
    <filter-name>servlet-container</filter-name>
    <url-pattern>/*</url-pattern>
  </filter-mapping>
</web-app>
```

ちなみに、これを書くと `src/main/webapp` 配下に置いてる JSP は
フィルタで覆われて見れなくなってしまう。
見れるようにも設定出来るけど、それはまた別でまとめたい。

## アプリケーションクラス 作成

`javax.ws.rs.core.Application` を継承したクラスを作る。
`org.glassfish.jersey.server.ResourceConfig` (`Application` 継承) を使うと、
色々メソッドが生えてて便利。

このクラスでは利用するリソースクラス等の登録が責務っぽい。
ここでは `ResourceConfig#packages()` を使って、
自分のパッケージ配下をスキャン＆登録してもらう。

```java
package tryrest;
import org.glassfish.jersey.server.ResourceConfig;

public class TryRestApplication extends ResourceConfig {
    public TryRestApplication() {
        packages(TryRestApplication.class.getPackage().getName());
    }
}
```

## リソースクラス 作成

今回メインとなるリソースクラスを作る。
URL とのマッピングと、実処理を書く。

ポイントはこんなとこ。

* `@Path` で URL のマッピングをする。
  * `@Path` はメソッドにも付けれる。
  * その場合はクラスとメソッドのパスを連結した URL になる。
  * `{hogehoge}` で URL パスの一部をパラメータに出来る (=> `@PathParam`)。
* `@GET`, `@POST` で HTTP メソッドのマッピングをする。
* パラメータは引数やフィールドで受取れる。
  * URL パスの一部を受取る場合は `@PathParam` を使う。
  * URL クエリ文字列を受取る場合は `@QueryParam` を使う。
  * フォームの値を受取る場合は `@FormParam` を使う。
  * Bean クラスにまとめて受取る場合は `@BeanParam` を使う。
* 戻り値のデータは、リクエストヘッダに応じたフォーマットで返してくれる。
  * `Accept: application/json` なら JSON に変換して返してくれる。
  * `Accept: application/xml` なら XML に変換して返してくれる。
* `@Context` を使うと色々なリクエスト/レスポンス情報をインジェクション出来る。
  * 今回はアプリケーションの URL を取得するのに `UriInfo` を使ってる。

```java
package tryrest.hoges;
import java.net.URI;
import java.util.ArrayList;
import java.util.List;
import javax.ws.rs.BeanParam;
import javax.ws.rs.GET;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.Response;
import javax.ws.rs.core.UriInfo;

@Path("/hoges")
public class HogeResource {

  private static List<HogeData> store = new ArrayList<HogeData>();

  @Context
  private UriInfo uriInfo;

  @POST
  public Response post(@BeanParam HogeData data) {
    store.add(data);
    URI uri = uriInfo.getAbsolutePathBuilder().path("{id}").build(store.size());
    return Response.created(uri).entity(data).build();
  }

  @GET
  public List<HogeData> get() {
    return store;
  }

  @GET
  @Path("/{id}")
  public HogeData get(@PathParam("id") int id) {
    return store.get(id - 1);
  }

}
```

データクラスはこんな感じ。
単純な Bean に幾つかのアノテーションを与えてる。

* `@Data` は Getter/Setter を自動生成してる。
  * Lombok の機能。コードの見通し良くなって Lombok 最高。
  * `toString()` なんかも自動生成してくれる。
* `@XmlRootElement` は XML に変換する場合に必要。
  * JAXB の機能。
  * 他にも色々アノテーションがあって、 XML の形をカスタマイズ出来るっぽい。
* `@FormParam` はフォームデータのキーとのマッピング。
  * リストの場合は同じキーのデータを複数送ればOK。

```java
package tryrest.hoges;
import java.util.List;
import javax.ws.rs.FormParam;
import javax.xml.bind.annotation.XmlRootElement;
import lombok.Data;

@Data
@XmlRootElement
public class HogeData {

  @FormParam("integer")
  private Integer integer;

  @FormParam("string")
  private String string;

  @FormParam("strings")
  private List<String> strings;

}
```

## コンパイル, パッケージ作成, デプロイ

ここまで出来たらコンパイル＆デプロイ。

```console
$ mvn compile package glassfish:redeploy
```

## 動作確認

まずは POST で適当なデータを登録してみる。
レスポンスは JSON で。

```console
$ curl -i -H "Accept: application/json" \
  -d "integer=1" \
  -d "string=aaa" \
  -d "strings=AAA1" -d "strings=AAA2" -d "strings=AAA3" \
  http://your-host:8080/try-rest/hoges

HTTP/1.1 201 Created
Server: GlassFish Server Open Source Edition  4.1
X-Powered-By: Servlet/3.1 JSP/2.3 (GlassFish Server Open Source Edition  4.1  Java/Oracle Corporation/1.8)
Location: http://your-host:8080/try-rest/hoges/1
Content-Type: application/json
Date: Mon, 27 Oct 2014 13:39:26 GMT
Content-Length: 61

{"integer":1,"string":"aaa","strings":["AAA1","AAA2","AAA3"]}
```

次はレスポンスを XML にしてみる。
リクエストヘッダの `Accept` でコントロール。

```console
$ curl -i -H "Accept: application/xml" \
  -d "integer=2" \
  -d "string=bbb" \
  -d "strings=BBB1" -d "strings=BBB2" -d "strings=BBB3" \
  http://your-host:8080/try-rest/hoges

HTTP/1.1 201 Created
Server: GlassFish Server Open Source Edition  4.1
X-Powered-By: Servlet/3.1 JSP/2.3 (GlassFish Server Open Source Edition  4.1  Java/Oracle Corporation/1.8)
Location: http://your-host:8080/try-rest/hoges/2
Content-Type: application/xml
Date: Mon, 27 Oct 2014 13:40:26 GMT
Content-Length: 185

<?xml version="1.0" encoding="UTF-8" standalone="yes"?><hogeData><integer>2</integer><string>bbb</string><strings>BBB1</strings><strings>BBB2</strings><strings>BBB3</strings></hogeData>
```

今度はデータのリストを JSON で GET してみる。

```console
$ curl -i -H "Accept: application/json" \
  http://your-host:8080/try-rest/hoges

HTTP/1.1 200 OK
Server: GlassFish Server Open Source Edition  4.1
X-Powered-By: Servlet/3.1 JSP/2.3 (GlassFish Server Open Source Edition  4.1  Java/Oracle Corporation/1.8)
Content-Type: application/json
Date: Mon, 27 Oct 2014 13:40:56 GMT
Content-Length: 125

[{"integer":1,"string":"aaa","strings":["AAA1","AAA2","AAA3"]},{"integer":2,"string":"bbb","strings":["BBB1","BBB2","BBB3"]}]
```

単一のデータも GET してみる。 id=2 のデータを XML で。

```console
$ curl -i -H "Accept: application/xml" \
  http://your-host:8080/try-rest/hoges/2

HTTP/1.1 200 OK
Server: GlassFish Server Open Source Edition  4.1
X-Powered-By: Servlet/3.1 JSP/2.3 (GlassFish Server Open Source Edition  4.1  Java/Oracle Corporation/1.8)
Content-Type: application/xml
Date: Mon, 27 Oct 2014 13:41:28 GMT
Content-Length: 185

<?xml version="1.0" encoding="UTF-8" standalone="yes"?><hogeData><integer>2</integer><string>bbb</string><strings>BBB1</strings><strings>BBB2</strings><strings>BBB3</strings></hogeData>
```

問題なく動いた。
XML/JSON の切換えも出来てる。

Accept ヘッダが面倒な場合は、 URL の拡張子で制御する仕組みもあった。
その辺もまた別でまとめたいなー。

以上！

## コード (GitHub)

[Release rbox-20141028 - akihyro/try-jaxrs](https://github.com/akihyro/try-jaxrs/releases/tag/rbox-20141028)

## 参考

* [今どきの Java Web フレームワークってどうなってるの？ - きしだのはてな](http://d.hatena.ne.jp/nowokay/20131108)
* [Jersey 2.13 User Guide](https://jersey.java.net/documentation/latest/user-guide.html)
* [Project Lombok](http://projectlombok.org)
* [JerseyMVC の使い方メモ - Qiita](http://qiita.com/opengl-8080/items/f4c25ad671e8a6dac743)
