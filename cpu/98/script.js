async function compressVideo(file) {
    const progressBar = document.getElementById('progressBar');
    progressBar.style.display = 'block';
    progressBar.style.width = '100%'; // レイアウトを固定するための設定
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
  