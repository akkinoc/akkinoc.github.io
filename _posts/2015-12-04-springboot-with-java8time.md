---
title: Spring Boot + 周辺ライブラリで Java 8 日時 API を使う！ (Java Advent Calendar 2015 4日目)
categories: tech
tags: spring-boot spring-framework java jackson jaxb jpa thymeleaf
header:
  teaser: /assets/posts/2015-12-04-springboot-with-java8time-800x280.jpg
  og_image: /assets/posts/2015-12-04-springboot-with-java8time-800x280.jpg
---

これは [Java Advent Calendar 2015] 4日目の記事です。
昨日は [@susumuis] さんでした。明日は [@megascus] さんです。

[Java Advent Calendar 2015]: http://qiita.com/advent-calendar/2015/java
[@susumuis]: https://twitter.com/susumuis
[@megascus]: https://twitter.com/megascus

<!--more-->

- - -

Java で日時を扱う場合は、できるだけ Java 8 Date and Time API を使っています。
旧 API (`java.util.Date`, `java.util.Calendar`) と比較して、

* Immutable なこと。
* 日付, 時間, 日付 + 時間等でクラスが分かれてること。

が気に入ってます。

が、まだ一手間加えないと何も考えずに使えるとは言えない状態でした。

この記事では、 Spring Boot & 僕がよく使う周辺ライブラリで
Java 8 日時 API を使うときにやったことをまとめました。

## 前置き

普段は、ビジネスロジックやデータは Java 8 日時に統一して、
どうしてもなところだけ共通処理で旧型日時に変換する考え方でやってます。

今回、試した環境はこちらです。

* Spring Boot 1.3.0
* Java 1.8.0 Update 60
* Apache Maven 3.3.3

次の部分について、 Java 8 日時を1つずつ扱えるようにしました。

* Jackson
* JAXB
* JPA
* Thymeleaf
* プロパティ (`@Value`, `@ConfigurationProperties`)
* リクエストパラメータ (`@PathVariable`, `@RequestParam`, `@ModelAttribute`, etc)

使う日時の型は、次の3つに限定します。
Offset 系, Zoned 系はあまり扱ったことがありません (^^;

* `java.time.LocalDate`
* `java.time.LocalTime`
* `java.time.LocalDateTime`

日時のフォーマットは、基本は ISO で統一しています。

## Jackson

`spring-boot-starter-web` のデフォで使える Jackson.
`@RequestBody`, `@ResponseBody` 等の JSON 変換に Jackson を使う場合は、
次の2点を設定すればフィールドに Java 8 日時が使えました。

1) 依存関係に Jackson Datatype JSR310 を追加。

```xml
<dependency>
  <groupId>com.fasterxml.jackson.datatype</groupId>
  <artifactId>jackson-datatype-jsr310</artifactId>
</dependency>
```

2) `application.yml` 等で Jackson のオプションをセット。

```yaml
spring.jackson.serialization.WRITE_DATES_AS_TIMESTAMPS: false
```

`@JsonFormat` を添えれば、フィールドごとにフォーマット変更もいけました。

```java
@JsonFormat(pattern = "y年M月d日")
private LocalDate customDate;
@JsonFormat(pattern = "H時m分s秒")
private LocalTime customTime;
@JsonFormat(pattern = "y年M月d日 H時m分s秒")
private LocalDateTime customDateTime;
```

### サンプルコード

