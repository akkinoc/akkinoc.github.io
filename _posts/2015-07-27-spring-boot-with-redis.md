---
title: Java - Spring Boot で Redis を使う！
categories: tech
tags: java spring-boot spring-framework redis amazon-elasticache aws
header:
  teaser: /assets/posts/2015-07-27-spring-boot-with-redis-800x300.png
  og_image: /assets/posts/2015-07-27-spring-boot-with-redis-800x300.png
---

バックエンドに Redis を置いた、 Spring Boot アプリケーションを作りました。
そのときに調べた実装方法のメモです。

<!--more-->

Redis に格納するデータフォーマットは

* 文字列
* Java シリアライズ
* JSON

をまとめました。

## Redis とは

* Key-Value ストア (KVS)
* インメモリ DB なので高速
* データに型がある (文字列, リスト, セット, ソート済セット, ハッシュ)

## 環境

* CentOS 6.6
* Redis 2.8.19
* Java 1.8.0 update 51
* Maven 3.3.3
* Spring Boot 1.2.5
* Lombok 1.16.4 (Getter/Setter 作成に使ってます, 本題ではないです)

## 依存関係

`pom.xml` の `dependencies` に
`spring-boot-starter-redis` を追加します。

```xml
<dependency>
  <groupId>org.springframework.boot</groupId>
  <artifactId>spring-boot-starter-redis</artifactId>
</dependency>
```

## 接続設定

Redis サーバへ接続するための設定です。

ここでは `application.yml` に書きました。
`.properties` にするとか、 Java 実行パラメータ (`-D`) で渡すとかはお好みで。

```yaml
spring.redis:
  host: localhost
  port: 6379
  password: null
  database: 0
  pool:
    max-idle: 8
    min-idle: 0
    max-active: 8
    max-wait: -1
```

ちなみに上記はデフォルト値。
この値のまま使うなら敢えて書く必要はないです (^^;

### spring.redis.database

Redis ではデータベースを複数持つことが出来るようで、
0 から順に番号付けされてるようです。
この設定値には、どのデータベースに繋ぐかの番号を指定します。

僕はテスト時は `spring.redis.database=1` にして、
アプリケーション実行に使うエリアと、
テストコードが使うエリアとに分けて利用してます :)

### spring.redis.pool.*

デフォルトでは Apache Commons Pool によって
コネクションをプールして使いまわすっぽいです。
どれくらいプールするかの設定をこのプロパティでいじれるようになってました。

## RedisTemplate について

Java から Redisアクセスするには、 `RedisTemplate` 系のクラスを使います。
Spring Boot の自動設定では、 `StringRedisTemplate` が DI コンテナに登録されてました。

## 文字列で保存/取得してみる

REST コントローラで、 Redis へ PUT/GET してみます。

Redis アクセスには `StringRedisTemplate` を使います。
データ型には、文字列, リスト, ハッシュを使ってみました。

```java
@Data
public class Hoge {
  private String string;
  private List<String> list;
  private Map<String, String> map;
}
```

```java
@RestController @RequestMapping(value = "/hoge-string")
public class HogeStringController {

  @Autowired
  private StringRedisTemplate redisTemplate;

  @RequestMapping(method = RequestMethod.PUT)
  public void put(@RequestBody Hoge value) throws Exception {
    redisTemplate.opsForValue()
      .set("hoge-string:string", value.getString());
    redisTemplate.delete("hoge-string:list");
    redisTemplate.opsForList()
      .rightPushAll("hoge-string:list", value.getList().toArray(new String[0]));
    redisTemplate.delete("hoge-string:map");
    redisTemplate.opsForHash()
      .putAll("hoge-string:map", value.getMap());
  }

  @RequestMapping(method = RequestMethod.GET)
  public Hoge get() throws Exception {
    Hoge hoge = new Hoge();
    hoge.setString(
      redisTemplate.opsForValue().get("hoge-string:string")
    );
    hoge.setList(
      redisTemplate.opsForList().range("hoge-string:list", 0, -1)
    );
    hoge.setMap(
      redisTemplate.<String, String>opsForHash().entries("hoge-string:map")
    );
    return hoge;
  }

}
```

実行すると。

```console
$ curl -X PUT 'http://localhost:8080/hoge-string' \
  -H 'Content-Type:application/json' \
  -d '{
    "string": "hoge",
    "list": [
      "hoge",
      "fuga"
    ],
    "map": {
      "hoge": "fuga",
      "fuga": "piyo"
    }
  }'

$ curl 'http://localhost:8080/hoge-string'
{"string":"hoge","list":["hoge","fuga"],"map":{"fuga":"piyo","hoge":"fuga"}}
```

