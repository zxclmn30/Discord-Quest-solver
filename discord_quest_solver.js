
(async function solveDiscordQuests() {
    console.log("%c[Quest Solver] 스크립트 시작...", "color: #5865F2; font-weight: bold; font-size: 14px;");

    let wpRequire;
    try {
        window.webpackChunkdiscord_app.push([
            [Symbol()],
            {},
            (x) => { wpRequire = x; }
        ]);
    } catch (e) {
        console.error("Webpack 청크를 찾을 수 없습니다. 디스코드 웹 클라이언트인지 확인하세요.");
        return;
    }

    const modules = Object.values(wpRequire.c);
    
    let token = null;

    for (const m of modules) {
        if (!m?.exports) continue;
        

        if (typeof m.exports.default?.getToken === "function") {
            token = m.exports.default.getToken();
            break;
        } else if (typeof m.exports.getToken === "function") {
            token = m.exports.getToken();
            break;
        }
    }

    if (!token) {
        console.error("[Quest Solver] 인증 토큰을 찾을 수 없습니다. (로그인 상태를 확인하세요)");
        return;
    }

    console.log("%c[Quest Solver] 인증 모듈 확인 완료! 퀘스트 목록을 조회합니다...", "color: #57F287;");

    async function apiRequest(endpoint, method = "GET", body = null) {
        const res = await fetch(`https://discord.com/api/v9${endpoint}`, {
            method: method,
            headers: {
                "Authorization": token,
                "Content-Type": "application/json",
            },
            body: body ? JSON.stringify(body) : null
        });
        if (!res.ok) {
            const errText = await res.text();
            throw new Error(`API 오류 (${res.status}): ${errText}`);
        }
        return await res.json();
    }

    try {
        const questsData = await apiRequest("/quests/@me");
        const activeQuests = questsData.quests || [];

        if (activeQuests.length === 0) {
            console.log("%c[Quest Solver] 현재 진행 가능한 퀘스트가 없습니다.", "color: #FEE75C;");
            return;
        }

        console.log(`[Quest Solver] 총 ${activeQuests.length}개의 퀘스트를 발견했습니다.`);

        for (const quest of activeQuests) {
            const questName = quest.config?.messages?.quest_name || quest.id;
            const targetSeconds = quest.config?.stream_duration_requirement_minutes 
                ? quest.config.stream_duration_requirement_minutes * 60 
                : 900; // 기본 15분 (900초)

            const userStatus = quest.user_status;
            const completed = userStatus?.completed_at !== null;
            const currentSeconds = userStatus?.stream_progress_seconds || 0;

            console.log(`\n========================================`);
            console.log(`퀘스트: ${questName} (ID: ${quest.id})`);
            console.log(`진행도: ${currentSeconds}초 / ${targetSeconds}초 (완료 여부: ${completed})`);

            if (completed) {
                console.log("이미 완료된 퀘스트입니다. 건너뜁니다.");
                continue;
            }

            if (!userStatus?.enrolled_at) {
                console.log("[Quest Solver] 퀘스트 수락(Enroll) 시도...");
                try {
                    await apiRequest(`/quests/${quest.id}/enroll`, "POST");
                    console.log("[Quest Solver] 퀘스트 수락 완료!");
                } catch (err) {
                    console.warn("[Quest Solver] 퀘스트 수락 실패(이미 등록됨 등):", err.message);
                }
            }

            console.log(`[Quest Solver] 하트비트 전송을 시작합니다... (약 30초 주기 전송)`);
            let progress = currentSeconds;

            while (progress < targetSeconds) {
                try {
                    const heartbeatRes = await apiRequest(`/quests/${quest.id}/heartbeat`, "POST", {
                        stream_key: `call:fake-stream-${quest.id}`
                    });

                    progress = heartbeatRes.stream_progress_seconds || (progress + 30);
                    console.log(`[Quest Solver] 진행도 갱신: ${progress}초 / ${targetSeconds}초`);

                    if (heartbeatRes.completed_at) {
                        console.log("%c[Quest Solver] 퀘스트 완료!", "color: #57F287; font-weight: bold;");
                        break;
                    }
                } catch (e) {
                    console.error("[Quest Solver] Heartbeat 전송 오류:", e.message);
                    console.log("30초 후 재시도합니다...");
                }

                await new Promise(r => setTimeout(r, 30000));
            }
        }

        console.log("\n%c[Quest Solver] 모든 대상 퀘스트 작업이 끝났습니다!", "color: #57F287; font-weight: bold;");
    } catch (err) {
        console.error("[Quest Solver] 실행 중 오류 발생:", err);
    }
})();
