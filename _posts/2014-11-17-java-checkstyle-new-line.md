---
title: Java - CheckStyle で改行コードのチェックが弱いので自前で何とかした
categories: tech
tags: checkstyle java regex
header:
  teaser: /assets/posts/2014-11-17-java-checkstyle-new-line-800x200.jpg
  overlay_image: /assets/posts/2014-11-17-java-checkstyle-new-line-800x200.jpg
---

CheckStyle で改行コードが LF で統一されてることをチェックしたい。

ざっと探してみると [NewlineAtEndOfFile] ってのがあったけど、
これがイマイチなので自前でもチェックすることにした。

[NewlineAtEndOfFile]: http://checkstyle.sourceforge.net/config_misc.html

<!--more-->

## NewlineAtEndOfFile

こんな使い方。

```xml
<module name="NewlineAtEndOfFile">
  <property name="lineSeparator" value="lf" />
</module>
```

けど名前の通りファイル末尾の改行しかチェックしてくれない。
ファイルの途中に CR が入ってても、それはスルーしちゃう。

まーこれはファイル末尾が改行なことをチェックするのが
一番の目的だろうから、今回やりたいことと合わなくて仕方ないのかも。

ただ、ファイル末尾が CRLF でも通ってしまった。

確かに LF で終わってはいるけど...
それじゃ `lineSeparator` で `crlf` とか `lf` とか選べる意味が薄いような...
何かポリシーあってこうしてるのかな...？

## 自前のチェックも追加！

`NewlineAtEndOfFile` とは別で、正規表現でのチェックも追加することにした。

```xml
<module name="RegexpMultiline">
  <property name="format" value="\r[\s\S]*\z" />
  <property name="message" value="改行コードに LF 以外が使われてる！" />
</module>
```

以下ポイント。

* CR (`\r`) を見つけたら違反にしてる。
* 同じエラーが行数分発生するのはうざいので、ファイルごとに出すようにしてる。
  * → `[\s\S]*\z` の部分でファイル末尾まで読み込んでる。
  * → これで2つ目以降の CR があっても無視させてる。

## 出来たけど...

標準のチェックが用意されると嬉しいなぁ。
