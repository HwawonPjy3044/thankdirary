@echo off
chcp 65001 > nul
echo.
echo  ===================================
echo   AI 감정일기 - Vercel 로컬 서버
echo  ===================================
echo.
echo  [안내] vercel dev 로 실행합니다.
echo  API 서버리스 함수(/api/ai)도 함께 작동합니다.
echo.
echo  브라우저에서 아래 주소로 접속하세요:
echo  http://localhost:3000
echo.
echo  ※ vercel CLI가 없다면 먼저 설치하세요:
echo     npm install -g vercel
echo.
echo  서버를 종료하려면 Ctrl+C 를 누르세요.
echo.
cd /d "%~dp0"
vercel dev
pause
