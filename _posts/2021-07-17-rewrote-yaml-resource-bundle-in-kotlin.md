---
title: yaml-resource-bundle を Kotlin で書き直した
categories: tech
tags: yaml-resource-bundle kotlin java yaml maven kotest github-actions
header:
  teaser: /assets/posts/2021-07-17-rewrote-yaml-resource-bundle-in-kotlin-1200x630.png
  og_image: /assets/posts/2021-07-17-rewrote-yaml-resource-bundle-in-kotlin-1200x630.png
---

だいぶ前に個人開発したライブラリたちをずっと放置してしまっていたのですが、
また少しずつでもアップデートしていきたいと思い、
まずは軽めの yaml-resource-bundle から始めてみました。

折角の機会なので、僕の好きな Kotlin で全て書き直しました。

<!--more-->

## yaml-resource-bundle とは

Java ResourceBundle の拡張ライブラリです。
YAML フォーマットのリソースを ResourceBundle として扱えるようにします。

[akkinoc/yaml-resource-bundle - GitHub](https://github.com/akkinoc/yaml-resource-bundle)

最初は Maven セントラルリポジトリへ公開する練習のために作った雑なライブラリでした。
Web 検索などすると意外にも使われていたので、メンテすることにしました。

Kotlin で書き直しましたが、 Java からも使えます。

## 使い方

依存関係を追加して、

```xml
<dependency>
  <groupId>dev.akkinoc.util</groupId>
  <artifactId>yaml-resource-bundle</artifactId>
  <version>2.0.1</version>
</dependency>
```

`ResourceBundle.getBundle(...)` で `YamlResourceBundle.Control` を指定すれば OK です。

```java
ResourceBundle bundle = ResourceBundle.getBundle("resource", YamlResourceBundle.Control.INSTANCE);
System.out.println(bundle.getString("key"));
```

## 頑張ったところ

* マップ, リストでネストされた値をいい感じに展開
* `---` で区切られた複数の YAML ドキュメントに対応
* `&`, `*` 記号による YAML アンカー, エイリアスに対応
* YAML エイリアスで再帰的な無限ループ (ex: `&A [ *A ]`) が入力されたときのハングアップ回避
* Kotlin らしくテストに Kotest を導入
* CI を CircleCI から GitHub Actions へ移行
