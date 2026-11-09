# 고객 모바일 수리이력 — 목록 유지·WEB 상세 항목 통일 r86

## r86 최종 정정 — 아래 r85 기록보다 우선

사용자: ‘이거는 유지하고 안에 상세 내용을 바꾸란거야’와 함께 원래 간단한 목록 카드 이미지를 제시했다. r85에서 목록까지 펼쳐 표시한 부분은 취소한다.

- `customer.js`의 `maintenanceRow()`를 원본 서비스 행 마크업으로 복원: 아이콘·고장부위·짧은 날짜/시간·처리상태·화살표. 차량 카드/기종·그룹 머리글도 원본 그대로다.
- ‘수리이력’ 명칭은 유지. 항목을 눌러 들어가는 `serviceEntry` 상세 화면의 7개 WEB 고객용 필드 및 상세 조치내용 미표시만 유지한다.
- `customer.css`에서 r85 확장 행 스타일 전부 제거. 스타일 파일은 r85 작업 전 보관본과 완전히 동일하다. 활성 HTML JS/CSS 캐시는 `20260920-r86`.
- 자동 검증: 대표/직원 서비스 목록의 모든 차량 카드 HTML을 r85 이전 목록과 비교해 완전 일치. 전체 CSS도 보관본과 완전 일치. repair-history, service-scope, owner-dashboard, efficiency-label-weight 및 JS 문법 검사 통과.
- 브라우저: 원래 검증과 같은 390×844에서 카드/행 복원 확인. ‘리튬 배터리 팩 09.20 12:00 진행중’ 클릭 후 수리이력 상세의 그룹·기종·호기·수리일시·고장부위·현상·완료여부 확인. 가로 넘침 없음.
- 화면 ID/권한/집계/복귀 유지. 로컬만 수정했으며 GitHub·앱 빌드·WEB·서버·원격 Figma는 미변경.

## 아래 내용은 r85 이력 — 목록 확장 설명은 r86에서 취소

## 요청·기준

2026-09-20: 모바일 서비스의 ‘정비’를 ‘수리이력’으로 바꾸고, 현재 제작 중인 WEB 고객대표·고객직원의 수리이력 항목과 동일하게 표시한다. 다른 서비스 탭이나 WEB 자체를 재설계하지 않는다.

- 화면 ID: `LQ-SVC-001` 서비스 목록, `LQ-SVC-002` 수리이력, 관련 `LQ-OPS-002` 차량 상세 바로가기. 메뉴 `srvc/maintenance`와 기존 `maintenance` URL 키 유지.
- 참조: `html/final-implementation/fleet-customer-requested-260813/Service/service-maintenance-tobe.html`, `_shared/service-enhancements.js`의 `applyServiceRole()`, `_shared/common-logic.js`의 `roles.hideMaintenanceDetails`.
- 실제 로컬 WEB 화면을 두 역할로 열어 확인: 고객대표 13대, 직원 물류1팀 3대. 표시 열은 두 역할 모두 아래 7개. 업체 열과 상세내용 열은 고객 역할에서 숨겨짐.

|WEB 항목|모바일 표시·데이터|
|---|---|
|그룹|차량 카드 머리글 및 선택 이력: `v.group`|
|기종|차량 카드 머리글 및 선택 이력: `v.model`|
|호기|기존 클릭 가능한 차량번호 및 선택 이력: `v.equipmentNumber`|
|수리일시|`r.occurredAt` 전체 날짜·시간|
|고장부위|`r.part`, 없으면 `-`|
|현상|`r.symptom`, 없으면 `-`|
|완료여부|`r.resolved` → 완료/진행중|

## 변경 전후·파일

- `html/customer/mobile-prototype/customer.js`
  - `services()`: 정비 탭을 수리이력으로 변경. 기존 차량별 카드 안에서 일시·부위·현상·완료여부를 표시한다. 기간·건수·아이콘·차량 선택·상세 이동은 유지.
  - 신규 `maintenanceFields()`/`maintenanceRow()`: WEB 고객용 필드만 렌더링. ‘현상’ 누락 시 딜러용 상세내용으로 대체하지 않는다.
  - 차량별 이력 및 `serviceEntry` 선택 이력: 기존 항목/발생·정비 일시/증상/조치 내용 대신 위 7개 필드 사용. 상세내용/조치 내용은 DOM에도 출력하지 않는다.
  - `labels`, 차량 바로가기, 최근 수리, 서비스 도움말을 같은 명칭으로 정리. 최근 수리의 완료여부도 실제 해당 이력의 완료/진행중 값을 표시한다.
- `customer.css`: 수리이력 행 내부에만 기존 14px·색상 토큰을 사용하는 항목/값 배치 추가. 기존 완료여부 굵기와 완료 항목 아이콘의 중립색 유지. 외곽 카드·헤더·기간 컨트롤·다른 탭·메뉴는 그대로다.
- `index.html`, `owner-dashboard-preview.html`: JS/CSS 캐시 `20260920-r85`.
- 변경 전 파일 보관: `artifacts/customer-mobile-repair-20260920/`. 기존 대시보드 백업과 WEB 원본은 수정하지 않았다.
- 모델·공용 원장·집계는 미변경. WEB 예시는 전일 13건/3건, 모바일은 기존 전일+당일 이력으로 같은 월에서 26건/6건일 수 있다. 이번 작업은 표시 항목 통일이며 샘플 이력 건수를 억지로 맞추지 않는다.

## 검증

- 390×844 동일 해상도 전후 비교: 상단 제목 339×32px, 범위 선택 339×44px, 탭 339×46px로 치수와 위치 동일.
- 344×884 좁은 화면: 수리이력/소모품/에러 탭 모두 44px 버튼, 줄바꿈·잘림·가로 넘침 없음. 수리이력 값 넘침 없음.
- 대표 목록 26건 → 개별 수리이력 클릭 → 7개 항목 확인 → 서비스 목록 26건으로 복귀. 직원은 물류1팀 차량 3대/이력 6건만 표시, 그룹 변경 컨트롤 없음.
- 자동 검사 12개 통과: repair-history, service-scope, efficiency-label-weight, owner-dashboard, period-controls, font14, fold-chart, axis-label, group-cards-preview, web-parity, supply-reset, error (`tests/customer-mobile-*.cjs`). JS 문법 검사 통과.
- 신규 검사는 양 역할의 목록/직접 이력/선택 이력 상세정보 미노출, 누락값, 문자열 이스케이프, 범위 우회 방지, 건수·날짜·이동 불변을 검증한다. 기존 스냅샷 비교는 정확한 r85 변경만 제외하고 나머지 동일성을 유지한다.
- 별도 구형 `customer-mobile-prototype.cjs` 전체 실행은 `web-contracts.generated.js`를 로드하지 않는 기존 초기화 구조 때문에 모델 로딩 단계에서 실패한다. 이번 변경과 무관한 테스트 설정은 수정하지 않았으며, 현재 공용 계약을 로드하는 web-parity 및 서비스 관련 검사로 검증했다.

## 전달 상태

로컬 HTML만 반영. GitHub Pages, APK/iOS, 실제 서버/API에는 반영하지 않았다. 클라이언트에서 고객용 상세내용을 숨기는 것은 서버 권한 검사를 대체하지 않으며, 실제 API에서도 고객에게 허용된 필드와 차량 범위를 반환해야 한다. 기존 화면 ID 유지, 로컬 등록부 갱신, Figma/FigJam은 명시 요청 시 일괄 반영 대기.
