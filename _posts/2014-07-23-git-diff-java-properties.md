---
title: Java のプロパティファイルを git diff するときは自動的に native2ascii で変換
categories: tech
tags: java git
header:
  teaser: /assets/posts/2014-07-23-git-diff-java-properties-800x200.jpg
  overlay_image: /assets/posts/2014-07-23-git-diff-java-properties-800x200.jpg
  caption: Photo by [すしぱく](http://www.pakutaso.com/20130343074post-2542.html)
---

Java のプロパティファイルは、マルチバイト文字が Unicode 表記 (¥uXXXX) になってる。
git diff が見にくいので、自動的に native2ascii で変換するようにした。

<!--more-->

## core.attributesfile をセット (グローバル設定する場合)

attributesfile のパスを設定する。
設定済みな場合は自分の環境に適宜読み換えで。

```shell
git config --global core.attributesfile "~/.gitattributes"
```

## attributesfile への追加

`*.properties` を追加。

```shell
echo '*.properties diff=properties' >>~/.gitattributes
```

## diff.textconv を設定

差分を取るとき、 `native2ascii -reverse` をかますように設定。

```shell
git config --global diff.properties.textconv "/usr/java/default/bin/native2ascii -reverse"
```

native2ascii のパスは環境に合ったパスで。
自分は Oracle JDK7 を rpm でインストールしたら `/usr/java/default/bin` に入ってた。

## 参考

* [2013-12-21 - Yoichi's diary](http://yoichi.geiin.org/d/?date=20131221)
