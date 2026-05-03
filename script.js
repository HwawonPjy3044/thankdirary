document.addEventListener('DOMContentLoaded', () => {
    // === Supabase 설정 (사용자 정보로 변경 필요) ===
    const SUPABASE_URL = 'https://jszfwqenwkzoufaslfle.supabase.co'; 
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpzemZ3cWVud2t6b3VmYXNsZmxlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc3NzAxMDUsImV4cCI6MjA5MzM0NjEwNX0.A5uchwusRS8tKKxYClgbya31HQXJqEK35adwqxVCljQ';
    
    let supabase;
    if (typeof window.supabase !== 'undefined') {
        supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    }

    // 날짜 설정
    const dateElement = document.getElementById('currentDate');
    const options = { weekday: 'long', month: 'short', day: 'numeric' };
    const today = new Date();
    dateElement.textContent = today.toLocaleDateString('en-US', options).toUpperCase();

    // ── Supabase 인증 (로그인/회원가입) ────────────────────────
    const loginScreen = document.getElementById('loginScreen');
    const authForm = document.getElementById('authForm');
    const emailInput = document.getElementById('emailInput');
    const passwordInput = document.getElementById('passwordInput');
    const authSubmitBtn = document.getElementById('authSubmitBtn');
    const authToggleBtn = document.getElementById('authToggleBtn');
    const authToggleText = document.getElementById('authToggleText');
    const authErrorMessage = document.getElementById('authErrorMessage');
    const logoutBtn = document.getElementById('logoutBtn');
    const googleLoginBtn = document.getElementById('googleLoginBtn');

    let isSignUpMode = false;

    // 구글 로그인
    if (googleLoginBtn && supabase) {
        googleLoginBtn.addEventListener('click', async () => {
            try {
                const { error } = await supabase.auth.signInWithOAuth({
                    provider: 'google',
                    options: {
                        queryParams: {
                            access_type: 'offline',
                            prompt: 'consent',
                        },
                        // 현재 페이지로 리다이렉트
                        redirectTo: window.location.origin
                    }
                });
                if (error) throw error;
            } catch (error) {
                authErrorMessage.textContent = '구글 로그인 중 오류가 발생했습니다: ' + error.message;
                authErrorMessage.style.display = 'block';
            }
        });
    }

    // 로그인 <-> 회원가입 모드 전환
    authToggleBtn.addEventListener('click', () => {
        isSignUpMode = !isSignUpMode;
        if (isSignUpMode) {
            authSubmitBtn.textContent = '이메일로 회원가입';
            authToggleText.textContent = '이미 계정이 있으신가요?';
            authToggleBtn.textContent = '로그인';
        } else {
            authSubmitBtn.textContent = '이메일로 로그인';
            authToggleText.textContent = '계정이 없으신가요?';
            authToggleBtn.textContent = '회원가입';
        }
        authErrorMessage.style.display = 'none';
    });

    // 로그인/회원가입 폼 제출
    if (authForm && supabase) {
        authForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = emailInput.value;
            const password = passwordInput.value;
            authErrorMessage.style.display = 'none';
            authSubmitBtn.disabled = true;

            try {
                if (isSignUpMode) {
                    // 회원가입
                    const { data, error } = await supabase.auth.signUp({ email, password });
                    if (error) throw error;
                    
                    if (data.user && data.user.identities && data.user.identities.length === 0) {
                        throw new Error('이미 가입된 이메일입니다.');
                    }
                    
                    alert('회원가입이 완료되었습니다!');
                    // 이메일 인증이 필요 없게 설정된 경우 바로 로그인됨
                    if (data.session) {
                        loginScreen.classList.add('hidden');
                        logoutBtn.style.display = 'block';
                    } else {
                        // 세션이 없으면 로그인 모드로 전환 권유
                        isSignUpMode = false;
                        authSubmitBtn.textContent = '이메일로 로그인';
                        authToggleText.textContent = '계정이 없으신가요?';
                        authToggleBtn.textContent = '회원가입';
                        alert('가입한 계정으로 로그인을 진행해주세요. (이메일 인증이 필요할 수도 있습니다.)');
                    }
                } else {
                    // 로그인
                    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
                    if (error) throw error;
                    
                    loginScreen.classList.add('hidden');
                    logoutBtn.style.display = 'block';
                }
            } catch (error) {
                // Supabase 에러 메시지 한글화 (간단한 예)
                let msg = error.message;
                if (msg.includes('Invalid login credentials')) msg = '이메일 또는 비밀번호가 올바르지 않습니다.';
                if (msg.includes('Password should be at least 6 characters')) msg = '비밀번호는 최소 6자 이상이어야 합니다.';
                authErrorMessage.textContent = msg;
                authErrorMessage.style.display = 'block';
            } finally {
                authSubmitBtn.disabled = false;
            }
        });
    }

    // 로그아웃 처리
    if (logoutBtn && supabase) {
        logoutBtn.addEventListener('click', async () => {
            await supabase.auth.signOut();
            loginScreen.classList.remove('hidden');
            logoutBtn.style.display = 'none';
            emailInput.value = '';
            passwordInput.value = '';
        });
    }

    // 초기 세션 확인 (자동 로그인)
    if (supabase) {
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) {
                loginScreen.classList.add('hidden');
                logoutBtn.style.display = 'block';
            }
        });

        // 인증 상태 변경 리스너
        supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
                loginScreen.classList.add('hidden');
                logoutBtn.style.display = 'block';
            } else if (event === 'SIGNED_OUT') {
                loginScreen.classList.remove('hidden');
                logoutBtn.style.display = 'none';
            }
        });
    }

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
                voiceBtnLabel.textContent = '음성 입력';
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
            
            // Supabase에 저장
            await saveDiaryToSupabase(text, reply);
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

    // ── Supabase 데이터 저장 및 불러오기 ────────────────────────
    async function saveDiaryToSupabase(content, aiResponse) {
        if (!supabase || SUPABASE_URL === 'YOUR_SUPABASE_URL') {
            console.warn('Supabase가 설정되지 않아 일기가 저장되지 않았습니다.');
            return;
        }
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                console.warn('로그인된 사용자가 없습니다.');
                return;
            }

            const { error } = await supabase
                .from('diaries')
                .insert([{ 
                    content: content, 
                    ai_response: aiResponse,
                    user_id: session.user.id
                }]);
            
            if (error) throw error;
            console.log('일기가 성공적으로 저장되었습니다.');
        } catch (error) {
            console.error('일기 저장 실패:', error.message);
        }
    }

    async function loadDiaries() {
        const timelineList = document.getElementById('timelineList');
        const timelineLoading = document.getElementById('timelineLoading');
        
        // 기존 리스트 초기화 후 로딩 표시
        const items = timelineList.querySelectorAll('.timeline-item, .empty-msg, .error-msg');
        items.forEach(item => item.remove());
        timelineLoading.style.display = 'flex';

        if (!supabase || SUPABASE_URL === 'YOUR_SUPABASE_URL') {
            timelineLoading.style.display = 'none';
            const msg = document.createElement('p');
            msg.className = 'error-msg';
            msg.textContent = 'Supabase 설정이 필요합니다. script.js에 URL과 Key를 입력해주세요.';
            timelineList.appendChild(msg);
            return;
        }

        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                timelineLoading.style.display = 'none';
                timelineList.insertAdjacentHTML('beforeend', '<p class="error-msg">로그인이 필요합니다.</p>');
                return;
            }

            // 최신순으로 가져오기 (RLS가 설정되어 있으면 자동으로 자신의 데이터만 가져옴)
            const { data, error } = await supabase
                .from('diaries')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;

            timelineLoading.style.display = 'none';
            
            if (!data || data.length === 0) {
                timelineList.insertAdjacentHTML('beforeend', '<p class="empty-msg">아직 기록된 일기가 없습니다.</p>');
                return;
            }

            data.forEach(item => {
                const dateObj = new Date(item.created_at);
                const dateStr = dateObj.toLocaleDateString('ko-KR', { year: 'numeric', month: 'short', day: 'numeric', weekday: 'short' });
                const timeStr = dateObj.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
                
                const itemDiv = document.createElement('div');
                itemDiv.className = 'timeline-item';
                itemDiv.innerHTML = `
                    <div class="timeline-dot"></div>
                    <div class="timeline-date">${dateStr} ${timeStr}</div>
                    <div class="timeline-box">
                        <div class="timeline-content-text">${item.content.replace(/\n/g, '<br>')}</div>
                        <div class="timeline-ai-response">
                            <span class="material-symbols-rounded">auto_awesome</span>
                            <p>${item.ai_response.replace(/\n/g, '<br>')}</p>
                        </div>
                    </div>
                `;
                timelineList.appendChild(itemDiv);
            });
        } catch (error) {
            timelineLoading.style.display = 'none';
            timelineList.insertAdjacentHTML('beforeend', `<p class="error-msg">기록을 불러오는데 실패했습니다: ${error.message}</p>`);
        }
    }

    // ── 타임라인 모달 이벤트 ──────────────────────────────────────
    const historyBtn = document.getElementById('historyBtn');
    const timelineModal = document.getElementById('timelineModal');
    const closeModal = document.getElementById('closeModal');

    historyBtn.addEventListener('click', () => {
        timelineModal.classList.add('show');
        loadDiaries();
    });

    closeModal.addEventListener('click', () => {
        timelineModal.classList.remove('show');
    });

    timelineModal.addEventListener('click', (e) => {
        if (e.target === timelineModal) {
            timelineModal.classList.remove('show');
        }
    });
});
