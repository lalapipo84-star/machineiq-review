# 고객 Android QR 테스트 · 2026-09-20

## 사용자 확정 범위

설정에 `QR 검색`을 추가한다. 현재는 테스트용으로 QR의 내용을 확인·복사·다시 스캔하는 기능만 제공한다. 차량 시리얼번호·터미널 ID 자동 입력이나 회원가입/차량 등록 연결은 구현하지 않는다. 자동 입력은 추후 요청 대상이다.

**향후 HTML 전달본에서도 QR 기능을 제외한다.** 카메라 권한, QR 메뉴, 네이티브 스캐너는 Android의 `src/location`에만 둔다. 일반 HTML·HTML ZIP·기본 무권한 APK에는 포함하지 않는다. 두 HTML 패키지 검사에 제외 조건을 추가하여 이 구분을 검증한다.

## 화면 · 변경 전후

- LQ-ACC-001 설정: 기존 위치 이용 동의 관리·앱 알림 테스트 옆에 같은 버튼 스타일의 QR 검색만 추가. 다른 화면·회원가입 입력은 변경하지 않음.
- 신규 LQ-COM-005: QR 검색. 사용자가 누를 때만 카메라 권한 요청, 허용 시 QR만 인식. 닫기·기기 조명 지원.
- 신규 LQ-COM-005-P01: QR 인식 결과. 원문·복사·다시 스캔·닫기. URL이나 스크립트도 실행하지 않고 문자열로만 표시.
- 권한 거부·영구 거부·카메라 없음/열기 실패: 안내와 재시도 또는 Android 앱 설정. 다른 앱 메뉴 이용은 유지.

## 수정 파일 · 함수

- `android/customer-machine-iq-preview/app/src/location/assets/location-ui.js`: 설정 버튼 확장. 중복 삽입 방지·기존 역할별 알림 이동 유지.
- `src/location/java/com/bobcat/machineiq/customerpreview/LocationActivity.java`의 `route`: 실제 사용자 동작·로컬 페이지·런타임 토큰 확인 후 내부 QR Activity 실행.
- 같은 폴더 `QrScanActivity.java`: 카메라 권한·라이프사이클·QR 결과 확인. `QrPayload.java`: 빈/과도한 원문 방어.
- `app/src/location/AndroidManifest.xml`: 선택적 카메라 기능, CAMERA 권한, 외부에서 실행 불가 QR 화면. 불필요한 라이브러리 기본 캡처 Activity 제거.
- `app/build.gradle`: 위치 APK에서만 ZXing Android Embedded 4.3.0 및 검사용 JUnit 사용. 버전 0.1.3-location, code 4.
- `tests/customer-android-location.cjs`, `tests/customer-android-qr.cjs`, `app/src/locationTest/java/.../QrPayloadTest.java`: 기존 기능·QR 안전 조건·생성 QR 실제 디코딩 검사.
- `tests/customer-mobile-package.cjs`, `tests/customer-mobile-html.cjs`: HTML에 QR 메뉴·카메라 연동·Android 소스가 섞이지 않도록 검사.

## 보존 및 보안

앱 이름·패키지·기존 딜러 아이콘·위치 동의·로컬 알림·PDF 저장 기능 유지. 기존 위치/알림 APK의 업데이트 빌드이며 기본 APK와 별도 패키지다. 영상/원문 저장·업로드 없음. 복사를 누른 경우에만 클립보드에 민감 콘텐츠로 기록한다. 백그라운드 카메라·마이크·연락처 권한을 추가하지 않는다. 회원가입/차량 등록/QR 서버 조회/실제 PUSH/iOS는 구현하지 않았다.

## 검증

QR 원문(차량번호·한글·여러 줄·URL/스크립트 포함) 디코딩, 빈 값/초과 길이 방어, 일반 바코드 제외의 JVM 테스트 5개 통과. APK 빌드·정적 검사 통과, lint 오류 0개(기존 및 추가 경고 12개). 기존 설정·위치·알림 소스 및 DOM 검사 통과. 실제 휴대폰 카메라·OS 권한 팝업 검증은 연결 기기가 없어 미실시. 빌드 검증을 실제 카메라 검증으로 간주하지 않는다.

HTML 화면/데이터는 r87 전달본을 그대로 사용하며 QR는 APK의 별도 자산으로만 주입한다. 원격 Figma/FigJam은 변경하지 않고 로컬 등록부에 대기 기록만 남긴다.

구현 참고: [ZXing Android Embedded 4.3.0](https://github.com/journeyapps/zxing-android-embedded/tree/v4.3.0). Apache 2.0 라이선스/고지는 APK의 `assets/licenses/`에 포함한다.

## 설치 파일 검증

`output/apk/Machine-IQ-Customer-Location-Notifications-QR-v0.1.3-20260920-r87-debug.apk` (5,172,998 bytes).

- SHA-256: `16fa7106db105d6f20efa3b48beede66507bb1e4767b9f224930d47b1da0865c`.
- APK 서명 검증 통과. 기존 v0.1.2 위치·알림 APK와 같은 서명 인증서 및 패키지명 확인.
- 내장 HTML 해시 `66ad26a79de246214fb5c7357acb4433ebe792e6a59cc51f13789dc5498785da`로 r87 원본과 동일. 5개 해상도 아이콘 모두 이전 APK와 바이트 동일.
- 최종 권한은 카메라·대략적/정확한 위치·알림 4개뿐. 인터넷·마이크·백그라운드 위치 권한 없음.
- 기존 배포 ZIP은 보관본 그대로 두며, 이번에 HTML ZIP을 재생성하지 않음. HTML 향후 생성 시 QR 제외 검사를 계속 적용.
