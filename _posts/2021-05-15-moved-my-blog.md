---
title: はてなブログから GitHub Pages + Jekyll に引越した
categories: tech
tags: blog website github-pages jekyll hugo hatena-blog
header:
  teaser: /assets/posts/2021-05-15-moved-my-blog-1200x630.png
  og_image: /assets/posts/2021-05-15-moved-my-blog-1200x630.png
---

今まではてなブログで記事を書いてましたが、
Jekyll でビルド + GitHub Pages でホストする形へ移転しました。
あと、ドメイン名も変えました。

[rakugakibox.net](http://rakugakibox.net) → [akkinoc.dev](https://akkinoc.dev)

<!--more-->

[![Image]][Image]

[Image]: {% link assets/posts/2021-05-15-moved-my-blog-image-2602x1436.png %}

## 移転先の選択

下記の条件を満たしたくて、 GitHub Pages + 静的サイトジェネレータにしました。

* 記事を Markdown で書きたい
* 記事や画像や設定などを GitHub で管理したい
* 独自ドメインを使いたい
* JS/CSS をカスタムして遊びたい
* ホスティング料金を抑えたい
* HTTPS (SSL), レスポンシブは必須 (今時ないとこないと思うけど)

他にも note や Zenn も候補だったのですが、全て満たすのが GitHub Pages でした。
あと、ドメインに新しめの TLD を使ってみたくて、 ".dev" を選びました。

## 静的サイトジェネレータの選択

今なら Hugo がいいなーと思い、軽く試してみました。
けど、細かいとこまで気に入ったテーマが Jekyll のものだったのです...
Hugo に好みのテーマが育つか、気分が変わったら乗り換えるかも。

＊今回使った Jekyll テーマ:

* [Minimal Mistakes](https://mmistakes.github.io/minimal-mistakes/)

＊気になってる Hugo テーマ:

* [Academic](https://themes.gohugo.io/academic/)
* [LoveIt](https://themes.gohugo.io/loveit/)
* [Hermit](https://themes.gohugo.io/hermit/)

## できたこと

色々と最新の Web 技術も調べながらやってたので、

* OGP
* Web Application Manifest
* Well-known URIs
* Google Search Console
* Google Analytics

など、古くなってた知識をアップデートもできて、なかなか楽しかったです。

## コード

[akkinoc/akkinoc.github.io - GitHub](https://github.com/akkinoc/akkinoc.github.io)
