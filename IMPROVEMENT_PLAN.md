# 코드베이스 점검 & 단계별 개선 계획 (2026-06-12)

대상: AI초딩영어 v1 (정적 PWA + Cloudflare Worker 프록시)
규모: app.js 1720줄, data.js 475줄, styles.css 1590줄, worker 115줄

전반적으로 기능은 잘 동작하고 구조도 깔끔한 편이다. 아래는 발견한 문제를
**심각도 순**으로 정리하고, 바로 실행 가능한 단계로 묶었다.

---

## 🔴 1단계 — 보안·안정성 (먼저 처리)

### 1-1. Worker에 호출량 제한이 없다 (비용/남용 위험)
- 현재 `ALLOWED_ORIGINS`(우리 사이트 Origin)만 검사한다. 브라우저는 막지만
  `curl`로 Origin 헤더를 위조하면 누구나 우리 키로 Gemini를 호출할 수 있다.
- 공개 사이트라 주소가 노출되므로, 악용 시 무료 한도 소진·유료 전환 시 과금.
- **개선**: ① Cloudflare 대시보드에서 **Rate Limiting**(분당 N회) 설정,
  ② Google AI Studio에서 키에 **일일 할당량 캡**, ③ Worker에 간단한
  per-IP 카운터(KV 또는 메모리)로 폭주 차단. 최소한 ①②는 즉시.

### 1-2. `innerHTML` + 데이터 직접 삽입 (XSS 표면)
- `renderPlan`, `renderRoadmap`, `renderVersionGate`, `renderToday`(대화 라인),
  `renderBossMission` 등이 `day.title`, `phrase`, `mission.en` 등을
  템플릿 문자열로 `innerHTML`에 넣는다. 현재 데이터는 코드 내 상수라 안전하다.
- **하지만** v2에서 "서버에서 커리큘럼 JSON 원격 로딩"이 로드맵에 있다.
  그때 외부 문자열이 그대로 `innerHTML`로 들어가면 XSS가 된다.
- **개선**: 지금 당장 위험은 아니지만, 원격 데이터 도입 **전에** `textContent`
  기반 렌더(이미 채팅·미션 일부는 그렇게 함)로 통일. 최소한 가이드라인으로 못박기.

### 1-3. PIN 보호의 한계가 코드에 드러남
- `hashPin`이 SHA-256으로 해시하지만 **salt가 없어** 4자리(1만 가지)는
  레인보우/브루트포스로 즉시 역산 가능. 또 `parentMode`가 `sessionStorage`라
  새 탭/콘솔로 우회 가능. 이건 "아이 억제용"이지 보안이 아님(주석에도 명시됨).
- **개선**: 현 용도(초등학생 억제)엔 충분. 단 README/주석에 "보안 아님" 명시
  유지하고, 진짜 보호가 필요해지면 서버 인증으로(중기). **지금은 변경 불필요**,
  인지만.

---

## 🟠 2단계 — 사용자가 실제로 겪을 버그

### 2-1. 음성 인식(`recognition`) 객체가 GC로 사라질 수 있음
- `startRecognition`/`startAiRecognition`에서 `new SpeechRecognition()`을
  지역 변수로 만들고 `start()` 후 함수가 끝난다. 일부 브라우저(특히 iOS Safari)
  에서 참조가 사라지면 `onresult` 전에 가비지 컬렉션돼 인식이 조용히 실패한다.
- **개선**: recognition을 모듈 스코프 변수에 보관(말하기 진행 중 1개만), 끝나면
  해제. iOS에서 마이크 기능 신뢰성 직결.

### 2-2. `aria-live="polite"` 영역을 매번 `innerHTML=""`로 비움
- `#chatLog`가 `aria-live`인데 `renderChat`이 매 메시지마다 전체를 다시 그린다.
  스크린리더가 전체를 다시 읽거나 혼란. 또 메시지 많아지면 성능 저하(전체 재렌더).
- **개선**: 새 메시지만 append하는 방식으로. `renderChat`은 최초 1회만 전체 그리고,
  `pushChat`은 마지막 버블만 추가. (현재 `pushChat`→`saveState`→`renderChat`
  전체 재렌더 구조라 메시지 16개마다 16개 DOM 재생성)

### 2-3. `버전 게이트` 버튼 핸들러 중복 바인딩 가능성
- `renderVersionGate`가 호출될 때마다 `#requestUpdateBtn`을 새로 만들고
  `addEventListener`를 단다. innerHTML로 새로 만드니 실제 누수는 없지만,
  `renderPlan`이 자주 불려 매번 DOM을 통째로 재생성하는 패턴이 곳곳에 있다.
- **개선**: 이벤트 위임(부모에 한 번)으로 전환하면 재렌더 비용·버그 표면 감소.

### 2-4. `completeBtn`이 보스 미션 날에도 그냥 완료됨
- 보스 미션(Day 7/14/21/28)은 "말하기로 3개 통과"가 목표인데, 통과 안 해도
  "오늘 완료"를 누르면 진도가 넘어간다. 보스의 의미가 약해짐.
