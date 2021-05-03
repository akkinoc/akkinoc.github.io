---
title: YAMAHA ルータ RTX1200 で Amazon VPC に VPN 接続した
categories: tech
tags: amazon-vpc aws yamaha rtx1200 ipsec
header:
  teaser: /assets/posts/2014-06-09-amazon-vpc-from-yamaha-rtx1200-800x154.jpg
  overlay_image: /assets/posts/2014-06-09-amazon-vpc-from-yamaha-rtx1200-800x154.jpg
  caption: Photo by [YAMAHA](http://jp.yamaha.com/products/network/downloads/tools)
---

サーバを手軽に立てたいなー。
でもセキュリティ考えるの面倒だなー。
そんな思いから Amazon VPC を立てて VPN 接続してみた。

<!--more-->

## ネットワーク構成

だいぶ端折ってるけど、こんな構成で構築した。

[![Image: Overview]][Image: Overview]

[Image: Overview]: {% link assets/posts/2014-06-09-amazon-vpc-from-yamaha-rtx1200-overview-360x480.png %}

カスタマーゲートウェイには、 YAMAHA ルータ RTX1200 を導入した。

<iframe style="width:120px;height:240px;" marginwidth="0" marginheight="0" scrolling="no" frameborder="0" src="//rcm-fe.amazon-adsystem.com/e/cm?lt1=_blank&bc1=000000&IS2=1&bg1=FFFFFF&fc1=000000&lc1=0000FF&t=akkinoc.dev-22&language=ja_JP&o=9&p=8&l=as4&m=amazon&f=ifr&ref=as_ss_li_til&asins=B001G79VGK&linkId=83eb5c8a7659c07e167ae875ccef9dbe"></iframe>

グローバル IP アドレスには、固定 IP アドレスを契約した。

## 構築方法

こちらを参考にさせて頂いた。

1. [VPC に YAMAHA RTX1100 で接続する - tama's memo](http://www.tama200x.com/blog/?p=680)
2. [RTX1100 から VPC に接続した記録 - petach の日記](http://d.hatena.ne.jp/petach/20130109/1357743436)
3. [YAMAHA RTX1100 で AWS VPC と VPN 接続できない。。なぜ？＞一部で設定修正が必要だった - 茶国 Rev3](http://d.hatena.ne.jp/chakoku/20130914/1379164876)
4. [Amazon Virtual Private Cloud (Amazon VPC) 設定例 - ヤマハネットワーク周辺機器技術情報](http://www.rtpro.yamaha.co.jp/RT/docs/amazon-vpc)
5. [IPsec 設定ガイド - ヤマハネットワーク周辺機器技術情報](http://www.rtpro.yamaha.co.jp/RT/docs/ipsec/guide.html)

特に3つ目のページでは、自分も同じ部分で詰まったのでとても助かった。
AWS から提供される設定コマンドそのままでは動かなくて、これにはとても悩まされた...

> AWS が出力してくれる内容に対して修正が必要であることが分かった。
> これは、マスカレードをどう設定しているか？にもよるのだけど、、
> ipsec ike local address には VPN 装置のグローバル側 IP ではなくて、
> VPN 装置の NAT されたプライベート側 IP を書くべきらしかった。
> これを修正したら接続できるようになった。

## 設定内容

設定した内容はこんな感じ。

これでプライベートなセグメントに配置した EC2 インスタンスへ接続が出来た。
＊セキュリティグループの解放とかは勿論やった上で :)

```shell
# デフォルトゲートウェイ
ip route default gateway pp 1

# LAN1
ip lan1 address 192.168.1.2/24

# PPPoE (LAN2)
pp select 1
 pp keepalive use lcp-echo
 pp keepalive interval 30 retry-interval=30 count=12
 pp always-on on
 pppoe use lan2
 pppoe auto connect on
 pppoe auto disconnect off
 pp auth accept pap chap
 pp auth myname <プロバイダ接続ID> <プロバイダ接続パスワード>
 ppp lcp mru on 1454
 ppp ipcp ipaddress on
 ppp ipcp msext on
 ppp ccp type none
 ip pp mtu 1454
 ip pp nat descriptor 1000
 pp enable 1
pp select none

# IPsec トンネル 1
tunnel select 1
 ipsec tunnel 201
  ipsec sa policy 201 1 esp aes-cbc sha-hmac
  ipsec ike duration ipsec-sa 1 3600
  ipsec ike encryption 1 aes-cbc
  ipsec ike group 1 modp1024
  ipsec ike hash 1 sha
  ipsec ike keepalive use 1 on dpd 10 3
  ipsec ike local address 1 192.168.1.2
  ipsec ike pfs 1 on
  ipsec ike pre-shared-key 1 text <事前共有鍵>
  ipsec ike remote address 1 <相手側IPアドレス>
 ipsec tunnel outer df-bit clear
 ip tunnel address 169.254.252.26/30
 ip tunnel remote address 169.254.252.25
 ip tunnel tcp mss limit 1387
 tunnel enable 1
tunnel select none

# IPsec トンネル 2
tunnel select 2
 ipsec tunnel 202
  ipsec sa policy 202 2 esp aes-cbc sha-hmac
  ipsec ike duration ipsec-sa 2 3600
  ipsec ike encryption 2 aes-cbc
  ipsec ike group 2 modp1024
  ipsec ike hash 2 sha
  ipsec ike keepalive use 2 on dpd 10 3
  ipsec ike local address 2 192.168.1.2
  ipsec ike pfs 2 on
  ipsec ike pre-shared-key 2 text <事前共有鍵>
  ipsec ike remote address 2 <相手側IPアドレス>
 ipsec tunnel outer df-bit clear
 ip tunnel address 169.254.252.30/30
 ip tunnel remote address 169.254.252.29
 ip tunnel tcp mss limit 1387
 tunnel enable 2
tunnel select none

# NAT
nat descriptor type 1000 masquerade
nat descriptor address outer 1000 ipcp
nat descriptor address inner 1000 auto
nat descriptor masquerade static 1000 1 192.168.1.2 udp 500
nat descriptor masquerade static 1000 2 192.168.1.2 esp

# BGP
bgp use on
bgp autonomous-system 65000
bgp neighbor 1 10124 169.254.252.25 hold-time=30 local-address=169.254.252.26
bgp neighbor 2 10124 169.254.252.29 hold-time=30 local-address=169.254.252.30
bgp import filter 1 equal 0.0.0.0/0
bgp import 10124 static filter 1

# IPsec
ipsec auto refresh on

# DNS
dns service recursive
dns server pp 1
dns server select 500001 pp 1 any . restrict pp 1
dns private address spoof on
```

## みんな設定の管理どうしてるんだろう

フィルタとかも入れだしたらカオスになってきた...

<blockquote class="twitter-tweet"><p lang="ja" dir="ltr">ヤマハルータの設定、複雑になってくるとコメント入れたりバージョン管理したくなってくる。世のデキる人たちはどうやって管理してるんだろうなー。</p>&mdash; Akihiro Kondo (@akkinoc) <a href="https://twitter.com/akkinoc/status/471598498299645952?ref_src=twsrc%5Etfw">May 28, 2014</a></blockquote> <script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>
