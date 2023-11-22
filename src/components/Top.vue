<template>
  <div class="top">
    <section class="section">
      <div class="container">
        <h1 class="title">WorldAccessCounter</h1>
        <p class="subtitle">cluster ワールド内に設置できるアクセスカウンターです。 Unity製のワールドであれば設置可能です</p>        
      </div>
    </section>

    <section class="section" id="nav">
      <div class="container">
        <nav class="breadcrumb is-centered" aria-label="breadcrumbs">
          <ul>
            <li :class="isActiveSample"><a @click="clickNav('sample')">使い方</a></li>
            <li :class="isActiveForm"><a @click="clickNav('form')">URLを生成する</a></li>
            <li :class="isActiveDownload"><a @click="clickNav('download')">ダウンロード</a></li>
          </ul>
        </nav>
      </div>
    </section>

    <section class="section" id="download_container" v-if="isActiveDownload">
      <div class="container">
        <h1 class="title">ダウンロード</h1>
        <p class="subtitle">
          <a :href="UNITYPACKAGE_URL" target="_blank">AccessCounter.unitypackage</a>
        </p>        
      </div>
    </section>

    <section class="section" id="sample_seen" v-if="isActiveSample">
      <div class="container">
        <h1 class="title">使い方</h1>
        <div class="columns">
          <div class="column">
            <ol>
              <li>Cluster Creater Kit を設置済みのUnityプロジェクトを用意してUnityで開く</li>
              <li><a :href="UNITYPACKAGE_URL" target="_blank">AccessCounter.unitypackage</a> を ダウンロードして プロジェクトにインポートする</li>
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

    <section class="section" id="form_container" v-if="isActiveForm">
      <div class="container">
        <h1 class="title">URLを生成する</h1>
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
    const UNITYPACKAGE_URL = "https://github.com/tfuru/WorldAccessCounter/raw/main/unity/AccessCounter.unitypackage";
    const COUNT_UP_API_URL = 'https://access-754xomgh3q-uc.a.run.app?worldid=[WORLDID]&identifier=[IDENTIFIER]&cmd=up';
    var worldUrl = ref('https://cluster.mu/w/2d1a38f1-9967-4b6f-994a-d00d52637a8e');
    var identifier = ref('');
    var videoPlayerUrl = ref('');

    const isActiveSample = ref("is-active");
    const isActiveDownload = ref("");
    const isActiveForm = ref("");

    const clickNav = (value: string) => {
      console.log('value', value);
      switch (value) {
        case "download":
          isActiveDownload.value = "is-active";
          isActiveSample.value = "";
          isActiveForm.value = "";
          break;
        case "sample":
          isActiveDownload.value = "";
          isActiveSample.value = "is-active";
          isActiveForm.value = "";
          break;
        case "form":
          isActiveDownload.value = "";
          isActiveSample.value = "";
          isActiveForm.value = "is-active";
          break;
      }
    };

    const clickCreateURL = (e: any) => {
      console.log('clickCreateURL', worldUrl, identifier);

      // https://cluster.mu/w/ を削除して worldid を取得する
      const worldid = worldUrl.value.replace('https://cluster.mu/w/', '');
      videoPlayerUrl.value = COUNT_UP_API_URL.replace('[WORLDID]', worldid).replace('[IDENTIFIER]', (identifier.value != "") ? identifier.value : "dummy-identifier");

      console.log('videoPlayerUrl', videoPlayerUrl);
    };

    return {
      UNITYPACKAGE_URL,
      worldUrl,
      identifier,
      videoPlayerUrl,
      clickCreateURL,
      clickNav,
      isActiveDownload,
      isActiveSample,
      isActiveForm
    };
  }
});
</script>

<style scoped lang="scss">

#nav, #form_container, #sample_seen {
  .container {
    margin: 0 auto;
    width: 600px;
  }
}

#nav {
  ul {
    li {
      font-size: large;
    }
  }
}

#sample_seen {
  ol {
    li {
      text-align: left;
      font-size: large;
    }
  }
}
</style>
