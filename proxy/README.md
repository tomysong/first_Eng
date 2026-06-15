# Gemini 키 프록시 배포 가이드 (Cloudflare Worker)

아이가 키 입력 없이 AI 대화·AI 목소리를 쓰게 하려면, 키를 앱이 아닌 **서버에만** 두어야 합니다.
이 폴더의 `cloudflare-worker.js` 가 그 서버입니다. 개발 지식 없이 **웹 대시보드에서 복붙**으로 배포됩니다. 무료입니다.

## 준비물

- Cloudflare 무료 계정 (https://dash.cloudflare.com 에서 가입)
- Gemini API 키 (https://aistudio.google.com/app/apikey 에서 무료 발급)

## 배포 단계

1. Cloudflare 대시보드 → 왼쪽 **Workers & Pages** → **Create application** → **Create Worker**.
2. 이름을 정하고(예: `kid-eng-proxy`) **Deploy** 를 누릅니다. (기본 코드가 일단 배포됩니다)
3. **Edit code** 를 눌러 편집기로 들어간 뒤, 기본 코드를 모두 지우고
   `cloudflare-worker.js` 내용을 통째로 붙여넣고 **Deploy** 합니다.
4. Worker 화면에서 **Settings → Variables and Secrets** 로 가서
   **Add** → 이름 `GEMINI_KEY`, 값에 본인 Gemini 키를 넣고 **Encrypt(Secret)** 로 저장합니다.
5. 같은 Worker 화면에서 **Settings → Bindings** 로 갑니다.
6. **Add binding** → **KV Namespace** 를 고르고 아래처럼 넣습니다.

   - Variable name: `RATE_LIMIT_KV`
   - Namespace name: `kid-eng-rate-limit` (이름은 비슷하게만 해도 됨)

   처음 만드는 경우에는 새 Namespace 생성으로 진행하면 됩니다.
7. 저장 후 다시 **Deploy** 합니다.
8. 화면 위쪽에 보이는 주소(예: `https://kid-eng-proxy.본인계정.workers.dev`)를 복사합니다.

## 앱에 연결

복사한 주소를 `app.js` 맨 위의 `GEMINI_PROXY` 값에 넣고 커밋·푸시하면 끝입니다.

```js
const GEMINI_PROXY = "https://kid-eng-proxy.본인계정.workers.dev";
```

- 비워 두면(`""`) 예전처럼 보호자 탭에서 키를 직접 입력하는 방식으로 동작합니다.
- 주소를 넣으면 아이는 아무 설정 없이 바로 AI 대화·목소리를 쓰고, 키는 절대 노출되지 않습니다.

## 안전장치

- Worker는 우리 앱 주소(`tomysong.github.io`)에서 온 요청만 받습니다(`ALLOWED_ORIGINS`). 다른 사이트는 거부됩니다.
- Gemini 의 `generateContent` 경로만 통과시키고 나머지는 막습니다.
- Worker 코드 안에 기본 제한이 들어 있습니다.
  - 같은 IP 기준 `60초 동안 20번` 요청 가능
  - 초과하면 `10분` 잠금
  - 본문 크기 `30KB` 초과 시 차단
- 이 KV 제한은 소규모 앱용 기본 보호막입니다. 더 엄격한 차단이 필요하면 Cloudflare WAF Rate Limiting 을 같이 켜는 편이 좋습니다.
- 제한이 잘 붙었는지 확인하려면 Worker 주소를 브라우저에서 열어 JSON 응답의 `rateLimitKVBound: true` 를 확인하세요.
- 그래도 키 보호를 더 강화하려면 Cloudflare WAF Rate Limiting 과 Google AI Studio 프로젝트 사용량 확인을 같이 켜두는 것을 권합니다.
- 도메인이 바뀌면 `ALLOWED_ORIGINS` 에 새 주소를 추가하세요.

## Cloudflare 화면에서 못 찾을 때

Cloudflare 화면이 자주 바뀌어서 메뉴 이름이 조금 다를 수 있습니다. 그래도 순서는 거의 이렇습니다.

1. `Workers & Pages`
2. 내 Worker 클릭
3. 위쪽 탭이나 왼쪽 메뉴에서 `Settings`
4. 그 안에서 `Variables and Secrets`
5. 다시 `Settings` 안의 `Bindings`

`Bindings` 가 안 보이면 Worker 상세 화면 안으로 한 번 더 들어가야 보이는 경우가 있습니다.
