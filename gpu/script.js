document.getElementById('upload').addEventListener('change', async (event) => {
  const file = event.target.files[0];
  if (file) {
    document.getElementById('compressBtn').disabled = false;
    document.getElementById('compressBtn').onclick = () => compressVideo(file);
  }
});

async function compressVideo(file) {
  const logOutput = document.getElementById('logOutput');
  const progressBar = document.getElementById('progressBar');
  progressBar.style.display = 'block';
  progressBar.value = 0;

  const video = document.createElement('video');
  video.src = URL.createObjectURL(file);
  await video.play();

  const canvas = document.createElement('canvas');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx = canvas.getContext('2d');

  const stream = canvas.captureStream();
  const [track] = stream.getVideoTracks();
  
  const chunks = [];
  const encoder = new VideoEncoder({
    output: chunk => chunks.push(chunk),
    error: e => logOutput.textContent += `エラー: ${e.message}\n`
  });

  encoder.configure({
    codec: 'vp8',
    width: video.videoWidth,
    height: video.videoHeight,
    bitrate: 5000000,
    framerate: 30
  });

  while (video.currentTime < video.duration) {
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const frame = new VideoFrame(track);
    encoder.encode(frame);
    await new Promise(resolve => setTimeout(resolve, 100)); // フレームごとの待機
    progressBar.value = (video.currentTime / video.duration) * 100;
  }

  await encoder.flush();
  logOutput.textContent += '圧縮完了\n';

  const blob = new Blob(chunks.map(c => c.data), { type: 'video/webm' });
  const url = URL.createObjectURL(blob);

  const downloadBtn = document.getElementById('downloadBtn');
  downloadBtn.style.display = 'inline-block';
  downloadBtn.textContent = 'ダウンロード';
  downloadBtn.onclick = () => {
    const a = document.createElement('a');
    a.href = url;
    a.download = 'compressed_video.webm';
    a.click();
  };

  progressBar.style.display = 'none';
}
