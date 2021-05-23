---
title: Perl に挑戦したらエラー発生しないのに catch ブロックまで動いてはまった
categories: tech
tags: perl
header:
  teaser: /assets/posts/2014-03-23-perl-try-catch-800x300.png
  og_image: /assets/posts/2014-03-23-perl-try-catch-800x300.png
---

最近は Perl スクリプトが割と使われている環境に居ます。
どちらかと言うと Rubyist だったけど、折角なので Perl な世界にも飛び込んでみました。
...で早速はまったのでメモメモ。

<!--more-->

## try-catch を書いてみた

既存のコードをコピーして try-catch を書いたところ、
正常な処理なのに catch の中まで動いてはまりました。

```perl
try {
  print "try\n";
} catch {
  print "catch\n";  # ここも動く
}
```

## Perl では try-catch 構文はない

既存コードの try-catch を見て、言語仕様として
例外処理の仕組みがあると思い込んだのが敗因でした。

Perl では try-catch 構文がないようで、
既存コードではライブラリ Try::Tiny が頑張っているとのこと。

で、今回 catch まで動いてしまったのは `use Try::Tiny` をしていなかったから。
こんな感じのエラーも出ていたけど、他のログに埋もれて見落としてた orz

```console
Can't call method "catch" without a package or object reference at - line 3.
```

## Try::Tiny の仕組み

Try::Tiny の仕組みは少し考えれば予想はついたし、ググれば出てきた。
こんな括弧や sub が省略されてるんだろうな。

```perl
use Try::Tiny;
try (
  sub { print "try\n"; },
  catch ( sub { print "catch\n"; } )
);
```
