---
title: 外部リンクを別窓で開く JavaScript, 動的追加されるリンクにも対応させてみた (jQuery使用)
categories: tech
tags: javascript jquery
header:
  teaser: /assets/posts/2014-05-08-ext-link-js-800x400.jpg
  overlay_image: /assets/posts/2014-05-08-ext-link-js-800x400.jpg
  caption: Photo by [susi-paku](http://www.pakutaso.com/20110951254post-623.html)
---

外部リンクは軒並み `target="_blank"` にして別窓で開きたいことがある。
そんなとき、 HTML が修正出来ないページ (このはてなブログも) では
JavaScript で対応することになるのだけど、
よくある方法では不十分だったので自前で実装してみた。

<!--more-->

## よくある方法

よくあるのはこんな感じのコード。
DOM Ready をトリガーに、対象の要素に対して `target="_blank"` をセットしていく。
属性セレクタで自サイトのホスト名を含まないリンクを対象にしてる。

```javascript
$(function() {
  $("a[href^=http]:not([href*='" + location.hostname + "'])").attr("target", "_blank");
});
```

### 参考

* [外部リンクに target="_blank" と class を付与する jQuery で別窓アイコンを付ける - WPC](http://web-pc.net/jquery007)
* [外部サイトへのリンクに target=_blank 属性を追加 (jQuery) - せんむの技術ブログ](http://www.shikidahironori.jp/music/2011/01/target-blankjquery.html)
* [一行の記述で全ての外部サイトへのリンクを別ウィンドウ (target="_blank") で開く方法 - D-31N.COM デザインスタジオ](http://www.d-31n.com/blog_archive/jquery/3962)

## それでは不十分なこと

Ajax 等で DOM Ready より後に追加されたリンクに対応出来ない。
はてなブログだと、はてなスター, コメントあたりがそんな動きをしてた。

## DOM Ready より後に追加されたリンクにも対応してみた

こんなコードを書いたらそれっぽく動いた。
リンククリックをトリガーに、 window まで伝搬されたイベントを拾って対応してる。
a 要素を検索しない分、大きなページでは表示も高速化するかもしれない (未確認)。

```javascript
$(window).click(function(event) {
  var target = $(event.target);
  if (!target.is("a")) {
    target = target.parents("a").first();
  }
  target.filter(
    "[href^=http]:not([href*='" + location.hostname + "'])"
  ).attr("target", "_blank");
});
```

## この方法の残念なこと

CSS で外部リンクの見た目を変えたいって場合には向かない。
例えば別窓を開きますよ的なアイコンを横に置いたりとか。

属性セレクタ `[target="_blank"] { ... }` を使っても、
`addClass("ext_link")` してクラスセレクタ `.ext_link { ... }` を使っても、
有効になるのが click タイミングなので意味がない。

もし DOM Ready 後の追加要素には CSS 適用しなくて良ければ、
前記したよくある方法と併用するといいかもしれない。
