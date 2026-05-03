document.addEventListener('DOMContentLoaded', () => {
    // 날짜 설정
    const dateElement = document.getElementById('currentDate');
    const options = { weekday: 'long', month: 'short', day: 'numeric' };
    const today = new Date();
    dateElement.textContent = today.toLocaleDateString('en-US', options).toUpperCase();

    const voiceBtn = document.getElementById('voiceBtn');
    const voiceBtnIcon = voiceBtn.querySelector('.material-symbols-rounded');
    const voiceBtnLabel = voiceBtn.querySelector('.btn-label');
    const aiBtn = document.getElementById('aiBtn');
    const diaryInput = document.getElementById('diaryInput');
    const responseContent = document.getElementById('responseContent');
    const responseBox = document.getElementById('responseBox');

    // ── 음성 인식 (Web Speech API) ──────────────────────────────
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
        voiceBtn.title = '이 브라우저는 음성 인식을 지원하지 않습니다.';
        voiceBtn.style.opacity = '0.5';
        voiceBtn.style.cursor = 'not-allowed';
    } else {
        const recognition = new SpeechRecognition();
        recognition.lang = 'ko-KR';
        recognition.interimResults = true;   // 중간 결과도 표시
        recognition.continuous = false;

        let isListening = false;

        function setListeningState(listening) {
            isListening = listening;
            if (listening) {
                voiceBtnIcon.textContent = 'graphic_eq';
                voiceBtnLabel.textContent = '음성 인식 중....';
                voiceBtn.classList.add('listening');
            } else {
                voiceBtnIcon.textContent = 'mic';
                voiceBtnLabel.textContent = '음성 입력하기';
                voiceBtn.classList.remove('listening');
            }
        }

        voiceBtn.addEventListener('click', () => {
            if (isListening) {
                recognition.stop();
                return;
            }
            recognition.start();
        });

        recognition.onstart = () => {
            setListeningState(true);
        };

        // 중간 결과(interim) 실시간 표시
        let interimSpanId = '__interim__';
        recognition.onresult = (e) => {
            let finalText = '';
            let interimText = '';

            for (let i = e.resultIndex; i < e.results.length; i++) {
                const transcript = e.results[i][0].transcript;
                if (e.results[i].isFinal) {
                    finalText += transcript;
                } else {
                    interimText += transcript;
                }
            }

            // 최종 결과는 textarea에 누적
            if (finalText) {
                const current = diaryInput.value.replace(/\[인식중: .*?\]/g, '').trimEnd();
                diaryInput.value = current ? current + ' ' + finalText : finalText;
            }

            // 중간 결과는 임시 표시
            if (interimText) {
                const base = diaryInput.value.replace(/\[인식중: .*?\]/g, '').trimEnd();
                diaryInput.value = base + (base ? ' ' : '') + `[인식중: ${interimText}]`;
            }
        };

        recognition.onend = () => {
            // 중간 결과 태그 정리
            diaryInput.value = diaryInput.value.replace(/\[인식중: .*?\]/g, '').trim();
            setListeningState(false);
        };

        recognition.onerror = (e) => {
            console.error('음성 인식 오류:', e.error);
            setListeningState(false);
        };
    }

    // ── AI 상담사 버튼 (/api/ai 서버리스 호출) ─────────────────
    const aiIcon = aiBtn.querySelector('.material-symbols-rounded');

    async function askGemini(userText) {
        // API 키는 서버(Vercel)에서만 처리 — 클라이언트 코드에 키 없음
        const response = await fetch('/api/ai', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: userText })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || '알 수 없는 오류');
        }

        return data.reply;
    }

    aiBtn.addEventListener('click', async () => {
        const text = diaryInput.value.trim();

        if (!text) {
            responseContent.textContent = '먼저 오늘 하루에 대해 이야기해주세요.';
            return;
        }

        // 로딩 상태
        aiBtn.disabled = true;
        aiIcon.textContent = 'hourglass_empty';
        responseBox.style.opacity = '0.7';
        responseContent.textContent = 'AI 상담사가 이야기를 듣고 있어요...';

        // 점 애니메이션
        let dots = 0;
        const loadingInterval = setInterval(() => {
            dots = (dots + 1) % 4;
            responseContent.textContent = 'AI 상담사가 이야기를 듣고 있어요' + '.'.repeat(dots);
        }, 400);

        try {
            const reply = await askGemini(text);
            clearInterval(loadingInterval);
            responseBox.style.opacity = '1';
            responseContent.textContent = reply;
            // 답변창이 보이도록 부드럽게 스크롤
            responseBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        } catch (error) {
            clearInterval(loadingInterval);
            responseBox.style.opacity = '1';
            responseContent.textContent = `오류가 발생했어요: ${error.message}`;
            console.error('Gemini API 오류:', error);
        } finally {
            aiBtn.disabled = false;
            aiIcon.textContent = 'psychology';
        }
    });
});
