(function (root, factory) {
  'use strict';
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.MIQNoticeKinds = factory();
}(typeof window !== 'undefined' ? window : this, function () {
  'use strict';
  return Object.freeze({ GENERAL: '일반 공지', SERVICE: '점검·장애', TERMS: '약관·정책' });
}));
