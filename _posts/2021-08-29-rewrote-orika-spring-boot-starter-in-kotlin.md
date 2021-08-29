---
title: orika-spring-boot-starter を Kotlin で書き直した
categories: tech
tags: orika-spring-boot-starter kotlin java spring-boot spring-framework orika maven kotest github-actions
header:
  teaser: /assets/posts/2021-08-29-rewrote-orika-spring-boot-starter-in-kotlin-1200x630.png
  og_image: /assets/posts/2021-08-29-rewrote-orika-spring-boot-starter-in-kotlin-1200x630.png
---

こちらの先月の記事に続き、
放置してしまっていた orika-spring-boot-starter もアップデートしました。

[yaml-resource-bundle を Kotlin で書き直した]({% post_url 2021-07-17-rewrote-yaml-resource-bundle-in-kotlin %})

今回も Kotlin で全て書き直しました。

<!--more-->

## orika-spring-boot-starter とは

Java フレームワーク Spring Boot の拡張ライブラリです。
Orika (Java Bean マッピングライブラリ) を自動で DI コンテナに組み込み、使いやすくします。
Spring Boot アプリケーションプロパティや、ユーザ実装の設定クラスで、動作を設定できます。

[akkinoc/orika-spring-boot-starter - GitHub](https://github.com/akkinoc/orika-spring-boot-starter)

Kotlin で書き直しましたが、 Java からも使えます。

## 使い方

依存関係を追加して、

```xml
<dependency>
  <groupId>dev.akkinoc.spring.boot</groupId>
  <artifactId>orika-spring-boot-starter</artifactId>
  <version>2.0.0</version>
</dependency>
```

Orika の `MapperFacade` を注入すれば、

```java
import ma.glasnost.orika.MapperFacade;
```

```java
@Autowired
private MapperFacade orikaMapperFacade;
```

`MapperFacade` でマッピング処理を呼び出せます。

```java
PersonSource src = new PersonSource("John", "Smith", 23);
System.out.println(src);   // => "PersonSource(firstName=John, lastName=Smith, age=23)"
PersonDestination dest = orikaMapperFacade.map(src, PersonDestination.class);
System.out.println(dest);  // => "PersonDestination(givenName=John, sirName=Smith, age=23)"
```

細かなマッピングの設定は、 `OrikaMapperFactoryConfigurer` を継承して
`@Component` で Spring コンテナに登録すれば OK です。

```java
import dev.akkinoc.spring.boot.orika.OrikaMapperFactoryConfigurer;
import ma.glasnost.orika.MapperFactory;

@Component
public class PersonMapping implements OrikaMapperFactoryConfigurer {
  @Override
  public void configure(MapperFactory orikaMapperFactory) {
    orikaMapperFactory.classMap(PersonSource.class, PersonDestination.class)
      .field("firstName", "givenName")
      .field("lastName", "sirName")
      .byDefault()
      .register();
  }
}
```

## 今回アップデートしたこと

* Kotlin で書き直した
* Maven Group ID と Java パッケージを変更
* `@Bean` Lite Mode (`@Configuration(proxyBeanMethods = false)`) を使ってみた
* Kotlin らしくテストに Kotest を導入
* CI を CircleCI から GitHub Actions へ移行
* 他, 依存関係の更新とバグ修正
