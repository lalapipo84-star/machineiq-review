/* Adapted from the two user-provided monitoring reference HTML files.
   One shared browser review ledger; no interface or backend request is sent. */
(function(root,factory){var api=factory(root);if(typeof module==='object'&&module.exports)module.exports=api;else root.MIQAdminMonitoring=api;}(typeof window!=='undefined'?window:globalThis,function(root){
'use strict';
function monitorSeed(){
// ---------- 인터페이스 정의 ----------
const IFACES = [
  { key: 'testtms',  name: 'testtms API', dir: 'Agent → Cloud',  manual: false,
    reqTitle: '수신 데이터 (Agent → Cloud)', resTitle: 'Cloud 응답' },
  { key: 'mes',      name: 'MES EAI',     dir: 'Cloud → MES',     manual: true, rfc: 'DIV_MES_TMS_RESULT_M',
    reqTitle: '전송 내역 (Cloud → MES)', resTitle: 'MES 응답' },
  { key: 'nonagree', name: '미동의 EAI',  dir: 'Cloud ↔ ERP',     manual: true, rfc: 'DIPP_SEND_EQUIP_DIV_TMS',
    reqTitle: '요청 (Cloud → ERP)', resTitle: '응답 (ERP → Cloud)' },
  { key: 'agree',    name: '동의 EAI',    dir: 'Cloud ↔ ERP',     manual: true, rfc: 'DIPP_SEND_EQUIP_DIV_TMS',
    reqTitle: '요청 (Cloud → ERP)', resTitle: '응답 (ERP → Cloud)' },
  { key: 'register', name: '차량등록 EAI', dir: 'Cloud ↔ ERP',    manual: false, rfc: '(신규 개발 예정)', planned: true,
    reqTitle: '요청 (Cloud → ERP)', resTitle: '응답 (ERP → Cloud)' },
];
const IF = Object.fromEntries(IFACES.map(i => [i.key, i]));
const MAX_RETRY = 30;
const TODAY = '2026-10-30';

const LABELS = {
  terminalid: '단말기 ID', can: 'CAN 수신', datatime: '수집 일시', mountTms: 'TMS 장착', checkTms: 'TMS 통신',
  checkGps: 'GPS 통신', checkBattery: '배터리', code: '응답 코드', message: '메시지',
  TERMINAL_ID: '단말기 ID', CHECKPLANT: '생산 공장', TESTS: '점검 결과 (TEST_TYPE / TEST_RESULT)', TARGET_DB: '저장 DB',
  AGREE: '동의 구분', RESULT: '처리 결과', MESSAGE: '메시지',
  PKMT: 'PKMT', MATNR: '대표기종', TYPBZ: '모델명', BATT_TYPE: '배터리 종류', ARBPL: 'Work Center',
  LAND1: '국가', TZONE: 'Timezone', KUNNR_Z2: '영업 딜러', KUNNR_Z1: '서비스 딜러',
  EQUNR: '차대번호', GWLDT: '보증개시일', KUNNR_SP: '고객사', LINQ_NO: '터미널 시리얼번호', AUFNR: 'PP 코드', KDAUF: 'Order Number',
};
// 동의 EAI 응답 항목 (차량 요약 박스도 이 순서를 따른다)
const AGREE_FIELDS = ['EQUNR', 'PKMT', 'MATNR', 'TYPBZ', 'BATT_TYPE', 'ARBPL', 'LAND1', 'TZONE', 'GWLDT', 'KUNNR_SP', 'KUNNR_Z2', 'KUNNR_Z1'];
const VALUE_TEXT ={ AGREE: { X: 'X (미동의)', O: 'O (동의)' }, RESULT: { S: 'S (성공)', E: 'E (오류)' } };

// ---------- 더미 데이터 ----------
const pad = n => String(n).padStart(2, '0');
function dayPlus(date, n) {
  const d = new Date(date + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
function addSec(at, s) {
  const d = new Date(at.replace(' ', 'T') + 'Z');
  d.setUTCSeconds(d.getUTCSeconds() + s);
  return d.toISOString().slice(0, 19).replace('T', ' ');
}

let seq = 0;
function log(iface, at, opt) {
  return Object.assign({ id: ++seq, iface, at, trigger: '자동', user: '시스템', attempt: null, ms: 300 + (seq * 137) % 900 }, opt);
}
function testtms(tid, at, checks) {
  const req = { terminalid: tid, can: 'Y', datatime: addSec(at, -2), mountTms: 'Y', checkTms: 'Y', checkGps: 'Y', checkBattery: 'Y', ...checks };
  const bad = Object.entries(req).filter(([k, v]) => k.startsWith('check') && v !== 'Y').map(([k]) => LABELS[k]);
  return log('testtms', at, {
    ok: true, warn: bad.length > 0, summary: bad.length ? `수신 · ${bad.join(', ')} 이상` : '수신 · 전 항목 정상',
    req, res: { code: 200, message: '수신 완료' }, ms: 40,
    source: `JSON 파일 · /data/logs/testtms/${at.slice(0, 10).replace(/-/g, '')}.json`,
  });
}
function mesTests(t) {
  return [['TMS', t.checkTms], ['GPS', t.checkGps], ['BATT', t.checkBattery]]
    .map(([type, v]) => ({ TEST_TYPE: type, TEST_RESULT: v === 'Y' ? 'O' : v === 'N' ? 'X' : 'NULL' }));
}
function mes(tid, at, plant, tests, opt = {}) {
  const db = plant === 'KR' ? 'DBKR' : 'DBCY';
  const ok = opt.ok !== false;
  const bad = tests.filter(t => t.TEST_RESULT !== 'O').map(t => `${t.TEST_TYPE} ${t.TEST_RESULT}`);
  return log('mes', at, Object.assign({
    ok, warn: ok && bad.length > 0,
    summary: ok ? `${db} 전송 완료 · ${tests.map(t => `${t.TEST_TYPE} ${t.TEST_RESULT}`).join(' / ')}` : opt.err,
    req: { TERMINAL_ID: tid, CHECKPLANT: plant, TARGET_DB: db, TESTS: tests },
    res: ok ? { RESULT: 'S', MESSAGE: `${db} MES 저장 완료` } : { RESULT: 'E', MESSAGE: opt.err },
    source: 'DB · TB_IF_MES_LOG',
  }, opt));
}
const SPEC = {
  A: { PKMT: 'PK-DX225-01', MATNR: 'B20SE7-KO20', TYPBZ: 'DX225LCA-7', BATT_TYPE: '12V 150Ah', ARBPL: 'WC-KR-210', LAND1: 'KR', TZONE: 'Asia/Seoul', KUNNR_Z2: '0000102231 (서울중장비)', KUNNR_Z1: '0000102231 (서울중장비)' },
  B: { PKMT: 'PK-DX140-03', MATNR: 'B14SE7-KO11', TYPBZ: 'DX140W-7', BATT_TYPE: '12V 120Ah', ARBPL: 'WC-KR-140', LAND1: 'KR', TZONE: 'Asia/Seoul', KUNNR_Z2: '0000104410 (부산건기)', KUNNR_Z1: '0000104588 (경남서비스)' },
  C: { PKMT: 'PK-DX300-02', MATNR: 'B30SE7-KO05', TYPBZ: 'DX300LCA-7', BATT_TYPE: '24V 100Ah', ARBPL: 'WC-KR-300', LAND1: 'KR', TZONE: 'Asia/Seoul', KUNNR_Z2: '0000103077 (중부장비)', KUNNR_Z1: '0000103077 (중부장비)' },
};
const NOT_MAPPED = 'TERMINAL-EQUIPMENT 매핑 정보 없음 (추적성부품 미등록)';
function eaiReq(tid, agree) { return { TERMINAL_ID: tid, AGREE: agree }; }
function nonagree(tid, at, attempt, trigger, spec) {
  const ok = !!spec;
  return log('nonagree', at, {
    ok, attempt, trigger, summary: ok ? '조회 성공 · 미동의 차량정보 저장' : '추적성부품 미등록',
    req: eaiReq(tid, 'X'),
    res: ok ? { RESULT: 'S', MESSAGE: 'OK', ...spec } : { RESULT: 'E', MESSAGE: NOT_MAPPED },
    source: 'DB · TB_IF_EAI_LOG',
  });
}
// 최초 1회는 testtms 수신 직후, 이후는 매일 02:00 배치
function retries(tid, firstAt, count, successSpec) {
  const out = [];
  const day0 = firstAt.slice(0, 10);
  for (let k = 1; k <= count; k++) {
    const at = k === 1 ? addSec(firstAt, 2) : `${dayPlus(day0, k - 1)} 02:00:${pad(5 + k % 50)}`;
    const last = k === count;
    out.push(nonagree(tid, at, k, k === 1 ? '자동' : '배치', last ? successSpec : null));
  }
  return out;
}
function agree(tid, at, data, opt = {}) {
  const ok = !!data;
  const err = opt.err || NOT_MAPPED;
  const res = { RESULT: ok ? 'S' : 'E', MESSAGE: ok ? 'OK' : err };
  if (ok) AGREE_FIELDS.forEach(k => { res[k] = data[k]; });
  return log('agree', at, Object.assign({
    ok, trigger: '고객 요청', summary: ok ? '조회 성공 · 동의 차량정보 저장' : `${err.split(' (')[0]} · 고객에게 조회 불가 안내 노출`,
    req: eaiReq(tid, 'O'), res,
    source: 'DB · TB_IF_EAI_LOG',
  }, opt));
}
// 고객대표의 차량매핑 요청 프로세스에서 차대번호로 호출된다. 성공해야 동의 EAI로 넘어간다
function register(tid, at, equnr, spec) {
  const ok = !!spec;
  return log('register', at, {
    ok, trigger: '고객 요청', user: '고객대표', summary: ok ? '조회 성공 · 단말기·딜러·고객사 확인' : '차대번호에 매핑된 단말기 없음 · 동의 EAI 미호출',
    req: { EQUNR: equnr },
    res: ok ? { RESULT: 'S', MESSAGE: 'OK', LINQ_NO: tid, TYPBZ: spec.TYPBZ, MATNR: spec.MATNR, ARBPL: spec.ARBPL,
      KUNNR_Z1: spec.KUNNR_Z1, KUNNR_Z2: spec.KUNNR_Z2, KUNNR_SP: spec.KUNNR_SP, AUFNR: '700005023038', KDAUF: '2800003776' }
      : { RESULT: 'E', MESSAGE: '차대번호에 매핑된 터미널 정보 없음' },
    source: 'DB · TB_IF_EAI_LOG',
  });
}

const VEHICLES = [
  (() => {
    const tid = 'TMS24K0010231', t = testtms(tid, '2026-08-04 09:15:22');
    return { tid, plant: 'KR', note: '동의 완료', consented: true, erpReady: true, spec: SPEC.A,
      agreeData: { EQUNR: 'FBB08-000038', GWLDT: '2026-09-22', KUNNR_SP: '0001345891 (㈜한빛건설)' },
      logs: [t, mes(tid, '2026-08-04 09:15:23', 'KR', mesTests(t.req)), ...retries(tid, '2026-08-04 09:15:22', 2, SPEC.A),
        register(tid, '2026-09-22 13:58:12', 'FBB08-000038', { ...SPEC.A, KUNNR_SP: '0001345891 (㈜한빛건설)' }),
        agree(tid, '2026-09-22 14:03:51', { ...SPEC.A, EQUNR: 'FBB08-000038', GWLDT: '2026-09-22', KUNNR_SP: '0001345891 (㈜한빛건설)' })] };
  })(),
  (() => {
    const tid = 'TMS24K0018876', t = testtms(tid, '2026-10-19 10:41:07');
    // ERP에는 이미 등록됐지만 다음 배치 전인 상황 (수동 호출 시 성공)
    return { tid, plant: 'KR', note: '미동의 EAI 재시도 중', consented: false, erpReady: true, spec: SPEC.B,
      logs: [t, mes(tid, '2026-10-19 10:41:08', 'KR', mesTests(t.req)), ...retries(tid, '2026-10-19 10:41:07', 12, null)] };
  })(),
  (() => {
    const tid = 'TMS24C0007712', t = testtms(tid, '2026-09-12 15:20:44');
    return { tid, plant: 'CN', note: '30회 초과 · Alert', consented: false, erpReady: false,
      alert: { at: '2026-10-11 02:00:36' },
      logs: [t, mes(tid, '2026-09-12 15:20:45', 'CN', mesTests(t.req)), ...retries(tid, '2026-09-12 15:20:44', 30, null),
        register(tid, '2026-10-25 10:12:40', 'FCC21-000417', null)] };
  })(),
  (() => {
    const tid = 'TMS24K0019002', t = testtms(tid, '2026-10-27 13:05:10', { checkBattery: 'N' });
    const tests = mesTests(t.req);
    return { tid, plant: 'KR', note: 'MES 전송 실패 후 수동 재전송', consented: false, erpReady: true, spec: SPEC.C,
      logs: [t, mes(tid, '2026-10-27 13:05:12', 'KR', tests, { ok: false, err: 'MES 응답 없음 (Timeout 30s)', ms: 30000 }),
        ...retries(tid, '2026-10-27 13:05:10', 2, SPEC.C),
        mes(tid, '2026-10-27 16:40:02', 'KR', tests, { trigger: '수동', user: '운영자 김OO', reason: 'MES 미수신 문의로 재전송' })] };
  })(),
  (() => {
    const tid = 'TMS24K0015540', t = testtms(tid, '2026-10-22 11:02:31');
    const customer = { KUNNR_SP: '0001402276 (㈜동남토건)' };
    return { tid, plant: 'KR', note: '차량등록 성공 후 동의 EAI 실패', consented: true, erpReady: true, spec: SPEC.B,
      agreeData: { EQUNR: 'FBB14-000912', GWLDT: '2026-10-28', ...customer },
      logs: [t, mes(tid, '2026-10-22 11:02:32', 'KR', mesTests(t.req)), ...retries(tid, '2026-10-22 11:02:31', 2, SPEC.B),
        register(tid, '2026-10-28 15:46:58', 'FBB14-000912', { ...SPEC.B, ...customer }),
        agree(tid, '2026-10-28 15:47:30', null, { err: 'ERP 응답 없음 (Timeout 30s)', ms: 30000 })] };
  })(),
];
VEHICLES.forEach(v => v.logs.sort((a, b) => a.at.localeCompare(b.at)));

// ---------- 상태 계산 ----------
const logsOf = (v, key) => v.logs.filter(l => l.iface === key);
const lastOk = (v, key) => logsOf(v, key).filter(l => l.ok).pop();

function nodeState(v, key) {
  const logs = logsOf(v, key), last = logs[logs.length - 1];
  const ok = lastOk(v, key);
  if (key === 'testtms') {
    if (!last) return { s: 'idle', label: '수신 대기', meta: 'Agent 첫 전원 공급 시 수신' };
    return { s: last.warn ? 'warn' : 'done', label: last.warn ? '수신 · 점검 이상' : '수신 완료', meta: `${last.at}<br>${last.summary.replace('수신 · ', '')}` };
  }
  if (key === 'mes') {
    if (!last) return { s: 'idle', label: '전송 대기', meta: '' };
    if (!last.ok) return { s: 'fail', label: '전송 실패', meta: `${last.at}<br>${last.summary}` };
    const tests = last.req.TESTS.map(t => `${t.TEST_TYPE} ${t.TEST_RESULT}`).join(' · ');
    return { s: last.warn ? 'warn' : 'done', label: last.warn ? '전송 완료 · 점검 이상' : '전송 완료', meta: `${last.at} → ${last.req.TARGET_DB}<br>${tests}` };
  }
  if (key === 'nonagree') {
    const autoCnt = logs.filter(l => l.trigger !== '수동').length;
    if (ok) return { s: 'done', label: '조회 성공', meta: `${ok.at}<br>${ok.trigger === '수동' ? '수동 호출로 성공' : `${ok.attempt}차 시도에서 성공`}` };
    if (v.alert) return { s: 'stop', label: `${MAX_RETRY}회 실패 · 호출 중단`, meta: `Alert 등록 ${v.alert.at.slice(0, 16)}<br>${last.res.MESSAGE.split(' (')[0]}`, cnt: autoCnt };
    if (last) {
      const next = `${dayPlus(last.at.slice(0, 10), 1)} 02:00`;
      return { s: 'retry', label: `재시도 중 ${autoCnt}/${MAX_RETRY}`, meta: `다음 배치 ${next}<br>${MAX_RETRY - autoCnt}회 남음`, cnt: autoCnt };
    }
    return { s: 'idle', label: '호출 대기', meta: 'testtms 수신 후 호출' };
  }
  if (key === 'agree') {
    if (ok) return { s: 'done', label: '조회 성공', meta: `${ok.at}<br>차대번호 확보` };
    if (last) return { s: 'fail', label: '조회 실패', meta: `${last.at}<br>원인 확인 후 딜러 통해 재동의 안내` };
    const reg = logsOf(v, 'register').pop();
    if (reg && !reg.ok) return { s: 'idle', label: '미호출', meta: '차량등록 EAI 실패로<br>호출되지 않음' };
    return { s: 'idle', label: '호출 대기', meta: '차량등록 EAI 성공 시 호출' };
  }
  if (key === 'register') {
    if (ok) return { s: 'done', label: '조회 성공', meta: `${ok.at}<br>차대번호 ${ok.req.EQUNR}` };
    if (last) return { s: 'fail', label: '조회 실패', meta: `${last.at}<br>차대번호 ${last.req.EQUNR}` };
    return { s: 'plan', label: '고객 호출 대기', meta: '고객대표의<br>차량매핑 요청 시 호출' };
  }
}

// 차량 요약은 동의 EAI 응답만 쓴다. 동의 EAI가 성공하기 전에는 모든 항목이 빈 값
function vehicleInfo(v) {
  const l = lastOk(v, 'agree');
  return l ? l.res : {};
}

const NO_MANUAL = {
  testtms: 'Agent가 Cloud로 보내는 수신 API라 Cloud에서 호출할 수 없습니다.',
  register: '고객대표의 차량매핑 요청 프로세스에서만 호출하는 인터페이스라 수동 호출을 제공하지 않습니다.',
};
function manualAvailability(v, key) {
  if (!IF[key].manual) return { ok: false, why: NO_MANUAL[key] };
  if (key === 'mes' && !logsOf(v, 'testtms').length) return { ok: false, why: 'testtms 수신 이력이 없어 전송할 점검 결과가 없습니다.' };
  if (key === 'agree' && !lastOk(v, 'register')) return { ok: false, why: '차량등록 EAI가 성공한 차량만 동의 EAI를 호출할 수 있습니다.' };
  if (key === 'agree' && !v.consented) return { ok: false, why: '고객 정보제공 동의 이력이 없는 차량입니다. 동의 EAI는 개인정보(차대번호 등)를 가져오므로 호출할 수 없습니다.' };
  return { ok: true };
}


return {IFACES,LABELS,AGREE_FIELDS,VALUE_TEXT,NO_MANUAL,VEHICLES,logsOf,lastOk,nodeState,vehicleInfo,manualAvailability,mesTests,eaiReq,mes,nonagree,agree};}
function alertSeed(){
// ---------- Alert 유형 ----------
const TYPES = {
  nonagree: { name: '추적성부품등록 누락' },
  company:  { name: 'New Company Code', master: 'COMPANY master' },
  vehicle:  { name: 'New PKMT Code', master: 'VEHICLE master' },
};
const FIELD = {
  EquipmentCode: '장비코드',
  KUNNR_SP: '고객사', KUNNR_Z2: '영업 딜러', KUNNR_Z1: '서비스 딜러', ARBPL: 'Work Center',
};
const TODAY = '2026-11-03';
const ME = '나 (매니저)';

// ---------- 더미 데이터 ----------
let seq = 0;
const ALERTS = [];
const recalled = (at, by, logId) => ({ recall: { at, by, logId } });
const closed = (recallAt, recallLogId, at) => ({ ...recalled(recallAt, '운영자 김정수', recallLogId), closedAt: at, closedBy: '운영자 김정수' });

// 마스터 미등록: EAI 응답 값 중 마스터 DB에 없는 코드. 수신 건마다 1건
//  New Company Code: 미동의/동의 EAI의 KUNNR_SP, KUNNR_Z2, KUNNR_Z1, ARBPL
//                    (차량등록 EAI는 업무 구조상 미등록 코드가 올 수 없어 판단하지 않는다)
//  New PKMT Code:    미동의/동의 EAI의 EquipmentCode
// 처리 완료는 Alert 발생 후 같은 단말기·같은 인터페이스를 재호출해 성공한 경우에만 가능하다 (recall)
function master(type, at, tid, field, code, iface, logId, extra) {
  const res = { RESULT: 'S', MESSAGE: 'OK', TERMINAL_ID: tid, EquipmentCode: 'FBA20-07', ARBPL: 'WC-KR-210',
    KUNNR_Z2: '0000102231', KUNNR_Z1: '0000102231', LAND1: 'KR' };
  if (iface !== '미동의 EAI') res.KUNNR_SP = '0001345891';
  res[field] = code;
  ALERTS.push({ id: ++seq, type, at, tid, field, code, iface, logId, res, ...extra });
}
// 추적성부품등록 누락: 미동의 EAI 30회 실패 (생산라인 GPS terminal no. 입력 누락)
function nonagree(at, tid, firstAt, lastAt, extra) {
  ALERTS.push({ id: ++seq, type: 'nonagree', at, tid, iface: '미동의 EAI', firstAt, lastAt,
    lastMsg: 'TERMINAL-EQUIPMENT 매핑 정보 없음 (추적성부품 미등록)', ...extra });
}

nonagree('2026-09-28 02:00:19', 'TMS24K0016601', '2026-08-30 10:11:52', '2026-09-28 02:00:18', closed('2026-09-30 14:58:10', 79012, '2026-09-30 15:02:37'));
nonagree('2026-10-11 02:00:36', 'TMS24C0007712', '2026-09-12 15:20:46', '2026-10-11 02:00:35');
nonagree('2026-10-14 02:00:41', 'TMS24C0007735', '2026-09-15 09:47:13', '2026-10-14 02:00:40');

master('company', '2026-10-27 13:12:40', 'TMS24K0017720', 'KUNNR_SP', '0001410388', '동의 EAI', 86014);
master('company', '2026-10-28 02:00:07', 'TMS24K0019002', 'KUNNR_Z1', '0000103077', '미동의 EAI', 86377, recalled('2026-11-03 09:42:18', '운영자 김정수', 89180));
master('company', '2026-10-29 09:31:45', 'TMS24K0020911', 'KUNNR_Z2', '0000105120', '미동의 EAI', 86990);
master('company', '2026-10-30 10:20:15', 'TMS24K0020988', 'ARBPL', 'WC-KR-225', '미동의 EAI', 87655);
master('company', '2026-11-02 02:00:12', 'TMS24K0020950', 'KUNNR_Z2', '0000105120', '미동의 EAI', 88941);
master('company', '2026-10-01 11:20:51', 'TMS24K0013388', 'KUNNR_Z2', '0000099871', '미동의 EAI', 74420, closed('2026-10-02 09:35:51', 74533, '2026-10-02 09:40:18'));

master('vehicle', '2026-10-30 16:48:02', 'TMS24K0021031', 'EquipmentCode', 'FBB22-31', '미동의 EAI', 88213, recalled('2026-11-03 09:47:02', '운영자 김정수', 89184));
master('vehicle', '2026-10-31 11:05:33', 'TMS24K0021052', 'EquipmentCode', 'FBB22-31', '미동의 EAI', 88460, recalled('2026-11-03 09:47:40', '운영자 김정수', 89185));
master('vehicle', '2026-11-01 02:00:39', 'TMS24K0021077', 'EquipmentCode', 'FBB22-31', '미동의 EAI', 88702);
master('vehicle', '2026-11-02 14:22:10', 'TMS24K0021098', 'EquipmentCode', 'FBB22-31', '미동의 EAI', 89015);
master('vehicle', '2026-11-03 10:15:27', 'TMS24K0018802', 'EquipmentCode', 'FBB22-31', '동의 EAI', 89207);
master('vehicle', '2026-09-17 15:40:09', 'TMS24K0012031', 'EquipmentCode', 'FDB35-02', '동의 EAI', 71022, closed('2026-09-19 10:08:31', 71304, '2026-09-19 10:12:44'));
master('vehicle', '2026-09-18 10:02:11', 'TMS24K0012044', 'EquipmentCode', 'FDB35-02', '미동의 EAI', 71187, closed('2026-09-19 10:09:12', 71305, '2026-09-19 10:13:02'));

ALERTS.sort((a, b) => b.at.localeCompare(a.at));


return {TYPES,FIELD,ALERTS};}
  var M=monitorSeed(), A=alertSeed(), key='linq.admin.monitoring.reference.v1';
  var templates=M.VEHICLES.map(function(v){return copy(v);}), alerts=A.ALERTS;
  var initialAlerts=copy(alerts), listeners=new Set(), ledger={manual:[],closed:{}}, snapshot='';
  function copy(v){return JSON.parse(JSON.stringify(v));}
  var ifaceKeys={'testtms API':'testtms','MES EAI':'mes','미동의 EAI':'nonagree','동의 EAI':'agree','차량등록 EAI':'register'};
  // Alert-only terminals expose exactly the supplied response/failed trace.
  // They do not acquire fictional MES ingress, consent or registration proof.
  alerts.forEach(function(a){
    if(M.VEHICLES.some(function(v){return v.tid===a.tid;}))return;
    var logs=initialAlerts.filter(function(x){return x.tid===a.tid;}).map(function(x){return {id:x.logId||100000+x.id,iface:ifaceKeys[x.iface],at:x.lastAt||x.at,ok:!!x.res&&x.res.RESULT==='S',warn:false,attempt:x.type==='nonagree'?30:null,trigger:'자동',user:'시스템',summary:x.type==='nonagree'?x.lastMsg:'마스터 코드 미등록 Alert',req:{TERMINAL_ID:x.tid,AGREE:x.iface==='동의 EAI'?'O':'X'},res:x.res||{RESULT:'E',MESSAGE:x.lastMsg},source:'제공된 Alert 예시의 연계 이력',ms:0};});
    var v={tid:a.tid,plant:'',note:'Alert 연계 이력',consented:false,erpReady:!!a.res,spec:a.res?copy(a.res):null,logs:logs,alertTraceOnly:true};if(a.type==='nonagree')v.alert={at:a.at};M.VEHICLES.push(v);templates.push(copy(v));
  });
  function timestamp(){return new Date(Date.now()+9*3600000).toISOString().slice(0,19).replace('T',' ');}
  function active(){return !!(root.MIQAdminContext&&root.MIQAdminContext.active());}
  function read(){try{if(root.localStorage){var raw=root.localStorage.getItem(key);if(!raw)return {manual:[],closed:{}};var d=JSON.parse(raw);return {manual:Array.isArray(d.manual)?d.manual.filter(validManual):[],closed:d.closed&&typeof d.closed==='object'&&!Array.isArray(d.closed)?d.closed:{}};} }catch(_){}return ledger;}
  function validManual(r){return r&&typeof r.tid==='string'&&r.log&&M.IFACES.some(function(i){return i.key===r.log.iface;})&&Number.isSafeInteger(r.log.id)&&/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(r.log.at)&&typeof r.log.ok==='boolean'&&r.log.req&&r.log.res;}
  function apply(){
    M.VEHICLES.forEach(function(v,i){v.logs=copy(templates[i].logs);ledger.manual.filter(function(r){return r.tid===v.tid;}).forEach(function(r){v.logs.push(copy(r.log));});v.logs.sort(function(a,b){return a.at.localeCompare(b.at)||a.id-b.id;});});
    alerts.forEach(function(a,i){
      Object.keys(a).forEach(function(k){delete a[k];});Object.assign(a,copy(initialAlerts[i]));
      if(a.closedAt)return; // A historical completion keeps its original proof.
      var closed=ledger.closed[String(a.id)];
      var candidates=ledger.manual.filter(function(r){return r.tid===a.tid&&ifaceKeys[a.iface]===r.log.iface&&r.log.trigger==='수동'&&r.log.at>a.at&&(!closed||r.log.at<=closed.at);}).sort(function(x,y){return x.log.at.localeCompare(y.log.at)||x.log.id-y.log.id;});
      var latest=candidates[candidates.length-1];
      if(latest&&(!a.recall||latest.log.at>=a.recall.at)){if(latest.log.ok)a.recall={at:latest.log.at,by:latest.log.user,logId:latest.log.id};else delete a.recall;}
      if(closed&&closed.recall&&typeof closed.recall.at==='string'&&closed.recall.at>a.at&&closed.recall.at<=closed.at)a.recall=copy(closed.recall);
      if(closed&&typeof closed.at==='string'&&typeof closed.by==='string'&&a.recall&&closed.at>=a.recall.at){a.closedAt=closed.at;a.closedBy=closed.by;}
    });
  }
  function refresh(notify){var next=read(),serialized=JSON.stringify(next),changed=serialized!==snapshot;if(changed){ledger=next;snapshot=serialized;apply();if(notify)listeners.forEach(function(fn){fn();});}return changed;}
  function save(){snapshot=JSON.stringify(ledger);try{if(root.localStorage)root.localStorage.setItem(key,snapshot);}catch(_){}apply();}
  function findVehicle(type,q){q=String(q||'').trim().toUpperCase();return M.VEHICLES.find(function(v){return type==='equnr'?String(M.vehicleInfo(v).EQUNR||'').toUpperCase()===q:v.tid===q;})||null;}
  function nodeState(v,k){var logs=M.logsOf(v,k),last=logs[logs.length-1],prior=M.lastOk(v,k);if(last&&!last.ok&&prior&&['nonagree','agree','register'].indexOf(k)>=0)return {s:'fail',label:'최근 조회 실패',meta:last.at+'<br>최신 응답을 확인해 주세요.'};return M.nodeState(v,k);}
  function manualParams(v,k){if(k==='mes'){var log=M.logsOf(v,'testtms').slice(-1)[0];if(!log)return null;return {TERMINAL_ID:v.tid,CHECKPLANT:v.plant,TARGET_DB:v.plant==='KR'?'DBKR':'DBCY',TESTS:M.mesTests(log.req)};}if(k==='nonagree')return M.eaiReq(v.tid,'X');if(k==='agree')return M.eaiReq(v.tid,'O');return null;}
  function runManual(tid,k,reason){
    if(!active())throw Error('어드민 화면에서만 실행할 수 있습니다.');refresh(false);var v=findVehicle('tid',tid);if(!v)throw Error('조회한 단말기가 없습니다.');if(!M.IFACES.some(function(i){return i.key===k;}))throw Error('지원하지 않는 인터페이스입니다.');var available=M.manualAvailability(v,k);if(!available.ok)throw Error(available.why);reason=String(reason||'').trim();if(!reason||reason.length>500)throw Error('호출 사유를 1~500자로 입력해 주세요.');var at=timestamp(),opt={trigger:'수동',user:'어드민 (시연)',reason:reason},l;
    if(k==='mes')l=M.mes(v.tid,at,v.plant,manualParams(v,k).TESTS,opt);
    if(k==='nonagree')l=Object.assign(M.nonagree(v.tid,at,null,'수동',v.erpReady?v.spec:null),opt);
    if(k==='agree')l=M.agree(v.tid,at,v.erpReady?Object.assign({},v.spec,v.agreeData):null,opt);
    if(!l)throw Error('수동 호출을 지원하지 않습니다.');var max=ledger.manual.reduce(function(n,r){return Math.max(n,r.log.id);},Date.now());l.id=max+1;ledger.manual.push({tid:v.tid,log:l});save();return copy(l);
  }
  function canClose(a){return !!a&&!a.closedAt&&!!a.recall&&a.recall.at>a.at;}
  function closeAlerts(ids){
    if(!active())return {ok:false,message:'어드민 화면에서만 처리할 수 있습니다.'};refresh(false);ids=Array.from(new Set(ids.map(Number)));var list=ids.map(function(id){return alerts.find(function(a){return a.id===id;});});if(!list.length||list.some(function(a){return !canClose(a);}))return {ok:false,message:'선택한 모든 Alert에 같은 단말기·인터페이스의 발생 이후 재호출 성공 이력이 필요합니다.'};var at=timestamp();list.forEach(function(a){ledger.closed[String(a.id)]={at:at,by:'어드민 (시연)',recall:copy(a.recall)};});save();return {ok:true,count:list.length};
  }
  function portalUrl(page,params){var url=new URL(page,root.location.href),lang=new URLSearchParams(root.location.search).get('lang');url.search='';url.hash='';url.searchParams.set('role','internal');url.searchParams.set('portal','admin');if(lang)url.searchParams.set('lang',lang);Object.entries(params||{}).forEach(function(p){if(p[1]!=null&&p[1]!=='')url.searchParams.set(p[0],String(p[1]));});return url.href;}
  refresh(false);
  if(typeof root.addEventListener==='function'){root.addEventListener('storage',function(ev){if(ev.key===key)refresh(true);});root.addEventListener('focus',function(){refresh(true);});}
  return {interfaces:M.IFACES,labels:M.LABELS,agreeFields:M.AGREE_FIELDS,valueText:M.VALUE_TEXT,noManual:M.NO_MANUAL,alertTypes:A.TYPES,fieldLabels:A.FIELD,vehicles:function(){return M.VEHICLES;},alerts:function(){return alerts;},findVehicle:findVehicle,logsOf:M.logsOf,lastOk:M.lastOk,nodeState:nodeState,vehicleInfo:M.vehicleInfo,manualAvailability:M.manualAvailability,manualParams:manualParams,runManual:runManual,canClose:canClose,closeAlerts:closeAlerts,refresh:refresh,subscribe:function(fn){listeners.add(fn);return function(){listeners.delete(fn);};},timestamp:timestamp,portalUrl:portalUrl,openAlertCount:function(){return alerts.filter(function(a){return !a.closedAt;}).length;}};

}));
