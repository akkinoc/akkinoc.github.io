---
title: Java 8 - "java.util.function" 俺俺チートシート
categories: tech
tags: java
header:
  teaser: /assets/posts/2015-04-27-java-util-function-800x277.png
  overlay_image: /assets/posts/2015-04-27-java-util-function-800x277.png
---

`java.util.function` の関数型インターフェイスたちを自分の整理用に落書きしました。

<!--more-->

## 1枚目: 関数型インターフェイス

* "java.util.function" の関数型インターフェイスたち。
* 関数適用時に呼ばれるメソッドと、その引数, 戻り値を矢印で繋いだもの。
* 一番左側 (網掛け部分) の列が基本形。
* 右側の列はプリミティブ特化したもの。左から `int`, `long`, `double`, `boolean`.

[![Image: Sheet1]][Image: Sheet1]

[Image: Sheet1]: {% link assets/posts/2015-04-27-java-util-function-sheet1-1920x1080.png %}

## 2枚目: 関数を生成するメソッド

* "java.util.function" のインターフェイスが持つ、関数を生成するメソッドたち。
* 生成された関数を呼び出したときの内部の動きを矢印で繋いだもの。
* なんとなくで描いたから変なスペースあるし型名だったり変数名だったりするけど...

[![Image: Sheet2]][Image: Sheet2]

[Image: Sheet2]: {% link assets/posts/2015-04-27-java-util-function-sheet2-1920x1080.png %}

## 参考

* [java.util.function - Java Platform SE 8](http://docs.oracle.com/javase/jp/8/docs/api/java/util/function/package-summary.html)
