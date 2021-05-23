---
title: 外部リンクを別窓で開く JavaScript を改善した
categories: tech
tags: javascript jquery
header:
  teaser: /assets/posts/2014-06-14-ext-link-js-800x400.jpg
  og_image: /assets/posts/2014-06-14-ext-link-js-800x400.jpg
---

jQuery の delegate/live というものを今更ながら知った。
以前の記事で書いたスクリプトに適用出来そうだったので直してみた。

<!--more-->

[外部リンクを別窓で開く JavaScript, 動的追加されるリンクにも対応させてみた (jQuery使用)]({% post_url 2014-05-08-ext-link-js %})

## 変更前

ごちゃごちゃ。

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

## 変更後

すっきり :)

```javascript
$(document).on("click",
  "a[href^=http]:not([target]):not([href*='" + location.hostname + "'])",
  function(event) { $(event.currentTarget).attr("target", "_blank") }
);
```

## 参考

* [jQuery の bind/live/delegate の違いまとめ、と新 API .on() の使い方 - y-kawaz の日記](http://d.hatena.ne.jp/y-kawaz/20111002/1317489435)
