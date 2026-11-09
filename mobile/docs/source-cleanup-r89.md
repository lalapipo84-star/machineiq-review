# 고객 모바일 r89 소스 정리

## 범위

- 모바일 HTML, 고객 Android 앱, 모바일 전용 포장·검사·등록부만 변경했다. WEB·딜러 원본은 읽기만 했으며 수정하지 않았다.
- 화면 ID·역할·디자인·하단 메뉴·집계 기준 유지. 실제 인증/PUSH/등록 서버와 iOS는 미구현 상태 그대로다. GitHub 게시 없음.
- 사용자 확정: 교체된 실행 코드는 같은 작업에서 제거한다. 요청한 백업만 분리하며 기본 배포에 넣지 않는다. AGENTS.md에 완료 조건을 추가했다.

## 변경 전/후

|대상 / 화면 ID|이전|r89|
|---|---|---|
|홈 LQ-DASH-001|customer → 그룹 교체 → 대시보드 교체, 변경 감시 2개|home-view.js의 순수 렌더러를 customer.js/home()에서 1회 호출. 정렬은 기존 클릭 처리기로 통합|
|이전 홈·그룹 별도안|현행 파일을 과거 캐시값으로 참조|archive/dashboard-20260919 고정 자산만 참조. 기본 배포 제외, 비교용 포장에만 --include-archives 명시|
|고객 CSS|구 홈 스타일과 같은 선택자·속성의 재정의|구 홈 전용 status-chart/health-kpis/performance-headline/performance-mini 제거. 현행 규칙의 최종 값·순서는 보존|
|공통 모바일 모델 / LQ-MGT-001-T01|WEB 추출본 불일치, 승인 시각 7월 고정|모바일 생성본을 현재 원본과 동기화. approvalReference getter로 실제 승인·반려 실행 시각 사용|
|리튬 상세 LQ-OPS-002 및 배터리|리튬 모델 별도 복사본도 로드|customer.js/lithiumStates에서 M.web.lithium 단일 모델 사용|
|미사용 소스|auth.js/css, signup-example.js, review.html, 구 홈 교체기/스타일, 리튬 복사본|현행 폴더에서 8개 제거. 복구용 변경 전 사본은 웹 루트 밖 artifacts에만 존재|
|공개 지도|동봉하지 않는 로컬 설정을 요청해 실패|모바일 포장 시 키 없는 외부 Google 지도 어댑터 사용. 로컬 지도 SDK 구현은 유지|
|모바일 포장|오래된 기본 revision·r46 다운로드 자동 포함|release.json 기준 r89, 구 ZIP·비교안·백업 기본 제외|
|온라인 APK|미사용 오프라인 location-ui.js도 포함|오프라인 전용 src/offline/assets로 분리. 온라인 APK에는 hosted-location-ui.js와 라이선스 2개만 포함|

## 수정 파일·함수

- html/customer/mobile-prototype: customer.js(home, lithiumStates, 클릭 정렬), home-view.js, customer.css, index.html, owner-dashboard-preview.html, 비교 HTML 2개, web-contracts.generated.js, release.json.
- scripts: build-customer-web-contracts.cjs, check-customer-mobile-source.cjs, package-customer-mobile.cjs, package-customer-mobile-html.cjs, mobile-delivery/location-map.js, preview-customer-location.cjs.
- Android: app/build.gradle의 자산 분기·버전·verifyDebugApkAssets; location-ui.js를 src/offline/assets로 이동. 기존 Java 권한·QR·알림 코드는 변경 없음.
- 기존 화면 ID와 FigJam 배치 유지. 이번 정리는 내부 구조 변경이며 FigJam 원격 수정 없음. 승인 처리 시각·배포 구분은 이후 요청 시 전달 문서와 함께 반영한다.

## 검증

- 생성 공통 로직 16개 원본 동기화, 현행 파일 문법/참조/중복 속성 검사.
- 고정 시각 대표·직원 38개 경로 비교: 최종 홈 동일, 승인 날짜 외 기존 화면 마크업 동일. 배터리 상태를 실제 브라우저와 동일한 모델로 주입해 검사.
- 26개 정상·빈 데이터·미수신 조건 × 19개 경로 × 2개 역할 = 988개 조합, 오류/잘못된 숫자 0. 실제 화면 수가 아닌 자동 조건 조합이다.
- 홈 집계 단위, 서비스 상세 링크, 역할 범위, 그룹 정렬, 날짜 조회, 새로고침, 인증, 소모품 처리, 배터리/충격, 차량별 효율 회귀검사.
- CSS에서 제거한 구 홈 전용 규칙을 제외한 최종 선택자/속성 값 동일. 좁은 폭에서 대표/직원 홈·효율·서비스·설정 전후 비교.
- Android JVM 9개 통과, assemble/lint 성공(오류 0, 기존 경고 12개). 실제 APK 자산 목록 검증. 실기기 설치·카메라·GPS·OS 권한 화면은 미검증.

## 재발 방지

`node scripts/check-customer-mobile-source.cjs`를 모바일 포장 전에 자동 실행한다. 구 파일 재유입, 잘못된 활성 참조, 홈 교체 감시기, 중복 CSS 속성, WEB 복사본 불일치, HTML QR 포함을 발견하면 포장을 중단한다.

Android assembleDebug는 verifyDebugApkAssets에 의존하며 완성된 APK의 실제 자산 목록을 확인한다. 온라인/오프라인 어댑터가 섞이면 빌드 실패다.

주 검증 진입점은 `node tests/customer-mobile-regression.cjs`(현행 20개 검사)이며 source-cleanup/owner-dashboard/home-efficiency/period-controls 등을 포함한다. 과거 r75~r87의 전체 소스 바이트 동일성 스냅샷은 해당 시점 변경 증거이며 단일 렌더러 정리 이후의 완료 기준으로 사용하지 않는다.

## 전달 상태

- 로컬 모바일에 적용. 별도 WEB 소스 변경 없음.
- 새 온라인 APK는 0.2.1-github / code 6. GitHub Pages를 읽으므로 이번 모바일 웹 변경은 게시 전까지 온라인 APK에 나타나지 않는다.
- HTML/HTML ZIP에는 QR·네이티브 동의 UI가 없다. APK QR는 원문 확인·복사·재촬영만 제공한다.
- 변경 전 사본: artifacts/customer-mobile-source-cleanup-20260921/before 및 retired. 복구 가능하며 실행·배포 대상이 아니다.

최종 검증: 현행 회귀검사 20개, 기본 폴더 전달 검사 7개, 단일 HTML 검사, 명시적 비교안 포장 자산 검사 모두 통과. 기본 폴더 192개 파일에는 archive·과거 ZIP·구 실행 파일 없음. 344px 브라우저에서 대표 홈 343개·직원 홈 199개·차량 효율 514개·서비스 391개·설정 79개 가시 요소의 텍스트/위치/크기/색상/폰트 전후 동일. 실제 차트 → 운영효율 이동과 그룹 정렬도 확인했다. 공개 GitHub 및 실기기 검증으로 확대 해석하지 않는다.
