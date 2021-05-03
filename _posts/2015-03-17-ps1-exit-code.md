---
title: ターミナルで直前の終了コードを常に確認する (顔文字も)
categories: tech
tags: terminal bash shell centos putty
header:
  teaser: /assets/posts/2015-03-17-ps1-exit-code-800x280.png
  overlay_image: /assets/posts/2015-03-17-ps1-exit-code-800x280.png
---

CUI でコマンドを叩いてると、終了コードが気になることが多いんだけど。

毎回 `echo $?` を叩いて確認するのは面倒だし、
確認し忘れて別のコマンドを叩いてしまうと、
2つ前の終了コードを失ってしまってうあああってなる。

それを防ぐべく、 PS1 をほげほげして常に直前の終了コードを
プロンプトで表示するようにした。
ついでに顔文字を使って、喜びと残念さも味わえるようにしてみた。

<!--more-->

## 使ってる環境

* OS: CentOS 6.6
* ターミナル: Windows PuTTY ごった煮版 (SSH経由)

## コード

こんなコードを `~/.bash_profile` に追記した。
全ユーザに適用して良ければ `/etc/profile.d` の中に
ファイルを作成してもいいと思う。

全部まとめて1行で書くことも出来るけど、
読みやすさ重視して変数/ファンクションを多用してる。

あと、普段から Git を使ってるので、ブランチ名も常に表示してる。

```shell
# Colors
_ps1_red="\e[31m"
_ps1_green="\e[32m"
_ps1_yellow="\e[33m"
_ps1_blue="\e[34m"
_ps1_purple="\e[35m"
_ps1_cyan="\e[36m"
_ps1_reset="\e[00m"

# PS1 parts
function _ps1_result() {
    code=$?
    if [ ${code} == 0 ]; then
        echo -e "${_ps1_blue}"'(っ*´∀`*)っ OK!!'" [${code}]${_ps1_reset}"
    else
        echo -e "${_ps1_red}"'(｡´･ω･`) NG...'" [${code}]${_ps1_reset}"
    fi
}
_ps1_user="${_ps1_green}\u@\h${_ps1_reset}"
_ps1_dir="${_ps1_cyan}\w${_ps1_reset}"
function _ps1_git() {
    echo -e "${_ps1_yellow}$(__git_ps1 2>/dev/null)${_ps1_reset}"
}
_ps1_prompt="\$ "

# PS1
export PS1="\n\$(_ps1_result)\n${_ps1_user}:${_ps1_dir}\$(_ps1_git)\n${_ps1_prompt}"
```

## 表示結果

できた。便利。かわいい。

[![Image: Result]][Image: Result]

[Image: Result]: {% link assets/posts/2015-03-17-ps1-exit-code-result-440x222.png %}

Mac のターミナルなら絵文字も使えるのかもなー。

## PuTTY は少し設定必要

PuTTY では全角文字の表示幅が潰れてしまった。
\[ウィンドウ\] → \[変換\] → \[CJK 用の文字幅を使用する\] を
チェックしておくといいみたい。

## 参考

* [プロンプトに顔文字を出す - おおにしあきらの日記](http://d.hatena.ne.jp/ohnishiakira/20111202/1322825446)
* [プロンプトの戯れ - rcmdnk’s blog](http://rcmdnk.github.io/blog/2013/03/18/prompt-screen)
