---
title: Java Buildpack Memory Calculator を Amazon ECS + AWS Fargate で動かす
categories: tech
tags: spring-boot spring-framework java buildpack amazon-ecs aws-fargate aws-cloudformation aws
header:
  teaser: /assets/posts/2024-05-20-java-buildpack-memory-calculator-on-aws-ecs-fargate-1200x630.png
  og_image: /assets/posts/2024-05-20-java-buildpack-memory-calculator-on-aws-ecs-fargate-1200x630.png
---

Spring Boot アプリケーションを Amazon ECS + AWS Fargate で動かした際、
[Java Buildpack Memory Calculator] が正しく機能していないことに気付き、調査しました。

[Java Buildpack Memory Calculator]: https://paketo.io/docs/reference/java-reference/#memory-calculator

<!--more-->

## 前提

* 環境
  * Java 17
  * Gradle 8.7
  * Spring Boot 3.2
* Docker イメージ ビルド方法
  * Spring Boot Gradle Plugin の `gradle bootBuildImage` でビルド
* Docker イメージ 実行環境
  * Amazon ECS + AWS Fargate
* (僕はコンテナ技術に明るくありません)

## Java Buildpack Memory Calculator とは

[Java Buildpack Memory Calculator] は、 Java アプリケーションのメモリ配分について、
実行環境のキャパシティ等から最適な値を自動計算し割当ててくれるそうです。
Spring Boot の Maven / Gradle プラグインでイメージビルドすると組み込まれました。

計算式は次のように算出されるようです。

> Heap = Total Container Memory - Non-Heap - Headroom
> Non-Heap = Direct Memory + Metaspace + Reserved Code Cache + (Thread Stack * Thread Count)
>
> <footer><cite><a href="https://paketo.io/docs/reference/java-reference/#memory-calculator">Java Buildpack Reference - Paketo Buildpacks</a></cite></footer>

## 起きていたこと

ECS タスク定義のメモリ ([Task size > memory]) は 1GB で設定していたのですが、
コンテナ起動時に流れていたログは次のような内容でした。
(見やすいように適当に改行を入れてます。)

```text
Calculated JVM Memory Configuration:
  -XX:MaxDirectMemorySize=10M
  -Xmx7128493K
  -XX:MaxMetaspaceSize=138570K
  -XX:ReservedCodeCacheSize=240M
  -Xss1M
  (Total Memory: 7574264K, Thread Count: 50, Loaded Class Count: 22051, Headroom: 0%)
```

[Task size > memory]: https://docs.aws.amazon.com/AmazonECS/latest/developerguide/task_definition_parameters.html#ContainerDefinition-taskmemory

Total Memory と -Xmx が 7GB 近くで計算されており、
設定しているメモリキャパシティよりも大きな値が使われていて、
明らかに様子がおかしいです。
何度か再起動すると 3.5GB 前後になったり 1.5GB 前後になったりもしました。

## 結論 / 解決方法

先に結論を書きます。

ECS タスク定義内のコンテナ定義の方にも
"メモリのハード制限" ([Container definitions > memory]) を設定することで、
この値が Total Memory の値として採用され、期待通り制御できるようになりました。
(CloudFormation で言うと [TaskDefinition > ContainerDefinition > Memory] です。)

[Container definitions > memory]: https://docs.aws.amazon.com/AmazonECS/latest/developerguide/task_definition_parameters.html#container_definition_memory
[TaskDefinition > ContainerDefinition > Memory]: https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-ecs-taskdefinition-containerdefinition.html#cfn-ecs-taskdefinition-containerdefinition-memory

逆に言うと、これ設定しないと Heap の計算が狂ってしまうので注意したいところです。

ちなみに "メモリのソフト制限" ([Container definitions > memoryReservation]) という
設定項目もあるのですが、こちらは設定しても解消されませんでした。
(CloudFormation で言うと [TaskDefinition > ContainerDefinition > MemoryReservation] です。)

[Container definitions > memoryReservation]: https://docs.aws.amazon.com/AmazonECS/latest/developerguide/task_definition_parameters.html#container_definition_memory
[TaskDefinition > ContainerDefinition > MemoryReservation]: https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-ecs-taskdefinition-containerdefinition.html#cfn-ecs-taskdefinition-containerdefinition-memoryreservation

