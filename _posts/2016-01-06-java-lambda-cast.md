---
title: Java - 交差型キャストでラムダ式を Serializable, Cloneable にして遊んだ！
categories: tech
tags: java
header:
  teaser: /assets/posts/2016-01-06-java-lambda-cast-800x150.png
  og_image: /assets/posts/2016-01-06-java-lambda-cast-800x150.png
---

ラムダ式の交差型キャストというものを初めて知りました。

キャストだけでインターフェイスを実装したことになるのが面白くて、
ラムダ式を Serializable や Cloneable にして軽く遊んでみました。

<!--more-->

## 経緯

<blockquote class="twitter-tweet"><p lang="ja" dir="ltr">JDKのソース見て知った。「(Hoge &amp; Fuga)」みたいな複数の型を書いてキャストなんて文法あるのか～ <a href="https://t.co/AMvmUky7dL">pic.twitter.com/AMvmUky7dL</a></p>&mdash; Akihiro Kondo (@akkinoc) <a href="https://twitter.com/akkinoc/status/684553623250939904?ref_src=twsrc%5Etfw">January 6, 2016</a></blockquote> <script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>
<blockquote class="twitter-tweet"><p lang="ja" dir="ltr"><a href="https://twitter.com/bitter_fox?ref_src=twsrc%5Etfw">@bitter_fox</a> <a href="https://twitter.com/cero_t?ref_src=twsrc%5Etfw">@cero_t</a> おお！交差型キャストと言うんですね～キャストでラムダ式がSerializableに変わるの面白いですねｗ ありがとございます！</p>&mdash; Akihiro Kondo (@akkinoc) <a href="https://twitter.com/akkinoc/status/684560407646715904?ref_src=twsrc%5Etfw">January 6, 2016</a></blockquote> <script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>

## 交差型キャスト

交差型キャストについては、
[@bitter_fox] さんのスライドと記事がとても分かりやすかったです。

[@bitter_fox]: https://twitter.com/bitter_fox

* [徹底解説！ Project Lambda のすべて リターンズ [祝 Java8Launch #jjug] - SlideShare](http://www.slideshare.net/bitter_fox/java8-launch#108)
* [JavaSE8 リリース記念！マイナーな言語仕様を紹介してみる (交差型キャスト，レシーバパラメータ(仮引数にthis)) - きつねとJava！](http://d.hatena.ne.jp/bitter_fox/20140319/1395221764)

## 環境

```console
$ java -version
java version "1.8.0_65"
Java(TM) SE Runtime Environment (build 1.8.0_65-b17)
Java HotSpot(TM) 64-Bit Server VM (build 25.65-b01, mixed mode)
```

＊以降、どこまでが仕様でどこからが環境依存なのかは分からずに書いてます(^^;

## Serializable にしてみる

シリアライズ/デシリアライズして、実行まで出来ちゃいました。

```java
public static void main(String[] args) throws Exception {
  Runnable lambda = (Runnable & Serializable) () -> System.out.println("hoge");

  byte[] bytes = serialize(lambda);
  Runnable lambda2 = deserialize(bytes);

  System.out.println(lambda);     // Hoge$$Lambda$1/868693306@1fb3ebeb
  lambda.run();                   // hoge
  System.out.println(lambda2);    // Hoge$$Lambda$2/2003749087@4eec7777
  lambda2.run();                  // hoge
}

static byte[] serialize(Object object) throws Exception {
  try (ByteArrayOutputStream baos = new ByteArrayOutputStream();
      ObjectOutputStream oos = new ObjectOutputStream(baos)) {
    oos.writeObject(object);
    return baos.toByteArray();
  }
}

static <T> T deserialize(byte[] bytes) throws Exception {
  try (ByteArrayInputStream bais = new ByteArrayInputStream(bytes);
      ObjectInputStream ois = new ObjectInputStream(bais)) {
    return (T) ois.readObject();
  }
}
```

ラムダ式内で外部の変数を使ったらどうなっちゃうんだろー？
外部変数の値ごとシリアライズしちゃってるのかなー？

まずは Serializable でない変数を含むラムダ式にして確認したところ、
`writeObject` で `NotSerializableException` となりました。

```java
Object hoge = new Object();
Runnable lambda = (Runnable & Serializable) () -> System.out.println(hoge);
```

今度は Serializable な外部変数を含むラムダ式にして、
変数の内容をシリアライズ前後で書き換えてみました。

```java
public static void main(String[] args) throws Exception {
  Map<String, String> hoge = new HashMap<>();
  hoge.put("a", "x");
  Runnable lambda = (Runnable & Serializable) () -> System.out.println(hoge);

  hoge.put("b", "y");

  byte[] bytes = serialize(lambda);
  Runnable lambda2 = deserialize(bytes);

  hoge.put("c", "z");

  System.out.println(lambda);     // Hoge$$Lambda$1/868693306@1c20c684
  lambda.run();                   // {a=x, b=y, c=z}
  System.out.println(lambda2);    // Hoge$$Lambda$2/1149319664@7cca494b
  lambda2.run();                  // {a=x, b=y}
}
```

やはり、外部変数の値ごとシリアライズしてるような動作となりました。
なるほどー。

## Cloneable にしてみる

Cloneable にも出来ちゃいました。

```java
public static void main(String[] args) throws Exception {
  Runnable lambda = (Runnable & Cloneable) () -> System.out.println("hoge");
  System.out.println(lambda instanceof Cloneable);    // true
}
```

でも `Object#clone()` は protected なのでそのままじゃ呼び出せません。
ならば無理やり呼んでやる！ｗ
とリフレクションしてみたら、普通に clone できました。

```java
public static void main(String[] args) throws Exception {
  Runnable lambda = (Runnable & Cloneable) () -> System.out.println("hoge");
  Runnable lambda2 = cloneForce(lambda);
  System.out.println(lambda);     // Hoge$$Lambda$1/455659002@4c873330
  lambda.run();                   // hoge
  System.out.println(lambda2);    // Hoge$$Lambda$1/455659002@119d7047
  lambda2.run();                  // hoge
}

static <T> T cloneForce(T object) throws Exception {
  Method clone = Object.class.getDeclaredMethod("clone");
  clone.setAccessible(true);
  return (T) clone.invoke(object);
}
```

Serializable と同じように、状態を持つ外部変数も使ってみたけど、
こちらは参照が保たれたままで普通でした :)

```java
public static void main(String[] args) throws Exception {
  Map<String, String> hoge = new HashMap<>();
  hoge.put("a", "x");
  Runnable lambda = (Runnable & Cloneable) () -> System.out.println(hoge);
  hoge.put("b", "y");
  Runnable lambda2 = cloneForce(lambda);
  hoge.put("c", "z");
  System.out.println(lambda);     // Hoge$$Lambda$1/455659002@7229724f
  lambda.run();                   // {a=x, b=y, c=z}
  System.out.println(lambda2);    // Hoge$$Lambda$1/455659002@4c873330
  lambda2.run();                  // {a=x, b=y, c=z}
}
```

## 以上！

役に立つかは微妙なところだけど、面白かったー。
