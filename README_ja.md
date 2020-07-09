[English](https://github.com/kako-jun/nostalgic-counter)

# :pager: Nostalgic Counter / ノスタルジックカウンター

[![Build Status](https://travis-ci.org/kako-jun/nostalgic-counter.svg?branch=master)](https://travis-ci.org/kako-jun/nostalgic-counter)

`Nostalgic Counter` は、インターネット黎明期のホームページでお馴染みだった「アクセスカウンター」を、いま風の技術で再現したものです。

- サイトの訪問者をカウントし、サイト内に埋め込んで表示
- 数値の代わりに、アニメーション GIF を表示
- 連続カウント防止機能あり
- キリ番表示機能あり

などを実現します。

JavaScript が動作する環境であれば表示可能なので、GitHub Pages などの静的サイトにも設置できます。

サーバー側、クライアント側に分かれており、こちらはクライアント側です。

サーバー側は [Nostalgic Counter Server](https://github.com/kako-jun/nostalgic-counter-server/blob/master/README_ja.md) を参照。

どちらもソースコードを公開しているので、個人で借りたクラウドに設置することも、改造することも可能です。

## Description

### Demo

[デモサイト](https://nostalgic-counter.llll-ll.com/demo)

### VS.

#### VS. Google Analytics

Google Analytics でもアクセス数を知ることはできます。

しかし、その数値をサイトに埋め込んで公開するようには作られていません。

#### VS. 古き良き CGI でのアクセスカウンター

CGI の実行を許可してくれるサーバーが、現在は少なくなっています。

Perl で書かれたものが多く、改造のための学習コストが大きいです。

#### VS. その他、企業製のアクセスカウンター

ソースコードが公開されていません。

その企業のアカウントを取得する必要があります。

広告が入ります。

## Installation

### Requirements

モダンな Web ブラウザ

### Download binaries

- [nostalgic-counter.min.js](https://github.com/kako-jun/nostalgic-counter/releases)

### CDN

```html
<script src="https://cdn.jsdelivr.net/gh/kako-jun/nostalgic-counter@v1.0.2/dist/nostalgic-counter.min.js"></script>
```

## Features

### Usage

#### 1 番簡単な使い方

自分のサイトの HTML を開き、`<body>` 末尾に以下を追加します。

```html
<script src="https://cdn.jsdelivr.net/gh/kako-jun/nostalgic-counter@v1.0.2/dist/nostalgic-counter.min.js"></script>

<script>
  window.onload = async () => {
    const counter = await window.NostalgicCounter.getCounter(
      "https://nostalgic-counter.llll-ll.com/api/counter?id=sample"
    );

    if (counter) {
      window.NostalgicCounter.showCounter("nostalgic-counter", counter.total);
    }
  };
</script>
```

カウンターを表示したい場所に、以下を追加します。

```html
<p>あなたは <span id="nostalgic-counter"></span> 人目の訪問者です。</p>
```

Web ブラウザで HTML を開くと、カウンターが表示されていることを確認できるでしょう。

ただし、この例では `sample` という ID のカウンターを指定しており、自分のサイト専用のカウンターにはなっていません。

`sample` カウンターを使った人が他にいた場合、その人のサイトと共有のカウンターになってしまいます。

そのため、まずは自分専用のカウンターを作ることが必要です。

#### 自分専用のカウンターを作る

操作は全て Web ブラウザで行います。

URL 欄 に「したい操作を意味する文字列」を打ち込み、Enter を押すことで実行します。

カウンターを新規作成する操作は、以下です。
（`ff2` という ID のカウンターを、`nobara` というパスワードで作る場合）

```
https://nostalgic-counter.llll-ll.com/api/admin/new?id=ff2&password=nobara
```

HTML 内のコードは、以下のようになります。

```js
const counter = await window.NostalgicCounter.getCounter("https://nostalgic-counter.llll-ll.com/api/counter?id=ff2");
```

カウンターを使う時には、`&password=nobara` は必要無いことに注意してください。

誤って書いてしまうと、パスワードがバレてしまいます。

#### 自分のカウンターに対して、設定を変更する

新規作成された直後のカウンターは、以下のような設定になっています。

- アクセス数: 0
- 別アクセスとみなす経過時間": 0 分
- アクセス数に履かせるゲタ: 0

アクセス数を 0 にリセットする操作は、以下です。

```
https://nostalgic-counter.llll-ll.com/api/admin/reset?id=ff2&password=nobara
```

「別アクセスとみなす経過時間」が 0 分のままだと、サイトをリロードするたびに数値が増えます。

60 分に変更する操作は、以下です。

```
https://nostalgic-counter.llll-ll.com/api/admin/config?id=ff2&password=nobara&interval_minutes=60
```

「アクセス数に履かせるゲタ」とは、「サイトを引っ越した際に、それまでのアクセス数を引き継げると便利だなー」と思って付けた機能です。

単純に、ゲタの数値だけ足した数値が、カウンターに表示されます。

10 万アクセスからスタートしたい場合は、以下です。

```
https://nostalgic-counter.llll-ll.com/api/admin/config?id=ff2&password=nobara&offset_count=100000
```

現在の設定内容を確認する操作は、以下です。

```
https://nostalgic-counter.llll-ll.com/api/admin/config?id=ff2&password=nobara
```

```js
{
  interval_minutes: 60,
  offset_count: 100000
}
```

#### これまでのアクセス数を取得する

累計を取得する操作は、以下です。

```
https://nostalgic-counter.llll-ll.com/api/counter?id=ff2
```

```js
{
  total: 2;
}
```

サイト管理者以外にも見えて良いデータなので、パスワードは必要ありません。

#### さらに細かい情報を取得する

URL に `&ex` を付けると、取得できる情報が増えます。

```
https://nostalgic-counter.llll-ll.com/api/counter?id=ff2&ex
```

```js
{
  total: 2,
  today: 1,
  today_date: "2020-07-09",
  yesterday: 0,
  yesterday_date: "2020-07-08",
  this_month: 2,
  this_month_date: "2020-07",
  last_month: 0,
  last_month_date: "2020-06",
  this_year: 2,
  this_year_date: "2020",
  last_year: 0,
  last_year_date: "2019"
}
```

### Examples

Nostalgic Counter には 3 つの API があります。

- `window.NostalgicCounter.getCounter()`
- `window.NostalgicCounter.showCounter()`
- `window.NostalgicCounter.showKiriban()`

基本的な使い方は、
`getCounter()` でカウンターを取得し、
そのカウンターに対して `showCounter()` を呼ぶことで、サイトに数値を表示します。

`showCounter()` の引数を変えると、数値の代わりに画像を使うこともできます。

今日だけでなく、昨年、先月、先週、昨日のアクセス数も表示できます。

カウンターに対して `showKiriban()` を呼ぶと、キリ番関連の色んなメッセージを表示します。

- 1000 アクセスごとをキリ番にする。（間隔での指定）
- 12345 アクセスをキリ番にする。（直値での指定）
- 次回のキリ番を知らせる。
- キリ番だったことを、Twitter でシェアする。

などの機能があります。

詳細は、デモサイトのコードを見てください。

### Unsupported

#### 昨年、先月、先週、昨日のアクセス数は表示できるが、一昨年のアクセス数、今月の日ごとのアクセス数などは無理

機能を実装すれば可能ですが、それらを表示したいケースが無かったので予定していません。

#### パスワード無しでカウンターを作ってしまうと、もうその ID ではカウンターを作れない

例えば、`ff2` という名前のカウンターを作る場合、ブラウザの URL 欄に

```
https://nostalgic-counter.llll-ll.com/api/admin/new?id=ff2&password=nobara
```

と打って、開く必要があります。

誤って

```
https://nostalgic-counter.llll-ll.com/api/admin/new?id=ff2
```

と打ってしまうと、パスワード無しのカウンターが作られます。

もう `ff2` という ID は使用済みになったので、作り直すことはできません。

諦めて、`ff3` にでもしてください。

#### 作成済みのカウンターのパスワードを変更することはできない

シンプルにするために、この制限を設けています。

パスワード無しカウンターから、パスワード有りカウンターに変更できないのと同様です。

パスワードを変えたい場合は、別 ID でカウンターを新規作成し、これまでのアクセス数をゲタとして設定しましょう。

#### 未使用のカウンターは、新年になるたびに削除される

誤って作ったカウンターや、もう必要無くなったカウンターを削除したい場合、明示的に削除することはできません。

削除依頼を出した人が、カウンターを作成した本人かを証明する手段が無いためです。

そのため、1 年間アクセスの無かったカウンターを、自動的に削除する運用にしています。

サイトにカウンターを設置したままだと、アクセスが発生してしまうため、まずはサイトから取り外してください。

例えば、最後のアクセスが 2020-04-02 だった場合、2021-01-01 にはまだ 1 年間経過していないので、2022-01-01 に削除されます。

そのカウンターの ID は開放され、別の人が使えるようになります。

### Coding

改造する場合の手順は、以下です。

Node.js と TypeScript で実装しており、`nostalgic-counter.ts` にまとまっています。

```sh
$ git clone git@github.com:kako-jun/nostalgic-counter.git
$ cd nostalgic-counter
$ npm install
```

`nostalgic-counter.ts` をコード変更します。

```sh
$ npm run build
```

`dist/nostalgic-counter.min.js` が生成されます。

### Contributing

Pull Request を歓迎します

- `Nostalgic Counter` をより便利にする機能の追加
- より洗練された TypeScript での書き方
- バグの発見、修正
- もっと良い英訳、日本語訳があると教えたい

など、アイデアを教えてください。

## Authors

kako-jun

- :octocat: https://github.com/kako-jun
- :house: https://llll-ll.com
- :bird: https://twitter.com/kako_jun_42

### :lemon: Lemonade stand

寄付を頂けたら、少し豪華な猫エサを買おうと思います。

下のリンクから、Amazon ギフト券（E メールタイプ）を送ってください。

「受取人」欄には `kako.hydrajin@gmail.com` と入力してください。

**[:hearts: Donate](https://www.amazon.co.jp/gp/product/B004N3APGO/ref=as_li_tl?ie=UTF8&tag=llll-ll-22&camp=247&creative=1211&linkCode=as2&creativeASIN=B004N3APGO&linkId=4aab440d9dbd9b06bbe014aaafb88d6f)**

- 「メッセージ」欄を使って、感想を伝えることもできます。
- 送り主が誰かは分かりません。
- ¥15 から送れます。

## License

This project is licensed under the MIT License.

See the [LICENSE](https://github.com/kako-jun/nostalgic-counter/blob/master/LICENSE) file for details.

## Acknowledgments

- [Node.js](https://nodejs.org/)
- [TypeScript](https://www.typescriptlang.org/)
- and you.
