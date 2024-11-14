const { createFFmpeg, fetchFile } = FFmpeg;
const ffmpeg = createFFmpeg({
    corePath: './ffmpeg-core.wasm', // ローカルに配置したffmpeg-core.wasmを指定
    log: true,
});
const inputVideo = document.getElementById('inputVideo');
const compressButton = document.getElementById('compressButton');
const statusText = document.getElementById('status');
const outputVideo = document.getElementById('outputVideo');
const downloadLink = document.getElementById('downloadLink');

compressButton.addEventListener('click', async () => {
    if (!inputVideo.files[0]) {
        alert("動画ファイルを選択してください。");
        return;
    }

    try {
        // FFmpegの読み込み
        statusText.textContent = "FFmpegをロード中...";
        await ffmpeg.load();

        // ファイルの読み込み
        const file = inputVideo.files[0];
        const fileName = file.name;
        ffmpeg.FS('writeFile', fileName, await fetchFile(file));

        // 圧縮処理の実行
        statusText.textContent = "動画を圧縮中...";
        const outputFileName = 'output.mp4';
        await ffmpeg.run(
            '-i', fileName,
            '-b:v', '500k',         // ビデオのビットレートを500kbpsに設定
            '-maxrate', '500k',
            '-bufsize', '1000k',
            '-vf', 'scale=-2:720',  // 解像度を720pに変更
            '-preset', 'fast',
            outputFileName
        );

        // 圧縮されたファイルの取得
        const data = ffmpeg.FS('readFile', outputFileName);
        const blob = new Blob([data.buffer], { type: 'video/mp4' });

        // 出力動画の表示とダウンロードリンクの設定
        const url = URL.createObjectURL(blob);
        outputVideo.src = url;
        downloadLink.href = url;
        downloadLink.style.display = 'block';
        statusText.textContent = "圧縮完了！動画をダウンロードできます。";
    } catch (error) {
        console.error(error);
        statusText.textContent = "エラーが発生しました。";
    }
});