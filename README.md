# WorldAccessCounter

cluster ワールド内に設置できるアクセスカウンターです  
Unity製のワールドであれば設置可能です  

# 使い方 など の説明
https://cms-count.web.app/


# デモワールド

[ワールド内アクセスカウンター](https://cluster.mu/w/2d1a38f1-9967-4b6f-994a-d00d52637a8e)

```
アクセス数を記録できるツールのサンプルワールドです
例えば ゲーム開始数 と クリア数 を 表示するとかに使えます。
このサンプルワールドは 入室数 を表示してます。
```


# firebase deploy

```
firebase deploy
firebase deploy --only functions
firebase deploy --only hosting:cms-count
```

# ローカルでの動作確認

```
cd functions
build:watch

cd ..
firebase emulators:start

open http://127.0.0.1:5001/cms-count/us-central1/access
open http://127.0.0.1:5001/cms-count/us-central1/helloWorld?count=100&backgroundColor=f00&fontcolor=00f&size=300
```

# API 仕様

## GET /access

```
# カウント取得
curl -X GET "http://127.0.0.1:5001/cms-count/us-central1/access?worldid=dummy-worldid&identifier=dummy-identifier"
curl -X GET "https://access-754xomgh3q-uc.a.run.app?worldid=dummy-worldid&identifier=dummy-identifier"

# カウント加算 cmd=up
curl -X GET "http://127.0.0.1:5001/cms-count/us-central1/access?worldid=dummy-worldid&identifier=dummy-identifier&cmd=up"
curl -X GET "https://access-754xomgh3q-uc.a.run.app?worldid=dummy-worldid&identifier=dummy-identifier&cmd=up"

# リセット cmd=reset
curl -X GET "http://127.0.0.1:5001/cms-count/us-central1/access?worldid=dummy-worldid&identifier=dummy-identifier&cmd=reset"
curl -X GET "https://access-754xomgh3q-uc.a.run.app?worldid=dummy-worldid&identifier=dummy-identifier&cmd=reset"

# レスポンス
# 数字が加算された MP4動画 が返却される
```

