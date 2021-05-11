---
title: Spring Boot キャンプで duke とねこび～んの kusokora してきた！
categories: tech
tags: spring-boot spring-framework opencv jms stomp web-socket web-rtc java jjug
header:
  teaser: /assets/posts/2015-03-28-spring-boot-camp-handson-799x265.png
  overlay_image: /assets/posts/2015-03-28-spring-boot-camp-handson-799x265.png
---

こちらのイベントに参加してきました。
Spring Boot, OpenCV, JMS, STOMP, WebSocket, WebRTC を使って画像変換アプリを作りました。
アプリ名は "kusokora" でした。すごい名前です。

<!--more-->

[【東京】 JJUG ナイト・セミナー 「中上級者向け！ Spring Boot ハンズオン！」 3/25 (水) 開催 - 日本 Java ユーザーグループ](http://www.java-users.jp/?p=1700)

## 作ったもの

ブラウザからアップロードしたりカメラで撮った写真の顔画像を認識して、
duke で kusokora するアプリを作りました。

例えばこれを。

[![Image: Original]][Image: Original]

こうする。

[![Image: Duke]][Image: Duke]

[Image: Original]: {% link assets/posts/2015-03-28-spring-boot-camp-handson-original-265x265.png %}
[Image: Duke]: {% link assets/posts/2015-03-28-spring-boot-camp-handson-duke-265x265.png %}

画像処理で有名な lena さん。
この画像って下の方にも続きがあるとは知りませんでした...
[レナ (画像データ) - Wikipedia] の外部リンクから全体画像を辿れるようです (^^;

[レナ (画像データ) - Wikipedia]: http://ja.wikipedia.org/wiki/%E3%83%AC%E3%83%8A_%28%E7%94%BB%E5%83%8F%E3%83%87%E3%83%BC%E3%82%BF%29

## 使った技術

* OpenCV
  * 画像変換のライブラリ。
  * duke の描画に使いました。
* JMS
  * Java のメッセージング API.
  * 画像変換を非同期で開始する為に使いました。
  * ブラウザからリクエストを受けたらメッセージ送信だけしてレスポンスは即返却。
  * メッセージを受ける側では、画像変換処理を行いました。
* STOMP
  * Simple (or Streaming) Text Orientated Messaging Protocol.
  * こちらもメッセージング。
  * ブラウザ ⇔ サーバとの通信で使いました。
  * ブラウザ側でメッセージを subscribe, 変換結果の画像を受けとって描画しました。
* WebRTC
  * リアルタイムコミュニケーション用 API.
  * ブラウザでのカメラアクセスに使いました。
  * 撮影した画像は STOMP でサーバへ送信しました。

Spring Boot があまり出てきません。噂通り影が薄かったです。
けど、

* 簡単に HTTP リクエストを捌けたり。
* JMS や STOMP を使えるようにしてくれたり。
* DI コンテナを提供してくれたり。

裏方で頑張ってくれるとてもいい子でした。

Spring Boot は日々使ってるけど、
他は殆ど使ったことはなかったのでとても楽しかったです。

> 本ハンズオンでは Spring Boot というよりも純粋に
> Java プログラミングの楽しさを改めてお伝えしたいと思います。
>
> <footer><cite>イベントページから引用</cite></footer>

ほんとこの通り。
[@making] さん、他関係者の方、ありがとうございました！

[@making]: https://twitter.com/making

## ねこび～ん版を作ってみた

ねこび～ん的なものを描画するバージョンも作ってみた！
(Spring Boot 全く関係ないけどｗ

[![Image: NekoBean]][Image: NekoBean]

[Image: NekoBean]: {% link assets/posts/2015-03-28-spring-boot-camp-handson-nekobean-265x265.png %}

<blockquote class="twitter-tweet"><p lang="ja" dir="ltr">ねこび～んっぽいkusokoraつくった～:) <a href="https://twitter.com/hashtag/jjug?src=hash&amp;ref_src=twsrc%5Etfw">#jjug</a> <a href="https://twitter.com/hashtag/kanjava_sbc?src=hash&amp;ref_src=twsrc%5Etfw">#kanjava_sbc</a> <a href="https://twitter.com/hashtag/sbc03?src=hash&amp;ref_src=twsrc%5Etfw">#sbc03</a><a href="https://t.co/lkEhrc3aAQ">https://t.co/lkEhrc3aAQ</a> <a href="http://t.co/IXznUFlx9K">pic.twitter.com/IXznUFlx9K</a></p>&mdash; Akihiro Kondo (@akkinoc) <a href="https://twitter.com/akkinoc/status/580690346813722625?ref_src=twsrc%5Etfw">March 25, 2015</a></blockquote> <script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>

他にもオリジナルで色んなのを描いてる方々が居ました。面白い～。

## 成果物

[akihyro/spring-boot-camp-handson - GitHub](https://github.com/akihyro/spring-boot-camp-handson)

## リンク

* [【東京】JJUG ナイト・セミナー「中上級者向け！Spring Bootハンズオン！」3/25(水)開催 - 日本Javaユーザーグループ](http://www.java-users.jp/?p=1700)
* [Spring Bootキャンプ ハンズオン資料](http://spring-boot-camp.readthedocs.org/ja/latest)
* [Spring Bootキャンプ@関ジャバでハンズオンをやってきました #kanjava_sbc - BLOG.IK.AM](http://blog.ik.am/#/entries/326)
* [Spring Bootキャンプをやった #kanjava_sbc - 裏紙](http://backpaper0.github.io/2015/03/08/spring_boot_camp.html)
* [Spring Boot キャンプハンズオンに参加してきた！ #kanjava_sbc - Mitsuyuki.Shiiba](http://bufferings.hatenablog.com/entry/2015/03/08/124740)
* [Sping Boot キャンプに入隊してきました！！ - シスアーキ in はてな](http://kozake.hatenablog.com/entry/2015/03/09/233242)
* [Spring Boot キャンプ予習メモ - Java EE 事始め！](http://masatoshitada.hatenadiary.jp/entry/2015/03/13/070656)