[akihyro/try-springboot-with-java8time/jackson - GitHub](https://github.com/akihyro/try-springboot-with-java8time/tree/master/jackson)

実行後、こんな curl コマンドで GET/POST できます。

```console
$ curl "http://localhost:8080/hoge"
$ curl -X POST "http://localhost:8080/hoge" \
  -H "Content-Type: application/json" \
  -d '{ "isoDate": "2012-01-23", "isoTime": "23:59:48", "isoDateTime": "2012-01-23T23:59:48", "customDate": "2012年1月23日", "customTime": "23時59分48秒", "customDateTime": "2012年1月23日 23時59分48秒" }'
```

### 参考

* [FasterXML/jackson-datatype-jsr310 - GitHub](https://github.com/FasterXML/jackson-datatype-jsr310)
* [71.3 Customize the Jackson ObjectMapper - Spring Boot Reference Guide](http://docs.spring.io/spring-boot/docs/1.3.0.RELEASE/reference/htmlsingle/#howto-customize-the-jackson-objectmapper)

## JAXB

Java 標準で使える JAXB.
`@RequestBody`, `@ResponseBody` 等の XML 変換に JAXB を使う場合は、
次の2点を設定すればフィールドに Java 8 日時が使えました。

日時の型ごとに XmlAdapter を用意しないといけないのですが、
作るのが面倒なので軽くぐぐったら、
[JAXB adapters for Java 8 Date and Time API (JSR-310) types](https://github.com/migesok/jaxb-java-time-adapters)
というのがあったので使ってみました。

1) 依存関係に追加。

```xml
<dependency>
  <groupId>com.migesok</groupId>
  <artifactId>jaxb-java-time-adapters</artifactId>
  <version>1.1.3</version>
</dependency>
```

2) パッケージにアノテーションを付与してアダプタを指定。

```java
@XmlJavaTypeAdapters({
  @XmlJavaTypeAdapter(value = LocalDateXmlAdapter.class, type = LocalDate.class),
  @XmlJavaTypeAdapter(value = LocalTimeXmlAdapter.class, type = LocalTime.class),
  @XmlJavaTypeAdapter(value = LocalDateTimeXmlAdapter.class, type = LocalDateTime.class)
})
package your.pkg;
```

### サンプルコード

[akihyro/try-springboot-with-java8time/jaxb - GitHub](https://github.com/akihyro/try-springboot-with-java8time/tree/master/jaxb)

実行後、こんな curl コマンドで GET/POST できます。

```console
$ curl "http://localhost:8080/hoge.xml"
$ curl -X POST "http://localhost:8080/hoge.xml" \
  -H "Content-Type: application/xml" \
  -d '<hoge><isoDate>2012-01-23</isoDate><isoDateTime>2012-01-23T23:59:48</isoDateTime><isoTime>23:59:48</isoTime></hoge>'
```

### 参考

* [migesok/jaxb-java-time-adapters - GitHub](https://github.com/migesok/jaxb-java-time-adapters)
* [日本人のための Date and Time API Tips - Programming Studio](http://www.coppermine.jp/docs/programming/2013/12/jsr310-tips.html)

## JPA

最近は DBMS には MySQL 5.6 を使っています。

DB 側の日時の型は `DATE`, `TIME`, `DATETIME` を使い分けたいのですが、
単純に `@Entity` のフィールドに `LocalDate` 等を使うと
`BLOB` にマッピングされてしまいました。

この場合は、 `java.util.Date`, `java.sql.Date` 等に変換する
`AttributeConverter` を組み込んであげれば良いようです。
Spring Data JPA には `Jsr310JpaConverters` というクラスが
用意されていたので使ってみました。

`Jsr310JpaConverters` をスキャン対象に加えれば使えました。

```java
@SpringBootApplication
@EntityScan(basePackageClasses = {
  YourApplication.class, Jsr310JpaConverters.class
})
public class YourApplication {
}
```

＊MySQL 5.6, Hibernate でしか試していないので、
他の DBMS や JPA 実装でも大丈夫かは分かりません (^^;

### サンプルコード

[akihyro/try-springboot-with-java8time/jpa - GitHub](https://github.com/akihyro/try-springboot-with-java8time/tree/master/jpa)

localhost に test スキーマがあること前提のコードです。
実行すると日時を持つ hoge テーブルを作成して、 INSERT/SELECT します。

### 参考

* [Jsr310JpaConverters - Spring Data JPA 1.9.1.RELEASE API](http://docs.spring.io/spring-data/jpa/docs/current/api/org/springframework/data/jpa/convert/threeten/Jsr310JpaConverters.html)

## Thymeleaf

テンプレートエンジンの Thymeleaf.
旧型日時は `#dates`, `#calendars` で扱えますが、
これらは Java 8 日時は扱えません。

次の2点を設定すれば、 `#temporals` で Java 8 日時も扱えるようになりました。

1) 依存関係に `thymeleaf-extras-java8time` を追加。

```xml
<dependency>
  <groupId>org.thymeleaf.extras</groupId>
  <artifactId>thymeleaf-extras-java8time</artifactId>
  <version>2.1.0.RELEASE</version>
</dependency>
```

2) Dialect を DI コンテナに登録。
`TemplateEngine` への組込みは `ThymeleafAutoConfiguration` がやってくれます。

```java
@Bean
public IDialect java8TimeDialect() {
  return new Java8TimeDialect();
}
```

### サンプルコード

[akihyro/try-springboot-with-java8time/thymeleaf - GitHub](https://github.com/akihyro/try-springboot-with-java8time/tree/master/thymeleaf)

実行後、 `/hoge` にアクセスすると日時フォーマットした HTML を返します。

### 参考

* [thymeleaf/thymeleaf-extras-java8time - GitHub](https://github.com/thymeleaf/thymeleaf-extras-java8time)
* [Dates - 18 Appendix B: Expression Utility Objects - Tutorial: Using Thymeleaf](http://www.thymeleaf.org/doc/tutorials/2.1/usingthymeleaf.html#dates)
* [Calendars - 18 Appendix B: Expression Utility Objects - Tutorial: Using Thymeleaf](http://www.thymeleaf.org/doc/tutorials/2.1/usingthymeleaf.html#calendars)

## プロパティ (`@Value`, `@ConfigurationProperties`)

例えばこんな `application.yml` を書いて、

```yaml
try-springboot-with-java8time:
  iso:
    date: "2015-12-04"
    time: "12:34:56"
    date-time: "2015-12-04T12:34:56"
```

`@Value` で Java 8 日時フィールドをセットしたい場合。

```java
@Value("${try-springboot-with-java8time.iso.date}")
private LocalDate isoDate;
@Value("${try-springboot-with-java8time.iso.time}")
private LocalTime isoTime;
@Value("${try-springboot-with-java8time.iso.date-time}")
private LocalDateTime isoDateTime;
```

これは `ConversionService` (Bean の名前は `conversionService`) を
自前で用意してやるといけました。

```java
@Configuration
public class ConversionServiceConfiguration {
  @Bean
  public ConversionService conversionService() {
    FormattingConversionServiceFactoryBean factory = new FormattingConversionServiceFactoryBean();
    DateTimeFormatterRegistrar registrar = new DateTimeFormatterRegistrar();
    registrar.setUseIsoFormat(true);
    factory.setFormatterRegistrars(Collections.singleton(registrar));
    factory.afterPropertiesSet();
    return factory.getObject();
  }
}
```

`@DateTimeFormat` を添えれば、フィールドごとにフォーマット変更もいけました。

```java
@Value("${try-springboot-with-java8time.custom.date}")
@DateTimeFormat(pattern = "y年M月d日")
private LocalDate customDate;
@Value("${try-springboot-with-java8time.custom.time}")
@DateTimeFormat(pattern = "H時m分s秒")
private LocalTime customTime;
@Value("${try-springboot-with-java8time.custom.date-time}")
@DateTimeFormat(pattern = "y年M月d日 H時m分s秒")
private LocalDateTime customDateTime;
```

### サンプルコード

[akihyro/try-springboot-with-java8time/properties - GitHub](https://github.com/akihyro/try-springboot-with-java8time/tree/master/jackson)

実行すると `application.yml` の日時をログ出力します。

### 参考

* [24.7.2 Relaxed binding - Spring Boot Reference Guide](http://docs.spring.io/spring-boot/docs/1.3.0.RELEASE/reference/htmlsingle/#boot-features-external-config-relaxed-binding)

## リクエストパラメータ (`@PathVariable`, `@RequestParam`, `@ModelAttribute`, etc)

MVC コントローラでは、特に何もしなくても Java 8 日時型で受取れるようになってました。

ただ、デフォルトのフォーマットは `FormatStyle.SHORT` でした。
日付なら `15/12/04`, 時間なら `12:34`, 日時なら `15/12/04 12:34` といった感じ。

こちらも `@DateTimeFormat` を添えれば、パラメータごとにフォーマット変更もいけました。

```java
@RequestMapping("/hoge")
public Map hoge(
  @RequestParam(required = false)
  LocalDate defaultDate,
  @RequestParam(required = false)
  LocalTime defaultTime,
  @RequestParam(required = false)
  LocalDateTime defaultDateTime,
  @RequestParam(required = false)
  @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
  LocalDate isoDate,
  @RequestParam(required = false)
  @DateTimeFormat(iso = DateTimeFormat.ISO.TIME)
  LocalTime isoTime,
  @RequestParam(required = false)
  @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
  LocalDateTime isoDateTime
) {
  // ...
}
```

デフォルトのフォーマットを変えたい場合は、
`WebMvcConfigurer` で自前のフォーマッタを組み込むと出来ました。

```java
@Configuration
public class WebMvcConfiguration extends WebMvcConfigurerAdapter {
  @Override
  public void addFormatters(FormatterRegistry registry) {
    DateTimeFormatterRegistrar registrar = new DateTimeFormatterRegistrar();
    registrar.setUseIsoFormat(true);
    registrar.registerFormatters(registry);
  }
}
```

### サンプルコード

[akihyro/try-springboot-with-java8time/request-param - GitHub](https://github.com/akihyro/try-springboot-with-java8time/tree/master/request-param)

実行後、こんな curl コマンドで GET できます。

```console
$ curl "http://localhost:8080/hoge?defaultDate=2015-12-04&defaultTime=12:34:56.78&defaultDateTime=2015-12-04T12:34:56.78&isoDate=2015-12-04&isoTime=12:34:56.78&isoDateTime=2015-12-04T12:34:56.78"
```

## まとめ

* Jackson: `jackson-datatype-jsr310` を使う。
* JAXB: 日時の型ごとに `XmlAdapter` を用意。
* JPA: `Jsr310JpaConverters` を使う。
* Thymeleaf: `thymeleaf-extras-java8time` を使う。
* プロパティ: `ConversionService` を設定。
* リクエストパラメータ: そのままでも使える。
  フォーマット変えたい場合は `WebMvcConfigurer` で設定。

近いうち、特に意識しなくても Java 8 日時が
さくさく使えるようになるといいなーと思います :)
