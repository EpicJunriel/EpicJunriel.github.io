let ffmpeg;
const logOutput = document.getElementById('logOutput');
const checkmark = document.getElementById('checkmark');
const uploadInput = document.getElementById('upload');
const compressBtn = document.getElementById('compressBtn');
const targetSizeInput = document.getElementById('targetSize');
const framerateSelect = document.getElementById('framerate');
const resolutionSelect = document.getElementById('resolution');
const twoPassCheckbox = document.getElementById('twoPass');
const videoInfo = document.getElementById('videoInfo');
const thumbnail = document.getElementById('thumbnail');
const progressBar = document.getElementById('progressBar');
const compressedInfo = document.getElementById('compressedInfo');
const downloadBtn = document.getElementById('downloadBtn');
const buildVersion = document.getElementById('buildVersion');

async function initFFmpeg() {
  ffmpeg = await FFmpeg.createFFmpeg({
    log: true,
    progress: (p) => {
      if (p.ratio) progressBar.value = Math.round(p.ratio * 100);
    }
  });

  ffmpeg.setLogger(({ type, message }) => {
    logOutput.textContent += `[${type}] ${message}\n`;
    logOutput.scrollTop = logOutput.scrollHeight;
  });

  await ffmpeg.load();
  checkmark.style.display = 'inline';
  enableControls();
}

function enableControls() {
  uploadInput.disabled = false;
  targetSizeInput.disabled = false;
  framerateSelect.disabled = false;
  resolutionSelect.disabled = false;
  twoPassCheckbox.disabled = false;
  compressBtn.disabled = false;
}

uploadInput.addEventListener('change', (event) => {
  const file = event.target.files[0];
  if (file) {
    displayVideoInfo(file);
    compressBtn.onclick = () => compressVideo(file);
  }
});

function displayVideoInfo(file) {
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

async function getVideoDuration(file) {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.onloadedmetadata = () => {
      window.URL.revokeObjectURL(video.src);
      resolve(video.duration);
    };
    video.onerror = () => reject(new Error('動画のメタデータを読み込めませんでした。'));
    video.src = window.URL.createObjectURL(file);
  });
}

async function calculateBitrate(targetSizeMB, duration) {
  const targetSizeBytes = targetSizeMB * 1024 * 1024;
  const bitrateBps = (targetSizeBytes * 8) / duration;
  return Math.floor(bitrateBps / 1000); // kbps
}

async function compressVideo(file) {
  const targetSizeMB = parseInt(targetSizeInput.value, 10);
  if (!targetSizeMB || targetSizeMB <= 0) {
    logOutput.textContent += 'エラー: 目標ファイルサイズを正しく入力してください。\n';
    return;
  }

  try {
    progressBar.style.display = 'block';
    progressBar.value = 0;

    const duration = await getVideoDuration(file);
    logOutput.textContent += `動画の長さ: ${duration.toFixed(2)}秒\n`;

    const bitrate = await calculateBitrate(targetSizeMB, duration);
    logOutput.textContent += `計算されたビットレート: ${bitrate}kbps\n`;

    const tempInputFileName = 'input.mp4';
    const outputFileName = getOutputFileName(file.name);
    await ffmpeg.FS('writeFile', tempInputFileName, new Uint8Array(await file.arrayBuffer()));

    const framerate = framerateSelect.value;
    const resolution = resolutionSelect.value;
    const twoPass = twoPassCheckbox.checked;

    let scaleFilter = '';
    if (resolution !== 'original') {
      scaleFilter = `-vf scale=${resolution}`;
    }

    if (twoPass) {
      const nullDevice = navigator.platform.includes('Win') ? 'NUL' : '/dev/null';
      await ffmpeg.run(
        '-y', '-i', tempInputFileName,
        '-c:v', 'libx264',
        '-b:v', `${bitrate}k`,
        '-r', framerate,
        scaleFilter,
        '-pass', '1',
        '-f', 'null',
        nullDevice
      );
      await ffmpeg.run(
        '-i', tempInputFileName,
        '-c:v', 'libx264',
        '-b:v', `${bitrate}k`,
        '-r', framerate,
        scaleFilter,
        '-pass', '2',
        '-movflags', '+faststart',
        outputFileName
      );
    } else {
      await ffmpeg.run(
        '-i', tempInputFileName,
        '-c:v', 'libx264',
        '-b:v', `${bitrate}k`,
        '-r', framerate,
        scaleFilter,
        '-movflags', '+faststart',
        outputFileName
      );
    }

    const data = ffmpeg.FS('readFile', outputFileName);
    const videoBlob = new Blob([data.buffer], { type: 'video/mp4' });
    const url = URL.createObjectURL(videoBlob);

    compressedInfo.innerHTML = `<p>圧縮後のサイズ: ${(videoBlob.size / (1024 * 1024)).toFixed(2)} MB</p>`;
    downloadBtn.style.display = 'inline-block';
    downloadBtn.textContent = `${outputFileName} をダウンロード`;
    downloadBtn.onclick = () => {
      const a = document.createElement('a');
      a.href = url;
      a.download = outputFileName;
      a.click();
    };

    progressBar.style.display = 'none';
    ffmpeg.FS('unlink', tempInputFileName);
  } catch (error) {
    logOutput.textContent += `エラー: ${error.message}\n`;
  }
}

initFFmpeg();