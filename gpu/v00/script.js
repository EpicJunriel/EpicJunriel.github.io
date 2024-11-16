const input = document.getElementById('input-video');
const preview = document.getElementById('preview');
const status = document.getElementById('status');
let decodedFrames = [];
let videoFile;

input.addEventListener('change', (event) => {
  videoFile = event.target.files[0];
  console.log(`動画ファイルが選択されました: ${videoFile.name}`);
  status.textContent = `ステータス: ${videoFile.name} を読み込み中`;
});

document.getElementById('convert').addEventListener('click', async () => {
  if (!videoFile) {
    console.error("動画ファイルが選択されていません。");
    alert("動画ファイルを選択してください。");
    return;
  }

  try {
    await convertToMP4(videoFile);
  } catch (error) {
    console.error("変換中にエラーが発生しました:", error);
    status.textContent = "エラーが発生しました。詳細はコンソールを確認してください。";
  }
});

async function convertToMP4(file) {
  console.log("MP4への変換を開始します...");
  status.textContent = "MP4への変換を開始します...";

  const videoBuffer = await file.arrayBuffer();
  const videoDecoder = new VideoDecoder({
    output: handleDecodedFrame,
    error: (e) => console.error("デコードエラー:", e),
  });

  try {
    videoDecoder.configure({ codec: 'vp8' });
    console.log("デコーダーが構成されました: codec = 'vp8'");
  } catch (error) {
    console.error("コーデックが非対応です:", error);
    status.textContent = "コーデックが非対応です。変換を中止します。";
    return;
  }

  const init = { type: 'key', data: videoBuffer };
  videoDecoder.decode(init);

  console.log("動画のデコードを開始しました。");
  status.textContent = "動画のデコード中...";

  const videoEncoder = new VideoEncoder({
    output: handleEncodedChunk,
    error: (e) => console.error("エンコードエラー:", e),
  });

  videoEncoder.configure({
    codec: 'avc1.42E01E', // H.264
    width: 1280,
    height: 720,
    bitrate: 2_000_000,
    framerate: 30,
  });

  const chunks = [];

  async function handleDecodedFrame(frame) {
    console.log("フレームがデコードされました:", frame);
    decodedFrames.push(frame);
    videoEncoder.encode(frame);
    frame.close();
  }

  async function handleEncodedChunk(chunk) {
    console.log("チャンクがエンコードされました:", chunk);
    chunks.push(chunk);
  }

  videoEncoder.flush().then(async () => {
    console.log("エンコードが完了しました。MP4ファイルを作成中...");
    const mp4Blob = new Blob(chunks, { type: 'video/mp4' });
    const url = URL.createObjectURL(mp4Blob);
    preview.src = url;
    status.textContent = "変換が完了しました。プレビューが再生可能です。";
    console.log("MP4ファイルの作成が完了しました。");
  }).catch((error) => {
    console.error("エンコード完了時にエラーが発生しました:", error);
    status.textContent = "エンコード中にエラーが発生しました。";
  });
}
