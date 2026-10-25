## 📌 주요 원리 ("API Read" 및 동작 흐름)

1. **내부 Webpack 청크 분석 (`webpackChunkdiscord_app`)**
   - 디스코드는 싱글 페이지 애플리케이션(SPA)으로, 모든 내부 비즈니스 로직과 API 클라이언트가 Webpack 번들 형태로 브라우저 메모리에 로드됩니다.
   - `window.webpackChunkdiscord_app.push(...)`를 활용해 이미 메모리에 올라와 있는 모듈 인스턴스에 접근하여 현재 사용자의 세션 토큰(`getToken()`)을 안전하게 읽어옵니다.

2. **퀘스트 목록 조회 (`GET /api/v9/quests/@me`)**
   - 현재 계정에 할당된 퀘스트(`quests`) 배열을 반환받습니다.
   - 각 퀘스트의 ID, 목표 시간(`stream_duration_requirement_minutes`), 현재 진행 시간(`stream_progress_seconds`), 완료 여부(`completed_at`)를 확인합니다.

3. **퀘스트 수락 (`POST /api/v9/quests/{quest_id}/enroll`)**
   - 사용자가 '수락' 버튼을 누르지 않은 상태인 경우 퀘스트를 등록(Enroll)합니다.

4. **진행도 주기적 전송 (`POST /api/v9/quests/{quest_id}/heartbeat`)**
   - 디스코드는 사용자가 실제로 스트리밍을 하거나 게임을 플레이할 때 약 20~30초마다 서버로 하트비트 패킷을 보냅니다.
   - 스크립트는 이를 에뮬레이션하여 30초 주기로 하트비트를 보내 진행도를 목표 시간(기본 900초 = 15분)까지 채웁니다.

> [!WARNING]
> 본 코드는 Discord API의 구조와 웹 애플리케이션의 번들 통신 방식을 학습하기 위한 **교육/연구 목적**으로 제공됩니다.
> - 자동화된 스크립트로 보상을 수령하는 행위는 **Discord 서비스 이용약관(ToS)** 위반에 해당할 수 있으며, 계정 정지(Suspension) 등의 불이익을 초래할 수 있습니다.
> - 실제 본 계정에서 악용하지 마시고, API 통신 패턴 분석 목적으로만 참고하시기 바랍니다.
