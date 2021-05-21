---
title: shell - コマンドが成功するまで何度かリトライする
categories: tech
tags: shell bash
header:
  teaser: /assets/posts/2015-04-28-shell-function-retryable-800x400.jpg
---

標準コマンドにありそうでなかったので作った。
色んなコマンドで使いたかったので、ちょい汎用的なファンクションにしました。

<!--more-->

## function retryable

こんなファンクションを作る。
リトライ回数を変えたい場合は `{1..3}` を調整する。

```shell
function retryable() {
  for i in {1..3}; do
    "$@" && break
  done
  return $?
}
```

このファンクションの引数に、リトライしたいコマンドを渡せば OK.

### 成功する場合

```console
$ set -x  # トレース出力用
$ retryable test 0 -eq 0

+ retryable test 0 -eq 0
+ for i in '{1..3}'
+ test 0 -eq 0
+ break
+ return 0
```

### 失敗 (リトライ) する場合

```console
$ set -x  # トレース出力用
$ retryable test 0 -eq 1

+ retryable test 0 -eq 1
+ for i in '{1..3}'
+ test 0 -eq 1
+ for i in '{1..3}'
+ test 0 -eq 1
+ for i in '{1..3}'
+ test 0 -eq 1
+ return 1
```

## 組み込んだはいいけど

<blockquote class="twitter-tweet"><p lang="ja" dir="ltr">ちょいちょいバッチがこけるからリトライ処理を組み込んだのに、組み込んだら全くこけなくなるという不思議。</p>&mdash; Akihiro Kondo (@akkinoc) <a href="https://twitter.com/akkinoc/status/592482365429026817?ref_src=twsrc%5Etfw">April 27, 2015</a></blockquote> <script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>

## 参考

* [メモ: ループ制御 - argius note](http://argius.hatenablog.jp/entry/20070321/1174484318)
* [シェルスクリプトでリトライ処理 - cloudpack 技術情報サイト](http://blog.cloudpack.jp/2013/02/20/server-news-blog-post/)
* [ssh 接続が成功するまでリトライする - 物ら君語なの〓い要](http://autofuton.hatenadiary.jp/entry/20110602/1306953436)
