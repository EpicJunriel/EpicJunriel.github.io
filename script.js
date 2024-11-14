// ffmpeg.wasm �̃��[�h
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
  status.textContent = 'ffmpeg.wasm �ǂݍ��݊���';
}

async function compressVideo(file) {
  status.textContent = '���k��...���҂���������';

  // ���̓t�@�C���� ffmpeg �Ƀ��[�h
  const inputFileName = 'input.mp4';
  const outputFileName = 'output.mp4';
  const inputBuffer = await file.arrayBuffer();

  ffmpeg.FS('writeFile', inputFileName, new Uint8Array(inputBuffer));

  // ffmpeg �R�}���h�œ�������k
  await ffmpeg.run(
    '-i', inputFileName,
    '-b:v', '500k', // �r�b�g���[�g�w��
    '-preset', 'fast',
    '-movflags', 'faststart',
    outputFileName
  );

  // ���k���ꂽ�t�@�C�����擾
  const outputBuffer = ffmpeg.FS('readFile', outputFileName);
  const outputBlob = new Blob([outputBuffer], { type: 'video/mp4' });

  // �t�@�C���T�C�Y�� 10MB �ȉ��ɂȂ邩�m�F
  if (outputBlob.size <= 10 * 1024 * 1024) {
    status.textContent = '���k�����I';
    const outputUrl = URL.createObjectURL(outputBlob);
    outputVideo.src = outputUrl;
    downloadLink.href = outputUrl;
    downloadLink.textContent = '���k������_�E�����[�h';
    downloadLink.style.display = 'block';
  } else {
    status.textContent = '�t�@�C���T�C�Y�� 10MB �𒴂��Ă��܂��B�r�b�g���[�g�𒲐����Ă��������B';
  }
}

compressButton.addEventListener('click', () => {
  const file = videoInput.files[0];
  if (file) {
    compressVideo(file);
  } else {
    alert('����t�@�C����I�����Ă��������B');
  }
});

// �y�[�W�ǂݍ��ݎ��� ffmpeg.wasm �����[�h
window.onload = loadFFmpeg;