- **개선**: 보스 날에는 `bossCleared`에 포함될 때만 완료 허용(또는 "그냥 넘어가기"
  를 별도 확인). 학습 흐름 일관성.

---

## 🟡 3단계 — 코드 구조·유지보수

### 3-1. app.js가 1720줄 단일 파일 (모듈화 미완)
- data/dom/profiles/progress만 분리됐고, 렌더·AI·TTS·음성인식·프로필게이트·
  보호자모드가 전부 app.js에 섞여 있다. 한 화면 고치려면 전체를 스크롤.
- **개선**: 기능 단위로 추가 분리 — `tts.js`(클라우드/로컬 음성),
  `speech.js`(인식·채점), `chat.js`(AI 대화·미션), `parent.js`(보호자·게이트),
  `render.js`(화면). state를 인자로 넘기거나 작은 store 모듈로.

### 3-2. 전역 가변 상태가 흩어져 있음
- `speakSession`, `currentAudio`, `cloudTtsBlockedUntil`, `geminiTtsModel`,
  `voiceRecorder`, `gateMode`, `resetAnswer` 등 모듈 전역 let이 많다.
  테스트·디버깅이 어렵고 프로필 전환 시 초기화 누락 위험.
- **개선**: TTS 관련은 하나의 객체로 묶고, 프로필 전환은 현재 `location.reload()`
  로 처리하니 큰 문제는 없지만, 분리 시 함께 정리.

### 3-3. 중복 로직
- `buildGeminiHistory`와 `buildPlainHistory`가 거의 같은 필터/슬라이스.
- `getBestVoice`의 preferredNames와 `listLearningVoices`의 정렬 정규식이
  같은 이름 목록을 두 번 하드코딩. → 상수 1개로.
- 보스/일반 분기(`day.boss ? ensureBossTargets() : dialogue.map(...)`)가
  `speakDialogue`/`speakNextSentence`/`dialogueTarget`에 반복.

### 3-4. OpenAI 경로가 사실상 죽은 코드
- `GEMINI_PROXY`가 설정되면 `effectiveProvider()`가 항상 "gemini"라
  `callOpenAI`/`fetchOpenAiTts`는 절대 호출되지 않는다. 모델명도 `gpt-5.4-mini`
  (존재 의심)로 남아 있다.
- **개선**: 프록시 전제로 간다면 OpenAI 분기 제거(코드 단순화), 또는 프록시를
  OpenAI도 지원하게 확장. 지금은 혼란만 줌.

---

## 🟢 4단계 — 콘텐츠·UX 다듬기

### 4-1. 미션 키워드 매칭이 단순
- `checkMissionProgress`가 keyword **단어 단위 포함**만 본다. "I think"는
  잡지만 변형("thinking", 문장부호 직결)은 놓치거나 오탐 가능. `_` 빈칸 미션은
  사실상 keyword만 맞으면 통과.
- **개선**: 어간/축약 일부 허용, 너무 짧은 keyword(예: "to") 제외.

### 4-2. 콘텐츠 반복 (로드맵 7번 항목, 여전히 유효)
- dialogues는 레벨당 7개로 늘었지만 28일/7 = 4주 반복이라 Week1과 Week3이
  같은 대화. 표현 카드도 레벨당 5개 고정.
- **개선**: 주차별 변형(같은 주제, 다른 문장) 또는 난이도 점증.

### 4-3. 접근성·다크모드
- `color-scheme: light` 고정. iOS 다크모드에서 흰 배경 강제 → 눈부심.
- 일부 아이콘 버튼에 `aria-label` 없음(이모지만). 스크린리더 사용 시 불명확.
- **개선**: 다크모드 변수 추가(중기), 아이콘 버튼에 `aria-label` 보강(단기).

### 4-4. 에러 메시지에 raw API 메시지 노출
- `sendAiMessage` catch가 `error.message`(영어 API 오류)를 아이에게 그대로
  보여준다("This model is currently experiencing high demand..."). 아이가 읽기엔
  부적절.
- **개선**: 사용자용 한국어 메시지로 치환, 원문은 console에만.

---

## 권장 실행 순서

1. **즉시(서버 설정만, 코드 0줄)**: 1-1 Rate Limiting + 키 일일 할당량 캡.
2. **단기 1차(반나절)**: 2-1 음성인식 GC, 2-4 보스 완료 조건, 4-4 에러 메시지,
   4-3 aria-label — 사용자가 바로 체감하는 버그.
3. **단기 2차**: 2-2 채팅 증분 렌더, 3-3/3-4 중복·죽은 코드 제거.
4. **중기**: 3-1 모듈 추가 분리, 4-1 미션 매칭 개선, 4-2 콘텐츠 확충.
5. **장기(v2)**: Convex 서버 도입 시 1-2(원격 데이터 XSS 방지) + 진짜 인증으로
   1-3 대체. VERSION_ROADMAP.md의 서버 설계와 합류.

> 핵심 한 줄: **지금 가장 급한 건 코드가 아니라 Cloudflare/Google 쪽
> "사용량 상한"이다.** 공개 프록시라 그게 없으면 비용 사고가 날 수 있다.
> 나머지는 천천히 다듬어도 된다.
