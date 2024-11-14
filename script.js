// ffmpeg.wasm のロード
import initFFmpeg from 'https://cdn.jsdelivr.net/npm/@ffmpeg/ffmpeg@0.12.1/dist/ffmpeg.min.js';

const videoInput = document.getElementById('videoInput');
const compressButton = document.getElementById('compressButton');
const status = document.getElementById('status');
const outputVideo = document.getElementById('outputVideo');
const downloadLink = document.getElementById('downloadLink');

let ffmpeg;

async function loadFFmpeg() {
  ffmpeg = await initFFmpeg();
  await ffmpeg.load();
  status.textContent = 'ffmpeg.wasm 読み込み完了';
}

async function compressVideo(file) {
  status.textContent = '圧縮中...お待ちください';

  // 入力ファイルを ffmpeg にロード
  const inputFileName = 'input.mp4';
  const outputFileName = 'output.mp4';
  const inputBuffer = await file.arrayBuffer();

  ffmpeg.FS('writeFile', inputFileName, new Uint8Array(inputBuffer));

  // ffmpeg コマンドで動画を圧縮
  await ffmpeg.run(
    '-i', inputFileName,
    '-b:v', '500k', // ビットレート指定
    '-preset', 'fast',
    '-movflags', 'faststart',
    outputFileName
  );

  // 圧縮されたファイルを取得
  const outputBuffer = ffmpeg.FS('readFile', outputFileName);
  const outputBlob = new Blob([outputBuffer], { type: 'video/mp4' });

  // ファイルサイズが 10MB 以下になるか確認
  if (outputBlob.size <= 10 * 1024 * 1024) {
    status.textContent = '圧縮完了！';
    const outputUrl = URL.createObjectURL(outputBlob);
    outputVideo.src = outputUrl;
    downloadLink.href = outputUrl;
    downloadLink.textContent = '圧縮動画をダウンロード';
    downloadLink.style.display = 'block';
  } else {
    status.textContent = 'ファイルサイズが 10MB を超えています。ビットレートを調整してください。';
  }
}

compressButton.addEventListener('click', () => {
  const file = videoInput.files[0];
  if (file) {
    compressVideo(file);
  } else {
    alert('動画ファイルを選択してください。');
  }
});

// ページ読み込み時に ffmpeg.wasm をロード
window.onload = loadFFmpeg;
