---
title: rake から system32 直下の java が呼び出せなくてはまった
categories: tech
tags: ruby java
header:
  teaser: /assets/posts/2014-03-19-java-from-rake-800x300.png
  overlay_image: /assets/posts/2014-03-19-java-from-rake-800x300.png
  # caption: Photo by [Andy](http://free-illustrations.gatag.net/2013/09/14/120000.html)
---

ちょっとした make 的なことをしたくて rake を使ってみました。
そこから java を呼び出そうとしたときに
java コマンドがないという罠にはまったのでメモ。

<!--more-->

## 環境

* Windows 7 (64bit)
* Java SDK 7u51 (64bit)
* Ruby 1.9.3p545 (32bit)

## rake から java を呼び出してみた

### rakefile

こんなファイルを用意。
ここでは便宜上バージョン確認のみ。

```ruby
task :default do
  sh "java -version"
end
```

### 実行

こんな感じで怒られた...

```console
> rake
java -version
rake aborted!
Command failed with status (127): [java -version...]
rakefile:2:in `block in <top (required)>'
Tasks: TOP => default
(See full trace by running task with --trace)
```

## もしかしてパスが通ってない？

java.exe へのパスが通ってるか確認してみた。
コマンドプロンプトから確認。ちゃんとパスは通ってました。

```console
> java -version
java version "1.7.0_51"
Java(TM) SE Runtime Environment (build 1.7.0_51-b13)
Java HotSpot(TM) 64-Bit Server VM (build 24.51-b03, mixed mode)

> where java
C:\Windows\System32\java.exe

> echo %PATH%
C:\Windows\system32;C:\Windows;...
```

## irb からも試してみた

irb からもダメ。絶対パスもダメ。
しかも No such file...?!

```console
> irb
irb(main):001:0> `java -version`
Errno::ENOENT: No such file or directory - java -version
        from (irb):1:in ``'
        from (irb):1
        from irb:12:in `<main>'
irb(main):002:0> `C:/Windows/System32/java.exe -version`
Errno::ENOENT: No such file or directory - C:/Windows/System32/java.exe -version
        from (irb):2:in ``'
        from (irb):2
        from irb:12:in `<main>'
```

でも `C:/Program Files/Java` 配下のパスでは通った。
取り敢えずの回避策は分かったものの、何故なのか悩まされました...

```console
irb(main):003:0> `"C:/Program Files/Java/jdk1.7.0_51/bin/java.exe" -version`
java version "1.7.0_51"
Java(TM) SE Runtime Environment (build 1.7.0_51-b13)
Java HotSpot(TM) 64-Bit Server VM (build 24.51-b03, mixed mode)
=> ""
```

## 犯人は WOW64

64bit 環境で 32bit アプリケーションを実行すると
システムフォルダがリダイレクトされる仕組み (WOW64) がある。
WOW64 の存在は知ってたけど、すっかり頭から抜けてました。

今回は 32bit な rake (ruby) から `C:/Windows/System32` にアクセスしようとした為、
`C:/Windows/SYSWOW64` にリダイレクトされてたんだと思います。
`C:/Windows/SYSWOW64` には java.exe は置いてなかったので、残念な結果に...

## 対策

1. ruby も 64bit にする
2. `C:/Program Files/Java` 配下のインストール先にパスを通す
3. `C:/Program Files/Java` 配下の絶対パスを使う

今回は 2 で回避しました。

## Android SDK でも似たような現象

ネットで調べてたら 64bit 環境の Android SDK でも
Java が見つからない事象が割とあるようでした。
原因まで書いてる記事は見つからなかったけど、たぶん同じ原因なんじゃないかな～。
