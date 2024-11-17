let ffmpeg;

async function initFFmpeg() {
  // FFmpeg インスタンスを作成し、ローディングを開始
  ffmpeg = await FFmpeg.createFFmpeg({
    log: true,
    progress: (p) => {
      const progressBar = document.getElementById('progressBar');
      if (p.ratio) progressBar.value = Math.round(p.ratio * 100);
    }
  });

  // ログの自動スクロール機能
  function enableAutoScroll() {
    const logOutput = document.getElementById('logOutput');
    const observer = new MutationObserver(() => {
      logOutput.scrollTop = logOutput.scrollHeight;
    });
    observer.observe(logOutput, { childList: true });
  }

  // FFmpeg のログメッセージを表示
  ffmpeg.setLogger(({ type, message }) => {
    const logOutput = document.getElementById('logOutput');
    logOutput.textContent += `[${type}] ${message}\n`;
  });

  // 自動スクロールを有効にする
  enableAutoScroll();
  await ffmpeg.load();
}

// 動画ファイルが選択されたときの処理
document.getElementById('upload').addEventListener('change', (event) => {
  const file = event.target.files[0];
  if (file) {
    displayVideoInfo(file);
    document.getElementById('compressBtn').disabled = false;
    document.getElementById('compressBtn').onclick = () => compressVideo(file);
  }
});

// 動画ファイル情報とサムネイルを表示
function displayVideoInfo(file) {
  const videoInfo = document.getElementById('videoInfo');
  const thumbnail = document.getElementById('thumbnail');
  const url = URL.createObjectURL(file);

  videoInfo.innerHTML = `
    <p>ファイル名: ${file.name}</p>
    <p>サイズ: ${(file.size / (1024 * 1024)).toFixed(2)} MB</p>
  `;

  const video = document.createElement('video');
  video.src = url;
  video.currentTime = 1;
  video.addEventListener('loadeddata', () => {
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    thumbnail.src = canvas.toDataURL('image/png');
    thumbnail.style.display = 'block';
  });
}

// 出力ファイル名を生成
function getOutputFileName(inputFileName) {
  const baseName = inputFileName.substring(0, inputFileName.lastIndexOf('.'));
  const extension = inputFileName.substring(inputFileName.lastIndexOf('.'));
  return `${baseName}_compressed${extension}`;
}

// 動画ファイルの圧縮処理
async function compressVideo(file) {
  const progressBar = document.getElementById('progressBar');
  progressBar.style.display = 'block';
  progressBar.style.width = '100%'; // レイアウト崩れ防止のため幅を固定
  progressBar.value = 0;

  const tempInputFileName = 'temp_input.mp4';
  const outputFileName = getOutputFileName(file.name);

  // 入力ファイルをFFmpeg仮想ファイルシステムに書き込み
  await ffmpeg.FS('writeFile', tempInputFileName, new Uint8Array(await file.arrayBuffer()));

  // FFmpegコマンドで圧縮処理を実行
  await ffmpeg.run('-i', tempInputFileName, '-vcodec', 'libx264', '-crf', '28', '-preset', 'fast', '-movflags', '+faststart', '-fs', '8M', outputFileName);

  // 圧縮後の動画ファイルを読み込み、ダウンロードリンクを作成
  const data = ffmpeg.FS('readFile', outputFileName);
  const videoBlob = new Blob([data.buffer], { type: 'video/mp4' });
  const url = URL.createObjectURL(videoBlob);

  const compressedInfo = document.getElementById('compressedInfo');
  compressedInfo.innerHTML = `<p>圧縮後のサイズ: ${(videoBlob.size / (1024 * 1024)).toFixed(2)} MB</p>`;

  const downloadBtn = document.getElementById('downloadBtn');
  downloadBtn.style.display = 'inline-block';
  downloadBtn.classList.add('download-btn');
  downloadBtn.textContent = `${outputFileName} をダウンロード`;
  downloadBtn.onclick = () => {
    const a = document.createElement('a');
    a.href = url;
    a.download = outputFileName;
    a.click();
  };

  // プログレスバーの非表示と仮想ファイルの削除
  progressBar.style.display = 'none';
  ffmpeg.FS('unlink', tempInputFileName);
}

// FFmpeg の初期化を実行
initFFmpeg();
