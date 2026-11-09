# 고객 직원 메인 중복 그룹 카드 제거 — 2026-09-20

## 요청과 적용

직원 홈은 이미 배정 그룹 범위만 표시하므로, 상단 정보와 반복되는 ‘내 그룹 작업 현황’을 제거한다. ‘오늘의 작업 효율’ 다음에 ‘최근 7일 작업 추이’를 바로 표시한다. 고객대표의 ‘그룹별 운영 비교’는 유지한다.

기존 화면 ID `LQ-DASH-001` 유지. 별도 화면·권한·메뉴를 추가하거나 삭제하지 않는다. 카드의 중복 진입 버튼만 함께 사라지고 상단 에러/소모품, 차량 보기, 오늘 리포트 및 최근 7일 리포트 진입은 유지한다.

## 변경 파일

- `html/customer/mobile-prototype/owner-dashboard-preview.js`의 `render`: `customer_staff`이면 그룹 카드 section을 출력하지 않는 조건만 추가. 기존 집계·조회 범위·대표 정렬·CSS는 그대로 유지.
- `index.html`, `owner-dashboard-preview.html`: 대시보드 JS 캐시만 `20260920-7`로 변경. 공통 컴포넌트를 사용하는 별도안에도 직원 카드 제거가 동일 적용된다.
- 변경 전 4개 파일은 `artifacts/customer-mobile-staff-home-before-20260920/`에 보관.

## 검증

- `customer-mobile-staff-home.cjs`: 두 역할·메인/별도안·두 정렬·정상/빈 차량/미수신 소모품 24개 출력 비교. 대표는 변경 전과 전체 동일, 직원은 지정한 section 하나를 제외한 전체 출력 동일. CSS와 나머지 소스 불변 검사.
- `customer-mobile-owner-dashboard.cjs`, `customer-mobile-missing-data-fix.cjs`(988개 렌더링), `customer-mobile-efficiency-label-weight.cjs`, `customer-mobile-service-scope.cjs` 통과.
- 브라우저 344×884 동일 조건 전후: 상단 에러/소모품·차량 상태·오늘 작업 카드의 내용·높이·위치 동일. 최근 7일 카드의 내용·높이 동일, Y 1102→821로 281px 위로 이동.
- 실제 버튼: 직원 상단 교체 필요→서비스 소모품 due, 9월13일 추이→같은 날짜 일 리포트. 두 이동 모두 `customer_staff` 범위 유지.
- 대표 화면의 그룹 카드 4개·정렬 버튼 2개 유지. 확인용 화면 크기 변경은 종료 후 복원.

## 반영 범위

로컬 HTML만 수정. GitHub Pages·기존 APK·ZIP·iOS·실제 서버에는 이번 변경을 반영하지 않았다. Figma/FigJam은 사용자 요청 시 누적 반영 대기로 기록하고 원격 보드는 변경하지 않았다.
