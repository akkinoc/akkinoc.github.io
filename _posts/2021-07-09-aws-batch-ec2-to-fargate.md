---
title: AWS Batch の実行環境を EC2 → Fargate へ移行して感じたメリット/デメリット
categories: tech
tags: aws-batch aws-fargate amazon-ec2 amazon-ecs amazon-eventbridge aws-cloudformation aws
header:
  teaser: /assets/posts/2021-07-09-aws-batch-ec2-to-fargate-1200x630.png
  og_image: /assets/posts/2021-07-09-aws-batch-ec2-to-fargate-1200x630.png
---

普段、バッチ処理の実行には AWS Batch を使ってます。

先日 AWS Batch の実行環境を EC2 → Fargate へ切り替えてみたので、
僕の感じたメリット/デメリットをまとめてみました。

<!--more-->

## 前提: AWS Batch とは

名前そのままですが、 AWS でバッチ処理を実行できる、フルマネージド型のサービスです。
バッチ処理は Docker イメージで実装しておき、ジョブを投げつけるとコンテナ実行してくれます。

> [![Image: AWS Batch]][Image: AWS Batch]
>
> <footer><cite><a href="https://docs.aws.amazon.com/ja_jp/wellarchitected/latest/high-performance-computing-lens/batch-based-architecture.html">AWS Batch アーキテクチャの例 - AWS Well-Architected フレームワーク</a></cite></footer>

[Image: AWS Batch]: {% link assets/posts/2021-07-09-aws-batch-ec2-to-fargate-aws-batch-550x300.png %}

ジョブは Amazon EventBridge 経由等で自動投入できるので、
時間ベースのスケジュールや、 Amazon S3 への PutObject など、
様々なイベントでトリガーできます。

コンピューティング環境 (実行環境) は、前は Amazon EC2 一択しかなかったのですが、
2020/12 頃から AWS Fargate も選べるようになっていたようです。
今回はここを EC2 → Fargate へ切り替えました。

## 前提: 僕の場合の使い方

夜間〜早朝の決まった時間に、数時間ほどの定常的な処理を実行しています。
複数のバッチ処理はありますが、それぞれに依存関係はありません。
エラー発生時はアプリ内で何度か再実行はしていますが、
それでもダメならエラー通知だけして、翌朝に人力で対処しています。

そのため、ジョブの依存関係, ジョブの自動再​試行, 配列ジョブといった、
AWS Batch 特有の便利機能までは使っていません。
AWS Batch では内部的に Amazon ECS が使われているのですが、
直接 ECS にタスク投入して実行する形でも良いかも、と思ってるくらいの使い方です。

以下は、この使い方でまとめたメリット/デメリットになります。

## Fargate のメリット (EC2 と比較)

### 起動が少しだけ速くなった

ジョブ投入〜バッチ処理開始までの時間が、少しだけ速くなりました。
小さなコンテナイメージで何度か試したところ、
EC2 では 1-3 分以上かかりましたが、 Fargate では 30 秒程でした。

[![Image: EC2 Jobs]][Image: EC2 Jobs]
[![Image: Fargate Jobs]][Image: Fargate Jobs]

[Image: EC2 Jobs]: {% link assets/posts/2021-07-09-aws-batch-ec2-to-fargate-aws-batch-on-ec2-jobs-520x240.png %}
[Image: Fargate Jobs]: {% link assets/posts/2021-07-09-aws-batch-ec2-to-fargate-aws-batch-on-fargate-jobs-520x240.png %}

＊EC2 はインスタンス起動のため時間が伸びるようです。
＊インスタンス起動したままにすれば、料金は上がりますが EC2 のが速いと思います。

### 断続的なジョブ投入時に長時間待たされることがなくなった

EC2 では、断続的に複数のジョブを投入した場合、 10 分 〜 1 時間弱ほど待っても
なかなかバッチ処理が始まらない事象に何度か遭遇していました。

