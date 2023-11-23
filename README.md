# WorldAccessCounter

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

