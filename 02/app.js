const { createFFmpeg, fetchFile } = FFmpeg;
const ffmpeg = createFFmpeg({ log: true });
const logArea = document.getElementById('log-area');

async function loadFFmpeg() {
    logArea.textContent = 'ffmpeg-core�����[�h��...\n';
    await ffmpeg.load();
    document.getElementById('checkmark').style.display = 'inline';
    logArea.textContent += 'ffmpeg-core�̃��[�h���������܂����B\n';
    enableControls();
}

function enableControls() {
    document.getElementById('video-input').disabled = false;
    document.getElementById('target-size').disabled = false;
    document.getElementById('framerate').disabled = false;
    document.getElementById('resolution').disabled = false;
    document.getElementById('two-pass').disabled = false;
    document.getElementById('encode-btn').disabled = false;
}

document.getElementById('encode-btn').addEventListener('click', async () => {
    const fileInput = document.getElementById('video-input').files[0];
    if (!fileInput) {
        logArea.textContent += '�G���[: ����t�@�C����I�����Ă��������B\n';
        return;
    }

    const targetSizeMB = parseFloat(document.getElementById('target-size').value);
    if (!targetSizeMB || targetSizeMB <= 0) {
        logArea.textContent += '�G���[: �L���ȖڕW�t�@�C���T�C�Y����͂��Ă��������B\n';
        return;
    }

    const framerate = document.getElementById('framerate').value;
    const resolution = document.getElementById('resolution').value;
    const twoPass = document.getElementById('two-pass').checked;

    try {
        ffmpeg.FS('writeFile', 'input.mp4', await fetchFile(fileInput));
        const duration = await getVideoDuration('input.mp4');
        const targetBitrate = calculateBitrate(targetSizeMB, duration);

        logArea.textContent += `�ڕW�r�b�g���[�g: ${targetBitrate}kbps\n`;

        if (twoPass) {
            await runTwoPassEncode(targetBitrate, framerate, resolution);
        } else {
            await runSinglePassEncode(targetBitrate, framerate, resolution);
        }

        const outputData = ffmpeg.FS('readFile', 'output.mp4');
        const blob = new Blob([outputData.buffer], { type: 'video/mp4' });
        const url = URL.createObjectURL(blob);
        downloadFile(url, 'output.mp4');
        logArea.textContent += '�G���R�[�h���������܂����B\n';
    } catch (error) {
        logArea.textContent += `�G���[: ${error.message}\n`;
    }
});

async function getVideoDuration(file) {
    // ffmpeg�œ���̒������擾�i�������j
    await ffmpeg.run('-i', file);
    const logs = ffmpeg.logOutput || '';
    const match = logs.match(/Duration: (\d{2}):(\d{2}):(\d{2}\.\d+)/);
    if (match) {
        const hours = parseInt(match[1], 10);
        const minutes = parseInt(match[2], 10);
        const seconds = parseFloat(match[3]);
        return hours * 3600 + minutes * 60 + seconds;
    }
    throw new Error('����̒������擾�ł��܂���ł���');
}

function calculateBitrate(targetSizeMB, durationSeconds) {
    const targetSizeBits = targetSizeMB * 8 * 1024 * 1024; // MB���r�b�g�ɕϊ�
    return Math.floor(targetSizeBits / durationSeconds / 1000); // kbps�ɕϊ�
}

async function runSinglePassEncode(bitrate, framerate, resolution) {
    const [width, height] = resolution.split('x');
    await ffmpeg.run(
        '-i', 'input.mp4',
        '-vcodec', 'libx264',
        '-b:v', `${bitrate}k`,
        '-r', framerate,
        '-s', `${width}x${height}`,
        '-preset', 'fast',
        '-movflags', '+faststart',
        'output.mp4'
    );
}

async function runTwoPassEncode(bitrate, framerate, resolution) {
    const [width, height] = resolution.split('x');
    const nullDevice = navigator.platform.includes('Win') ? 'NUL' : '/dev/null';
    await ffmpeg.run(
        '-y', '-i', 'input.mp4',
        '-vcodec', 'libx264',
        '-b:v', `${bitrate}k`,
        '-r', framerate,
        '-s', `${width}x${height}`,
        '-pass', '1',
        '-f', 'null',
        nullDevice
    );
    await ffmpeg.run(
        '-y', '-i', 'input.mp4',
        '-vcodec', 'libx264',
        '-b:v', `${bitrate}k`,
        '-r', framerate,
        '-s', `${width}x${height}`,
        '-pass', '2',
        '-movflags', '+faststart',
        'output.mp4'
    );
}

function downloadFile(url, filename) {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
}

// �o�[�W�����\��
document.getElementById('version').textContent = Math.random().toString(36).substr(2, 8);

// ffmpeg�̃��[�h�J�n
loadFFmpeg();