以下はこの結論に至るまでに調べたことのメモです。

## 調べたこと

### Total Memory は OS が認識しているメモリサイズと一致するのか？

実行中のコンテナにアタッチして中に潜り `free` コマンドを実行すると、
こちらも Total = 約 7GB と近い値になりました。
OS が認識しているメモリサイズが採用されているのかなと予想できました。

どうやらホスト側のメモリサイズが見えてしまっており、
これがタスク定義で指定したメモリサイズと一致するとは限らないようです。

### 同事象の Issue や記事等はないのか？

粘り強く探したら同事象の Issue を見つけ、
Aug 25, 2021 のコメントで今回の解決策に気付きました。

> New insights from the AWS support. We've been using ECS "wrong" the whole time.
> If you specify the limits on the [container definition][Container definitions > memory] as well everything works like a charm.
>
> <footer><cite><a href="https://github.com/paketo-buildpacks/libjvm/issues/86#issuecomment-905476037">Issue #86 Memory calculation on AWS ECS Fargate does not work properly - paketo-buildpacks/libjvm</a></cite></footer>

[cloudfoundry/java-buildpack-memory-calculator] の Issue を最初に探していたのですが、
[paketo-buildpacks/libjvm] の方が本体なのでしょうか。
(リポジトリごとの関係の詳細までは深くは調べませんでした。)

[cloudfoundry/java-buildpack-memory-calculator]: https://github.com/cloudfoundry/java-buildpack-memory-calculator
[paketo-buildpacks/libjvm]: https://github.com/paketo-buildpacks/libjvm

### どの値が Total Memory として採用されるのか？

[paketo-buildpacks/libjvm] のソースコードを見ると、
次のファイルを読み取っていそうに見えました。
(雑にソースコードを漁っただけなので違っているかもしれません。)

> ```go
> DefaultMemoryLimitPathV1 = "/sys/fs/cgroup/memory/memory.limit_in_bytes"
> DefaultMemoryLimitPathV2 = "/sys/fs/cgroup/memory.max"
> ```
>
> <footer><cite><a href="https://github.com/paketo-buildpacks/libjvm/blob/v1.44.4/helper/memory_calculator.go#L38-L39">helper/memory_calculator.go - paketo-buildpacks/libjvm</a></cite></footer>

### ECS コンテナ定義の設定値が /sys/fs/cgroup/memory にどう影響するか？

メモリのハード制限 / ソフト制限それぞれを変更して、
コンテナ内の各ファイルがどのように変化するか確認してみると、
下表のようになりました。

| ファイル                                           |            制限なし |    ハード制限 = 1GB |    ソフト制限 = 1GB |
|----------------------------------------------------|--------------------:|--------------------:|--------------------:|
| `/sys/fs/cgroup/memory/memory.limit_in_bytes`      | 9223372036854771712 |          1073741824 | 9223372036854771712 |
| `/sys/fs/cgroup/memory/memory.soft_limit_in_bytes` | 9223372036854771712 | 9223372036854771712 |          1073741824 |
| `/sys/fs/cgroup/memory.max`                        |    - (ファイルなし) |    - (ファイルなし) |    - (ファイルなし) |

9223372036854771712 は 未設定 / 制限なし を表しているらしい。

### おまけ: -XX:MaxDirectMemorySize がデフォルトで 10MB 固定なのは何故か？

僕の扱っているアプリケーションは -XX:MaxDirectMemorySize = 10MB だと
OutOfMemoryError (Direct Buffer) が割と発生しやすいです。
そのためこの値のデフォルトが何故 10MB 固定なのか気になり見つけたページです。
今回の記事との関係は薄いですが、覚書でリンクを貼っておきます。

* [Discussion #241 Why does paketo-libjvm set direct memory to an arbitrary 10MB by default? - paketo-buildpacks](https://github.com/orgs/paketo-buildpacks/discussions/241)

## 推察 まとめ

概ね以下の挙動をしているのかなと推察し、納得できました。

* ECS メモリのハード制限は `/sys/fs/cgroup/memory/memory.limit_in_bytes` に書き込まれる
* Memory Calculator は `/sys/fs/cgroup/memory/memory.limit_in_bytes` を Total Memory として使う
