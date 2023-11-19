/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import * as admin from "firebase-admin";
admin.initializeApp();

// import {getDownloadURL} from "firebase-admin/storage";
// const storage = admin.storage();
const db = admin.database();

import * as os from "os";
import * as path from "path";
import * as fs from "fs";
import * as crypto from "crypto";
import * as StreamSlice from "stream-slice";
const tmpdir = os.tmpdir();

import {onRequest} from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";

import {createCanvas} from "canvas";
import * as ffmpeg from "fluent-ffmpeg";
import * as ffmpegPath from "@ffmpeg-installer/ffmpeg";

// Start writing functions
// https://firebase.google.com/docs/functions/typescript

// TypeScriptで動画・音声形式変換(fluent-ffmpeg)
// https://zenn.dev/mini_hiori/articles/ts-media-convert

// NodeJs - Fluent-FFMPEG cannot find FFMPEG for firebase cloud functions
// https://stackoverflow.com/questions/62652721/nodejs-fluent-ffmpeg-cannot-find-ffmpeg-for-firebase-cloud-functions

// ffmpeg で画像を動画に変換する
// $ ffmpeg -y -stream_loop -1 -i 150x150.png -c:v libx264 -t 3 -an -pix_fmt yuv420p out.mp4
const ffmpegImageToVideo = async (inputFile: string, outputFile: string) => {
  logger.info(`ffmpegImageToVideo: ${outputFile}`);
  return new Promise<string>((resolve, reject) => {
    ffmpeg(inputFile)
      .setFfmpegPath(ffmpegPath.path)
      .inputOptions(["-y", "-stream_loop -1"])
      .outputOptions(["-t 3", "-c:v libx264", "-an", "-pix_fmt yuv420p"])
      .on("end", () => {
        logger.info("ffmpeg end");
        resolve(outputFile);
      })
      .on("error", (err) => {
        logger.info("ffmpeg error");
        reject(err);
      })
      .save(outputFile);
  });
};

// count 数字入りの画像を生成する
const createCountImage = (count: number, size: number, backgroundColor: string, fontColor: string, templateText: string) => {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = `#${backgroundColor}`;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;

  /*
  // 中央に線を引く
  ctx.fillStyle = "#0f0";
  ctx.beginPath();
  ctx.moveTo(centerX, 0);
  ctx.lineTo(centerX, canvas.height);
  ctx.moveTo(0, centerY);
  ctx.lineTo(canvas.width, centerY);
  ctx.stroke();
  */

  const value = templateText.replace("{COUNT}", `${count}`);
  let fontSize = 150;
  // value 文字数が 3 文字以上の場合は、フォントサイズを半分にする
  if (value.length > 3) {
    fontSize = fontSize / 2;
  }

  // 中央に文字を表示する
  ctx.fillStyle = `#${fontColor}`;
  ctx.font = `bold ${fontSize}px sans-serif`;
  ctx.textAlign = "center";
  ctx.fillText(value, centerX, centerY + fontSize / 3);
  const buffer = canvas.toBuffer("image/png");
  return buffer;
};

// 画像をtmpに保存する
const saveTmpImage = (buffer: Buffer) => {
  const fileName = crypto.randomBytes(20).toString("hex") + ".png";
  const filePath = path.join(tmpdir, fileName);
  logger.info(`saveTmpImage: ${filePath}`);

  fs.writeFileSync(filePath, buffer);
  return filePath;
};
/*
// MP4動画をstorageに保存する
const saveStorageMp4 = async (worldid: string, identifier: string, path: string) => {
  // path のファイルを読み込む
  const buffer = fs.readFileSync(path);

  // ワーリドIDのバケットにMP$を保存する
  const bucket = storage.bucket();
  const file = bucket.file(`${worldid}/${identifier}.mp4`);
  await file.save(buffer, {
    metadata: {
      contentType: "video/mp4",
    },
  });

  // ダウンロードURLを取得する
  return await getStorageMp4DownloadURL(worldid, identifier);
};
*/
/*
const getStorageMp4DownloadURL = async (worldid: string, identifier: string) => {
  // ワーリドIDのバケットにMP$を保存する
  const bucket = storage.bucket();
  const file = bucket.file(`${worldid}/${identifier}.mp4`);

  // ダウンロードURLを取得する
  return await getDownloadURL(file);
};
*/
// 現在のアクセス回数を取得する
const getAccessCount = async (worldid: string, identifier: string) => {
  const ref = db.ref(`access/${worldid}/${identifier}/count`);
  return new Promise<number>((resolve, reject) => {
    ref.once("value", (snapshot) => {
      if (snapshot == null) {
        reject(new Error("snapshot is null"));
        return;
      }
      resolve(snapshot.val());
    }, (error) => {
      reject(error);
    });
  });
};

