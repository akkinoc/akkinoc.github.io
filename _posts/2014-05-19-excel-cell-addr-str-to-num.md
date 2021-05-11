---
title: Excel セル位置を文字列 ("A1") ⇔ 数値 ([R,C]) 変換するワンライナー
categories: tech
tags: ruby excel roo
header:
  teaser: /assets/posts/2014-05-19-excel-cell-addr-str-to-num-825x312.png
  overlay_image: /assets/posts/2014-05-19-excel-cell-addr-str-to-num-825x312.png
  caption: Photo by [Qiita](https://help.qiita.com/ja/articles/others-brand-guideline)
---

＊この記事は [Qiita](http://qiita.com/akihyro/items/432f63ad9dc90f415e2d) から移行した内容です。

[roo](http://roo.rubyforge.org/) でスプレッドシートを扱うときに使った。

<!--more-->

## 文字列から数値に変換

`cell_addr` に文字列を入れて実行すると行番号と列番号が取れる。

```ruby
[cell_addr[/\d+/].to_i,cell_addr[/[A-Z]+/].chars.inject(0){|a,b|a*26+('A'..'Z').find_index(b)+1}]
```

メソッド化して使うとこんな感じ。

```ruby
def cell_addr_str_to_num(cell_addr)
  [cell_addr[/\d+/].to_i,cell_addr[/[A-Z]+/].chars.inject(0){|a,b|a*26+('A'..'Z').find_index(b)+1}]
end

cell_addr_str_to_num("A1")    # => [ 1,  1]
cell_addr_str_to_num("AB12")  # => [12, 28]

# 行番号と列番号を別々に取るとき
row, col = cell_addr_str_to_num("B3")
row                           # => 3
col                           # => 2
```

## 数値から文字列に変換

`row`, `col` に数値を入れて実行すると文字列が取れる。

```ruby
col.to_s(26).chars.map{|a|('A'..'Z').to_a[a.to_i(26)-1]}.join+row.to_s
```

メソッド化して使うとこんな感じ。

```ruby
def cell_addr_num_to_str(row, col)
  col.to_s(26).chars.map{|a|('A'..'Z').to_a[a.to_i(26)-1]}.join+row.to_s
end

cell_addr_num_to_str(1, 1)    # => "A1"
cell_addr_num_to_str(12, 28)  # => "AB12"

# 行番号と列番号を配列で渡すとき
addr = [3, 2]
cell_addr_num_to_str(*addr)   # => "B3"
```