原因は分かっていないですし、確実に再現させることも出来ないのですが、
ジョブ終了後の EC2 インスタンスの停止中〜停止直後くらいに、
別の新たなジョブを投入すると遭遇しやすかった印象があります。
＊感覚的な部分なので正確な条件ではないかもしれません。
＊AWS 内部の EC2 インスタンスの状態管理的な都合によるものなのでしょうか...

テスト用の手動実行時や、エラー後の手動再実行時に発生しやすく、
どこか設定を間違えただろうかと無駄に調査する時間が過ぎていたので、
この問題がなくなるのは個人的には大きなメリットです。

Fargate 移行後は、まだ間もないですが、今のところこの事象は発生していません。

## Fargate のデメリット (EC2 と比較)

### コストが微増する

同じ vCPU, メモリで比較した場合、 Fargate の方が少し割高です。
いくつかの EC2 インスタンスタイプごとに、料金を比較してみました。
＊2021/07 時点, アジアパシフィック (東京) リージョン, オンデマンドの時間単価です。

| EC2 タイプ | vCPU | メモリ | EC2 料金 | Fargate 料金 | 料金比較 |
|:-----------|-----:|-------:|---------:|-------------:|---------:|
| c5.large   |    2 |      4 | $0.10700 |     $0.12324 |  +15.18% |
| m5.large   |    2 |      8 | $0.12400 |     $0.14536 |  +17.23% |
| r5.large   |    2 |     16 | $0.15200 |     $0.18960 |  +24.74% |
| c5.xlarge  |    4 |      8 | $0.21400 |     $0.24648 |  +15.18% |
| m5.xlarge  |    4 |     16 | $0.24800 |     $0.29072 |  +17.23% |

### vCPU, メモリの選択の幅が狭い

Fargate は vCPU, メモリの選択肢が EC2 インスタンスタイプほど多くありません。
vCPU 4, メモリ 30 GB を超えるリソースが欲しい場合は注意です。

> |    CPU の値    |                メモリの値                |
> |:---------------|:-----------------------------------------|
> | 256 (.25 vCPU) | 0.5 GB, 1 GB, 2 GB                       |
> | 512 (.5 vCPU)  | 1 GB, 2 GB, 3 GB, 4 GB                   |
> | 1024 (1 vCPU)  | 2 GB, 3 GB, 4 GB, 5 GB, 6 GB, 7 GB, 8 GB |
> | 2048 (2 vCPU)  | 4 GB ～ 16 GB (1 GB のインクリメント)    |
> | 4096 (4 vCPU)  | 8 GB ～ 30 GB (1 GB のインクリメント)    |
> 
> <footer><cite><a href="https://docs.aws.amazon.com/ja_jp/AmazonECS/latest/developerguide/AWS_Fargate.html">AWS Fargate での Amazon ECS - Amazon Elastic Container Service 開発者ガイド</a></cite></footer>

## まとめ

微々たる差ですが、 Fargate の方が少し速く起動できる点で、個人的に気に入っています。
気分だけの違いですが、よりサーバレスになってる感があるのも嬉しいです。
(EC2 でも自動で起動/停止してくれるので、使い勝手は変わってません。)

バッチ処理を組む場合、
短時間で終わる軽い処理なら AWS Lambda,
長時間かかる重い処理なら AWS Batch on EC2,
と選択することが多かったのですが、
ここに AWS Batch on Fargate という選択肢も増やせて良かったです。

## コード

検証に使ったコードは GitHub に置いてます。
AWS リソースは CloudFormation テンプレートで構築しました。

[akkinoc/try-aws-batch-on-fargate - GitHub](https://github.com/akkinoc/try-aws-batch-on-fargate)

## 参考

* [AWS Batch での AWS Fargate - AWS Batch ユーザーガイド](https://docs.aws.amazon.com/ja_jp/batch/latest/userguide/fargate.html)
