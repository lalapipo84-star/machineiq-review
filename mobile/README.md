# MACHINE IQ 고객 모바일

2026-10-01 r120. 이 폴더만으로 실행하는 고객 모바일 HTML 시연본입니다. 대표는 업체 전체, 직원은 배정 그룹을 조회합니다. 실제 인증·회원가입·PUSH·등록 서버는 연결하지 않았습니다.

## 실행

`node mobile/serve.cjs` 실행 후 `http://localhost:8806/login.html`을 엽니다. 정적 호스팅은 `mobile/login.html`로 진입합니다.

- 대표: `index.html#home?role=customer_owner`
- 직원: `index.html#home?role=customer_staff`
- 로그인·회원가입·비밀번호 찾기 및 홈·차량·서비스·리포트·설정 제공.

현재 홈은 home-view.js에서 한 번만 렌더링합니다. 구 홈 교체 스크립트·미사용 인증 코드·과거 ZIP은 포함하지 않습니다. 요청한 과거 비교안은 별도 포장 옵션으로만 포함하며 manifest.json/includeArchives로 구분합니다.

## 유지되는 동작

14px 세부 글자, 정수 반올림, 일·주·월 조회, 항목별 상세 연결, 직원 홈 중복 그룹 영역 제거, 언어 선택 제거, 최근 7일 차트 → 이번 달 운영효율 이동을 유지합니다. 운영효율·차량별효율은 식별자 위/그래프 아래와 시간 위 정렬을 사용합니다. 좁은 화면의 긴 차량번호는 겹치지 않게 표시합니다. 오류·위험색은 #992100, 브랜드·버튼은 #FF3600입니다.

에러는 해당 기간의 발생 건수(건), 소모품은 기간과 무관한 현재 관리 항목 수(개)입니다. 대표만 소모품 교체 처리·실행 취소가 가능하며 새로고침하면 원래 시연 데이터로 돌아갑니다.

HTML에는 QR·카메라·네이티브 권한 UI가 없습니다. 이 배포본은 제공받은 브라우저 지도 키를 포함하며 차량 위치 팝업 안에 Google 지도를 표시합니다. 인터넷과 허용된 HTTP/HTTPS 주소가 필요합니다. 파일 직접 열기(file://)에서는 키 제한 때문에 동작하지 않을 수 있습니다. 실행·키 제한 설정은 docs/map-setup.md를 참고하세요. 실제 충전 명령·이메일/SMS/PUSH 발송은 없습니다.

검수 비밀번호는 `password12!@`, 이메일 인증 코드는 `123456`입니다. 실제 계정 인증이 아닙니다.

## 파일과 검사

shared는 기존 모바일 공통 스타일/로고, assets는 폰트, data는 시연 차량 자료입니다. manifest.json은 파일 해시와 빌드 버전입니다. docs의 과거 PDF·엑셀은 제작 시점 자료이며 현재 정의는 screen-registry.json 및 source-cleanup-r89.md가 우선합니다.

오픈소스 고지는 licenses/에 포함합니다. 아이콘 Lucide 0.468.0(ISC, Feather MIT 기여 포함), 글꼴 Noto Sans KR 및 Open Sans(SIL OFL 1.1)를 사용합니다. 기존 PDF는 제작 당시 기록이며 최신 색상과 그래프 배치는 docs/danger-color-r91.md 및 daily-chart-r96.md를 참고하세요.

```sh
node mobile/tests/package.cjs
node mobile/tests/dashboard.cjs
node mobile/tests/auth.cjs
node mobile/tests/supply-reset.cjs
node mobile/tests/soc.cjs
node mobile/tests/error.cjs
node mobile/tests/lithium-shock.cjs
```

검사는 문법·자산·경로·시연 동작을 확인합니다. 실제 휴대폰 카메라/GPS/OS 권한 및 서버 검증을 대신하지 않습니다. GitHub 게시 여부는 로컬 생성 여부와 별개입니다.
