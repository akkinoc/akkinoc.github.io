---
title: Web ブラウジングが草不可避になる Chrome 拡張を作ってみた
categories: tech
tags: chrome javascript
header:
  teaser: /assets/posts/2014-04-27-chrome-extension-xa-800x400.jpg
  overlay_image: /assets/posts/2014-04-27-chrome-extension-xa-800x400.jpg
  caption: Photo by [shiosio](http://www.pakutaso.com/20120735206post-1755.html)
---

自分好みの Chrome 拡張をさくっと作れたら便利そうだなぁ...
ということでお試しで挑戦してみた。

<!--more-->

## テーマ

草植系 Chrome 拡張。
たまたま "[草とPerl]" を見てて、とてもいいと思った。

[草とPerl]: https://www.youtube.com/watch?v=BFzMlHMbl80

## 仕様

表示するページの所々に草を植える。

例えば [この Blog の About ページ] なら、

[![Image: Before]][Image: Before]

こんな感じに。

[![Image: After]][Image: After]

[この Blog の About ページ]: http://blog.rakugakibox.net/about
[Image: Before]: {% link assets/posts/2014-04-27-chrome-extension-xa-before-649x288.png %}
[Image: After]: {% link assets/posts/2014-04-27-chrome-extension-xa-after-649x311.png %}

## コード

マニフェストファイルと、そこから呼びだす HTML や JavaScript 等があればいいみたい。
今回は各ページロード後に実行する JavaScript ファイルがあれば十分だった。

### manifest.json

```json
{
  "manifest_version": 2,
  "name": "草不可避",
  "description": "草を植えるｗｗｗ",
  "version": "0.1",
  "content_scripts": [
    {
      "matches": [
        "http://*/*",
        "https://*/*"
      ],
      "js": [
        "content.js"
      ],
      "run_at": "document_end",
      "all_frames": true
    }
  ]
}
```

### content.js

```javascript
// xa と書いて草と読む

// 草の生え具合を調整する定数
var XA_STYLE = "color:green";
var XA_LETTERS = [ "ｗ", "Ｗ" ];
var XA_MIN_LENGTH = 1;
var XA_MAX_LENGTH = 3;

// 草を生むファンクション
function make_xa() {
  var xa = "";
  var length = Math.floor(
    Math.random() * (XA_MAX_LENGTH - XA_MIN_LENGTH + 1) + XA_MIN_LENGTH
  );
  while (length-- > 0)
    xa += XA_LETTERS[Math.floor(Math.random() * XA_LETTERS.length)];
  return "<span style='" + XA_STYLE + "'>" + xa + "</span>";
}

// HTML 中に草を生やすファンクション
function grow_xa(html) {
  return html.replace(
    /[、。]/g,
    function() { return make_xa(); }
  ).replace(
    /([）])/g,
    function() { return make_xa() + RegExp.$1; }
  ).replace(
    /([^>\s]+)(\s*<)/g,
    function() { return RegExp.$1 + make_xa() + RegExp.$2; }
  );
}

// 画面全体に草を生やす
document.body.innerHTML = grow_xa(document.body.innerHTML);
```

## 実行方法

1. 前記したコードを適当なフォルダに保存。
2. Chromeで \[設定\] → \[拡張機能\] を開く。
3. 右上の \[デベロッパーモード\] をチェック。
4. \[パッケージ化されていない拡張機能を読み込む\] を押下。
5. コード保存したフォルダを選択。
6. 追加された拡張の右側にある \[有効\] にチェック。
7. 草植されたネットサーフィンを楽しむｗ

文字が多いサイトで試すと結構衝撃的。
"WWW とは" みたいなページで試すともう何が何だか。

## 作ってみて思ったこと

* マニフェストファイルのキー (`name` とか `description` とか) は
  二重引用符で囲まないと上手く読んでくれないっぽい。
* "www.*" な草ドメインのときだけ有効にしたかったんだけど、
  `content_scripts.matches` に書く URL パターンは
  サブドメイン側にしかワイルドカードを使えないらしい。残念。
  * 参考: [Match Patterns - Chrome Platform APIs](http://developer.chrome.com/extensions/match_patterns)
