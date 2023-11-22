<template>
  <div class="top">
    <section class="section">
      <div class="container">
        <h1 class="title">cluster ワールド内アクセスカウンター</h1>
        <p class="subtitle">
          cluster ワールド内に設置できるアクセスカウンターです。 Unity製のワールドであれば、どこでも設置可能です。
        </p>        
      </div>
    </section>
    <section class="section">
      <div class="container">
        <h1 class="title">ダウンロード</h1>
        <p class="subtitle">
          <a href="#" target="_blank">AccessCounter.unitypackage</a>
        </p>        
      </div>
    </section>

    <section class="section" id="sample_seen">
      <div class="container">
        <h1 class="title">使い方</h1>
        <div class="columns">
          <div class="column">
            <ol>
              <li>Cluster Creater Kit を設置済みのUnityプロジェクトを用意してUnityで開く</li>
              <li><a href="#" target="_blank">AccessCounter.unitypackage</a> を ダウンロードして プロジェクトにインポートする</li>
              <li>サンプルシーン `Assets/t_furu/AccessCounter/Scenes/sample` を開く</li>
              <li>Hierarchy に `AccessCounter` があるので階層を開く</li>
              <li>`OnJoinPlayer`を選択してInspectorを見てみる<br/><img src="/img/docs/OnJoinPlayer.png" width="400"></li>
              <li>`CountUpTrigger`を選択してInspectorを見てみる<br/><img src="/img/docs/CountUpTrigger.png" width="400"></li>
              <li>`CountUpTrigger`を選択してInspectorにある `Video Player コンポーネント` の URLが下記で <a hre="#createurl">生成するURL</a>となるので見てみる</li>
              <li>Unityプレビューで実行してカウントアップする事を確認する</li>
              <li>アップロードするとワールドに人が来るたびにカウントアップされます</li>
            </ol>    
          </div>
        </div>
      </div>
    </section>

    <section class="section" id="form_container">
      <div class="container">
        <h1 class="title"><a id="createurl">URLを生成する</a></h1>
        <div class="columns">
          <div class="column">
            <p> CountUpTrigger`を選択してInspectorにある `Video Player コンポーネント` のURL に設定する値 </p>

            <div class="field">              
              <label class="label">ワールドURL</label>
              <div class="control">
                <input class="input" type="text" placeholder="https://cluster.mu/w/XXXXXXXX" v-model="worldUrl">
              </div>
            </div>            
            <div class="field">              
              <label class="label">識別子 [オプション]</label>
              <div class="control">
                <input class="input" type="text" placeholder="例) join" v-model="identifier">
              </div>
            </div>

            <div class="field">              
              <div class="control">
                <input class="button is-primary is-fullwidth" type="button" value="URL作成" @click="clickCreateURL">
              </div>
            </div>

            <div class="field">
              <label class="label">Video Player コンポーネントに設定するURL</label>
              <div class="control">
                <input class="input" type="text" v-model="videoPlayerUrl">
              </div>
            </div>

          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script lang="ts">
import { defineComponent,ref } from 'vue';

export default defineComponent({
  name: 'TopComponent',
  props: {
    msg: String,
  },
  setup() {
    const COUNT_UP_API_URL = 'https://access-754xomgh3q-uc.a.run.app?worldid=[WORLDID]&identifier=[IDENTIFIER]&cmd=up';
    var worldUrl = ref('https://cluster.mu/w/2d1a38f1-9967-4b6f-994a-d00d52637a8e');
    var identifier = ref('');
    var videoPlayerUrl = ref('');

    const clickCreateURL = (e: any) => {
      console.log('clickCreateURL', worldUrl, identifier);

      // https://cluster.mu/w/ を削除して worldid を取得する
      const worldid = worldUrl.value.replace('https://cluster.mu/w/', '');
      videoPlayerUrl.value = COUNT_UP_API_URL.replace('[WORLDID]', worldid).replace('[IDENTIFIER]', (identifier.value != "") ? identifier.value : "dummy-identifier");

      console.log('videoPlayerUrl', videoPlayerUrl);
    };

    return {
      worldUrl,
      identifier,
      videoPlayerUrl,
      clickCreateURL
    };
  }
});
</script>

<style scoped lang="scss">

#form_container {
  .container{
    margin: 0 auto;
    width: 600px;
  }

}

#sample_seen {
  ol {
    margin: 0 auto;
    width: 600px;
    li {
      text-align: left;
      font-size: large;
    }
  }
}
</style>
