# 고객 모바일 언어 선택 제거 및 추이→운영효율 (2026-09-21, r88)

## 요청과 변경 범위

- 사용자 확인: ‘다국어 제거’는 한국어/English 언어 선택 UI 제거다.
- 기존 화면 ID 유지: 회원가입 LQ-AUTH-002, 로그인 LQ-AUTH-003, 비밀번호 찾기 LQ-AUTH-004, 홈 LQ-DASH-001, 운영효율 LQ-REF-003.
- 고객 대표·직원 공통. 딜러/WEB 언어 선택 및 공용 스타일은 변경하지 않았다.
- 변경 전 12개 파일: `artifacts/customer-mobile-home-efficiency-before-20260921/` 보관.

## 수정 파일·함수 및 전후

|파일·함수|변경 전|변경 후|
|---|---|---|
|signup-header.js / 헤더 생성|로고 + 언어 선택 6개 옵션|로고 유지, 언어 선택 제거|
|login.js, signup.js, find-password.js / change 리스너|언어 선택 요소를 조회해 이벤트 등록|삭제된 요소에 대한 이벤트 제거. 인증 기능은 유지|
|login.html, signup.html, find-password.html|언어 ID 및 기존 캐시 버전|사용하지 않는 언어 ID 제거, 스크립트 r88|
|owner-dashboard-preview.js / render|7개 날짜 버튼 → 선택 날짜 업무 리포트|추이 카드 단일 버튼 → 이번 달 운영효율. 7개 막대는 동일 수치/스타일의 접근 가능한 비대화형 차트|
|owner-dashboard-preview.css / od-trend|날짜별 클릭 영역|기존 카드 크기를 바꾸지 않는 투명 전체 클릭 영역. 도움말/도움말 패널은 별도 클릭 유지|
|customer.js / 공통 click → go|추이에서 날짜별 업무 리포트|data-home-efficiency: 이번 달 1일~오늘, 월 조회, 상단 메뉴 방식, 일별 운영효율. 현재 권한 유지, 이전 그룹/차량/검색/리포트 필터 해제|
|index.html, owner-dashboard-preview.html|dashboard JS v7/CSS v6, customer r87|dashboard JS/CSS v8, customer r88|

차트의 ‘날짜를 누르면 해당 일자의 리포트가 열립니다.’는 ‘영역을 누르면 이번 달 운영효율이 열립니다.’로 교체했다. 어제까지 7일의 표시 수치·일평균·범례·집계 도움말은 변경하지 않았다. 카드 외부의 날짜별 리포트 버튼은 기존 동작을 유지한다.

직원 실제 이동 확인:
`#efficiency?efficiencyLayout=menu&efficiencyMode=daily&role=customer_staff&notificationCategory=all&status=all&service=maintenance&servicePeriod=m&serviceFrom=2026-09-01&serviceTo=2026-09-30&reportFocus=all&returnView=detail&period=m&from=2026-09-01&to=2026-09-21`

## 검증

- 신규 `tests/customer-mobile-home-efficiency.cjs`: 12개 파일 정확한 수정 범위, 두 역할/빈 데이터 등 12개 차트 출력 비교, 월/연 경계·이전 검색 조건 포함 8개 이동 통과.
- `customer-mobile-auth.cjs`: 언어 요소 없이 로그인·가입·찾기 초기화와 기존 로컬 인증 동작 통과. 과거 딜러 CSS 비교에 빠져 있던 기존 r62 고객 팔레트 기대값만 보정.
- `customer-mobile-staff-home.cjs` 24개, `customer-mobile-owner-dashboard.cjs`, `customer-mobile-missing-data-fix.cjs` 988개 렌더 회귀 통과.
- 344×884 동일 화면 비교: 홈의 다른 영역 DOM 동일, 추이 카드/막대/텍스트의 위치·크기·폰트·색상 동일.
- 인증 3개 화면은 동일 화면 크기에서 로고/제목/폼 좌표 동일, 언어 선택 0개. 브라우저 오류 없음.
- 실제 직원 카드 클릭으로 사용자 제공 주소와 동일한 운영효율 이동 확인. 대표는 Enter 키 실행으로 역할 유지 확인. 도움말 열기·닫기는 이동하지 않고 동작.

## 반영 상태

로컬 고객 모바일 HTML만 적용했다. GitHub 배포, APK/ZIP 재생성, iOS 및 실제 서버 연동은 이번 요청에서 수행하지 않았다. QR는 기존 APK 테스트 전용 정책 유지. Figma/FigJam은 원격 변경 없이 로컬 등록부와 반영 대기 기록만 갱신했다.

후속 요청 ‘깃에 올려줘’에 따라 2026-09-21 `fa4297a`로 GitHub/Pages 게시를 완료했다. APK/ZIP은 재생성하지 않았다. [게시·검증](CUSTOMER_MOBILE_R88_GITHUB_20260921.md).
