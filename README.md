# MACHINE IQ 프로토타입

- 웹 실행: https://giry02.github.io/machineiq/web/
- 웹 소스: `web/`
- 웹 최신 반영: 2026-09-27. 한국어 화면, 회원가입/차량 등록 흐름, 공통 오류 화면 및 최신 지표 표시를 반영했습니다. 언어 선택 메뉴는 표시하며, GitHub 게시본에서는 다른 언어를 선택해도 화면·이메일은 한국어로 유지됩니다. 로컬 다국어 전환 기능은 그대로 유지합니다.
- 회원가입: https://giry02.github.io/machineiq/web/registration/web-registration-tobe-v3.html?lang=ko
- 이메일 시안: https://giry02.github.io/machineiq/web/requirements-review/email-templates-20260926/index.html
- 이메일은 한국어의 회원가입 완료·비밀번호 찾기·회원 인증 검토용 HTML이며 실제 발송 기능은 없습니다. 가입 동의문도 기존 한국어 원문을 사용합니다.
- 최초 화면: 대시보드. 상단 권한 선택으로 내부 사용자·딜러·고객 화면을 확인합니다.
- 고객 모바일 실행: https://giry02.github.io/machineiq/mobile/login.html
- 고객 모바일 소스와 문서: `mobile/` — 2026-09-23 r97. 차량 상세 → 지도 보기에서 Google 지도와 차량번호 마커를 팝업 안에 표시합니다. 사용자 제공 브라우저 지도 키를 포함하며 사용 도메인/API 제한은 [지도 안내](mobile/docs/map-setup.md)를 참고하세요. 기존 r96 운영효율·차량별효율 배치, 대표/직원 권한, 오류 #992100/브랜드 #FF3600은 유지합니다. 기존 내장형 APK/ZIP은 이번 변경을 포함하지 않으며, GitHub 연결형 APK는 최신 화면 새로고침 후 게시된 화면을 표시합니다.
- [고객대표 메인](https://giry02.github.io/machineiq/mobile/index.html#home?role=customer_owner) · [고객직원 메인](https://giry02.github.io/machineiq/mobile/index.html#home?role=customer_staff)
- [운영효율](https://giry02.github.io/machineiq/mobile/index.html?v=20260923-r97#efficiency?efficiencyMode=daily&role=customer_owner&period=m) · [차량별효율](https://giry02.github.io/machineiq/mobile/index.html?v=20260923-r97#efficiency?efficiencyMode=vehicle&role=customer_owner&period=m)
- 이전 화면은 Git 이력에서 확인할 수 있습니다. 사용자 요청 백업은 로컬의 별도 보관 경로에 유지하며 현재 배포에는 포함하지 않습니다.
- [GitHub 연결형 APK v0.2.0 다운로드](mobile/downloads/Machine-IQ-Customer-GitHub-v0.2.0-20260921-debug.apk): GitHub Pages 최신 화면을 앱에서 바로 봅니다. 기존 위치·알림·QR 앱에 업데이트 설치할 수 있으며 이름/아이콘은 그대로입니다. 설정 → 최신 화면 새로고침. 인터넷 필요, QR·위치 동의·로컬 알림 테스트 유지. [설치·검증 안내](mobile/docs/android-github.md).
- [Android 테스트 APK v0.1.3](mobile/downloads/Machine-IQ-Customer-Location-Notifications-QR-v0.1.3-20260920-r87-debug.apk): 기존 앱 이름·딜러 아이콘·위치 동의·로컬 알림 유지. 설정 → QR 검색으로 원문 확인·복사·다시 스캔만 지원. 자동 입력·등록·실제 PUSH 서버·iOS는 미구현. 실제 카메라 검증은 설치 기기에서 필요합니다.
- QR 기능은 APK 전용입니다. 사용자 요청에 따라 현재 및 향후 HTML/ZIP에는 QR 메뉴·카메라 기능을 넣지 않습니다. 차량 시리얼번호·터미널 ID 입력 연결은 추후 별도 요청 대상입니다.
- 기존 고객 전달용 HTML ZIP: [2026-09-13 보관본](mobile/downloads/MACHINE_IQ_MOBILE_HTML_20260913_r46.zip). 최신 화면은 웹 링크를 사용하세요. 이번 게시에서 ZIP/iOS는 재생성하지 않았습니다.

정적 HTML/CSS/JavaScript 프로토타입이며 서버 로그인·실시간 수집 대신 시연 데이터를 사용합니다. 일부 설정은 브라우저에 저장됩니다. 고객 모바일 지도는 Maps JavaScript API로 표시하며, 인터넷 또는 키 인증 실패 시 안내와 외부 지도 링크를 제공합니다.

GitHub Pages 게시 기준: `main` 브랜치의 루트. `.nojekyll` 파일을 유지해야 `web/_shared`와 `web/_mock-data`를 읽을 수 있습니다.
