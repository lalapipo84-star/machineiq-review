/* Shared mock storage for dealer and customer interest-vehicle pages.
   Principal identities are fixed by role; query parameters never select another user's list. */
(function (root) {
  'use strict';

  function isDealer(role) {
    return role === 'dealer_owner' || role === 'dealer_staff';
  }
  function canUse(role) { return root.MIQCommon.roles.canUseFavorites(role); }

  function allowedPool(role, rows) {
    if (!canUse(role)) return [];
    return root.MIQCommon.roles.filterVehicles(role, rows).filter(function (vehicle) {
      return typeof vehicle.vin === 'string' && vehicle.vin.length > 0;
    });
  }

  function storageKey(role) {
    if (role === 'customer_owner') return 'linq.favorites.v1:customer-1933:owner-yoon';
    if (role === 'customer_staff') return 'linq.favorites.v1:customer-1933:staff-oh';
    return 'linq.favorites.v1:central-dealer:' + (role === 'dealer_owner' ? 'owner-park' : 'staff-jung');
  }

  function validated(role, ids, rows) {
    var allowed = allowedPool(role, rows).map(function (vehicle) { return vehicle.vin; });
    return root.MIQMeeting.favoriteIds(ids, allowed);
  }

  function normalize(role, state, rows) {
    if (!state || !Array.isArray(state.categories) || !Array.isArray(state.members)) throw new Error('관심차량 저장 형식이 올바르지 않습니다.');
    var defaults = state.categories.filter(function (category) { return category && category.id === 'default'; });
    var defaultName = defaults.length ? (typeof defaults[0].name === 'string' ? defaults[0].name.trim() : '') : '기본';
    if (defaults.length > 1 || !defaultName || defaultName.length > 30) throw new Error('구분 이름을 확인해 주세요. 이름은 1~30자로 입력해 주세요.');
    var categories = [{ id: 'default', name: defaultName }];
    state.categories.forEach(function (category) {
      if (!category || category.id === 'default') return;
      var name = typeof category.name === 'string' ? category.name.trim() : '';
      if (typeof category.id !== 'string' || !/^[a-zA-Z0-9_-]+$/.test(category.id) || !name || name.length > 30 ||
          categories.some(function (item) { return item.id === category.id || item.name.toLowerCase() === name.toLowerCase(); })) throw new Error('구분 이름을 확인해 주세요. 같은 이름은 사용할 수 없습니다.');
      categories.push({id:category.id,name:name});
    });
    var ids = validated(role, state.members.map(function (member) { return member && member.vin; }), rows);
    return {version:2,categories:categories,members:ids.map(function (vin) {
      var member=state.members.find(function (item) { return item && item.vin===vin; });
      return {vin:vin,categoryId:categories.some(function (category) { return category.id===member.categoryId; })?member.categoryId:'default'};
    })};
  }

  function readState(role, rows) {
    if (!canUse(role)) return {version:2,categories:[],members:[]};
    var stored = root.localStorage.getItem(storageKey(role));
    // First-visit WEB examples only; an explicitly saved empty list stays empty.
    var state = stored === null ? (isDealer(role) ? allowedPool(role, rows).slice(0, 3).map(function (row) { return row.vin; }) : []) : JSON.parse(stored);
    if (Array.isArray(state)) state={categories:[],members:state.map(function (vin) { return {vin:vin,categoryId:'default'}; })};
    return normalize(role,state,rows);
  }

  function read(role, rows, categoryId) {
    var state=readState(role,rows);
    var known=state.categories.some(function (category) { return category.id===categoryId; });
    return state.members.filter(function (member) { return !known || member.categoryId===categoryId; }).map(function (member) { return member.vin; });
  }

  function saveState(role, state, rows) {
    if (!canUse(role)) throw new Error('이 메뉴를 사용할 권한이 없습니다.');
    var saved=normalize(role,state,rows);
    // One atomic write preserves both category membership and the old list on failure.
    root.localStorage.setItem(storageKey(role),JSON.stringify(saved));
    return saved;
  }

  function save(role, ids, rows) {
    if (!canUse(role)) throw new Error('이 메뉴를 사용할 권한이 없습니다.');
    var state=readState(role,rows);
    state.members=validated(role,ids,rows).map(function (vin) {
      return state.members.find(function (member) { return member.vin===vin; }) || {vin:vin,categoryId:'default'};
    });
    return saveState(role,state,rows).members.map(function (member) { return member.vin; });
  }

  root.MIQFavorites = { isDealer: isDealer, canUse: canUse, allowedPool: allowedPool, read: read, save: save, readState: readState, saveState: saveState };
}(typeof window !== 'undefined' ? window : globalThis));
