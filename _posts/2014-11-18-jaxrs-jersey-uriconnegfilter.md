---
title: JAX-RS (Jersey) - URL の拡張子でレスポンスのコンテンツタイプを切り替える
categories: tech
tags: jax-rs jersey java glassfish
header:
  teaser: /assets/posts/2014-11-18-jaxrs-jersey-uriconnegfilter-800x200.png
  og_image: /assets/posts/2014-11-18-jaxrs-jersey-uriconnegfilter-800x200.png
---

複数のフォーマット (XML とか JSON とか) で返せる REST-API を作る場合、
JAX-RS では `Accept` リクエストヘッダで
コンテンツタイプを指定して切り替える仕組みになってる。

けどリクエストヘッダを付けるより、
URL 末尾に ".xml" とか ".json" とか付ける方が楽だなーと思ったのでやってみた。

<!--more-->

＊JAX-RS 標準仕様ではないので、 Jersey 以外では別の方法になると思う。

## UriConnegFilter

Jersey では `org.glassfish.jersey.server.filter.UriConnegFilter` で楽に実現できた。
拡張子とコンテンツタイプを事前にマッピングしておけば、
`Accept` ヘッダを書き換えてくれるっぽい。

ちなみに Conneg は Content negotiation の略だと思う。
いつも Config に空目してしまう。

## URL 拡張子とコンテンツタイプのマッピング方法

ここでは、

* ".xml" => "application/xml"
* ".json" => "application/json"

にマッピングしてみる。

マッピング方法は2つあった。
どちらの方法も `UriConnegFilter` の `register` は自動でやってくれる。

### ResourceConfig のサブクラスでやる方法

`org.glassfish.jersey.server.ResourceConfig` サブクラスのコンストラクタに、
こんなノリで書けば OK。

```java
public class TryRestApplication extends ResourceConfig {
  public TryRestApplication() {
    packages(TryRestApplication.class.getPackage().getName());
    // URL拡張子とコンテンツタイプのマッピング
    Map<String, MediaType> mappings = new HashMap<>();
    mappings.put("xml", MediaType.APPLICATION_XML_TYPE);
    mappings.put("json", MediaType.APPLICATION_JSON_TYPE);
    property(ServerProperties.MEDIA_TYPE_MAPPINGS, mappings);
  }
}
```

### web.xml に書く方法

`org.glassfish.jersey.servlet.ServletContainer` の `init-param` で設定。
`jersey.config.server.mediaTypeMappings` にカンマ区切りで書けば OK だった。

```xml
<filter>
  <filter-name>servlet-container</filter-name>
  <filter-class>org.glassfish.jersey.servlet.ServletContainer</filter-class>
  <init-param>
    <param-name>javax.ws.rs.Application</param-name>
    <param-value>tryrest.TryRestApplication</param-value>
  </init-param>
  <!-- URL拡張子とコンテンツタイプのマッピング -->
  <init-param>
    <param-name>jersey.config.server.mediaTypeMappings</param-name>
    <param-value>
      xml : application/xml,
      json: application/json
    </param-value>
  </init-param>
</filter>
```

個人的には `ResourceConfig` で書く方が好き。
パラメータ名やメディアタイプに定数使えるし。

## 試してみる

以前の記事で書いたコードを流用して試してみる。

[GlassFish + JAX-RS (Jersey) で REST なアプリを作ってみる (Java)]({% post_url 2014-10-28-glassfish-jaxrs-java %})

`Accept` ヘッダを付けなくていいので、ブラウザでも簡単に確認できた。

まずは ".json" で GET。

```console
$ curl -i http://localhost:8080/try-rest/hoges/2.json
HTTP/1.1 200 OK
Server: GlassFish Server Open Source Edition  4.1
X-Powered-By: Servlet/3.1 JSP/2.3 (GlassFish Server Open Source Edition  4.1  Java/Oracle Corporation/1.8)
Content-Type: application/json
Date: Sun, 16 Nov 2014 09:43:09 GMT
Content-Length: 61

{"integer":2,"string":"bbb","strings":["BBB1","BBB2","BBB3"]}
```

次は ".xml" で GET。

```console
$ curl -i http://localhost:8080/try-rest/hoges/2.xml
HTTP/1.1 200 OK
Server: GlassFish Server Open Source Edition  4.1
X-Powered-By: Servlet/3.1 JSP/2.3 (GlassFish Server Open Source Edition  4.1  Java/Oracle Corporation/1.8)
Content-Type: application/xml
Date: Sun, 16 Nov 2014 09:43:40 GMT
Content-Length: 185

<?xml version="1.0" encoding="UTF-8" standalone="yes"?><hogeData><integer>2</integer><string>bbb</string><strings>BBB1</strings><strings>BBB2</strings><strings>BBB3</strings></hogeData>
```

## 言語も出来るみたい

試してはいないけど、ドキュメント見た感じだと
"Accept-Language" のマッピングも同じように出来そうだった。

## まとめ

* 拡張子でコンテンツタイプを切り替える場合は `UriConnegFilter` を使う。
* マッピングは `ResourceConfig` サブクラス or `web.xml` で設定。

## コード (GitHub)

[Release rbox-20141118 - akihyro/try-jaxrs](https://github.com/akihyro/try-jaxrs/releases/tag/rbox-20141118)

## 参考

* [JAX-RS でアクセスした拡張子に応じて出力形式を変える + Spring 連携 - 今日つかったスニペット](http://cyubachi.hatenablog.com/entry/2013/11/15/194056)
* [Jersey で拡張子に応じて出力コンテンツを振り分ける方法 - AOE の日記](http://d.hatena.ne.jp/aoe-tk/20130203/1359900081)
* [UriConnegFilter - Jersey 2.13 API](https://jersey.java.net/apidocs/2.13/jersey/org/glassfish/jersey/server/filter/UriConnegFilter.html)
