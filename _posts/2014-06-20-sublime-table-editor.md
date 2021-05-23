---
title: Sublime Text の Table Editor で Markdown の表を書くのが楽ちんになった
categories: tech
tags: sublime-text markdown
header:
  teaser: /assets/posts/2014-06-20-sublime-table-editor-800x400.jpg
  og_image: /assets/posts/2014-06-20-sublime-table-editor-800x400.jpg
---

Markdown で表を組むとき、
大きな表になってくると列幅が揃ってないと見にくいし編集しにくい。
かと言って全ての列幅を揃えるのも面倒だったりする。

<!--more-->

## Markdown の表

こんなやつ。
1セルだけ文字数が長くなったりすると、列幅を全部揃えたりするのが面倒。

```markdown
|   col1   |   col2   |   col3   |
|----------|----------|----------|
| cell 1-1 | cell 1-2 | cell 1-3 |
| cell 2-1 | cell 2-2 | cell 2-3 |
| cell 3-1 | cell 3-2 | cell 3-3 |
```

## Table Editor

見つけたのが Table Editor。
よくあるプラグインまとめみたいなページに
あまり載ってなかったのでここでメモっておく。
表の整形や CSV からの変換もやってくれる。

[vkocubinsky/SublimeTableEditor - GitHub](https://github.com/vkocubinsky/SublimeTableEditor)

<blockquote class="twitter-tweet"><p lang="ja" dir="ltr">SublimeTextちゃんのTableEditorに惚れた。</p>&mdash; Akihiro Kondo (@akkinoc) <a href="https://twitter.com/akkinoc/status/475811475957620737?ref_src=twsrc%5Etfw">June 9, 2014</a></blockquote> <script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>

## インストール

1. Package Control から "Table Editor" を選択してインストール。
2. メニューの "View" → "Syntax" あたりでシンタックスを Markdown にする。
3. Ctrl+Shift+P で "Table Editor: Enable for current syntax" を選択。

これで Markdown シンタックスで Table Editor が使えるようになる。

## 揃えてみる

こんな中途半端で整ってない表でも、

```markdown
|col1|col2|col3
|--
|cell 1-1 |
|  せる2-1| cell 2-2
|ceeeeeeeeeeeeeeel 3-1 |cell 3-2| cell 3-3
```

表内で Tab キー押すだけで綺麗に揃えてくれる。嬉しい。
全角文字も基本2文字カウントである程度は大丈夫だった。

```markdown
|          col1         |   col2   |   col3   |
|-----------------------|----------|----------|
| cell 1-1              |          |          |
| せる2-1               | cell 2-2 |          |
| ceeeeeeeeeeeeeeel 3-1 | cell 3-2 | cell 3-3 |
```

## CSV から変換してみる

CSV を表に一発変換してくれるのも地味に嬉しかった。

CSV を選択して、

```markdown
cell 1-1,,
せる2-1,"cell 2-2",
"ceeeeeeeeeeeeeeel 3-1",cell 3-2,cell 3-3
```

Ctrl+K -> '\|' (Shift+\\) でさくっと変換。

```markdown
| cell 1-1              |          |          |
| せる2-1               | cell 2-2 |          |
| ceeeeeeeeeeeeeeel 3-1 | cell 3-2 | cell 3-3 |
```

## 参考

* [Sublime Text 3 を最強の Markdown エディタに - Layman's web creation.](http://web-layman.com/sublime-text-3-wozui-qiang-no-markdown-edeitani)
