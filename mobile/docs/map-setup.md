# 고객 모바일 지도 연결 안내

2026-09-23. 화면 ID `LQ-OPS-002-P01` 유지. 차량 상세 → 지도 보기에서 Google Maps JavaScript API로 최종 수신 위치와 차량번호 마커를 표시한다. 기존 팝업·확대/접기·제스처와 대표/직원 조회 범위는 그대로다. 실제 차량 GPS 서버나 휴대폰 현재 위치를 새로 연결한 것은 아니다.

## 실행과 키 관리

- 지도 포함 ZIP/Pages에는 사용자가 제공한 **브라우저용 지도 키**가 `map-config.local.js`에 포함된다. 비밀 서버 키처럼 숨길 수 없으므로 웹사이트/API 제한을 적용해야 한다.
- ZIP을 풀고 상위 폴더에서 `node mobile/serve.cjs` 실행 후 `http://localhost:8806/login.html`을 연다. 지도에는 인터넷이 필요하다.
- 파일 직접 열기(file://)는 HTTP 리퍼러가 없어 키 제한에 걸릴 수 있다. 키 제한을 해제하지 말고 허용된 로컬 서버 또는 HTTPS 사이트에서 실행한다.
- Google Cloud에서 Maps JavaScript API 활성화 및 결제 연결 상태를 확인한다. 기존 키의 권한·결제·도메인 제한은 이번 작업에서 변경하지 않았다.
- 키의 애플리케이션 제한은 웹사이트, API 제한은 Maps JavaScript API로 설정한다. 프로젝트의 다른 앱에서도 같은 키를 사용한다면 임의로 그 앱의 허용 주소를 제거하지 않는다.
- 현재 원본 로컬 확인 주소: `http://localhost:8816/*`.
- ZIP 기본 실행 주소: `http://localhost:8806/*`.
- 사용자가 요청한 GitHub Pages 주소는 `https://giry02.github.io/machineiq/mobile/`이며, 키에서 `https://giry02.github.io/*` 허용 여부를 확인한다. r97은 사용자의 별도 GitHub 지도 연결 요청에 따라 브라우저 키 포함 게시본을 생성한다.
- 개발 또는 승인된 운영 도메인이 더 있으면 해당 주소만 추가한다. `*` 전체 허용은 권장하지 않는다.

## 배포 원칙

`node scripts/package-customer-mobile.cjs <새 경로>/mobile --with-local-map`을 명시한 경우에만 로컬 브라우저 키와 현재 지도 구현을 포함한다. 기본 배포는 키 없는 외부 지도 링크를 유지한다. 두 지도 구현을 함께 로드하지 않는다. QR·카메라·네이티브 권한 메뉴는 어느 HTML ZIP에도 포함하지 않는다.

Google Cloud 관리 권한이 없어 전체 도메인 제한 설정은 조회하지 않았다. 로컬 지도 표시는 실제 브라우저에서 확인했지만, 공개 호스팅 주소·휴대폰 GPS·APK/iOS는 별도 검증 대상이다.

참고: [Google 지도 보안 권고](https://developers.google.com/maps/api-security-best-practices), [Maps JavaScript API 설정](https://developers.google.com/maps/documentation/javascript/get-api-key).
