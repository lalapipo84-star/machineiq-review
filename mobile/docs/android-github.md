# GitHub Pages 연결형 Android APK — 2026-09-21

## 사용자 요청과 설치

최신 GitHub 화면을 APK에서 직접 확인한다. 기존 위치·알림·QR 앱 위에 업데이트 설치하는 연결형이다.

- 파일: `Machine-IQ-Customer-GitHub-v0.2.0-20260921-debug.apk`
- 패키지: `com.bobcat.machineiq.customerpreview.location`
- 버전: `0.2.0-github`, versionCode 5 (이전 QR APK는 4)
- 앱 이름 및 딜러 아이콘 유지: `Machine IQ 고객 (위치·알림)`
- 시작 주소: https://giry02.github.io/machineiq/mobile/login.html
- 다운로드: https://giry02.github.io/machineiq/mobile/downloads/Machine-IQ-Customer-GitHub-v0.2.0-20260921-debug.apk

## 동작과 범위

HTML을 내장하지 않고 GitHub Pages의 최신 로그인·가입·비밀번호 찾기·메인을 직접 읽는다. 기존 위치 동의·QR 원문 확인/복사·로컬 알림 테스트를 APK 안에서만 추가한다. 일반 브라우저 HTML/ZIP에는 QR·카메라 연동을 넣지 않는다.

설정의 **최신 화면 새로고침**은 현재 페이지/역할을 유지하여 다시 읽는다. WebView 캐시를 사용하지 않으며 수동 새로고침은 문서 URL에도 일회성 값을 추가한다. 깃 업로드만이 아니라 **Pages 배포가 완료된 후** 최신 화면을 확인할 수 있다. 인터넷이 필요하며 네트워크 실패/HTTP 오류/25초 지연에는 안내·재시도·로그인 복귀를 제공한다. 무조건 이전 내장 화면을 보여주지 않는다.

기존 앱의 Android 동의/권한 저장은 같은 패키지로 유지되지만, 과거 file 주소의 웹 저장 상태는 HTTPS 주소와 별개다. 첫 실행은 로그인에서 시작한다. 인증/데이터는 기존 시연 동작이며 실제 서버 인증·FCM/APNs 연결을 새로 구현한 것이 아니다.

## 구현 파일 및 기존 ID

- `app/build.gradle`: `-PhostedPreview=true` 연결형 빌드. 기존 offline/location 빌드는 기존 버전·권한을 유지.
- `src/main/java/.../MainActivity.java`: 시작 주소/설정/신뢰 페이지/WebViewClient 확장 지점. 기본 내장형 동작 유지.
- `src/location/java/.../LocationActivity.java`: 신뢰 페이지 검사 공통화, 현재 Activity로 알림 복귀, 로그인 이전 알림 탭 보존, 새로고침 진입.
- `src/hosted/AndroidManifest.xml`: 기존 선택 권한 4개 + INTERNET. HostedActivity만 시작 화면.
- `src/hosted/java/.../HostedUrlPolicy.java`: 정확한 HTTPS 호스트·문서 4개 허용 목록.
- `src/hosted/java/.../HostedActivity.java`: 네트워크 화면·새로고침·오류/재시도·외부 링크 분리.
- `src/hosted/assets/hosted-location-ui.js`: iframe 없는 실제 공개 페이지용 앱 메뉴/알림 이동.
- ID 유지: LQ-AUTH-002/003/004, LQ-DASH-001, LQ-ACC-001, LQ-OPS-002-P01/P02/P03/P04, LQ-COM-004-P01, LQ-COM-005/P01, LQ-SVC-001-T02. 연결 실패는 공통 상태로 별도 업무 ID 없음.

## 보안과 개인정보

- 앱 내부와 네이티브 기능은 `https://giry02.github.io/machineiq/mobile/`의 명시된 4개 문서만 허용. 다른 저장소·비슷한 호스트·자격증명 포함 URI·인코딩 우회·HTTP는 앱 내부 허용 목록에서 제외.
- 프레임의 네이티브 실행을 차단하고 실제 사용자 동작·전면 앱·런타임 토큰·현재 신뢰 페이지를 확인한다. addJavascriptInterface 없음.
- 외부 웹 링크는 사용자 동작 시 외부 앱으로 분리. SSL 오류는 취소하며 우회 없음. mixed content 및 파일/콘텐츠 접근 불허, 웹 위치 API와 third-party cookie 비활성.
- QR 영상/원문을 서버나 웹 페이지에 전달하지 않으며 자동 등록/입력 없음. 현재 위치는 기존 명시적 동의/권한 절차와 외부 지도 버튼에서만 사용. 배경 위치·마이크·연락처 권한 없음.
- 참고: [Android URI 검증](https://developer.android.com/privacy-and-security/risks/unsafe-uri-loading), [WebSettings](https://developer.android.com/reference/android/webkit/WebSettings), [WebView](https://developer.android.com/develop/ui/views/layout/webapps/webview).

## 검증

- hosted/source/DOM 및 기존 location/QR 검사 통과. 두 역할의 설정 메뉴·중복 방지·로그인 전 알림 대기 및 역할별 에러 이동 확인.
- Gradle assembleDebug/lintDebug/testDebugUnitTest 성공. URL 정책 4개 묶음·QR 실제 디코딩/검증 5개, 총 9개 JVM 테스트 통과.
- lint 오류 0개 / 경고 12개. 빌드 검증은 실제 휴대폰 설치·카메라·GPS·OS 권한 검증을 뜻하지 않는다.
- APK 서명 v2 검증. 이전 QR APK와 동일 인증서 및 패키지/높은 versionCode 확인.
- 5개 해상도 아이콘이 이전 APK와 바이트 동일.
- APK에는 고객 HTML/시연 데이터가 없고 네이티브 UI 스크립트·라이선스만 assets로 포함.
- 412,945 bytes. SHA-256: `71feff53754e9d38fdc4c4dd9df47b40052dc6dfe90e6cc42f1c541c8f1b9f40`.
- 확인 시 연결 Android 기기는 없었다. 설치 후 실제 기기 검증은 미실시.

기존 오프라인 APK와 ZIP은 보존. iOS·서버·Figma는 미변경. 로컬 등록부 및 FigJam 반영 대기만 갱신한다.

