import { openaiTranscribeUrl } from "./api.js";

// 음성 입력(STT): 브라우저 녹음(MediaRecorder) → OpenAI Whisper로 전사.
// iOS Safari는 브라우저 음성인식(SpeechRecognition)을 지원하지 않아, 녹음 후
// 서버 전사 방식으로 처리한다. 키는 Worker에만 있다.

let recorder = null;
let chunks = [];
let mediaStream = null;

export function sttSupported() {
  return Boolean(navigator.mediaDevices?.getUserMedia && window.MediaRecorder);
}

export function isRecording() {
  return Boolean(recorder && recorder.state === "recording");
}

export async function startRecording() {
  mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
  chunks = [];
  recorder = new MediaRecorder(mediaStream);
  recorder.ondataavailable = (event) => {
    if (event.data.size) chunks.push(event.data);
  };
  recorder.start();
}

export function stopRecording() {
  return new Promise((resolve) => {
    if (!recorder) {
      resolve(null);
      return;
    }
    const active = recorder;
    active.onstop = () => {
      mediaStream?.getTracks().forEach((track) => track.stop());
      mediaStream = null;
      recorder = null;
      resolve(new Blob(chunks, { type: active.mimeType || "audio/webm" }));
    };
    active.stop();
  });
}

export async function transcribe(blob) {
  const type = blob.type || "audio/webm";
  // Whisper는 파일 확장자로 형식을 판단한다. 기기별 녹음 포맷에 맞춰 확장자 지정.
  const ext = /mp4|mpeg|m4a|aac/.test(type) ? "mp4" : /wav/.test(type) ? "wav" : "webm";
  const form = new FormData();
  form.append("file", blob, `speech.${ext}`);
  form.append("model", "whisper-1");
  form.append("language", "en");
  const response = await fetch(openaiTranscribeUrl(), { method: "POST", body: form });
  if (!response.ok) throw new Error("Whisper 전사 오류");
  const data = await response.json().catch(() => ({}));
  return (data.text || "").trim();
}
