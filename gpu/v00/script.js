const input = document.getElementById('input-video');
const preview = document.getElementById('preview');
const status = document.getElementById('status');
let decodedFrames = [];
let videoFile;

input.addEventListener('change', (event) => {
  videoFile = event.target.files[0];
  console.log(`����t�@�C�����I������܂���: ${videoFile.name}`);
  status.textContent = `�X�e�[�^�X: ${videoFile.name} ��ǂݍ��ݒ�`;
});

document.getElementById('convert').addEventListener('click', async () => {
  if (!videoFile) {
    console.error("����t�@�C�����I������Ă��܂���B");
    alert("����t�@�C����I�����Ă��������B");
    return;
  }

  try {
    await convertToMP4(videoFile);
  } catch (error) {
    console.error("�ϊ����ɃG���[���������܂���:", error);
    status.textContent = "�G���[���������܂����B�ڍׂ̓R���\�[�����m�F���Ă��������B";
  }
});

async function convertToMP4(file) {
  console.log("MP4�ւ̕ϊ����J�n���܂�...");
  status.textContent = "MP4�ւ̕ϊ����J�n���܂�...";

  const videoBuffer = await file.arrayBuffer();
  const videoDecoder = new VideoDecoder({
    output: handleDecodedFrame,
    error: (e) => console.error("�f�R�[�h�G���[:", e),
  });

  try {
    videoDecoder.configure({ codec: 'vp8' });
    console.log("�f�R�[�_�[���\������܂���: codec = 'vp8'");
  } catch (error) {
    console.error("�R�[�f�b�N����Ή��ł�:", error);
    status.textContent = "�R�[�f�b�N����Ή��ł��B�ϊ��𒆎~���܂��B";
    return;
  }

  const init = { type: 'key', data: videoBuffer };
  videoDecoder.decode(init);

  console.log("����̃f�R�[�h���J�n���܂����B");
  status.textContent = "����̃f�R�[�h��...";

  const videoEncoder = new VideoEncoder({
    output: handleEncodedChunk,
    error: (e) => console.error("�G���R�[�h�G���[:", e),
  });

  videoEncoder.configure({
    codec: 'avc1.42E01E', // H.264
    width: 1280,
    height: 720,
    bitrate: 2_000_000,
    framerate: 30,
  });

  const chunks = [];

  async function handleDecodedFrame(frame) {
    console.log("�t���[�����f�R�[�h����܂���:", frame);
    decodedFrames.push(frame);
    videoEncoder.encode(frame);
    frame.close();
  }

  async function handleEncodedChunk(chunk) {
    console.log("�`�����N���G���R�[�h����܂���:", chunk);
    chunks.push(chunk);
  }

  videoEncoder.flush().then(async () => {
    console.log("�G���R�[�h���������܂����BMP4�t�@�C�����쐬��...");
    const mp4Blob = new Blob(chunks, { type: 'video/mp4' });
    const url = URL.createObjectURL(mp4Blob);
    preview.src = url;
    status.textContent = "�ϊ����������܂����B�v���r���[���Đ��\�ł��B";
    console.log("MP4�t�@�C���̍쐬���������܂����B");
  }).catch((error) => {
    console.error("�G���R�[�h�������ɃG���[���������܂���:", error);
    status.textContent = "�G���R�[�h���ɃG���[���������܂����B";
  });
}
