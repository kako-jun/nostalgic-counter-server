[English](https://github.com/kako-jun/nostalgic-counter-server)

# :pager: Nostalgic Counter Server / ノスタルジックカウンターサーバー

[![Build Status](https://travis-ci.org/kako-jun/nostalgic-counter-server.svg?branch=master)](https://travis-ci.org/kako-jun/nostalgic-counter-server)

`Nostalgic Counter` は、インターネット黎明期のホームページでお馴染みだった「アクセスカウンター」を、いま風の技術で再現したものです。

- サイトの訪問者をカウントし、サイト内に埋め込んで表示
- 数値の代わりに、アニメーション GIF を表示
- 連続カウント防止機能あり
- キリ番表示機能あり

などを実現します。

JavaScript が動作する環境であれば表示可能なので、GitHub Pages などの静的サイトにも設置できます。

サーバー側、クライアント側に分かれており、こちらはサーバー側です。

クライアント側は [Nostalgic Counter](https://github.com/kako-jun/nostalgic-counter/blob/master/README_ja.md) を参照。

どちらもソースコードを公開しているので、個人で借りたクラウドに設置することも、改造することも可能です。

## Description

### Demo

[デモサイト](https://nostalgic-counter.llll-ll.com/demo)

## Installation

### Requirements

Node.js

### Download binaries

- [nostalgic-counter-server.js](https://raw.githubusercontent.com/kako-jun/nostalgic-counter-server/master/dist/nostalgic-counter-server.js)

### npm

[nostalgic-counter-server](https://www.npmjs.com/package/nostalgic-counter-server)

```sh
$ npm install nostalgic-counter-server
```

## Features

### Usage

#### js からの呼び出し方

サーバー上で動作させるための Node.js のプロジェクトを 1 つ作り、そこから

```js
const NostalgicCounterServer = require("nostalgic-counter-server");
const nostalgicCounterServer = new NostalgicCounterServer();
nostalgicCounterServer.start();
```

のように呼び出します。

これによって、カウンター用の Web API がホストされるようになります。

ユーザーのホーム以下に `.nostalgic-counter` ディレクトリが作られます。

ディレクトリ構成は、以下です。

- .nostalgic-counter
  - json
    - config.json
    - ignore_list.json
    - default
      - config.json
      - counter.json
      - ips.json
    - {カウンター 1 用}
      - config.json
      - counter.json
      - ips.json
    - {カウンター 2 用} …‥

クライアントから、カウンターを新規作成する Web API
`https://{設置したドメイン}/api/admin/new`
が呼ばれるたびに、カウンター用のディレクトリが増えていきます。

`.nostalgic-counter/config.json` の内容は、以下です。

```js
{
  "listening_port": 42011
}
```

Web API をホストするポートを変更できます。

クライアントの Web ブラウザから
`https://{設置したドメイン}/api/counter`
を開いて、JSON が表示されたら成功です。

### Unsupported

#### Node.js の Express を使用しているため、80 番ポート、443 番ポートでは待ち受けできない

Express のセキュリティ上の制約です。

回避方法は複数ありますが、リバースプロキシを立てる方法がオススメです。

Nginx でのリバースプロキシの立て方は、以下です。
（hoge.com での設定例です。自分のドメイン用に書き換えてください）

`/etc/nginx/sites-available/default` の内容

```
server {
  server_name hoge.com;
  listen 443 ssl http2;

  ssl_certificate /etc/letsencrypt/live/hoge.com/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/hoge.com/privkey.pem;

  add_header 'Access-Control-Allow-Origin' '*' always;
  add_header 'Access-Control-Allow-Headers' 'Origin, X-Requested-With, Content-Type, Accept';
  add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS';

  location /api {
    proxy_set_header X-Forwarded-for $remote_addr;
    proxy_pass http://localhost:42011;
  }
}
```

### Coding

改造する場合の手順は、以下です。

Node.js と TypeScript で実装しており、`nostalgic-counter-server.ts` にまとまっています。

```sh
$ git clone git@github.com:kako-jun/nostalgic-counter-server.git
$ cd nostalgic-counter-server
$ npm install
```

`nostalgic-counter-server.ts` をコード変更します。

```sh
$ npm run build
```

`dist/nostalgic-counter-server.js` が生成されます。

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

See the [LICENSE](https://github.com/kako-jun/nostalgic-counter-server/blob/master/LICENSE) file for details.

## Acknowledgments

- [Node.js](https://nodejs.org/)
- [TypeScript](https://www.typescriptlang.org/)
- and you.
