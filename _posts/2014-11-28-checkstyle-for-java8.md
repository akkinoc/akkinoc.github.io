---
title: Eclipse (Pleiades) or Maven で Java 8 対応の CheckStyle を使う
categories: tech
tags: checkstyle java eclipse pleiades maven
header:
  teaser: /assets/posts/2014-11-28-checkstyle-for-java8-800x200.jpg
  overlay_image: /assets/posts/2014-11-28-checkstyle-for-java8-800x200.jpg
---

Java 8 のシンタックス (ラムダとか！) を使ってるコードに CheckStyle したら、
Eclipse (Pleiades) でも Maven でもエラーになった。

どっちも CheckStyle 本体のバージョンが古いのが原因だった。
Java 8 対応のバージョンになるのも時間の問題だろうけど、
それぞれで使う CheckStyle をバージョンアップ出来たので、やり方をメモっとく。

<!--more-->

## 環境

* Eclipse:
  * Pleiades All in One 4.4.1.v20140926
  * Eclipse 4.4.0 Luna ルナ SR1 for Windows ベース
  * Checkstyle プラグイン 5.7
* Maven:
  * Apache Maven 3.2.3
  * Maven CheckStyle Plugin 2.13 (CheckStyle 5.7)

## エラー内容

試しにこんなコード書いたら。

```java
private void hoge() {
  Runnable run = () -> System.out.println("");
}
```

怒られた...

```text
(extension) TreeWalker: Got an exception - expecting EOF, found '}'
```

## Eclipse (Pleiades) での対応方法

1. `pleiades/eclipse/dropins/CheckStyle` をフォルダごと削除する。
2. Eclipse を起動して、 \[ヘルプ\] → \[Eclipse マーケットプレース\] を開く。
3. "checkstyle" で検索。
4. "Checkstyle プラグイン 6.1.0" をインストール。続きはウィザードに従えばOK。

あとは使いたいプロジェクトのプロパティから \[Checkstyle\] を開いて、
\[このプロジェクトで Checkstyle をアクティブにする\] にチェック入れれば OK。

最初、 `pleiades/eclipse/dropins/CheckStyle` を削除せずに
6.1.0 をインストールしてて、うまく動かなくて悩んでしまった。
古いバージョン (5.7.0) は手動削除しないと、自動で消えてくれないっぽい。

## Maven CheckStyle Plugin での対応方法

`pom.xml` に `maven-checkstyle-plugin` を書くとき、
CheckStyle 本体の依存関係を新しいバージョンで書いたら通った。

```xml
<plugin>
  <artifactId>maven-checkstyle-plugin</artifactId>
  <version>2.13</version>
  <dependencies>
    <dependency>
    <groupId>com.puppycrawl.tools</groupId>
    <artifactId>checkstyle</artifactId>
    <version>6.1</version>
    </dependency>
  </dependencies>
</plugin>
```

と言っても Maven CheckStyle Plugin 側では
動作確認されてないバージョンだろうけど。
何か問題が出てきたらそのとき考えることにしよう。

Java 8 対応版、はよリリースされると嬉しいなー(・ε・｀)
