const input = document.getElementById('input-video');
const preview = document.getElementById('preview');
const status = document.getElementById('status');
const logButton = document.getElementById('download-log');
let decodedFrames = [];
let videoFile;
let isEncoderClosed = false;
let logMessages = [];
let chunks = []; // グローバルスコープに移動

function addLog(message) {
  const timestamp = new Date().toISOString();
  const userAgent = navigator.userAgent;
  const logMessage = `[${timestamp}] [${userAgent}] ${message}`;
  console.log(logMessage);
  logMessages.push(logMessage);
}

input.addEventListener('change', async (event) => {
  videoFile = event.target.files[0];
  addLog(`動画ファイルが選択されました: ${videoFile.name}`);
  status.textContent = `ステータス: ${videoFile.name} を読み込み中`;

  const url = URL.createObjectURL(videoFile);
  const video = document.createElement('video');
  video.src = url;
  await video.play();

  logVideoMetadata(video);
});

document.getElementById('convert').addEventListener('click', async () => {
  if (!videoFile) {
    addLog("動画ファイルが選択されていません。");
    alert("動画ファイルを選択してください。");
    return;
  }

  try {
    await convertToMP4(videoFile);
  } catch (error) {
    addLog(`変換中にエラーが発生しました: ${error}`);
    status.textContent = "エラーが発生しました。詳細はコンソールを確認してください。";
  }
});

logButton.addEventListener('click', () => {
  const blob = new Blob([logMessages.join('\n')], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'conversion_log.log';
  link.click();
  addLog("ログファイルがダウンロードされました。");
});

async function convertToMP4(file) {
  addLog("MP4への変換を開始します...");
  status.textContent = "MP4への変換を開始します...";

  const mediaStream = await fileToMediaStream(file);
  const videoTracks = mediaStream.getVideoTracks();
  if (videoTracks.length === 0) {
    addLog("動画トラックが見つかりませんでした。");
    status.textContent = "動画トラックが見つかりませんでした。";
    return;
  }

  const track = videoTracks[0];
  const processor = new MediaStreamTrackProcessor({ track });
  const reader = processor.readable.getReader();
  const videoEncoder = new VideoEncoder({
    output: handleEncodedChunk,
    error: (e) => addLog(`エンコードエラー: ${e}`),
  });

  videoEncoder.configure({
    codec: 'avc1.42E01E', // H.264 (AVCレベル3.0)に変更
    width: 1280,
    height: 720,
    bitrate: 2_000_000,
    framerate: 30,
  });

  addLog("エンコード処理を開始します...");

  let readResult;
  while (!(readResult = await reader.read()).done) {
    const frame = readResult.value;
    if (isEncoderClosed) {
      addLog("エンコーダーが閉じられているため、フレームのエンコードをスキップします。");
      frame.close();
      continue;
    }

    try {
      videoEncoder.encode(frame);
      addLog("フレームがエンコードされました。");
      frame.close(); // メモリ解放
    } catch (error) {
      addLog(`エンコード中にエラーが発生しました: ${error}`);
      frame.close();
      break;
    }
  }

  try {
    await videoEncoder.flush();
    addLog("エンコードが完了しました。MP4ファイルを作成中...");
    isEncoderClosed = true;
    videoEncoder.close();
  } catch (error) {
    addLog(`エンコード完了時にエラーが発生しました: ${error}`);
  }

  const mp4Blob = new Blob(chunks, { type: 'video/mp4' });
  addLog(`作成されたMP4ファイルのサイズ: ${mp4Blob.size}バイト`);

  if (mp4Blob.size === 0) {
    addLog("MP4ファイルが空です。エンコードに失敗した可能性があります。");
    status.textContent = "エンコードに失敗しました。";
    return;
  }

  const url = URL.createObjectURL(mp4Blob);
  preview.srcObject = null;
  preview.src = url;
  preview.load();
  preview.play();
  status.textContent = "変換が完了しました。プレビューが再生可能です。";
  addLog("MP4ファイルの作成が完了し、プレビューが設定されました。");
}

function handleEncodedChunk(chunk) {
  if (isEncoderClosed) {
    addLog("エンコーダーが閉じられているため、チャンクの処理をスキップします。");
    return;
  }
  addLog(`チャンクがエンコードされました。サイズ: ${chunk.byteLength}バイト`);
  chunks.push(chunk);
}

async function logVideoMetadata(video) {
  const { videoWidth, videoHeight, duration } = video;
  addLog(`動画メタデータ: 解像度=${videoWidth}x${videoHeight}, 長さ=${duration}s`);
}

async function fileToMediaStream(file) {
  const url = URL.createObjectURL(file);
  const video = document.createElement('video');
  video.src = url;
  await video.play();
  addLog("MediaStreamが取得されました。");
  return video.captureStream();
}