Redis の登録内容は。

```console
$ redis-cli

> get hoge-string:string
"hoge"

> lrange hoge-string:list 0 -1
1) "hoge"
2) "fuga"

> hgetall hoge-string:map
1) "hoge"
2) "fuga"
3) "fuga"
4) "piyo"
```

## Java のシリアライズで保存/取得してみる

さっきの `Hoge` クラスを Java のシリアライズでバイナリにして、
1件の Key-Value として登録します。

まず自前の `RedisTemplate` を作って、 DI コンテナに登録してやります。
このとき、シリアライザに `JdkSerializationRedisSerializer` をセットします。
キーまでバイナリになると確認しにくいので、
キーのシリアライザには `StringRedisSerializer` をセットしました。

用意されてるシリアライザを組み合わせるだけなので楽ちんです。

```java
@Configuration
public class RedisConfiguration {
  @Bean
  public RedisTemplate<String, Hoge> serialRedisTemplate(RedisConnectionFactory connectionFactory) {
    RedisTemplate<String, Hoge> redisTemplate = new RedisTemplate<>();
    redisTemplate.setConnectionFactory(connectionFactory);
    redisTemplate.setKeySerializer(new StringRedisSerializer());
    redisTemplate.setValueSerializer(new JdkSerializationRedisSerializer());
    redisTemplate.setHashKeySerializer(redisTemplate.getKeySerializer());
    redisTemplate.setHashValueSerializer(redisTemplate.getValueSerializer());
    return redisTemplate;
  }
}
```

`Hoge` クラスは `Serializable` にしておきます。

```java
import java.io.Serializable;

public class Hoge implements Serializable {
  // ...
}
```

さっきとは別の REST コントローラを作って、 Redis へ PUT/GET してみます。
`RedisTemplate` は新たに作ったものをインジェクション。
`Hoge` クラスを丸っと Redis へ投げてます。

```java
@RestController @RequestMapping(value = "/hoge-serial")
public class HogeSerialController {

  @Autowired @Qualifier("serialRedisTemplate")
  private RedisTemplate<String, Hoge> redisTemplate;

  @RequestMapping(method = RequestMethod.PUT)
  public void put(@RequestBody Hoge value) throws Exception {
    redisTemplate.opsForValue().set("hoge-serial", value);
  }

  @RequestMapping(method = RequestMethod.GET)
  public Hoge get() throws Exception {
    return redisTemplate.opsForValue().get("hoge-serial");
  }

}
```

実行すると。

```console
$ curl -X PUT 'http://localhost:8080/hoge-serial' \
  -H 'Content-Type:application/json' \
  -d '{
    "string": "hoge",
    "list": [
      "hoge",
      "fuga"
    ],
    "map": {
      "hoge": "fuga",
      "fuga": "piyo"
    }
  }'

$ curl 'http://localhost:8080/hoge-serial'
{"string":"hoge","list":["hoge","fuga"],"map":{"hoge":"fuga","fuga":"piyo"}}
```

Redis の登録内容は。

```console
$ redis-cli

> get hoge-serial
"\xac\xed\x00\x05sr\x00#akihyro.tryspringbootwithredis.Hoge\xa2[\xd9\xb5?\xa0\xcb=\x02\x00\x03L\x00\x04listt\x00\x10Ljava/util/List;L\x00\x03mapt\x00\x0fLjava/util/Map;L\x00\x06stringt\x00\x12Ljava/lang/String;xpsr\x00\x13java.util.ArrayListx\x81\xd2\x1d\x99\xc7a\x9d\x03\x00\x01I\x00\x04sizexp\x00\x00\x00\x02w\x04\x00\x00\x00\x02t\x00\x04hoget\x00\x04fugaxsr\x00\x17java.util.LinkedHashMap4\xc0N\\\x10l\xc0\xfb\x02\x00\x01Z\x00\x0baccessOrderxr\x00\x11java.util.HashMap\x05\a\xda\xc1\xc3\x16`\xd1\x03\x00\x02F\x00\nloadFactorI\x00\tthresholdxp?@\x00\x00\x00\x00\x00\x0cw\b\x00\x00\x00\x10\x00\x00\x00\x02t\x00\x04hoget\x00\x04fugat\x00\x04fugat\x00\x04piyox\x00t\x00\x04hoge"
```

...やはりバイナリは見にくい (^^;

## JSON で保存/取得してみる

さっきの `Hoge` クラスを JSON にして、1件の Key-Value として登録します。

まずは JSON 版の `RedisTemplate` を DI コンテナに登録。
シリアライザには `Jackson2JsonRedisSerializer` をセットします。

```java
@Configuration
public class RedisConfiguration {

