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

  const mediaStream = await fileToMediaStream(file);
  const videoTracks = mediaStream.getVideoTracks();
  if (videoTracks.length === 0) {
    console.error("動画トラックが見つかりませんでした。");
    status.textContent = "動画トラックが見つかりませんでした。";
    return;
  }

  const track = videoTracks[0];
  const processor = new MediaStreamTrackProcessor({ track });
  const reader = processor.readable.getReader();
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

  console.log("デコード処理を開始します...");
  let readResult;
  while (!(readResult = await reader.read()).done) {
    const chunk = readResult.value;
    try {
      videoDecoder.decode(chunk);
    } catch (error) {
      console.error("デコード中にエラーが発生しました:", error);
    }
  }

  console.log("デコードが完了しました。");
  status.textContent = "デコードが完了しました。";
}

async function handleDecodedFrame(frame) {
  console.log("フレームがデコードされました:", frame);
  decodedFrames.push(frame);
  frame.close(); // メモリ解放
}

async function fileToMediaStream(file) {
  const url = URL.createObjectURL(file);
  const video = document.createElement('video');
  video.src = url;
  await video.play();
  console.log("MediaStreamが取得されました。");
  return video.captureStream();
}