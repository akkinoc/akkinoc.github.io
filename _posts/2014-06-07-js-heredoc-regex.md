---
title: 正規表現 "[^]" の意味, 改行にもマッチする正規表現
categories: tech
tags: javascript regex
header:
  teaser: /assets/posts/2014-06-07-js-heredoc-regex-800x300.jpg
  overlay_image: /assets/posts/2014-06-07-js-heredoc-regex-800x300.jpg
  caption: Photo by [susi-paku](http://www.pakutaso.com/20131053298post-3419.html)
---

JavaScript でヒアドキュメントするページで見つけた、
正規表現 `[^]` の意味が分からなかったので調べてみた。

<!--more-->

## JavaScript でヒアドキュメント

こちらで見つけたコード。 Node.js が元ネタのよう。
環境依存かもしれないけど、面白い。

* [Multi-line strings in JavaScript and Node.js - Tomek on Software](http://tomasz.janczuk.org/2013/05/multi-line-strings-in-javascript-and.html)
* [Javascript でヒアドキュメント - Qiita](http://qiita.com/_shimizu/items/837b529de9f3302e315c)

```javascript
(function () {/*
<div class="title">
  <h1>
    <a href="${url}">${title}</a>
  </h1>
</div>
*/}).toString().match(/[^]*\/\*([^]*)\*\/\}$/)[1];
```

このコードで使われてる正規表現 `[^]` が見慣れなくて一瞬意味が分からなかった。

## たぶん除外する文字がないだけ

`[^abc]` は 'a', 'b', 'c' を除外した文字。
なので、 `[^]` は除外する文字なしで何でも OK なのかなー。
記号なので Web 検索で調べにくい。

## 任意文字を示すドットとの違い

ドット `.` は改行を除く一文字。
`[^]` では改行は除かれないようだ。

```javascript
// Chrome で確認
/./.test("\n");    // => false
/./.test("\r");    // => false
/[^]/.test("\n");  // => true
/[^]/.test("\r");  // => true
```

## 他の改行にもマッチする正規表現

改行にもマッチさせたいのなら、こんな方法もあった。

[JavaScript で改行にもマッチする正規表現](https://os0x.g.hatena.ne.jp/os0x/20080213/1202900650)

```javascript
// Chrome で確認
/[\s\S]/.test("\n");  // => true
/[\s\S]/.test("\r");  // => true
```

## `[^]` は環境を選ぶっぽい

手元にあった ruby でも叩いてみたら SyntaxError でわろた。
IE でも動かなかったし、 `[^]` は環境を選ぶっぽい。

```console
irb(main):001:0> /[^abc]/
=> /[^abc]/
irb(main):002:0> /[^]/
SyntaxError: (irb):2: empty char-class: /[^]/
        from /usr/local/bin/irb:12:in `<main>'
```

## どうでもいいけど...

<blockquote class="twitter-tweet"><p lang="ja" dir="ltr">/[^_^]/<br><br>この正規表現が顔文字にしか見えない・・・。</p>&mdash; Akihiro Kondo (@akkinoc) <a href="https://twitter.com/akkinoc/status/465800695296188417?ref_src=twsrc%5Etfw">May 12, 2014</a></blockquote> <script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>