// アクセス回数をリセットする
const resetAccessCount = async (worldid: string, identifier: string) => {
  const ref = db.ref(`access/${worldid}/${identifier}/count`);
  return new Promise<number>((resolve, reject) => {
    ref.set(0, (error) => {
      if (error) {
        reject(error);
      } else {
        resolve(0);
      }
    });
  });
};

// 加算前に期限切れかどうかをチェックする
const ACCESSCOUNT_UP_EXPIRED_SECONDS = 5;
const expiredAccessCount = async (worldid: string, identifier: string) => {
  const ref = db.ref(`access/${worldid}/${identifier}/expired`);
  return new Promise<boolean>((resolve, reject) => {
    ref.once("value", (snapshot) => {
      // 有効期限を取得して、現在時刻と比較する
      const expired = snapshot?.val();
      const now = Date.now();
      if ((snapshot == null) || (expired < now)) {
        // 期限切れ なので expired を 現在時刻 + 5秒 に更新する
        const newExpired = now + ACCESSCOUNT_UP_EXPIRED_SECONDS * 1000;
        ref.set(newExpired);
        resolve(true);
        return;
      }
      resolve(false);
    }, (error) => {
      reject(error);
    });
  });
};

// Realtime Database に worldid, identifier へのアクセス回数を保存する アクセス回数は自動インクリメントする
const saveAccessCount = async (worldid: string, identifier: string) => {
  const ref = db.ref(`access/${worldid}/${identifier}/count`);
  // 期限切れなので、カウントを加算する
  return new Promise<number>((resolve, reject) => {
    expiredAccessCount(worldid, identifier)
      .then((expired) => {
        if (expired == false) {
          // 期限切れでないので、カウントを加算しない
          reject(new Error("expired is false"));
          return;
        }
        // 現在のアクセス回数を取得して インクリメントして返す
        ref.transaction((current) => {
          return (current || 0) + 1;
        }, (error, committed, snapshot) => {
          if (error) {
            reject(error);
          } else if (!committed) {
            reject(error);
          } else {
            if (snapshot == null) {
              reject(error);
              return;
            }
            resolve(snapshot.val());
          }
        });
      })
      .catch((error) => {
        reject(error);
      });
  });
};

// request と 指定path のMP4 ファイルを HTTP Range Request をつけてレスポンスする
const responseMp4 = async (request: any, response: any, path: string) => {
  console.log("responseMp4");

  const stat = fs.statSync(path);
  const file = fs.createReadStream( path, {flags: "rs+"} );
  if (typeof request.headers.range != "undefined") {
    const range = request.headers.range;
    const parts = range.replace(/bytes=/, "").split("-");
    const partialstart = parts[0];
    const partialend = parts[1];

    if (partialend != "") {
      const start = parseInt(partialstart, 10);
      const end = partialend ? parseInt(partialend, 10) : stat.size - 1;
      const chunksize = (end - start) + 1;

      const headers = {
        "Content-Range": `bytes ${start}-${end}/${stat.size}`,
        "Accept-Ranges": "bytes",
        "Content-Length": chunksize,
        "Content-Type": "video/mp4",
      };
      console.log(" headers", headers);

      response.writeHead(206, headers);
      file
        .pipe(StreamSlice.slice(start, start + chunksize))
        .pipe(response);
      return;
    }
  }

  // そのままレスポンスする
  const headers = {
    "Accept-Ranges": "none",
    "Content-Type": "video/mp4",
    "Content-Length": stat.size,
  };
  console.log(" headers", headers);

  response.writeHead(200, headers);
  file.pipe(response);
};

