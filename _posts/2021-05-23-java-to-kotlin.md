---
title: サーバサイドで Java → Kotlin に書き換えて感じたメリット/デメリット
categories: tech
tags: kotlin java spring-boot spring-framework
header:
  teaser: /assets/posts/2021-05-23-java-to-kotlin-1200x630.png
---

Kotlin というと Android 開発で使われることが多いと思いますが、
僕はサーバサイドで Spring Boot と組み合わせて使うことが多いです。

この数年ほど、サーバサイドで何度か Java → Kotlin へ書き換えてきたので、
僕の感じたメリット/デメリットをまとめてみました。

<!--more-->

## メリット

### コードの記述量が減る

記述量が減り、コードを書くのも読むのも楽になりました。
同じ処理をするなら、コード量はざっくり平均で 2-3 割くらい減らせています。

### Lombok が不要になる

Java では getter, setter, equals, toString 等を Lombok で作ることが多かったですが、
Kotlin だと言語レベルの data class で実装できます。

```kotlin
data class User(val name: String, val age: Int)
```

### 文字列に変数を埋め込みやすい

文字列と変数を連結する必要がなく見やすいです。

```kotlin
val a = 1
println("a = $a, a + 2 = ${ a + 2 }")  // "a = 1, a + 2 = 3"
```

### null 安全にできる & 演算子が便利

変数宣言は null を許容するかどうか指定でき、 null 安全にできます。

```kotlin
var a: String  = "abc"  // null 不可
var b: String? = "abc"  // null 可
```

Safe calls (`?.`), Elvis operator (`?:`) もとても便利です。
こちらの方がシンプルに書けるため、 Java の Optional は使わなくなりました。

```kotlin
val b = a?.length                       // a == null なら null になる
val c = a?.length ?: -1                 // a == null なら -1 になる
val d = a?.length ?: return             // a == null なら return する
val e = a?.length ?: throw Exception()  // a == null なら throw する
```

### コレクション操作が標準で充実してる

コレクション操作がとても充実していて、よくやる操作はほぼ揃ってます。
Java だとコレクションライブラリを追加したり自前実装したりしてましたが、
Kotlin では大抵は標準のものだけで足りています。
軽く操作する程度なら、 Java のように Stream/Collector を経由する必要もありません。

```kotlin
val a = listOf(1, 2, 3).map { it * it }
println(a)  // [1, 4, 9]
```

Java の Stream のように、無限ストリームを生成したい場合や、
大きなコレクションで複数ステップを遅延実行して効率を上げたい場合でも、
Sequence で同じことができて、更に便利関数も揃っていて良いです。
このため、 Java の Stream/Collector はほぼ使わなくなりました。

```kotlin
// 3 の倍数と 3 のつく数を強調
val a = generateSequence(1) { it + 1 }
  .map { if (it % 3 == 0 || '3' in "$it") "$it!" else "$it" }
  .take(35)
  .toList()
println(a)  // [1, 2, 3!, 4, 5, 6!, 7, 8, 9!, 10, 11, 12!, 13!, ..., 35!]
// 強調された数を抽出
val b = a.asSequence()
  .filter { '!' in it }
  .map { it.trim('!') }
  .toList()
println(b)  // [3, 6, 9, 12, 13, 15, 18, 21, 23, 24, 27, 30, 31, 32, 33, 34, 35]
```

どんな操作ができるかは、この辺りのリファレンスで確認できます:

* [Collection - Kotlin](https://kotlinlang.org/api/latest/jvm/stdlib/kotlin.collections/-collection/)
* [Sequence - Kotlin](https://kotlinlang.org/api/latest/jvm/stdlib/kotlin.sequences/-sequence/)

### コレクション変数が読取専用であることを明示できる

コレクションのインターフェイスが読取専用なものと変更可能なものとで分かれていて、
引数やフィールドに変更が発生するかどうかを明示できるので、可読性アップです。

> [![Image: Collections Diagram]][Image: Collections Diagram]
>
> <footer><cite><a href="https://kotlinlang.org/docs/collections-overview.html">Collections overview - Kotlin</a></cite></footer>

[Image: Collections Diagram]: {% link assets/posts/2021-05-23-java-to-kotlin-collections-diagram-406x311.png %}

### Spring Framework が公式サポートしている

Spring Framework, Spring Boot を使う場合、公式でサポートされているので、
Kotlin 向けの拡張機能が使えますし、変なハマり方も少ないです。
何より公式サポートという安心感が強いです。

* [Language Support - Spring Framework Documentation](https://docs.spring.io/spring-framework/docs/5.3.6/reference/html/languages.html#kotlin)
* [Kotlin support - Spring Boot Reference Documentation](https://docs.spring.io/spring-boot/docs/2.4.5/reference/html/spring-boot-features.html#boot-features-kotlin)

### Java 資産をそのまま使える

Kotlin サポートを謳ってなくても、使い慣れた Java ライブラリがそのまま使えます。

### Java コードから呼び出せる

Kotlin コードで JAR を作った場合でも、普通に Java コードから呼び出せます。
アプリ開発だけでなく、ライブラリ開発にも使えます。

## デメリット

### 人口が少ない

サーバサイド Kotlin は、まだまだ人口が少ない印象です。
チーム開発で導入する場合の障壁の1つなので、人口増やしたいです...

### open class にしないと Spring コンポーネントにできない

`@Component`, `@Controller`, `@Service`, `@Repository` など、
Spring Framework の DI コンテナに登録するコンポーネントを作成する場合、
open class にしないと起動できません。

```kotlin
@Repository
open class MyRepository
```

* Spring Framework が内部的にプロキシ用に継承しようとするためです。
* Kotlin のクラス定義は `open` を付けないと継承不可 (final class) なのです。

クラス定義に毎回 `open` を書くのは面倒なので、
コンパイラに kotlin-spring plugin を仕込んでおくのが楽です。
コンパイル時に自動で open class にしてくれます。

* [All-open compiler plugin - Kotlin](https://kotlinlang.org/docs/all-open-plugin.html#spring-support)

プラグインを初回設定するだけなので、あまりデメリットには感じてません。

## まとめ

個人的にはメリットの方が大きく上回っています。
Kotlin はサーバサイドでもオススメです。
