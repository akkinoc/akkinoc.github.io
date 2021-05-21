---
title: Spring Boot - HTTPS で Web アプリを起動したらサブドメインの HTTP が開けなくなった
categories: tech
tags: spring-boot spring-framework hsts java
header:
  teaser: /assets/posts/2016-04-22-spring-boot-hsts-800x132.png
---

Spring Boot & Spring Security ベースの Web アプリケーションを
`https://mydomain` (SSL) で動かしたら、
`http://sub.mydomain` (サブドメインで非 SSL) にアクセスできなくなったときのメモ。

<!--more-->

## HSTS

原因は HSTS (HTTP Strict Transport Security) という仕組みでした。

<blockquote class="twitter-tweet"><p lang="ja" dir="ltr">HSTS という仕組みを今更ながら知った (^^;;</p>&mdash; Akihiro Kondo (@akkinoc) <a href="https://twitter.com/akkinoc/status/720897847990726656?ref_src=twsrc%5Etfw">April 15, 2016</a></blockquote> <script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>
<blockquote class="twitter-tweet"><p lang="ja" dir="ltr">Spring BootアプリをHTTPSで動かしたら、そのサブドメインがHTTPで突然見れなくなって不思議だった。自動でStrict-Transport-Securityヘッダ付けてくれてるのかな...</p>&mdash; Akihiro Kondo (@akkinoc) <a href="https://twitter.com/akkinoc/status/720899067572658176?ref_src=twsrc%5Etfw">April 15, 2016</a></blockquote> <script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>

`Strict-Transport-Security` ヘッダで `includeSubDomains` が指定されていたため、
サブドメインの方まで HTTPS にリダイレクトされたような動きをしていたようです。

## 対策

`spring-boot-starter-security` をそのまま使ってる場合は、
プロパティ (`application.yml` とか) で `security.headers.hsts` を
設定してあげれば OK でした。

[このへんの自動設定] で制御してる感じでした。

[このへんの自動設定]: https://github.com/spring-projects/spring-boot/blob/v1.3.3.RELEASE/spring-boot-autoconfigure/src/main/java/org/springframework/boot/autoconfigure/security/SpringBootWebSecurityConfiguration.java#L101-L106

```yaml
security.headers.hsts: DOMAIN
  # NONE  : "Strict-Transport-Security" ヘッダを吐かない。
  # DOMAIN: "includeSubDomains" を付けない。
  # ALL   : "includeSubDomains" を付ける。
```

`WebSecurityConfigurerAdapter` でカスタマイズしてる場合は、
こんなコードでいけました。

```java
@Override
protected void configure(HttpSecurity http) throws Exception {
  http.headers().httpStrictTransportSecurity().includeSubDomains(false);
}
```

## 参考

* [28. Security - Spring Boot Reference Guide](http://docs.spring.io/spring-boot/docs/current/reference/htmlsingle/#boot-features-security)
* [17.1.3 HTTP Strict Transport Security (HSTS) - Spring Security Reference](https://docs.spring.io/spring-security/site/docs/current/reference/htmlsingle/index.html#headers-hsts)
* [HSTS (HTTP Strict Transport Security) の導入](http://qiita.com/takoratta/items/fb6b3486257eb7b9f12e)
