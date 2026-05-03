// Vercel 서버리스 함수 - Gemini API 호출
// API 키는 Vercel 환경변수(GEMINI_API_KEY)에서만 읽습니다.
// 클라이언트(브라우저)에는 절대 노출되지 않습니다.

export default async function handler(req, res) {
    // CORS 헤더 설정
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Preflight 요청 처리
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'POST 요청만 허용됩니다.' });
    }

    const { text } = req.body;

    if (!text || !text.trim()) {
        return res.status(400).json({ error: '일기 내용이 없습니다.' });
    }

    // ✅ API 키는 Vercel 환경변수에서만 읽음 (클라이언트에 노출 안 됨)
    const API_KEY = process.env.GEMINI_API_KEY;

    if (!API_KEY) {
        return res.status(500).json({ error: 'API 키가 서버에 설정되지 않았습니다.' });
    }

    const systemPrompt = `너는 고등학생 전문 심리 상담가야.

사용자의 일기를 읽고 반드시 아래 형식으로만 답변해:

감정: [감정을 나타내는 한 단어 (예: 불안, 기쁨, 행복, 슬픔, 외로움, 설렘, 분노, 지침 등)]

[사용자의 감정에 충분히 공감하고 따뜻하게 위로하는 메시지를 2~3문장으로 작성. 존댓말 사용. 이모지 1개 포함.]`;

    try {
        const geminiRes = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{
                        role: 'user',
                        parts: [{ text: `${systemPrompt}\n\n학생의 오늘 하루 이야기:\n${text}` }]
                    }]
                })
            }
        );

        if (!geminiRes.ok) {
            const errData = await geminiRes.json();
            throw new Error(errData.error?.message || `API 오류 (${geminiRes.status})`);
        }

        const data = await geminiRes.json();
        const reply = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!reply) {
            throw new Error('AI 응답을 파싱할 수 없습니다.');
        }

        return res.status(200).json({ reply });

    } catch (error) {
        console.error('Gemini API 오류:', error.message);
        return res.status(500).json({ error: error.message });
    }
}
