---
title: Eclipse に lombok 1.14.4 を導入したらコンテンツアシストが超絶遅くなった
categories: tech
tags: eclipse lombok java
header:
  teaser: /assets/posts/2014-07-20-eclipse-lombok-slow-800x170.png
  overlay_image: /assets/posts/2014-07-20-eclipse-lombok-slow-800x170.png
  caption: Photo by [Project Lombok](http://projectlombok.org)
---

Java で Getter/Setter 等の冗長コードがすっきり書ける lombok。
最新版 (1.14.4) を Eclipse に導入したら、コンテンツアシストが超絶遅くなってしまった。

<!--more-->

## 環境

* Windows 7
* [Oracle JDK 7](http://www.oracle.com/technetwork/jp/java/javase/downloads/jdk7-downloads-1880260.html)
* [Eclipse 4.4.0 Luna Pleiades All in One](http://mergedoc.sourceforge.jp/index.html#/pleiades_distros4.4.html)
* [lombok 1.14.4](http://projectlombok.org)

## コードアシストしたら

lombok を使ってるクラスで Ctrl+Space 等でコンテンツアシストすると、
やたら待たされた後にこんなエラーダイアログが出た...

[![Image: Error]][Image: Error]

[Image: Error]: {% link assets/posts/2014-07-20-eclipse-lombok-slow-error-800x161.png %}

> 'org.eclipse.jdt.ui' プラグインからの
> 'org.eclipse.jdt.ui.TemplateProposalComputer' プロポーザル・コンピューターが
> 正常に完了しませんでした。
> 拡張の 'computeCompletionProposals()' 命令からの戻り値が遅すぎます。

## 同現象らしき Issue 発見

公式ページの [Report an issue] に同現象らしき Issue があった。

[Report an issue]: https://code.google.com/p/projectlombok/issues/list

[Issue 708 - [Eclipse] Content assist crash with lombok 1.14.4 - projectlombok](https://code.google.com/p/projectlombok/issues/detail?id=708)

> When I try the lastest version of lombok in my Eclipse,
> content assist / completion is very slow and sometimes Eclipse show a popup error.
> It's only with the last version of lombok : 1.14.4
>
> When I put an older version (1.14.2 or 1.12.6), content assist / completion is ok.

1.14.2 or 1.12.6 では大丈夫とな。

## バージョン下げてみた

原因はよく分からないけど、取り敢えずバージョン下げてみた。

1.12.6 は [Google Project Hosting] からダウンロード。
1.14.2 は同じ場所になかったので [Maven] からダウンロード。
Eclipse インストールディレクトリの lombok.jar を差し替えて `eclipse.exe -clean.cmd` で起動。

[Google Project Hosting]: https://code.google.com/p/projectlombok/downloads/list
[Maven]: http://central.maven.org/maven2/org/projectlombok/lombok/1.14.2

自分の環境では 1.14.2 では解決しなかった。
1.12.6 では大丈夫だった。

そこまで最新版に拘りはないので、Issue を見守りつつ 1.12.6 でいくことにしよう。
