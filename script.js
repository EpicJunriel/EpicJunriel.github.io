let ffmpeg;

async function initFFmpeg() {
  ffmpeg = await FFmpeg.createFFmpeg({
    log: true,
    progress: (p) => {
      const progressBar = document.getElementById('progressBar');
      if (p.ratio) progressBar.value = Math.round(p.ratio * 100);
    }
  });

  function enableAutoScroll() {
    const logOutput = document.getElementById('logOutput');
    const observer = new MutationObserver(() => {
      logOutput.scrollTop = logOutput.scrollHeight;
    });
    observer.observe(logOutput, { childList: true });
  }

  ffmpeg.setLogger(({ type, message }) => {
    const logOutput = document.getElementById('logOutput');
    logOutput.textContent += `[${type}] ${message}\n`;
  });

  enableAutoScroll();
  await ffmpeg.load();
}

document.getElementById('upload').addEventListener('change', (event) => {
  const file = event.target.files[0];
  if (file) {
    displayVideoInfo(file);
    document.getElementById('compressBtn').disabled = false;
    document.getElementById('compressBtn').onclick = () => compressVideo(file);
  }
});

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

function getOutputFileName(inputFileName) {
  const baseName = inputFileName.substring(0, inputFileName.lastIndexOf('.'));
  const extension = inputFileName.substring(inputFileName.lastIndexOf('.'));
  return `${baseName}_compressed${extension}`;
}

async function compressVideo(file) {
  const progressBar = document.getElementById('progressBar');
  progressBar.style.display = 'block';
  progressBar.value = 0;

  const tempInputFileName = 'temp_input.mp4';
  const outputFileName = getOutputFileName(file.name);

  await ffmpeg.FS('writeFile', tempInputFileName, new Uint8Array(await file.arrayBuffer()));

  await ffmpeg.run('-i', tempInputFileName, '-vcodec', 'libx264', '-crf', '28', '-preset', 'fast', '-movflags', '+faststart', '-fs', '8M', outputFileName);

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

  progressBar.style.display = 'none';
  ffmpeg.FS('unlink', tempInputFileName);
}

initFFmpeg();