  // ...

  @Bean
  public RedisTemplate<String, Hoge> jsonRedisTemplate(RedisConnectionFactory connectionFactory) {
    RedisTemplate<String, Hoge> redisTemplate = new RedisTemplate<>();
    redisTemplate.setConnectionFactory(connectionFactory);
    redisTemplate.setKeySerializer(new StringRedisSerializer());
    redisTemplate.setValueSerializer(new Jackson2JsonRedisSerializer<>(Hoge.class));
    redisTemplate.setHashKeySerializer(redisTemplate.getKeySerializer());
    redisTemplate.setHashValueSerializer(redisTemplate.getValueSerializer());
    return redisTemplate;
  }

}
```

また新しい REST コントローラを作って、 Redis へ PUT/GET してみます。

```java
@RestController @RequestMapping(value = "/hoge-json")
public class HogeJsonController {

  @Autowired @Qualifier("jsonRedisTemplate")
  private RedisTemplate<String, Hoge> redisTemplate;

  @RequestMapping(method = RequestMethod.PUT)
  public void put(@RequestBody Hoge value) throws Exception {
    redisTemplate.opsForValue().set("hoge-json", value);
  }

  @RequestMapping(method = RequestMethod.GET)
  public Hoge get() throws Exception {
    return redisTemplate.opsForValue().get("hoge-json");
  }

}
```

実行すると。

```console
$ curl -X PUT 'http://localhost:8080/hoge-json' \
  -H 'Content-Type:application/json' \
  -d '{
    "string": "hoge",
    "list": [
      "hoge",
      "fuga"
    ],
    "map": {
      "hoge": "fuga",
      "fuga": "piyo"
    }
  }'

$ curl 'http://localhost:8080/hoge-json'
{"string":"hoge","list":["hoge","fuga"],"map":{"hoge":"fuga","fuga":"piyo"}}
```

Redis の登録内容は。

```console
$ redis-cli

> get hoge-json
"{\"string\":\"hoge\",\"list\":[\"hoge\",\"fuga\"],\"map\":{\"hoge\":\"fuga\",\"fuga\":\"piyo\"}}"
```

## Redis に格納するフォーマットで好きなもの

アプリの特性にもよるだろうけど、僕は今のところ JSON で格納が好きです。

* リストやハッシュの構造を持てる。
* 値を人間が確認できる。
  * redis-cli だけでは見にくいけど...
  * Redis Desktop Manager を使うと見やすい。
* 項目を追加しやすい。
  * 前記のコードで言うと、 `Hoge` クラスにフィールドを追加しやすい。
  * `JdkSerializationRedisSerializer` では、
    フィールド追加前に保存したエントリを読み込もうとすると
    `SerializationException` が発生する。
  * `Jackson2JsonRedisSerializer` では、
    新たに追加したフィールドは `null` で返してくれる。

## おまけ: クライアントは Redis Desktop Manager が便利

**Redis Desktop Manager**
<http://redisdesktop.com>

GUI でコロン区切りでいい感じにツリー構造にしてくれるのと、
保存形式が JSON なら見やすい形にも出来ました :)

[![Image: Desktop Manager]][Image: Desktop Manager]

[Image: Desktop Manager]: {% link assets/posts/2015-07-27-spring-boot-with-redis-desktop-manager-936x589.png %}

## おまけ: AWS では ElastiCache が便利

もしアプリケーションを AWS で動かすなら、
Amazon ElastiCache の Redis が便利でした。

キャッシュノードを複数の AZ に立てれば、レプリケーショングループのオプション1つで
マルチ AZ + レプリケーションしてくれて、 SPOF を回避できます。

最初、 memcached と Redis どちらを使うか悩みましたが、
この楽ちんさで Redis を採用しました :)

## コード (GitHub)

[akihyro/try-spring-boot-with-redis - GitHub](https://github.com/akihyro/try-spring-boot-with-redis)

## 参考

* [Spring Boot Reference Guide](http://docs.spring.io/spring-boot/docs/current/reference/htmlsingle/)
* [Spring Data Redis](http://docs.spring.io/spring-data/redis/docs/1.4.3.RELEASE/reference/html/)
* [Redis と spring-boot 連携 - teruuuのブログ](http://steavevaivai.hatenablog.com/entry/2015/05/23/183137)
* [SpringDataRedis を使ってみる - するめとめがね](http://tm8r.hateblo.jp/entry/20120329/1333033094)
