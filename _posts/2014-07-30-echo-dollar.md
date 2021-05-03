---
title: echo $"hoge" と echo $'fuga' みたいな引用符直前のドル記号の意味
categories: tech
tags: shell bash
header:
  teaser: /assets/posts/2014-07-30-echo-dollar-800x200.jpg
  overlay_image: /assets/posts/2014-07-30-echo-dollar-800x200.jpg
  # caption: Photo by [Adam Kirkham](http://free-illustrations.gatag.net/2013/10/22/110000.html)
---

あるプログラムを Linux でサービス起動させたくて、
`/etc/init.d` にあるスクリプトを参考にしようと眺めてたら。

引用符の前にドル記号が付いてる `echo` が
沢山出てきて何だこれはってなったので調べてみた。

<!--more-->

例えば samba ではこんなの。

```console
$ grep -A 14 '^start' /etc/init.d/smb
start() {
  KIND="SMB"
  echo -n $"Starting $KIND services: "
  daemon smbd $SMBDOPTIONS
  ...
}
```

## 二重引用符の前にあるドル記号の意味

多言語対応用っぽい。
記号が上手く検索出来ないのと、ググり力不足とで、調べるのに苦労した。

### 多分こんな動き

`echo $"hoge"` を見つけると、言語 (`$LANG` あたり) に合ったメッセージを探す。
メッセージは `$TEXTDOMAINDIR/<言語>/LC_MESSAGES/$TEXTDOMAIN.mo` か、
`/usr/share/locale/<言語>/LC_MESSAGES/$TEXTDOMAIN.mo` から取り出してくれる。

冒頭に書いたサービス起動メッセージも確かに定義されてた。
`init.d` スクリプトでは、大体 `/etc/rc.d/init.d/functions` が使われてる。
ここには `TEXTDOMAIN=initscripts` が定義されてる。
なので `/usr/share/locale/ja/LC_MESSAGES/initscripts.mo` を覗いてみた。

```console
$ msgunfmt /usr/share/locale/ja/LC_MESSAGES/initscripts.mo 2>/dev/null | grep -A 1 'Starting $KIND services: '
msgid "Starting $KIND services: "
msgstr "$KIND サービスを起動中: "
```

### 試してみる

LANG を変えたら確かにメッセージ変わった。
ローカライズされてることは使ってて何となく知ってたけど、
こんな仕組みだとは知らなかった。

```console
# LANG=en_US.UTF-8
# service smb start
Starting SMB services:                                     [  OK  ]
Starting NMB services:                                     [  OK  ]
```

```console
# LANG=ja_JP.UTF-8
# service smb start
SMB サービスを起動中:                                      [  OK  ]
NMB サービスを起動中:                                      [  OK  ]
```

### 参考

* [BashFAQ/098 How to add localization support to your bash scripts - Greg's Wiki](http://mywiki.wooledge.org/BashFAQ/098)
* [シェルスクリプトの多言語対応 - レピカグループの技術者ブログ](http://www.repica.jp/staffblog/tech/2013/03/07/783)
* [/etc/init.d/functions の解説 - 覚え書き](http://darutk-oboegaki.blogspot.jp/2012/10/etcinitdfunctions.html)

## 単一引用符の前にあるドル記号の意味

上記を調べてるとき、知人に教えて貰った。
二重引用符とは全く違う動き。

`echo -e` の範囲限定版みたいな感じ。
`$'...'` の部分だけエスケープが有効になる。

### 試してみる

```console
$ echo '\n''\\n'
\n\\n
$ echo -e '\n''\\n'

\n
$ echo $'\n''\\n'

\\n
$ echo $'\n'$'\\n'

\n
```

### 参考

* [echo $'\n' で改行が表示できる - reroの日記](http://d.hatena.ne.jp/rero/20071117/p1)

## まとめ

* `echo $"hoge"` は多言語対応用。
* `echo $'fuga'` はエスケープ有効化。