// MP4 テンポラリーファイルパスを生成する
const createOutputFilePath = (worldid: string, identifier: string) => {
  const hash = crypto.createHash("sha256");
  hash.update(worldid + "-" + identifier);
  const hashDigest = hash.digest("hex");
  const fileName = `${hashDigest}.mp4`;
  const outputFile = path.join(tmpdir, fileName);
  return outputFile;
};

// アクセス回数へのアクセス
/* # カウント取得 cmd=get
open 'http://127.0.0.1:5001/cms-count/us-central1/access?text=あなたは{COUNT}番目の訪問者です&size=1024'
open 'http://127.0.0.1:5001/cms-count/us-central1/access?backgroundColor=0000'

# カウント加算 cmd=up
curl -X GET "http://127.0.0.1:5001/cms-count/us-central1/access?worldid=dummy-worldid&identifier=dummy-identifier&cmd=up"

# リセット cmd=reset
curl -X GET "http://127.0.0.1:5001/cms-count/us-central1/access?worldid=dummy-worldid&identifier=dummy-identifier&cmd=reset"
*/
export const access = onRequest(async (request, response) => {
  logger.info("query =====");
  logger.info(request.query);

  const cmd = request.query.cmd as string || "get";
  const worldid = request.query.worldid as string || "dummy-worldid";
  const identifier = request.query.identifier as string || "dummy-identifier";

  const templateText = request.query.text as string || "{COUNT}";
  const size = parseInt(request.query.size as string) || 512;
  const backgroundColor = request.query.backgroundcolor as string || "fff";
  const fontColor = request.query.fontcolor as string || "000";

  const outputFile = createOutputFilePath(worldid, identifier);

  const range = request.headers.range;
  if (range) {
    const parts = range.replace(/bytes=/, "").split("-");
    const partialstart = parts[0];
    const partialend = parts[1];
    const start = parseInt(partialstart, 10);
    const end = partialend ? parseInt(partialend, 10) : -1;

    if ((end == -1) || ((start == 0) && (end == 1))) {
      switch (cmd) {
      case "up":
        // カウントアップさせて DB に保存し、その値を取得する
        await saveAccessCount(worldid, identifier);
        break;
      case "reset":
        // カウントをリセットする
        await resetAccessCount(worldid, identifier);
        break;
      }

      if (end == -1) {
        const headers = {
          "Accept-Ranges": "none",
        };
        console.log(" headers", headers);
        response.writeHead(200, headers).send();
        return;
      }
    }
  } else {
    // Android からのアクセスの場合は、Range がないので、そのまま処理する
    // userAgent: "stagefright/1.2 (Linux;Android 13)"
    switch (cmd) {
    case "up":
      // カウントアップさせて DB に保存し、その値を取得する
      await saveAccessCount(worldid, identifier);
      break;
    case "reset":
      // カウントをリセットする
      await resetAccessCount(worldid, identifier);
      break;
    }
  }

  const count = await getAccessCount(worldid, identifier);
  // 画像を生成する
  const buffer = createCountImage( count, size, backgroundColor, fontColor, templateText);
  // 画像をtmpに保存する
  const tmpImagePath = saveTmpImage(buffer);
  // 画像を動画に変換する
  await ffmpegImageToVideo(tmpImagePath, outputFile);
  // 動画をstorageに保存する
  // await saveStorageMp4(worldid, identifier, outputFile);

  responseMp4(request, response, outputFile);
});
