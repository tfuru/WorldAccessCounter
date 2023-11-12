/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import * as admin from "firebase-admin";
import {getDownloadURL} from "firebase-admin/storage";
admin.initializeApp();
const storage = admin.storage();
const db = admin.database();

import * as os from "os";
import * as path from "path";
import * as fs from "fs";
import * as crypto from "crypto";
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
// $ ffmpeg -y -stream_loop -1 -i 150x150.png -t 3 out.mp4
const ffmpegImageToVideo = async (inputFile: string) => {
  const fileName = crypto.randomBytes(20).toString("hex") + ".mp4";
  const outputFile = path.join(tmpdir, fileName);
  logger.info(`ffmpegImageToVideo: ${outputFile}`);
  return new Promise<string>((resolve, reject) => {
    ffmpeg(inputFile)
      .setFfmpegPath(ffmpegPath.path)
      .inputOptions(["-y", "-stream_loop -1"])
      .outputOptions(["-t 3"])
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

// cont 数字入りの画像を生成する
const createContImage = (cont: number, size: number, backgroundColor: string, fontColor: string) => {
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

  const value = `${cont}`;
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

// MP4動画をstorageに保存する
const saveStorageMp4 = async (worldid: string, identifier: string, path: string) => {
  // path のファイルを読み込む
  const buffer = fs.readFileSync(path);
  const fileName = `${identifier}.mp4`;

  // ワーリドIDのバケットにMP$を保存する
  const bucket = storage.bucket();
  const file = bucket.file(`${worldid}/${fileName}`);
  await file.save(buffer, {
    metadata: {
      contentType: "video/mp4",
    },
  });

  return await getDownloadURL(file);
};

// 現在のアクセス回数を取得する
const getAccessCount = async (worldid: string, identifier: string) => {
  const ref = db.ref(`access/${worldid}/${identifier}`);
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
  const ref = db.ref(`access/${worldid}/${identifier}`);
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

// Realtime Database に worldid, identifier へのアクセス回数を保存する アクセス回数は自動インクリメントする
const saveAccessCount = async (worldid: string, identifier: string) => {
  const ref = db.ref(`access/${worldid}/${identifier}`);
  return new Promise<number>((resolve, reject) => {
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
  });
};

// アクセス回数へのアクセス
/* # カウント取得 cmd=get
curl -X GET "http://127.0.0.1:5001/cms-count/us-central1/access?worldid=dummy-worldid&identifier=dummy-identifier"

# カウント加算 cmd=up
curl -X GET "http://127.0.0.1:5001/cms-count/us-central1/access?worldid=dummy-worldid&identifier=dummy-identifier&cmd=up"

# リセット cmd=reset
curl -X GET "http://127.0.0.1:5001/cms-count/us-central1/access?worldid=dummy-worldid&identifier=dummy-identifier&cmd=reset"
*/
export const access = onRequest(async (request, response) => {
  const worldid = request.query.worldid as string || "dummy-worldid";
  const identifier = request.query.identifier as string || "dummy-identifier";

  const size = parseInt(request.query.size as string) || 512;
  const backgroundColor = request.query.backgroundcolor as string || "fff";
  const fontColor = request.query.fontcolor as string || "000";

  const cmd = request.query.cmd as string || "get";
  let count = 0;
  switch (cmd) {
  case "up":
    // カウントアップさせて DB に保存し、その値を取得する
    count = await saveAccessCount(worldid, identifier);
    break;
  case "reset":
    // カウントをリセットする
    count = await resetAccessCount(worldid, identifier);
    break;
  case "get":
  default:
    count = await getAccessCount(worldid, identifier);
    break;
  }

  // 画像を生成する
  const buffer = createContImage( count, size, backgroundColor, fontColor);

  // 画像をtmpに保存する
  const tmpImagePath = saveTmpImage(buffer);

  // 画像を動画に変換する
  const tmpMp4Path = await ffmpegImageToVideo(tmpImagePath);

  // storage に mp4動画 を保存する
  const storageMp4Url = await saveStorageMp4(worldid, identifier, tmpMp4Path);

  // storageMp4Url にリダイレクトする
  response.redirect(storageMp4Url);
});

export const helloWorld = onRequest(async (request, response) => {
  logger.info("Hello logs!", {structuredData: true});
  logger.info(request.query);

  const worldid = request.query.worldid as string || "dummy-worldid";
  const identifier = request.query.identifier as string || "dummy-identifier";

  const count = parseInt(request.query.size as string) || 0;
  const size = parseInt(request.query.size as string) || 512;
  const backgroundColor = request.query.backgroundcolor as string || "fff";
  const fontColor = request.query.fontcolor as string || "000";

  logger.info(`count: ${count}`);
  logger.info(`size: ${size}`);
  logger.info(`backgroundColor: ${backgroundColor}`);
  logger.info(`fontColor: ${fontColor}`);

  // 画像を生成する
  const buffer = createContImage( count, size, backgroundColor, fontColor);

  // 画像をtmpに保存する
  const tmpImagePath = saveTmpImage(buffer);

  // 画像を動画に変換する
  const tmpMp4Path = await ffmpegImageToVideo(tmpImagePath);

  // storage に mp4動画 を保存する
  const storageMp4Url = await saveStorageMp4(worldid, identifier, tmpMp4Path);

  response.json({"msg": "Hello from Firebase!", "tmpImage": tmpImagePath, "tmpMp4Path": tmpMp4Path, "storageMp4Url": storageMp4Url});
});
