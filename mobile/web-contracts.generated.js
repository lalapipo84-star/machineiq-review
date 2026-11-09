/* GENERATED from current web sources. Run scripts/build-customer-web-contracts.cjs --check. */
(function(root){var module,globalThis=root,window=root;
root.MIQ_MOCK_DATA=root.MIQ_MOCK_DATA||{};
root.MIQ_MOCK_DATA.fleet={"schemaVersion":"1.0.0","dataset":"MACHINE IQ prototype fleet master","defaultCompany":{"companyId":"1933","companyName":"(주)세종물류중부지점"},"powerTypes":["엔진","납산","리튬"],"dashboardCompanies":[{"companyId":"1933","companyName":"(주)세종물류중부지점","vehicleCount":13,"connected":11,"disconnected":2,"running":8,"idle":3,"fault":2,"replacementNeeded":1,"replacementSoon":1,"dashboardRoles":["internal","dealer_owner","dealer_staff"]},{"companyId":"12894","companyName":"중원건기","vehicleCount":23,"connected":20,"disconnected":3,"running":13,"idle":7,"fault":1,"replacementNeeded":1,"replacementSoon":3,"dashboardRoles":["internal","dealer_owner","dealer_staff"]},{"companyId":"33767","companyName":"두산지게차 경남중부판매 주식회사","vehicleCount":5,"connected":4,"disconnected":1,"running":3,"idle":1,"fault":0,"replacementNeeded":1,"replacementSoon":1,"dashboardRoles":["internal","dealer_owner","dealer_staff"]},{"companyId":"364","companyName":"온양지게차(호성건설중기)","vehicleCount":3,"connected":2,"disconnected":1,"running":1,"idle":1,"fault":0,"replacementNeeded":0,"replacementSoon":0,"dashboardRoles":["internal","dealer_owner","dealer_staff"]},{"companyId":"3703","companyName":"태형금속공업(주)","vehicleCount":1,"connected":1,"disconnected":0,"running":1,"idle":0,"fault":0,"replacementNeeded":0,"replacementSoon":0,"dashboardRoles":["internal","dealer_owner","dealer_staff"]},{"companyId":"demo-company-006","companyName":"서울한빛물류(주)","vehicleCount":18,"connected":14,"disconnected":4,"running":7,"idle":7,"fault":0,"replacementNeeded":0,"replacementSoon":1,"dashboardRoles":["internal","dealer_owner","dealer_staff"],"demo":true},{"companyId":"demo-company-007","companyName":"서울새솔산업(주)","vehicleCount":35,"connected":27,"disconnected":8,"running":14,"idle":13,"fault":1,"replacementNeeded":3,"replacementSoon":3,"dashboardRoles":["internal","dealer_owner","dealer_staff"],"demo":true},{"companyId":"demo-company-008","companyName":"서울미래지게차(주)","vehicleCount":52,"connected":40,"disconnected":12,"running":21,"idle":19,"fault":2,"replacementNeeded":1,"replacementSoon":5,"dashboardRoles":["internal","dealer_owner","dealer_staff"],"demo":true},{"companyId":"demo-company-009","companyName":"서울대명유통(주)","vehicleCount":13,"connected":10,"disconnected":3,"running":5,"idle":5,"fault":3,"replacementNeeded":4,"replacementSoon":1,"dashboardRoles":["internal","dealer_owner","dealer_staff"],"demo":true},{"companyId":"demo-company-010","companyName":"서울청우정밀(주)","vehicleCount":30,"connected":24,"disconnected":6,"running":13,"idle":11,"fault":0,"replacementNeeded":2,"replacementSoon":3,"dashboardRoles":["internal","dealer_owner","dealer_staff"],"demo":true},{"companyId":"demo-company-011","companyName":"부산한빛물류(주)","vehicleCount":47,"connected":38,"disconnected":9,"running":21,"idle":17,"fault":1,"replacementNeeded":0,"replacementSoon":5,"dashboardRoles":["internal","dealer_owner","dealer_staff"],"demo":true},{"companyId":"demo-company-012","companyName":"부산새솔산업(주)","vehicleCount":8,"connected":6,"disconnected":2,"running":3,"idle":3,"fault":2,"replacementNeeded":3,"replacementSoon":1,"dashboardRoles":["internal","dealer_owner","dealer_staff"],"demo":true},{"companyId":"demo-company-013","companyName":"부산미래지게차(주)","vehicleCount":25,"connected":21,"disconnected":4,"running":12,"idle":9,"fault":3,"replacementNeeded":1,"replacementSoon":3,"dashboardRoles":["internal"],"demo":true},{"companyId":"demo-company-014","companyName":"부산대명유통(주)","vehicleCount":42,"connected":35,"disconnected":7,"running":20,"idle":15,"fault":0,"replacementNeeded":4,"replacementSoon":5,"dashboardRoles":["internal"],"demo":true},{"companyId":"demo-company-015","companyName":"부산청우정밀(주)","vehicleCount":59,"connected":50,"disconnected":9,"running":30,"idle":20,"fault":1,"replacementNeeded":2,"replacementSoon":1,"dashboardRoles":["internal"],"demo":true},{"companyId":"demo-company-016","companyName":"대구한빛물류(주)","vehicleCount":20,"connected":17,"disconnected":3,"running":10,"idle":7,"fault":2,"replacementNeeded":0,"replacementSoon":3,"dashboardRoles":["internal"],"demo":true},{"companyId":"demo-company-017","companyName":"대구새솔산업(주)","vehicleCount":37,"connected":32,"disconnected":5,"running":20,"idle":12,"fault":3,"replacementNeeded":3,"replacementSoon":5,"dashboardRoles":["internal"],"demo":true},{"companyId":"demo-company-018","companyName":"대구미래지게차(주)","vehicleCount":54,"connected":47,"disconnected":7,"running":29,"idle":18,"fault":0,"replacementNeeded":1,"replacementSoon":1,"dashboardRoles":["internal"],"demo":true},{"companyId":"demo-company-019","companyName":"대구대명유통(주)","vehicleCount":15,"connected":13,"disconnected":2,"running":8,"idle":5,"fault":1,"replacementNeeded":4,"replacementSoon":3,"dashboardRoles":["internal"],"demo":true},{"companyId":"demo-company-020","companyName":"대구청우정밀(주)","vehicleCount":32,"connected":28,"disconnected":4,"running":18,"idle":10,"fault":2,"replacementNeeded":2,"replacementSoon":5,"dashboardRoles":["internal"],"demo":true},{"companyId":"demo-company-021","companyName":"인천한빛물류(주)","vehicleCount":49,"connected":44,"disconnected":5,"running":29,"idle":15,"fault":3,"replacementNeeded":0,"replacementSoon":1,"dashboardRoles":["internal"],"demo":true},{"companyId":"demo-company-022","companyName":"인천새솔산업(주)","vehicleCount":10,"connected":9,"disconnected":1,"running":6,"idle":3,"fault":0,"replacementNeeded":3,"replacementSoon":3,"dashboardRoles":["internal"],"demo":true},{"companyId":"demo-company-023","companyName":"인천미래지게차(주)","vehicleCount":27,"connected":25,"disconnected":2,"running":17,"idle":8,"fault":1,"replacementNeeded":1,"replacementSoon":5,"dashboardRoles":["internal"],"demo":true},{"companyId":"demo-company-024","companyName":"인천대명유통(주)","vehicleCount":44,"connected":41,"disconnected":3,"running":28,"idle":13,"fault":2,"replacementNeeded":4,"replacementSoon":1,"dashboardRoles":["internal"],"demo":true},{"companyId":"demo-company-025","companyName":"인천청우정밀(주)","vehicleCount":5,"connected":5,"disconnected":0,"running":3,"idle":2,"fault":3,"replacementNeeded":2,"replacementSoon":3,"dashboardRoles":["internal"],"demo":true},{"companyId":"demo-company-026","companyName":"광주한빛물류(주)","vehicleCount":22,"connected":21,"disconnected":1,"running":15,"idle":6,"fault":0,"replacementNeeded":0,"replacementSoon":5,"dashboardRoles":["internal"],"demo":true},{"companyId":"demo-company-027","companyName":"광주새솔산업(주)","vehicleCount":39,"connected":29,"disconnected":10,"running":21,"idle":8,"fault":1,"replacementNeeded":3,"replacementSoon":1,"dashboardRoles":["internal"],"demo":true},{"companyId":"demo-company-028","companyName":"광주미래지게차(주)","vehicleCount":56,"connected":43,"disconnected":13,"running":31,"idle":12,"fault":2,"replacementNeeded":1,"replacementSoon":3,"dashboardRoles":["internal"],"demo":true},{"companyId":"demo-company-029","companyName":"광주대명유통(주)","vehicleCount":17,"connected":13,"disconnected":4,"running":9,"idle":4,"fault":3,"replacementNeeded":4,"replacementSoon":5,"dashboardRoles":["internal"],"demo":true},{"companyId":"demo-company-030","companyName":"광주청우정밀(주)","vehicleCount":34,"connected":27,"disconnected":7,"running":20,"idle":7,"fault":0,"replacementNeeded":2,"replacementSoon":1,"dashboardRoles":["internal"],"demo":true},{"companyId":"demo-company-031","companyName":"대전한빛물류(주)","vehicleCount":51,"connected":40,"disconnected":11,"running":30,"idle":10,"fault":1,"replacementNeeded":0,"replacementSoon":3,"dashboardRoles":["internal"],"demo":true},{"companyId":"demo-company-032","companyName":"대전새솔산업(주)","vehicleCount":12,"connected":10,"disconnected":2,"running":8,"idle":2,"fault":2,"replacementNeeded":3,"replacementSoon":5,"dashboardRoles":["internal"],"demo":true},{"companyId":"demo-company-033","companyName":"대전미래지게차(주)","vehicleCount":29,"connected":23,"disconnected":6,"running":18,"idle":5,"fault":3,"replacementNeeded":1,"replacementSoon":1,"dashboardRoles":["internal"],"demo":true},{"companyId":"demo-company-034","companyName":"대전대명유통(주)","vehicleCount":46,"connected":38,"disconnected":8,"running":30,"idle":8,"fault":0,"replacementNeeded":4,"replacementSoon":3,"dashboardRoles":["internal"],"demo":true},{"companyId":"demo-company-035","companyName":"대전청우정밀(주)","vehicleCount":7,"connected":6,"disconnected":1,"running":5,"idle":1,"fault":1,"replacementNeeded":2,"replacementSoon":5,"dashboardRoles":["internal"],"demo":true},{"companyId":"demo-company-036","companyName":"울산한빛물류(주)","vehicleCount":24,"connected":20,"disconnected":4,"running":16,"idle":4,"fault":2,"replacementNeeded":0,"replacementSoon":1,"dashboardRoles":["internal"],"demo":true},{"companyId":"demo-company-037","companyName":"울산새솔산업(주)","vehicleCount":41,"connected":35,"disconnected":6,"running":28,"idle":7,"fault":3,"replacementNeeded":3,"replacementSoon":3,"dashboardRoles":["internal"],"demo":true},{"companyId":"demo-company-038","companyName":"울산미래지게차(주)","vehicleCount":58,"connected":50,"disconnected":8,"running":41,"idle":9,"fault":0,"replacementNeeded":1,"replacementSoon":5,"dashboardRoles":["internal"],"demo":true},{"companyId":"demo-company-039","companyName":"울산대명유통(주)","vehicleCount":19,"connected":17,"disconnected":2,"running":14,"idle":3,"fault":1,"replacementNeeded":4,"replacementSoon":1,"dashboardRoles":["internal"],"demo":true},{"companyId":"demo-company-040","companyName":"울산청우정밀(주)","vehicleCount":36,"connected":32,"disconnected":4,"running":27,"idle":5,"fault":2,"replacementNeeded":2,"replacementSoon":3,"dashboardRoles":["internal"],"demo":true},{"companyId":"demo-company-041","companyName":"수원한빛물류(주)","vehicleCount":53,"connected":47,"disconnected":6,"running":40,"idle":7,"fault":3,"replacementNeeded":0,"replacementSoon":5,"dashboardRoles":["internal"],"demo":true},{"companyId":"demo-company-042","companyName":"수원새솔산업(주)","vehicleCount":14,"connected":13,"disconnected":1,"running":7,"idle":6,"fault":0,"replacementNeeded":3,"replacementSoon":1,"dashboardRoles":["internal"],"demo":true},{"companyId":"demo-company-043","companyName":"수원미래지게차(주)","vehicleCount":31,"connected":28,"disconnected":3,"running":14,"idle":14,"fault":1,"replacementNeeded":1,"replacementSoon":3,"dashboardRoles":["internal"],"demo":true},{"companyId":"demo-company-044","companyName":"수원대명유통(주)","vehicleCount":48,"connected":44,"disconnected":4,"running":23,"idle":21,"fault":2,"replacementNeeded":4,"replacementSoon":5,"dashboardRoles":["internal"],"demo":true},{"companyId":"demo-company-045","companyName":"수원청우정밀(주)","vehicleCount":9,"connected":8,"disconnected":1,"running":4,"idle":4,"fault":3,"replacementNeeded":2,"replacementSoon":1,"dashboardRoles":["internal"],"demo":true},{"companyId":"demo-company-046","companyName":"용인한빛물류(주)","vehicleCount":26,"connected":24,"disconnected":2,"running":13,"idle":11,"fault":0,"replacementNeeded":0,"replacementSoon":3,"dashboardRoles":["internal"],"demo":true},{"companyId":"demo-company-047","companyName":"용인새솔산업(주)","vehicleCount":43,"connected":41,"disconnected":2,"running":23,"idle":18,"fault":1,"replacementNeeded":3,"replacementSoon":5,"dashboardRoles":["internal"],"demo":true},{"companyId":"demo-company-048","companyName":"용인미래지게차(주)","vehicleCount":60,"connected":45,"disconnected":15,"running":25,"idle":20,"fault":2,"replacementNeeded":1,"replacementSoon":1,"dashboardRoles":["internal"],"demo":true},{"companyId":"demo-company-049","companyName":"용인대명유통(주)","vehicleCount":21,"connected":16,"disconnected":5,"running":9,"idle":7,"fault":3,"replacementNeeded":4,"replacementSoon":3,"dashboardRoles":["internal"],"demo":true},{"companyId":"demo-company-050","companyName":"용인청우정밀(주)","vehicleCount":38,"connected":29,"disconnected":9,"running":17,"idle":12,"fault":0,"replacementNeeded":2,"replacementSoon":5,"dashboardRoles":["internal"],"demo":true},{"companyId":"demo-company-051","companyName":"평택한빛물류(주)","vehicleCount":55,"connected":43,"disconnected":12,"running":25,"idle":18,"fault":1,"replacementNeeded":0,"replacementSoon":1,"dashboardRoles":["internal"],"demo":true},{"companyId":"demo-company-052","companyName":"평택새솔산업(주)","vehicleCount":16,"connected":13,"disconnected":3,"running":8,"idle":5,"fault":2,"replacementNeeded":3,"replacementSoon":3,"dashboardRoles":["internal"],"demo":true},{"companyId":"demo-company-053","companyName":"평택미래지게차(주)","vehicleCount":33,"connected":26,"disconnected":7,"running":16,"idle":10,"fault":3,"replacementNeeded":1,"replacementSoon":5,"dashboardRoles":["internal"],"demo":true},{"companyId":"demo-company-054","companyName":"평택대명유통(주)","vehicleCount":50,"connected":41,"disconnected":9,"running":25,"idle":16,"fault":0,"replacementNeeded":4,"replacementSoon":1,"dashboardRoles":["internal"],"demo":true},{"companyId":"demo-company-055","companyName":"평택청우정밀(주)","vehicleCount":11,"connected":9,"disconnected":2,"running":6,"idle":3,"fault":1,"replacementNeeded":2,"replacementSoon":3,"dashboardRoles":["internal"],"demo":true},{"companyId":"demo-company-056","companyName":"천안한빛물류(주)","vehicleCount":28,"connected":23,"disconnected":5,"running":15,"idle":8,"fault":2,"replacementNeeded":0,"replacementSoon":5,"dashboardRoles":["internal"],"demo":true},{"companyId":"demo-company-057","companyName":"천안새솔산업(주)","vehicleCount":45,"connected":38,"disconnected":7,"running":25,"idle":13,"fault":3,"replacementNeeded":3,"replacementSoon":1,"dashboardRoles":["internal"],"demo":true},{"companyId":"demo-company-058","companyName":"천안미래지게차(주)","vehicleCount":6,"connected":5,"disconnected":1,"running":3,"idle":2,"fault":0,"replacementNeeded":1,"replacementSoon":3,"dashboardRoles":["internal"],"demo":true},{"companyId":"demo-company-059","companyName":"천안대명유통(주)","vehicleCount":23,"connected":20,"disconnected":3,"running":13,"idle":7,"fault":1,"replacementNeeded":4,"replacementSoon":5,"dashboardRoles":["internal"],"demo":true},{"companyId":"demo-company-060","companyName":"천안청우정밀(주)","vehicleCount":40,"connected":35,"disconnected":5,"running":24,"idle":11,"fault":2,"replacementNeeded":2,"replacementSoon":1,"dashboardRoles":["internal"],"demo":true},{"companyId":"demo-company-061","companyName":"아산한빛물류(주)","vehicleCount":57,"connected":50,"disconnected":7,"running":35,"idle":15,"fault":3,"replacementNeeded":0,"replacementSoon":3,"dashboardRoles":["internal"],"demo":true},{"companyId":"demo-company-062","companyName":"아산새솔산업(주)","vehicleCount":18,"connected":16,"disconnected":2,"running":11,"idle":5,"fault":0,"replacementNeeded":3,"replacementSoon":5,"dashboardRoles":["internal"],"demo":true},{"companyId":"demo-company-063","companyName":"아산미래지게차(주)","vehicleCount":35,"connected":32,"disconnected":3,"running":23,"idle":9,"fault":1,"replacementNeeded":1,"replacementSoon":1,"dashboardRoles":["internal"],"demo":true},{"companyId":"demo-company-064","companyName":"아산대명유통(주)","vehicleCount":52,"connected":47,"disconnected":5,"running":34,"idle":13,"fault":2,"replacementNeeded":4,"replacementSoon":3,"dashboardRoles":["internal"],"demo":true},{"companyId":"demo-company-065","companyName":"아산청우정밀(주)","vehicleCount":13,"connected":12,"disconnected":1,"running":9,"idle":3,"fault":3,"replacementNeeded":2,"replacementSoon":5,"dashboardRoles":["internal"],"demo":true},{"companyId":"demo-company-066","companyName":"청주한빛물류(주)","vehicleCount":30,"connected":28,"disconnected":2,"running":21,"idle":7,"fault":0,"replacementNeeded":0,"replacementSoon":1,"dashboardRoles":["internal"],"demo":true},{"companyId":"demo-company-067","companyName":"청주새솔산업(주)","vehicleCount":47,"connected":44,"disconnected":3,"running":33,"idle":11,"fault":1,"replacementNeeded":3,"replacementSoon":3,"dashboardRoles":["internal"],"demo":true},{"companyId":"demo-company-068","companyName":"청주미래지게차(주)","vehicleCount":8,"connected":8,"disconnected":0,"running":6,"idle":2,"fault":2,"replacementNeeded":1,"replacementSoon":5,"dashboardRoles":["internal"],"demo":true},{"companyId":"demo-company-069","companyName":"청주대명유통(주)","vehicleCount":25,"connected":19,"disconnected":6,"running":15,"idle":4,"fault":3,"replacementNeeded":4,"replacementSoon":1,"dashboardRoles":["internal"],"demo":true},{"companyId":"demo-company-070","companyName":"청주청우정밀(주)","vehicleCount":42,"connected":32,"disconnected":10,"running":25,"idle":7,"fault":0,"replacementNeeded":2,"replacementSoon":3,"dashboardRoles":["internal"],"demo":true},{"companyId":"demo-company-071","companyName":"전주한빛물류(주)","vehicleCount":59,"connected":45,"disconnected":14,"running":36,"idle":9,"fault":1,"replacementNeeded":0,"replacementSoon":5,"dashboardRoles":["internal"],"demo":true},{"companyId":"demo-company-072","companyName":"전주새솔산업(주)","vehicleCount":20,"connected":16,"disconnected":4,"running":13,"idle":3,"fault":2,"replacementNeeded":3,"replacementSoon":1,"dashboardRoles":["internal"],"demo":true},{"companyId":"demo-company-073","companyName":"전주미래지게차(주)","vehicleCount":37,"connected":29,"disconnected":8,"running":23,"idle":6,"fault":3,"replacementNeeded":1,"replacementSoon":3,"dashboardRoles":["internal"],"demo":true},{"companyId":"demo-company-074","companyName":"전주대명유통(주)","vehicleCount":54,"connected":43,"disconnected":11,"running":35,"idle":8,"fault":0,"replacementNeeded":4,"replacementSoon":5,"dashboardRoles":["internal"],"demo":true},{"companyId":"demo-company-075","companyName":"전주청우정밀(주)","vehicleCount":15,"connected":12,"disconnected":3,"running":10,"idle":2,"fault":1,"replacementNeeded":2,"replacementSoon":1,"dashboardRoles":["internal"],"demo":true},{"companyId":"demo-company-076","companyName":"군산한빛물류(주)","vehicleCount":32,"connected":26,"disconnected":6,"running":22,"idle":4,"fault":2,"replacementNeeded":0,"replacementSoon":3,"dashboardRoles":["internal"],"demo":true},{"companyId":"demo-company-077","companyName":"군산새솔산업(주)","vehicleCount":49,"connected":41,"disconnected":8,"running":35,"idle":6,"fault":3,"replacementNeeded":3,"replacementSoon":5,"dashboardRoles":["internal"],"demo":true},{"companyId":"demo-company-078","companyName":"군산미래지게차(주)","vehicleCount":10,"connected":8,"disconnected":2,"running":4,"idle":4,"fault":0,"replacementNeeded":1,"replacementSoon":1,"dashboardRoles":["internal"],"demo":true},{"companyId":"demo-company-079","companyName":"군산대명유통(주)","vehicleCount":27,"connected":23,"disconnected":4,"running":12,"idle":11,"fault":1,"replacementNeeded":4,"replacementSoon":3,"dashboardRoles":["internal"],"demo":true},{"companyId":"demo-company-080","companyName":"군산청우정밀(주)","vehicleCount":44,"connected":38,"disconnected":6,"running":20,"idle":18,"fault":2,"replacementNeeded":2,"replacementSoon":5,"dashboardRoles":["internal"],"demo":true},{"companyId":"demo-company-081","companyName":"창원한빛물류(주)","vehicleCount":5,"connected":4,"disconnected":1,"running":2,"idle":2,"fault":3,"replacementNeeded":0,"replacementSoon":1,"dashboardRoles":["internal"],"demo":true},{"companyId":"demo-company-082","companyName":"창원새솔산업(주)","vehicleCount":22,"connected":19,"disconnected":3,"running":10,"idle":9,"fault":0,"replacementNeeded":3,"replacementSoon":3,"dashboardRoles":["internal"],"demo":true},{"companyId":"demo-company-083","companyName":"창원미래지게차(주)","vehicleCount":39,"connected":35,"disconnected":4,"running":19,"idle":16,"fault":1,"replacementNeeded":1,"replacementSoon":5,"dashboardRoles":["internal"],"demo":true},{"companyId":"demo-company-084","companyName":"창원대명유통(주)","vehicleCount":56,"connected":50,"disconnected":6,"running":28,"idle":22,"fault":2,"replacementNeeded":4,"replacementSoon":1,"dashboardRoles":["internal"],"demo":true},{"companyId":"demo-company-085","companyName":"창원청우정밀(주)","vehicleCount":17,"connected":15,"disconnected":2,"running":9,"idle":6,"fault":3,"replacementNeeded":2,"replacementSoon":3,"dashboardRoles":["internal"],"demo":true},{"companyId":"demo-company-086","companyName":"김해한빛물류(주)","vehicleCount":34,"connected":31,"disconnected":3,"running":18,"idle":13,"fault":0,"replacementNeeded":0,"replacementSoon":5,"dashboardRoles":["internal"],"demo":true},{"companyId":"demo-company-087","companyName":"김해새솔산업(주)","vehicleCount":51,"connected":47,"disconnected":4,"running":28,"idle":19,"fault":1,"replacementNeeded":3,"replacementSoon":1,"dashboardRoles":["internal"],"demo":true},{"companyId":"demo-company-088","companyName":"김해미래지게차(주)","vehicleCount":12,"connected":11,"disconnected":1,"running":7,"idle":4,"fault":2,"replacementNeeded":1,"replacementSoon":3,"dashboardRoles":["internal"],"demo":true},{"companyId":"demo-company-089","companyName":"김해대명유통(주)","vehicleCount":29,"connected":28,"disconnected":1,"running":17,"idle":11,"fault":3,"replacementNeeded":4,"replacementSoon":5,"dashboardRoles":["internal"],"demo":true},{"companyId":"demo-company-090","companyName":"김해청우정밀(주)","vehicleCount":46,"connected":35,"disconnected":11,"running":22,"idle":13,"fault":0,"replacementNeeded":2,"replacementSoon":1,"dashboardRoles":["internal"],"demo":true},{"companyId":"demo-company-091","companyName":"양산한빛물류(주)","vehicleCount":7,"connected":5,"disconnected":2,"running":3,"idle":2,"fault":1,"replacementNeeded":0,"replacementSoon":3,"dashboardRoles":["internal"],"demo":true},{"companyId":"demo-company-092","companyName":"양산새솔산업(주)","vehicleCount":24,"connected":18,"disconnected":6,"running":12,"idle":6,"fault":2,"replacementNeeded":3,"replacementSoon":5,"dashboardRoles":["internal"],"demo":true},{"companyId":"demo-company-093","companyName":"양산미래지게차(주)","vehicleCount":41,"connected":32,"disconnected":9,"running":21,"idle":11,"fault":3,"replacementNeeded":1,"replacementSoon":1,"dashboardRoles":["internal"],"demo":true},{"companyId":"demo-company-094","companyName":"양산대명유통(주)","vehicleCount":58,"connected":46,"disconnected":12,"running":30,"idle":16,"fault":0,"replacementNeeded":4,"replacementSoon":3,"dashboardRoles":["internal"],"demo":true},{"companyId":"demo-company-095","companyName":"양산청우정밀(주)","vehicleCount":19,"connected":15,"disconnected":4,"running":10,"idle":5,"fault":1,"replacementNeeded":2,"replacementSoon":5,"dashboardRoles":["internal"],"demo":true},{"companyId":"demo-company-096","companyName":"제주한빛물류(주)","vehicleCount":36,"connected":29,"disconnected":7,"running":20,"idle":9,"fault":2,"replacementNeeded":0,"replacementSoon":1,"dashboardRoles":["internal"],"demo":true},{"companyId":"demo-company-097","companyName":"제주새솔산업(주)","vehicleCount":53,"connected":43,"disconnected":10,"running":30,"idle":13,"fault":3,"replacementNeeded":3,"replacementSoon":3,"dashboardRoles":["internal"],"demo":true},{"companyId":"demo-company-098","companyName":"제주미래지게차(주)","vehicleCount":14,"connected":12,"disconnected":2,"running":8,"idle":4,"fault":0,"replacementNeeded":1,"replacementSoon":5,"dashboardRoles":["internal"],"demo":true},{"companyId":"demo-company-099","companyName":"제주대명유통(주)","vehicleCount":31,"connected":26,"disconnected":5,"running":18,"idle":8,"fault":1,"replacementNeeded":4,"replacementSoon":1,"dashboardRoles":["internal"],"demo":true},{"companyId":"demo-company-100","companyName":"제주청우정밀(주)","vehicleCount":48,"connected":41,"disconnected":7,"running":30,"idle":11,"fault":2,"replacementNeeded":2,"replacementSoon":3,"dashboardRoles":["internal"],"demo":true}],"vehicles":[{"companyId":"1933","companyName":"(주)세종물류중부지점","catalogOnly":false,"model":"B30S-7","vin":"FBA32_224250271","group":"기본그룹","type":"리튬","cumKm":12430,"cumH":3180,"conn":true,"soc":80,"km":16,"min":461,"summaryDetail":{"workMinutes":430,"idleMinutes":31,"supplyDueCount":1,"activeErrorCount":2},"eff":93.2,"shock":2,"bc":2.4},{"companyId":"1933","companyName":"(주)세종물류중부지점","catalogOnly":false,"model":"D25S-9","vin":"FBD25_113920044","group":"기본그룹","type":"엔진","cumKm":28910,"cumH":5640,"conn":false,"soc":null,"km":212,"min":5772,"summaryDetail":{"workMinutes":4502,"idleMinutes":1270,"supplyDueCount":null,"activeErrorCount":null},"eff":3.8,"shock":9,"fc":3.8},{"companyId":"1933","companyName":"(주)세종물류중부지점","catalogOnly":false,"model":"B18S-7","vin":"FBA18_224250094","group":"테스트그룹","type":"납산","cumKm":9870,"cumH":2410,"conn":true,"soc":null,"km":15,"min":1000,"summaryDetail":{"workMinutes":644,"idleMinutes":356,"supplyDueCount":null,"activeErrorCount":null},"eff":64.4,"shock":1,"bc":1.9},{"companyId":"1933","companyName":"(주)세종물류중부지점","catalogOnly":false,"model":"B20S-7","vin":"FBA20_224250312","group":"기본그룹","type":"리튬","cumKm":7240,"cumH":1860,"conn":true,"soc":62,"km":34,"min":1265,"summaryDetail":{"workMinutes":1121,"idleMinutes":144,"supplyDueCount":null,"activeErrorCount":null},"eff":88.6,"shock":3,"bc":2.1},{"companyId":"1933","companyName":"(주)세종물류중부지점","catalogOnly":false,"model":"B25S-7","vin":"FBA25_224250188","group":"기본그룹","type":"리튬","cumKm":15120,"cumH":4020,"conn":true,"soc":45,"km":58,"min":2598,"summaryDetail":{"workMinutes":2375,"idleMinutes":223,"supplyDueCount":null,"activeErrorCount":null},"eff":91.4,"shock":5,"bc":2.8},{"companyId":"1933","companyName":"(주)세종물류중부지점","catalogOnly":false,"model":"D30S-9","vin":"FBD30_113920117","group":"테스트그룹","type":"엔진","cumKm":33480,"cumH":6210,"conn":true,"soc":null,"km":187,"min":5307,"summaryDetail":{"workMinutes":3927,"idleMinutes":1380,"supplyDueCount":null,"activeErrorCount":null},"eff":4.1,"shock":7,"fc":4.1},{"companyId":"1933","companyName":"(주)세종물류중부지점","catalogOnly":false,"model":"B16S-7","vin":"FBA16_224250045","group":"물류2팀","type":"리튬","cumKm":4530,"cumH":1120,"conn":false,"soc":27,"km":12,"min":592,"summaryDetail":{"workMinutes":562,"idleMinutes":30,"supplyDueCount":null,"activeErrorCount":null},"eff":95,"shock":0,"bc":1.6},{"companyId":"1933","companyName":"(주)세종물류중부지점","catalogOnly":false,"model":"B35S-7","vin":"FBA35_224250403","group":"테스트그룹","type":"리튬","cumKm":19760,"cumH":5080,"conn":true,"soc":71,"km":76,"min":3693,"summaryDetail":{"workMinutes":3313,"idleMinutes":380,"supplyDueCount":null,"activeErrorCount":null},"eff":89.7,"shock":4,"bc":3.2},{"companyId":"1933","companyName":"(주)세종물류중부지점","catalogOnly":false,"model":"D18S-9","vin":"FBD18_113920062","group":"물류2팀","type":"엔진","cumKm":21340,"cumH":3970,"conn":true,"soc":null,"km":143,"min":3129,"summaryDetail":{"workMinutes":2566,"idleMinutes":563,"supplyDueCount":null,"activeErrorCount":null},"eff":3.5,"shock":6,"fc":3.5},{"companyId":"1933","companyName":"(주)세종물류중부지점","catalogOnly":false,"model":"B22S-7","vin":"FBA22_224250226","group":"테스트그룹","type":"납산","cumKm":11090,"cumH":2880,"conn":false,"soc":null,"km":22,"min":1104,"summaryDetail":{"workMinutes":786,"idleMinutes":318,"supplyDueCount":null,"activeErrorCount":null},"eff":71.2,"shock":2,"bc":2},{"vin":"FDB19-000122","model":"D50S-9","type":"엔진","companyId":"12894","companyName":"중원건기","group":"기본그룹","km":0,"min":239,"operatingRate":6.2,"efficiencyRate":99.5,"eff":99.5,"shock":0,"fc":3.7,"bc":null,"soc":null,"energyRate":null,"conn":null,"cumKm":null,"cumH":null,"catalogOnly":true},{"vin":"FDB19_225060343","model":"D50S-9","type":"엔진","companyId":"12894","companyName":"중원건기","group":"기본그룹","km":5,"min":1316,"operatingRate":15.2,"efficiencyRate":98.7,"eff":98.7,"shock":61,"fc":4.3,"bc":null,"soc":null,"energyRate":45,"conn":true,"cumKm":null,"cumH":null,"catalogOnly":true},{"vin":"FDB19_225060042","model":"D50S-9","type":"엔진","companyId":"33767","companyName":"두산지게차 경남중부판매 주식회사","group":"기본그룹","km":16,"min":4600,"operatingRate":56.4,"efficiencyRate":97.2,"eff":97.2,"shock":430,"fc":6,"bc":null,"soc":null,"energyRate":null,"conn":null,"cumKm":null,"cumH":null,"catalogOnly":true},{"vin":"FDB21-001898","model":"D70S-9","type":"엔진","companyId":"33767","companyName":"두산지게차 경남중부판매 주식회사","group":"기본그룹","km":27,"min":2044,"operatingRate":42.6,"efficiencyRate":77.5,"eff":77.5,"shock":2,"fc":5,"bc":null,"soc":null,"energyRate":null,"conn":null,"cumKm":null,"cumH":null,"catalogOnly":true},{"vin":"FDB21_224250294","model":"D70S-9","type":"엔진","companyId":"12894","companyName":"중원건기","group":"기본그룹","km":6,"min":1501,"operatingRate":31.3,"efficiencyRate":99.3,"eff":99.3,"shock":23,"fc":5.3,"bc":null,"soc":null,"energyRate":null,"conn":null,"cumKm":null,"cumH":null,"catalogOnly":true},{"vin":"FDB21_225060126","model":"D70S-9","type":"엔진","companyId":"12894","companyName":"중원건기","group":"기본그룹","km":0,"min":51,"operatingRate":2.1,"efficiencyRate":98.3,"eff":98.3,"shock":0,"fc":5.5,"bc":null,"soc":null,"energyRate":null,"conn":null,"cumKm":null,"cumH":null,"catalogOnly":true},{"vin":"FDB21_224250450","model":"D70S-9","type":"엔진","companyId":"12894","companyName":"중원건기","group":"기본그룹","km":27,"min":8426,"operatingRate":125.4,"efficiencyRate":97.2,"eff":97.2,"shock":241,"fc":4.2,"bc":null,"soc":null,"energyRate":null,"conn":null,"cumKm":null,"cumH":null,"catalogOnly":true},{"vin":"FDB21_224250307","model":"D70S-9","type":"엔진","companyId":"12894","companyName":"중원건기","group":"기본그룹","km":0,"min":32,"operatingRate":3.4,"efficiencyRate":84.5,"eff":84.5,"shock":0,"fc":6.7,"bc":null,"soc":null,"energyRate":null,"conn":null,"cumKm":null,"cumH":null,"catalogOnly":true},{"vin":"FDB21_224250283","model":"D70S-9","type":"엔진","companyId":"12894","companyName":"중원건기","group":"기본그룹","km":0,"min":237,"operatingRate":6.2,"efficiencyRate":98.1,"eff":98.1,"shock":23,"fc":4.8,"bc":null,"soc":null,"energyRate":null,"conn":null,"cumKm":null,"cumH":null,"catalogOnly":true},{"vin":"FDB21_225060005","model":"D70S-9","type":"엔진","companyId":"33767","companyName":"두산지게차 경남중부판매 주식회사","group":"기본그룹","km":3,"min":2066,"operatingRate":35.9,"efficiencyRate":99.4,"eff":99.4,"shock":3,"fc":3.1,"bc":null,"soc":null,"energyRate":null,"conn":null,"cumKm":null,"cumH":null,"catalogOnly":true},{"vin":"FDB21_225060182","model":"D70S-9","type":"엔진","companyId":"12894","companyName":"중원건기","group":"기본그룹","km":4,"min":469,"operatingRate":13.9,"efficiencyRate":97,"eff":97,"shock":5,"fc":4.5,"bc":null,"soc":null,"energyRate":null,"conn":null,"cumKm":null,"cumH":null,"catalogOnly":true},{"vin":"FDB21_225380045","model":"D70S-9","type":"엔진","companyId":"364","companyName":"온양지게차(호성건설중기)","group":"기본그룹","km":240,"min":600,"operatingRate":20.8,"efficiencyRate":99.7,"eff":99.7,"shock":83,"fc":7,"bc":null,"soc":null,"energyRate":null,"conn":null,"cumKm":null,"cumH":null,"catalogOnly":true},{"vin":"FDB21_224250226","model":"D70S-9","type":"엔진","companyId":"12894","companyName":"중원건기","group":"테스트그룹","km":9,"min":1186,"operatingRate":19,"efficiencyRate":84.4,"eff":84.4,"shock":27,"fc":4.4,"bc":null,"soc":null,"energyRate":null,"conn":null,"cumKm":null,"cumH":null,"catalogOnly":true},{"vin":"FDB21_224250363","model":"D70S-9","type":"엔진","companyId":"12894","companyName":"중원건기","group":"테스트그룹","km":1,"min":702,"operatingRate":11.3,"efficiencyRate":98.9,"eff":98.9,"shock":5,"fc":3.5,"bc":null,"soc":null,"energyRate":null,"conn":null,"cumKm":null,"cumH":null,"catalogOnly":true},{"vin":"FDB21_224250428","model":"D70S-9","type":"엔진","companyId":"12894","companyName":"중원건기","group":"테스트그룹","km":5,"min":1297,"operatingRate":20.8,"efficiencyRate":97.3,"eff":97.3,"shock":5,"fc":4.6,"bc":null,"soc":null,"energyRate":null,"conn":null,"cumKm":null,"cumH":null,"catalogOnly":true},{"vin":"FDB21_225060407","model":"D70S-9","type":"엔진","companyId":"12894","companyName":"중원건기","group":"테스트그룹","km":16,"min":8949,"operatingRate":133.2,"efficiencyRate":63.4,"eff":63.4,"shock":106,"fc":3.9,"bc":null,"soc":null,"energyRate":null,"conn":null,"cumKm":null,"cumH":null,"catalogOnly":true},{"vin":"FDB21_224250305","model":"D70S-9","type":"엔진","companyId":"3703","companyName":"태형금속공업(주)","group":"테스트그룹","km":20,"min":2614,"operatingRate":34,"efficiencyRate":74.7,"eff":74.7,"shock":1,"fc":4,"bc":null,"soc":null,"energyRate":null,"conn":null,"cumKm":null,"cumH":null,"catalogOnly":true},{"vin":"FDB21-001903","model":"D70S-9","type":"엔진","companyId":"33767","companyName":"두산지게차 경남중부판매 주식회사","group":"테스트그룹","km":37,"min":5934,"operatingRate":77.3,"efficiencyRate":94.7,"eff":94.7,"shock":196,"fc":4.3,"bc":null,"soc":null,"energyRate":null,"conn":null,"cumKm":null,"cumH":null,"catalogOnly":true},{"vin":"FDB21_224250275","model":"D70S-9","type":"엔진","companyId":"12894","companyName":"중원건기","group":"테스트그룹","km":12,"min":2912,"operatingRate":67.4,"efficiencyRate":99.5,"eff":99.5,"shock":0,"fc":4.2,"bc":null,"soc":null,"energyRate":null,"conn":null,"cumKm":null,"cumH":null,"catalogOnly":true},{"vin":"FDB21_225060095","model":"D70S-9","type":"엔진","companyId":"33767","companyName":"두산지게차 경남중부판매 주식회사","group":"테스트그룹","km":23,"min":7111,"operatingRate":87.1,"efficiencyRate":93.7,"eff":93.7,"shock":3,"fc":3.4,"bc":null,"soc":null,"energyRate":null,"conn":null,"cumKm":null,"cumH":null,"catalogOnly":true},{"vin":"FDB21_224030182","model":"D70S-9","type":"엔진","companyId":"364","companyName":"온양지게차(호성건설중기)","group":"테스트그룹","km":2,"min":835,"operatingRate":43.5,"efficiencyRate":98,"eff":98,"shock":1,"fc":3.2,"bc":null,"soc":null,"energyRate":null,"conn":null,"cumKm":null,"cumH":null,"catalogOnly":true},{"vin":"FBA36_225380008","model":"B25SE-7","type":"납산","companyId":"364","companyName":"온양지게차(호성건설중기)","group":"테스트그룹","km":128,"min":28800,"operatingRate":300,"efficiencyRate":83.1,"eff":83.1,"shock":46,"fc":null,"bc":null,"soc":null,"energyRate":67,"conn":false,"cumKm":null,"cumH":null,"catalogOnly":true},{"vin":"FBA32-002415","model":"B30S-7","type":"리튬","companyId":"12894","companyName":"중원건기","group":"물류1팀","km":148,"min":8613,"operatingRate":119.6,"efficiencyRate":80.7,"eff":80.7,"shock":0,"fc":null,"bc":null,"soc":80,"energyRate":80,"conn":true,"cumKm":null,"cumH":null,"catalogOnly":true},{"vin":"FBA34-000619","model":"B35S-7","type":"리튬","companyId":"12894","companyName":"중원건기","group":"물류1팀","km":63,"min":2986,"operatingRate":41.5,"efficiencyRate":65.3,"eff":65.3,"shock":6,"fc":null,"bc":null,"soc":null,"energyRate":null,"conn":null,"cumKm":null,"cumH":null,"catalogOnly":true},{"vin":"FDB21_224030076","model":"D70S-9","type":"엔진","companyId":"12894","companyName":"중원건기","group":"물류1팀","km":0,"min":6,"operatingRate":1.3,"efficiencyRate":98.9,"eff":98.9,"shock":0,"fc":4.8,"bc":null,"soc":null,"energyRate":null,"conn":null,"cumKm":null,"cumH":null,"catalogOnly":true},{"vin":"FDB21-003185","model":"D70S-9","type":"엔진","companyId":"12894","companyName":"중원건기","group":"물류1팀","km":17,"min":5637,"operatingRate":78.3,"efficiencyRate":99.3,"eff":99.3,"shock":10,"fc":3.8,"bc":null,"soc":null,"energyRate":null,"conn":null,"cumKm":null,"cumH":null,"catalogOnly":true},{"vin":"FDB21-002991","model":"D70S-9","type":"엔진","companyId":"12894","companyName":"중원건기","group":"물류1팀","km":22,"min":4906,"operatingRate":68.1,"efficiencyRate":97,"eff":97,"shock":3,"fc":5,"bc":null,"soc":null,"energyRate":null,"conn":null,"cumKm":null,"cumH":null,"catalogOnly":true},{"vin":"FDB21-002888","model":"D70S-9","type":"엔진","companyId":"12894","companyName":"중원건기","group":"물류1팀","km":50,"min":15393,"operatingRate":229.1,"efficiencyRate":97.9,"eff":97.9,"shock":11,"fc":3.7,"bc":null,"soc":null,"energyRate":null,"conn":null,"cumKm":null,"cumH":null,"catalogOnly":true},{"vin":"FDB21-002887","model":"D70S-9","type":"엔진","companyId":"12894","companyName":"중원건기","group":"물류1팀","km":63,"min":16797,"operatingRate":250,"efficiencyRate":98.5,"eff":98.5,"shock":16,"fc":3.8,"bc":null,"soc":null,"energyRate":null,"conn":null,"cumKm":null,"cumH":null,"catalogOnly":true},{"vin":"FDB21_224030105","model":"D70S-9","type":"엔진","companyId":"12894","companyName":"중원건기","group":"물류1팀","km":3,"min":1120,"operatingRate":21.2,"efficiencyRate":89.7,"eff":89.7,"shock":11,"fc":5.9,"bc":null,"soc":null,"energyRate":null,"conn":null,"cumKm":null,"cumH":null,"catalogOnly":true},{"vin":"FDB21-003358","model":"D70S-9","type":"엔진","companyId":"12894","companyName":"중원건기","group":"물류1팀","km":19,"min":3684,"operatingRate":69.8,"efficiencyRate":98.8,"eff":98.8,"shock":8,"fc":4.1,"bc":null,"soc":null,"energyRate":null,"conn":null,"cumKm":null,"cumH":null,"catalogOnly":true},{"vin":"FDB21-002985","model":"D70S-9","type":"엔진","companyId":"12894","companyName":"중원건기","group":"물류1팀","km":20,"min":4822,"operatingRate":67,"efficiencyRate":97.2,"eff":97.2,"shock":1,"fc":4.5,"bc":null,"soc":null,"energyRate":null,"conn":null,"cumKm":null,"cumH":null,"catalogOnly":true},{"companyId":"1933","companyName":"(주)세종물류중부지점","catalogOnly":false,"demo":true,"group":"물류1팀","model":"B30S-7","vin":"FBA32_DEMO_CS01","type":"리튬","cumKm":12540,"cumH":3180,"conn":true,"soc":78,"km":84,"min":2160,"eff":88,"shock":2,"bc":2.8,"summaryDetail":{"workMinutes":1900,"idleMinutes":260,"supplyDueCount":0,"activeErrorCount":1}},{"companyId":"1933","companyName":"(주)세종물류중부지점","catalogOnly":false,"demo":true,"group":"물류1팀","model":"B18S-7","vin":"FBA18_DEMO_CS02","type":"납산","cumKm":7340,"cumH":1840,"conn":false,"soc":46,"km":36,"min":960,"eff":75,"shock":0,"bc":3.2,"summaryDetail":{"workMinutes":720,"idleMinutes":240,"supplyDueCount":0,"activeErrorCount":0}},{"companyId":"1933","companyName":"(주)세종물류중부지점","catalogOnly":false,"demo":true,"group":"물류1팀","model":"D30S-9","vin":"FBD30_DEMO_CS03","type":"엔진","cumKm":18520,"cumH":4260,"conn":true,"soc":null,"km":126,"min":2820,"eff":3.7,"efficiencyRate":81.9,"shock":1,"fc":3.7,"summaryDetail":{"workMinutes":2310,"idleMinutes":510,"supplyDueCount":0,"activeErrorCount":0}}]};
root.MIQ_MOCK_DATA.observationProfiles={"schemaVersion":"1.0.0","kind":"demo-generation-profiles","measuredTelemetry":false,"timeZone":"Asia/Seoul","schedule":{"startHour":8,"endHour":18,"description":"Demo only: 10 hours per calendar day; not a production working calendar."},"provenance":"2026-09-24: explicitly calibrated from the 13 existing metric records using 22 demo operating days. The original undated snapshot is not measured daily telemetry. Missing catalog vehicles have no profile.","profiles":[{"vin":"FBA32_224250271","companyId":"1933","dailyRunningMinutes":21,"workingShare":0.9327548806941431,"kmPerRunningHour":2.0824295010845986,"dailyShockCount":0.09090909090909091,"fuelLitresPerHour":null,"batteryKwhPerHour":2.4,"batteryGaugeSource":"fleet.soc.fixed-demo"},{"vin":"FBD25_113920044","companyId":"1933","dailyRunningMinutes":262,"workingShare":0.77997227997228,"kmPerRunningHour":2.2037422037422036,"dailyShockCount":0.4090909090909091,"fuelLitresPerHour":3.8,"batteryKwhPerHour":null},{"vin":"FBA18_224250094","companyId":"1933","dailyRunningMinutes":45,"workingShare":0.644,"kmPerRunningHour":0.8999999999999999,"dailyShockCount":0.045454545454545456,"fuelLitresPerHour":null,"batteryKwhPerHour":1.9},{"vin":"FBA20_224250312","companyId":"1933","dailyRunningMinutes":58,"workingShare":0.8861660079051383,"kmPerRunningHour":1.6126482213438735,"dailyShockCount":0.13636363636363635,"fuelLitresPerHour":null,"batteryKwhPerHour":2.1,"batteryGaugeSource":"fleet.soc.fixed-demo"},{"vin":"FBA25_224250188","companyId":"1933","dailyRunningMinutes":118,"workingShare":0.9141647421093149,"kmPerRunningHour":1.3394919168591224,"dailyShockCount":0.22727272727272727,"fuelLitresPerHour":null,"batteryKwhPerHour":2.8,"batteryGaugeSource":"fleet.soc.fixed-demo"},{"vin":"FBD30_113920117","companyId":"1933","dailyRunningMinutes":241,"workingShare":0.7399660825325043,"kmPerRunningHour":2.114188807235726,"dailyShockCount":0.3181818181818182,"fuelLitresPerHour":4.1,"batteryKwhPerHour":null},{"vin":"FBA16_224250045","companyId":"1933","dailyRunningMinutes":27,"workingShare":0.9493243243243243,"kmPerRunningHour":1.2162162162162162,"dailyShockCount":0,"fuelLitresPerHour":null,"batteryKwhPerHour":1.6,"batteryGaugeSource":"fleet.soc.fixed-demo"},{"vin":"FBA35_224250403","companyId":"1933","dailyRunningMinutes":168,"workingShare":0.8971026265908475,"kmPerRunningHour":1.2347684809098294,"dailyShockCount":0.18181818181818182,"fuelLitresPerHour":null,"batteryKwhPerHour":3.2,"batteryGaugeSource":"fleet.soc.fixed-demo"},{"vin":"FBD18_113920062","companyId":"1933","dailyRunningMinutes":142,"workingShare":0.8200703100031959,"kmPerRunningHour":2.7420901246404603,"dailyShockCount":0.2727272727272727,"fuelLitresPerHour":3.5,"batteryKwhPerHour":null},{"vin":"FBA22_224250226","companyId":"1933","dailyRunningMinutes":50,"workingShare":0.7119565217391305,"kmPerRunningHour":1.1956521739130437,"dailyShockCount":0.09090909090909091,"fuelLitresPerHour":null,"batteryKwhPerHour":2},{"vin":"FBA32_DEMO_CS01","companyId":"1933","dailyRunningMinutes":98,"workingShare":0.8796296296296297,"kmPerRunningHour":2.3333333333333335,"dailyShockCount":0.09090909090909091,"fuelLitresPerHour":null,"batteryKwhPerHour":2.8,"batteryGaugeSource":"fleet.soc.fixed-demo"},{"vin":"FBA18_DEMO_CS02","companyId":"1933","dailyRunningMinutes":44,"workingShare":0.75,"kmPerRunningHour":2.25,"dailyShockCount":0,"fuelLitresPerHour":null,"batteryKwhPerHour":3.2,"batteryGaugeSource":"fleet.soc.fixed-demo"},{"vin":"FBD30_DEMO_CS03","companyId":"1933","dailyRunningMinutes":128,"workingShare":0.8191489361702128,"kmPerRunningHour":2.6808510638297873,"dailyShockCount":0.045454545454545456,"fuelLitresPerHour":3.7,"batteryKwhPerHour":null}],"batteryChargeScenario":{"kind":"fixed-demo-from-existing-master-soc","measuredHistory":false,"description":"Explicit constant demo charge levels across sample dates. Numeric source stays only in fleet.vehicles[].soc; not production historical readings. Real reports use server batteryRate derived from GAUGE_RATE. Missing/non-battery values remain unavailable; no energy conversion."}};
/* DOM-free prototype rules. Keep business-specific forms and data in their pages.
   Classic-script + CommonJS entry points let the same rules run in browser/tests.
   Role policies below simulate QA visibility; they are NOT server authorization. */
(function (root, factory) {
  var api = factory();
  api.view = {
    get: function (node, prop) { return root.MIQI18n ? root.MIQI18n.get(node, prop) : node[prop]; },
    set: function (node, prop, value) { if (root.MIQI18n) return root.MIQI18n.set(node, prop, value); node[prop] = value; return value; },
    call: function (node, method, args) { return root.MIQI18n ? root.MIQI18n.call(node, method, args) : node[method].apply(node, args); }
  };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.MIQCommon = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  var roles = [
    { code: 'internal', label: '내부 사용자' },
    { code: 'dealer_owner', label: '딜러 대표' },
    { code: 'dealer_staff', label: '딜러 직원' },
    { code: 'customer_owner', label: '고객 대표' },
    { code: 'customer_staff', label: '고객 직원' }
  ];
  var codes = roles.map(function (role) { return role.code; });
  var capabilities = {
    internal: [],
    dealer_owner: ['approveUserRequest', 'approveVehicleRequest'],
    dealer_staff: [],
    customer_owner: ['approveUserRequest', 'assignUserGroup', 'deactivateCustomerStaff', 'manageGroup', 'assignGroupVehicle', 'editVehicle', 'requestVehicle'],
    customer_staff: []
  };
  var targetPolicies = {
    internal:       { hideCompany: false, hideGroup: true,  companyId: '', companyIds: null },
    dealer_owner:   { hideCompany: false, hideGroup: true,  companyId: '', companyIds: null },
    dealer_staff:   { hideCompany: false, hideGroup: true,  companyId: '', companyIds: null },
    customer_owner: { hideCompany: true,  hideGroup: false, companyId: '1933', companyIds: ['1933'] },
    customer_staff: { hideCompany: true,  hideGroup: true,  companyId: '1933', companyIds: ['1933'] }
  };
  function resolveRole(value) { return codes.indexOf(value) > -1 ? value : 'customer_owner'; }
  function isDealer(role) { return role === 'dealer_owner' || role === 'dealer_staff'; }
  function isCustomer(role) { return role === 'customer_owner' || role === 'customer_staff'; }
  function canUseFavorites(role) { return isDealer(role) || isCustomer(role); }
  function roleLabel(role) { return roles[codes.indexOf(resolveRole(role))].label; }
  function targetPolicy(role) {
    var policy = targetPolicies[resolveRole(role)];
    return { hideCompany: policy.hideCompany, hideGroup: policy.hideGroup, companyId: policy.companyId,
      companyIds: policy.companyIds ? policy.companyIds.slice() : null,
      group: resolveRole(role) === 'customer_staff' ? '물류1팀' : '' };
  }
  function filterVehicles(role, vehicles) {
    var policy = targetPolicy(role);
    return (Array.isArray(vehicles) ? vehicles : []).filter(function (vehicle) {
      return vehicle && (!policy.companyIds || policy.companyIds.indexOf(String(vehicle.companyId || '')) > -1)
        && (!policy.group || vehicle.group === policy.group);
    });
  }

  function formatDate(date) {
    return date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0') + '-' + String(date.getDate()).padStart(2, '0');
  }
  function parseDate(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return null;
    var parts = value.split('-').map(Number);
    var date = new Date(parts[0], parts[1] - 1, parts[2]);
    return date.getFullYear() === parts[0] && date.getMonth() === parts[1] - 1 && date.getDate() === parts[2] ? date : null;
  }
  function addDays(date, days) {
    var result = new Date(date.getTime());
    result.setDate(result.getDate() + days);
    return result;
  }
  function today(reference) {
    var value = new Date((reference || new Date()).getTime());
    value.setHours(12, 0, 0, 0);
    return value;
  }
  function yesterday(reference) { return addDays(today(reference), -1); }
  function dayCount(from, to) {
    function day(date) { return Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()); }
    return Math.round((day(to) - day(from)) / 86400000) + 1;
  }
  function range(from, to) { return { from: formatDate(from), to: formatDate(to) }; }
  function operatingRange(mode, anchor) {
    var end = anchor || yesterday();
    var start = mode === 'w' ? addDays(end, -6) : mode === 'm' ? new Date(end.getFullYear(), end.getMonth(), 1, 12) : end;
    return range(start, end);
  }
  function linkedWeek(date, edge) {
    return edge === 'start' ? range(date, addDays(date, 6)) : range(addDays(date, -6), date);
  }
  function monthRange(anchor, latest) {
    var start = new Date(anchor.getFullYear(), anchor.getMonth(), 1, 12);
    var end = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0, 12);
    if (latest && end > latest && start <= latest) end = latest;
    return range(start, end);
  }
  function requestRange(period, reference) {
    if (period === 'all') return { from: '', to: '' };
    var end = today(reference);
    var start;
    if (period === 'w') start = addDays(end, -6);
    else {
      var months = period === 'q' ? 3 : 1;
      var lastDay = new Date(end.getFullYear(), end.getMonth() - months + 1, 0).getDate();
      start = new Date(end.getFullYear(), end.getMonth() - months, Math.min(end.getDate(), lastDay), 12);
    }
    return range(start, end);
  }

  function normalizeSearch(value) { return String(value == null ? '' : value).replace(/\s+/g, ' ').trim().toLowerCase(); }
  function menuHref(path, role, base) {
    var url = new URL(path, base);
    url.search = '';
    url.hash = '';
    url.searchParams.set('role', resolveRole(role));
    return url.href;
  }
  function serviceMenuHref(path, role, base, committedQuery) {
    var url = new URL(menuHref(path, role, base));
    var current = new URL(base);
    if (typeof committedQuery === 'string') current.search = committedQuery;
    ['companyId', 'group', 'type', 'veh', 'period', 'from', 'to'].forEach(function (key) {
      var value = current.searchParams.get(key);
      if (value) url.searchParams.set(key, value);
    });
    return url.href;
  }
  function listReturnHref(saved, fallback, role, base) {
    var destination = new URL(fallback, base);
    var paths = ['../Vehicle%20Summary/vehicle-summary-tobe-option-a-expand.html',
      '../Vehicle%20Summary/vehicle-summary-tobe-2.html',
      '../Vehicle%20Summary/vehicle-summary-tobe-3.html',
      '../Vehicle%20Summary/vehicle-summary-tobe-v2.html',
      '../Vehicle%20Summary/vehicle-summary-tobe-option-b-sort.html',
      '../Vehicle%20Summary/vehicle-summary-tobe-option-c-reference-sort.html',
      '../Service/service-tobe-v2.html',
      '../Service/service-maintenance-tobe.html',
      '../Service/service-supply-tobe.html',
      '../Service/service-error-tobe.html'];
    if (canUseFavorites(role)) paths.push('../Interest%20Vehicles/interest-vehicles-status-tobe.html');
    try {
      var candidate = new URL(saved || '', base);
      if (saved && candidate.origin === destination.origin && paths.some(function (path) {
        return new URL(path, base).pathname === candidate.pathname;
      })) destination = candidate;
    } catch (error) { /* Invalid return context falls back to the summary list. */ }
    destination.searchParams.delete('returnTo');
    destination.searchParams.set('role', resolveRole(role));
    destination.hash = '';
    return destination.href;
  }
  function vehicleDetailReturnHref(savedQuery, role, base) {
    var destination = new URL('../Vehicle%20Detail/vehicle-detail-tobe.html', base);
    var saved = new URLSearchParams(savedQuery || '');
    ['companyId', 'group', 'type', 'veh', 'model', 'period', 'from', 'to', 'metric', 'sort', 'dir', 'source', 'returnTo'].forEach(function (key) {
      if (saved.has(key)) destination.searchParams.set(key, saved.get(key));
    });
    destination.searchParams.set('role', resolveRole(role));
    return destination.href;
  }
  function createSearch(initial) {
    var applied = String(initial == null ? '' : initial).trim();
    return {
      read: function () { return normalizeSearch(applied); },
      value: function () { return applied; },
      commit: function (value) { applied = String(value == null ? '' : value).trim(); return normalizeSearch(applied); }
    };
  }
  function bindSearch(input, submit, onApply) {
    var state = createSearch(input.value);
    function apply(event) {
      if (event) event.preventDefault();
      state.commit(input.value);
      onApply();
    }
    function keydown(event) {
      if (event.key === 'Enter' && !event.isComposing && event.keyCode !== 229) apply(event);
    }
    input.addEventListener('keydown', keydown);
    submit.addEventListener('click', apply);
    state.destroy = function () {
      input.removeEventListener('keydown', keydown);
      submit.removeEventListener('click', apply);
    };
    return state;
  }

  // Display only. Never feed rounded labels back into metrics, thresholds or coordinates.
  function integer(value, grouped) {
    if (value === null || value === undefined || value === '' || typeof value === 'boolean') return '-';
    var numeric = Number(value);
    if (!Number.isFinite(numeric)) return '-';
    var rounded = Math.round(numeric);
    if (Object.is(rounded, -0)) rounded = 0;
    return grouped ? rounded.toLocaleString('ko-KR', { maximumFractionDigits: 0 }) : String(rounded);
  }

  return {
    numbers: { integer: integer },
    roles: {
      list: function () { return roles.map(function (role) { return { code: role.code, label: role.label }; }); },
      resolve: resolveRole, label: roleLabel, isDealer: isDealer, isCustomer: isCustomer, canUseFavorites: canUseFavorites,
      hasCapability: function (role, capability) { return codes.indexOf(role) > -1 && (!capability || capabilities[role].indexOf(capability) > -1); },
      targetPolicy: targetPolicy,
      filterVehicles: filterVehicles,
      scopeLabel: function (role) { return isCustomer(role) ? '전체 차량' : '전체 업체'; },
      dashboardDimension: function (role) { return role === 'internal' || isDealer(role) ? 'company' : 'group'; },
      hideDashboardComparison: function (role) { return role === 'customer_staff'; },
      hideMaintenanceDetails: isCustomer
    },
    dates: { format: formatDate, parse: parseDate, addDays: addDays, today: today, yesterday: yesterday,
      dayCount: dayCount, operatingRange: operatingRange, linkedWeek: linkedWeek, monthRange: monthRange, requestRange: requestRange },
    search: { normalize: normalizeSearch, create: createSearch, bind: bindSearch },
    navigation: { menuHref: menuHref, serviceMenuHref: serviceMenuHref, listReturnHref: listReturnHref, vehicleDetailReturnHref: vehicleDetailReturnHref }
  };
}));

(function(root){
var messages = {
    missing: ['페이지를 찾을 수 없습니다.', '주소가 변경되었거나 더 이상 제공되지 않는 페이지입니다. 주소를 확인하거나 로그인 화면으로 이동해 주세요.'],
    server: ['잠시 서비스를 이용할 수 없습니다.', '일시적인 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.'],
    unavailable: ['서비스가 일시 중단되었습니다.', '서비스 점검 또는 일시적인 과부하로 이용할 수 없습니다. 잠시 후 다시 시도해 주세요.'],
    session: ['다시 로그인이 필요합니다.', '로그인 상태가 만료되었습니다. 다시 로그인한 후 이용해 주세요.'],
    forbidden: ['접근 권한이 없습니다.', '이 정보를 이용할 권한이 없습니다. 소속 업체의 관리자에게 확인해 주세요.'],
    network: ['연결 상태를 확인해 주세요.', '서버에 연결하지 못했습니다. 인터넷 연결을 확인한 후 다시 시도해 주세요.'],
    timeout: ['응답이 지연되고 있습니다.', '요청 시간이 초과되었습니다. 잠시 후 다시 시도해 주세요.'],
    busy: ['잠시 후 다시 시도해 주세요.', '요청이 많아 처리하지 못했습니다. 잠시 기다린 후 다시 시도해 주세요.'],
    conflict: ['변경된 정보를 확인해 주세요.', '이미 처리되었거나 다른 사용자가 변경한 정보입니다. 최신 상태를 확인해 주세요.'],
    validation: ['입력 내용을 확인해 주세요.', '필수 항목과 입력 형식을 확인한 후 다시 시도해 주세요.'],
    invalid: ['정보를 불러오지 못했습니다.', '응답 정보를 확인할 수 없습니다. 잠시 후 다시 조회해 주세요.']
  };
  function kind(error) {
    error = error || {};
    if (error.name === 'AbortError') return 'cancelled';
    if (error.code === 'TIMEOUT') return 'timeout';
    if (error.code === 'INVALID_RESPONSE') return 'invalid';
    if (error.code === 'NETWORK' || error.name === 'TypeError') return 'network';
    var status = Number(error.status);
    return ({401:'session',403:'forbidden',404:'missing',408:'timeout',409:'conflict',400:'validation',422:'validation',429:'busy',503:'unavailable'})[status] || 'server';
  }
  function describe(error) {
    var type = typeof error === 'string' && messages[error] ? error : kind(error);
    if (type === 'cancelled') return {type:type, silent:true};
    return {type:type, title:messages[type][0], detail:messages[type][1], retry:['server','unavailable','network','timeout','busy','invalid'].includes(type)};
  }
root.MIQErrors={describe:describe};
})(window);
/* Deterministic DEMO intervals, never measured telemetry.
 * Profiles, vehicle master and UI translations are separate inputs. A query
 * selects existing VIN/date/hour samples; it must never seed their values.
 * Production must replace this provider with server-authorized interval data.
 */
(function(root, factory) {
  var commonJS = typeof module === 'object' && module.exports;
  var api = factory(commonJS ? require('../_mock-data/master/observation-profiles.json') : root.MIQ_MOCK_DATA.observationProfiles,
    commonJS ? require('../_mock-data/master/fleet.json') : root.MIQ_MOCK_DATA.fleet);
  if (commonJS) module.exports = api; else root.MIQObservations = api;
})(typeof window === 'undefined' ? globalThis : window, function(source, fleet) {
  'use strict';
  var profiles = new Map((source.profiles || []).map(function(p) { return [p.vin, p]; }));
  var catalog = fleet.vehicles || [];
  var vehiclesByVin = new Map(catalog.map(function(v) { return [v.vin,v]; }));
  var sampleCache = new Map();
  // Optional explicit prototype days. WEB callers keep the original 08~18 profile.
  // Install once before mobile rendering; never change the clock or query cutoff.
  var demoDays = new Map();
  function configureDemoDays(rows) {
    if (!Array.isArray(rows)) throw new Error('Demo days must be an array');
    var next = new Map();
    rows.forEach(function(r) {
      if (!r || !profiles.has(r.vin) || !date(r.date) ||
          !Number.isInteger(r.workMinutes) || r.workMinutes < 0 ||
          !Number.isInteger(r.idleMinutes) || r.idleMinutes < 0 ||
          !Number.isInteger(r.shockCount) || r.shockCount < 0 ||
          !Array.isArray(r.idleHours) || r.idleHours.some(function(h){return !Number.isInteger(h)||h<0||h>23;}) ||
          new Set(r.idleHours).size !== r.idleHours.length || r.idleHours.length >= 24 ||
          r.workMinutes+r.idleMinutes > (24-r.idleHours.length)*60) throw new Error('Invalid demo day');
      var key=r.vin+'|'+r.date;
      if(next.has(key))throw new Error('Duplicate demo day');
      next.set(key,Object.assign({},r,{idleHours:r.idleHours.slice()}));
    });
    demoDays=next;sampleCache.clear();
  }
  function numeric(v) { return typeof v === 'number' && Number.isFinite(v) && v >= 0; }
  function percent(v) { return numeric(v) && v <= 100; }
  function date(v) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(v || '')) return null;
    var d = new Date(v + 'T00:00:00Z');
    return Number.isFinite(d.getTime()) && d.toISOString().slice(0,10) === v ? d : null;
  }
  function shift(v, days) { return new Date(date(v).getTime() + days * 86400000).toISOString().slice(0,10); }
  function windowAt(now) {
    var d = new Date((now || new Date()).getTime() + 9 * 3600000);
    return { date:d.toISOString().slice(0,10), hours:d.getUTCHours(), timeZone:'Asia/Seoul' };
  }
  function cutoff(value) {
    var current = windowAt();
    if (typeof value === 'string') return value < current.date ? {date:value, hours:24} : current;
    return value || current;
  }
  function random(key) {
    var s = 2166136261;
    for (var i=0; i<key.length; i++) { s ^= key.charCodeAt(i); s = Math.imul(s,16777619); }
    return (s >>> 0) / 4294967296;
  }
  function part(total, hour, slots) { slots=slots||10;return Math.floor(total / slots) + (hour < total % slots ? 1 : 0); }
  function sample(vehicle, day, hour, asOf) {
    var p = vehicle && profiles.get(vehicle.vin), limit = cutoff(asOf);
    if (!p || !date(day) || hour < 0 || hour > 23 || day > limit.date || day === limit.date && hour >= limit.hours) return null;
    var key = p.vin + '|' + day;
    var cacheKey=key+'|'+hour;
    if(sampleCache.has(cacheKey))return sampleCache.get(cacheKey);
    var fixture=demoDays.get(key), slots=fixture?24-fixture.idleHours.length:10;
    var running = fixture?fixture.workMinutes+fixture.idleMinutes:Math.min(600, Math.round(p.dailyRunningMinutes * (.8 + random(key) * .4)));
    var working = fixture?fixture.workMinutes:Math.round(running * p.workingShare);
    var slot = fixture?hour-fixture.idleHours.filter(function(h){return h<hour;}).length:hour - 8;
    var scheduled = fixture?!fixture.idleHours.includes(hour):slot >= 0 && slot < 10;
    var work = scheduled ? part(working,slot,slots) : 0;
    var idle = scheduled ? part(running-working,slots-1-slot,slots) : 0;
    var minutes = work + idle;
    var shocks = fixture?fixture.shockCount:Math.floor(p.dailyShockCount) + (random(key+'|shock') < p.dailyShockCount % 1 ? 1 : 0);
    // Explicit fixed DEMO scenario only: reuse the existing master charge level.
    // This is not collected historical SOC and must not replace a server's
    // period batteryRate response. No kWh-to-percent conversion is performed.
    var masterVehicle=vehiclesByVin.get(p.vin), chargeSource=p.batteryGaugeSource;
    var chargeValue=chargeSource==='fleet.soc.fixed-demo' && masterVehicle && masterVehicle.type!=='엔진' && percent(masterVehicle.soc) ? masterVehicle.soc : null;
    var row={vin:p.vin, date:day, hour:hour, workMinutes:work, idleMinutes:idle,
      capacityMinutes:fixture?60:scheduled ? 60 : 0,
      distanceMetres:Math.round(minutes / 60 * p.kmPerRunningHour * 1000),
      shockCount:scheduled ? part(shocks,slot,slots) : 0,
      fuelLitres:numeric(p.fuelLitresPerHour) ? minutes / 60 * p.fuelLitresPerHour : null,
      batteryKwh:numeric(p.batteryKwhPerHour) ? minutes / 60 * p.batteryKwhPerHour : null,
      batteryChargePercent:chargeValue, batteryChargeProvenance:chargeValue===null?null:'fixed-demo-from-existing-master-soc', mock:true};
    if(sampleCache.size>=150000)sampleCache.clear();
    sampleCache.set(cacheKey,row);return row;
  }
  function totals(samples) {
    var rows = samples.filter(Boolean), work=0, idle=0, capacity=0, metres=0, shock=0;
    var fuel=0, fuelMinutes=0, fuelKnown=0, battery=0, batteryMinutes=0, batteryKnown=0, charge=0, chargeKnown=0;
    rows.forEach(function(r) {
      work+=r.workMinutes; idle+=r.idleMinutes; capacity+=r.capacityMinutes; metres+=r.distanceMetres; shock+=r.shockCount;
      if (numeric(r.fuelLitres)) { fuel+=r.fuelLitres; fuelMinutes+=r.workMinutes+r.idleMinutes; fuelKnown++; }
      if (numeric(r.batteryKwh)) { battery+=r.batteryKwh; batteryMinutes+=r.workMinutes+r.idleMinutes; batteryKnown++; }
      if (percent(r.batteryChargePercent)) { charge+=r.batteryChargePercent; chargeKnown++; }
    });
    var known=rows.length, running=work+idle;
    return {known:known, workMinutes:known?work:null, idleMinutes:known?idle:null, runningMinutes:known?running:null,
      capacityMinutes:known?capacity:null, distanceKm:known?metres/1000:null, shockCount:known?shock:null,
      efficiency:running>0?work/running*100:null, utilization:capacity>0?running/capacity*100:null,
      fuelLitres:fuelKnown?fuel:null, fuelRate:fuelMinutes>0?fuel/(fuelMinutes/60):null,
      batteryKwh:batteryKnown?battery:null, batteryRate:batteryMinutes>0?battery/(batteryMinutes/60):null,
      batteryChargePercent:chargeKnown?charge/chargeKnown:null};
  }
  function select(entity) {
    if (!entity) return [];
    if (Array.isArray(entity)) return unique(entity);
    if (entity.vehicles) return unique(entity.vehicles);
    if (entity.vin) return [entity];
    if (typeof entity === 'string') {
      var company = (fleet.dashboardCompanies || []).find(function(c) { return c.companyName===entity || String(c.companyId)===entity; });
      if (!company) return []; // Group names need a company scope; never guess it.
      entity={companyId:company.companyId};
    }
    var id=entity.companyId || entity.id;
    if (!id && entity.name) return select(entity.name);
    return catalog.filter(function(v) { return String(v.companyId)===String(id) && (!entity.group || v.group===entity.group); });
  }
  function unique(rows) { var seen=new Set(); return rows.filter(function(v) { if(seen.has(v.vin))return false; seen.add(v.vin); return true; }); }
  function intervals(entity, from, to, asOf, hour) {
    if (!date(from) || !date(to) || from>to || (date(to)-date(from))/86400000>365) return [];
    var vehicles=select(entity).filter(function(v) { return profiles.has(v.vin); }), rows=[];
    var limit=cutoff(asOf); if(to>limit.date)to=limit.date;
    for(var day=from;day<=to;day=shift(day,1)) vehicles.forEach(function(v) {
      for(var h=hour==null?0:hour;h<(hour==null?24:hour+1);h++) {var r=sample(v,day,h,limit);if(r)rows.push(r);}
    });
    return rows;
  }
  function aggregate(entity, from, to, asOf, hour) {
    var selected=select(entity), data=totals(intervals(selected,from,to,asOf,hour));
    data.vehicleCount=selected.length;
    data.knownVehicleCount=data.known ? selected.filter(function(v){return profiles.has(v.vin);}).length : 0;
    data.complete=data.knownVehicleCount===data.vehicleCount && data.vehicleCount>0;
    return data;
  }
  function value(data,key) {
    return {eff:data.efficiency,shock:data.shockCount,fuel:data.fuelRate,batt:data.batteryChargePercent,
      dist:data.distanceKm,hour:data.runningMinutes===null?null:data.runningMinutes/60}[key];
  }
  return {sample:sample,totals:totals,select:select,unique:unique,intervals:intervals,aggregate:aggregate,value:value,
    windowAt:windowAt,cutoff:cutoff,configureDemoDays:configureDemoDays,hasProfile:function(v){return !!v&&profiles.has(v.vin);},mock:true};
});

/* Pure prototype contracts. Values passed in by the caller; no server claims. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory(require('./vehicle-observations.js'));else root.MIQMeeting=factory(root.MIQObservations);})(typeof window==='undefined'?this:window,function(observations){
  'use strict';
  function pad(n){return String(n).padStart(2,'0');}
  function hourlyWindow(now,zone){
    zone=zone||'Asia/Seoul';
    var parts=new Intl.DateTimeFormat('en-CA',{timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',hourCycle:'h23'}).formatToParts(now||new Date());
    var p={};parts.forEach(function(x){p[x.type]=x.value;});
    var hour=Number(p.hour),date=p.year+'-'+p.month+'-'+p.day;
    return {date:date,from:'00:00',to:pad(hour)+':00',hours:hour,timeZone:zone,slots:Array.from({length:hour},function(_,i){return {from:pad(i)+':00',to:pad(i+1)+':00'};})};
  }
  function chargeWindow(start,end){
    if(start===null||end===null||typeof start==='boolean'||typeof end==='boolean'||String(start).trim()===''||String(end).trim()==='')return null;
    start=Number(start);end=Number(end);
    if(!Number.isInteger(start)||!Number.isInteger(end)||start<0||start>23||end<0||end>23)return null;
    var overnight=start>=end, duration=(end-start+24)%24||24;
    // The 24-hour scale begins at the configured start, so every overnight
    // interval is continuous, including 23 -> 22 and a full 24 hours.
    return {start:start,end:end,duration:duration,overnight:overnight,startLabel:(overnight?'전일 ':'금일 ')+pad(start)+':00',endLabel:'금일 '+pad(end)+':00',midnight:overnight?(24-start)/24*100:null,fill:duration/24*100};
  }
  function watchHourly(callback,options){
    options=options||{};
    var now=options.now||function(){return new Date();},last='',stopped=false;
    function refresh(){
      if(stopped)return;
      var w=hourlyWindow(now(),options.timeZone),key=w.date+' '+w.to;
      if(key!==last){last=key;callback(w);}
    }
    var timer=(options.schedule||setInterval)(refresh,30000);
    refresh();
    return {refresh:refresh,stop:function(){stopped=true;(options.cancel||clearInterval)(timer);}};
  }
  function calendarDays(from,to){
    function parse(value){
      if(!/^\d{4}-\d{2}-\d{2}$/.test(value||''))return null;
      var d=new Date(value+'T00:00:00Z');
      return !isNaN(d.getTime())&&d.toISOString().slice(0,10)===value?d:null;
    }
    var start=parse(from),end=parse(to),rows=[];
    if(!start||!end||start>end)return rows;
    for(var d=start;d<=end;d=new Date(d.getTime()+86400000)){
      var date=d.toISOString().slice(0,10);
      rows.push({date:date,x:(d.getUTCMonth()+1)+'/'+d.getUTCDate()});
    }
    return rows;
  }
  // Independent prototype kWh values, never converted from SOC.
  // Production displays the server's daily chargeKwh/consumeKwh response.
  function dailyEnergy(vin,from,to){
    return calendarDays(from,to).map(function(day){
      var key=vin+':energy-kwh-v2:'+day.date,seed=0;
      for(var j=0;j<key.length;j++)seed=(seed*31+key.charCodeAt(j))>>>0;
      function next(){seed=(seed*1103515245+12345)&0x7fffffff;return seed/0x7fffffff;}
      return {date:day.date,x:day.x,chargeKwh:Math.round((18+next()*22)*10)/10,consumeKwh:Math.round((12+next()*24)*10)/10};
    });
  }
  function temperatureHours(vin,date){
    var key=vin+':temperature:'+date,seed=0,rows=[];
    for(var j=0;j<key.length;j++)seed=(seed*31+key.charCodeAt(j))>>>0;
    function next(){seed=(seed*1103515245+12345)&0x7fffffff;return seed/0x7fffffff;}
    var base=30+Math.round(next()*4);
    for(var h=0;h<24;h++){
      var peak=Math.exp(-Math.pow(h-17,2)/12)*(8+next()*3);
      rows.push({date:date,x:pad(h)+'시',v:Math.round(base+peak+next()*1.2)});
    }
    return rows;
  }
  function dailyTemperature(vin,from,to){
    // Derive prototype extrema from hourly temperature for the validated calendar range.
    return calendarDays(from,to).map(function(day){
      var values=temperatureHours(vin,day.date).map(function(hour){return hour.v;});
      return {date:day.date,x:day.x,minC:Math.min.apply(null,values),maxC:Math.max.apply(null,values)};
    });
  }
  function reportScope(role,companies,groups,assignedGroup){
    var staff=role==='customer_staff',customer=staff||role==='customer_owner';
    var items=customer?(staff?[assignedGroup||'내 그룹']:groups.filter(function(g){return g&&g!=='미배정';})):companies;
    items=items.filter(function(n,i,a){return a.indexOf(n)===i;});
    if(!items.length&&customer)items=['전체'];
    return {label:customer?'그룹':'업체',items:items,readOnly:staff,single:items.length<=1,customer:customer};
  }
  function favoriteIds(value,allowed){
    return Array.isArray(value)?value.filter(function(id,i,a){return typeof id==='string'&&allowed.indexOf(id)>=0&&a.indexOf(id)===i;}):[];
  }
  function hourlyVehicle(v,window){
    var known=v.conn===true||v.conn===false,connected=v.conn===true;
    function random(key){var s=0;for(var i=0;i<key.length;i++)s=(s*31+key.charCodeAt(i))>>>0;return (s%1000)/1000;}
    var raw=observations.aggregate(v,window.date,window.date,window);
    var last=window.hours?observations.sample(v,window.date,window.hours-1,window):null;
    var running=connected&&!!last&&last.workMinutes+last.idleMinutes>0;
    var fault=connected&&random(v.vin+'fault')>.86?1:0;
    // Explicit demonstration vehicles share their current fault count with summary/dashboard.
    var activeError=v.summaryDetail&&v.summaryDetail.activeErrorCount;
    if(v.demo===true&&typeof activeError==='number'&&Number.isFinite(activeError)&&activeError>=0)fault=activeError;
    return {known:known,connected:connected,running:running,idle:connected&&!running,fault:fault,runH:known&&raw.known?raw.runningMinutes/60:null,workingMinutes:known?raw.workMinutes:null,idleMinutes:known?raw.idleMinutes:null,
      km:known?raw.distanceKm:null,fuel:known?raw.fuelLitres:null,battery:known?raw.batteryKwh:null,
      dataTime:connected?window.date+' '+window.to:null,
      status:!known?'unknown':!connected?'off':fault?'bad':'ok'};
  }
  return {hourlyWindow:hourlyWindow,watchHourly:watchHourly,dailyEnergy:dailyEnergy,temperatureHours:temperatureHours,dailyTemperature:dailyTemperature,chargeWindow:chargeWindow,reportScope:reportScope,favoriteIds:favoriteIds,hourlyVehicle:hourlyVehicle};
});

(function(root){
function parse(value) {
    var match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value || ''));
    if (!match) return null;
    var date = new Date(Date.UTC(+match[1], +match[2] - 1, +match[3]));
    return date.toISOString().slice(0, 10) === value ? date : null;
  }
  function axis(period, from, to) {
    var start = parse(from), end = parse(to), labels = [], dates = [], detailLabels = [];
    if (!start || !end || start > end) return { labels: labels, dates: dates, detailLabels: detailLabels, n: 0, bucket: 1, filled: 0 };
    var count = period === 'd' ? 24 : Math.min(366, Math.round((end - start) / 86400000) + 1);
    for (var index = 0; index < count; index++) {
      var date = new Date(start.getTime() + (period === 'd' ? 0 : index * 86400000));
      var iso = date.toISOString().slice(0, 10);
      var label = period === 'd' ? String(index).padStart(2, '0') + '시'
        : (index === 0 || date.getUTCDate() === 1 ? (date.getUTCMonth() + 1) + '월 ' : '') + date.getUTCDate() + '일';
      labels.push(label); dates.push(iso); detailLabels.push(iso + (period === 'd' ? ' ' + label : ''));
    }
    return { labels: labels, dates: dates, detailLabels: detailLabels, n: count, bucket: 1, filled: count };
  }
root.MIQCharts={axis:axis};
})(window);
/* Shared synthetic observations for dashboard/status/comparison/heatmap.
 * The same entity/date/metric is independent of the selected screen or range.
 * Replace this fixture provider with collected daily data for production.
 */
(function (root) {
  'use strict';
  var charts = root.MIQCharts, observations = root.MIQObservations;
  var metrics = [
    { key:'eff', label:'운영효율', unit:'%', agg:'avg', dec:1, betterHigh:true },
    { key:'shock', label:'충격횟수', unit:'건', agg:'sum', dec:0, betterHigh:false },
    { key:'fuel', label:'연료소비량', rateLabel:'시간당 연료소비량', unit:'L/H', agg:'avg', dec:1, betterHigh:false },
    { key:'batt', label:'배터리 충전량', unit:'%', agg:'avg', dec:1, betterHigh:true },
    { key:'dist', label:'운행거리', unit:'Km', agg:'sum', dec:1, betterHigh:true },
    { key:'hour', label:'운행시간', unit:'H', agg:'sum', dec:0, betterHigh:true }
  ];
  function metric(key) { return metrics.find(function (m) { return m.key === key; }); }
  function round(value, dec) { var p = Math.pow(10, dec); return Math.round(value * p) / p; }
  function iso(date) { return date.toISOString().slice(0, 10); }
  function date(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return null;
    var d = new Date(value + 'T00:00:00Z');
    return isFinite(d.getTime()) && iso(d) === value ? d : null;
  }
  function shift(value, days) { return iso(new Date(date(value).getTime() + days * 86400000)); }
  function cutoff() { return iso(new Date(Date.now() + 9 * 3600000 - 86400000)); }
  function periods(params) {
    var end = cutoff(), month = end.slice(0, 7) + '-01';
    return {
      d:{from:end, to:end, cur:'조회일', prev:'전일'},
      w:{from:shift(end, -6), to:end, cur:'조회주', prev:'이전주'},
      m:{from:month, to:end, cur:'조회월', prev:'이전월'},
      c:{from:params.get('from') || month, to:params.get('to') || end, cur:'조회기간', prev:'이전기간'}
    };
  }
  function query(entity, key, period, from, to, end) {
    var m=metric(key), axis=charts.axis(period,from,to), limit=end || observations.windowAt();
    var values=axis.dates.map(function(day,hour) {
      return m ? observations.value(observations.aggregate(entity,day,day,limit,period==='d'?hour:null),key) : null;
    });
    var raw=observations.aggregate(entity,from,period==='d'?from:to,limit);
    return {m:m,labels:axis.labels,detailLabels:axis.detailLabels,dates:axis.dates,series:values,
      filled:values.filter(function(v){return v!==null;}).length,total:m?observations.value(raw,key):null,coverage:raw};
  }
  function previous(period, from, to) {
    if (!date(from) || !date(to)) return {from:from, to:to};
    if (period === 'm') {
      function priorMonth(value) {
        var d = date(value), y = d.getUTCFullYear(), m = d.getUTCMonth();
        return iso(new Date(Date.UTC(y, m - 1, Math.min(d.getUTCDate(), new Date(Date.UTC(y, m, 0)).getUTCDate()))));
      }
      return {from:priorMonth(from), to:priorMonth(to)};
    }
    var days = period === 'd' ? 1 : Math.round((date(to) - date(from)) / 86400000) + 1;
    return {from:shift(from, -days), to:shift(period === 'd' ? from : to, -days)};
  }
  function status(entity, key, period, from, to, end) {
    var cur = query(entity, key, period, from, to, end), prior = previous(period, from, to);
    var prev = query(entity, key, period, prior.from, prior.to, end);
    return {m:cur.m, labels:cur.labels, detailLabels:cur.detailLabels,
      cols:cur.series.map(function (v, i) { return {cur:v, prev:prev.series[i] == null ? null : prev.series[i]}; }),
      filled:cur.filled, cur:cur.total, prev:prev.total, previous:prior};
  }
  function aggregate(entities,key,from,to,end) {
    var vehicles=observations.unique(entities.reduce(function(all,e){return all.concat(observations.select(e));},[]));
    return observations.value(observations.aggregate(vehicles,from,to,end || observations.windowAt()),key);
  }
  function annual(entities, key, year, end) {
    return Array.from({length:12}, function (_, i) {
      var month = year + '-' + String(i + 1).padStart(2, '0');
      return aggregate(entities, key, month + '-01', iso(new Date(Date.UTC(year, i + 1, 0))), end);
    });
  }
  var api = {metrics:metrics, metric:metric, round:round, cutoff:cutoff, periods:periods, query:query, status:status, previous:previous, aggregate:aggregate, annual:annual};
  root.MIQReportSeries = api;
  if (typeof module === 'object' && module.exports) module.exports = api;
})(typeof window === 'undefined' ? globalThis : window);

(function (root) {
  'use strict';
  /* Service 공용 이력과 소모품 목록. 목록과 배지는 같은 품목·상태를 사용한다.
     날짜·호기를 변경하지 않으며 실제 서버 데이터나 차량 카탈로그를 만들지 않는다. */
  var kinds = ['maintenance', 'supply', 'error'];
  var sourceVehicles = {
    FBA32_224250271: { model: 'B30S-7', group: '기본그룹', type: '리튬' },
    FBA32_224250383: { model: 'B30S-7', group: '기본그룹', type: '리튬' },
    FBA32_032068: { model: 'B30S-7', group: '기본그룹', type: '리튬' },
    FBA32_032042: { model: 'B18S-7', group: '테스트그룹', type: '납산' },
    FBA32_DEMO_CS01: { model: 'B30S-7', group: '물류1팀', type: '리튬' }
  };
  /* Existing Service HTML fixtures; full consumable values are shared with vehicle detail. */
  var supplies = [
    { vin: 'FBA32_224250271', name: '트랜스미션 오일', cycle: 100, used: 231 },
    { vin: 'FBA32_224250271', name: '작동유 필터', cycle: 250, used: 231 },
    { vin: 'FBA32_224250383', name: '트랜스미션 오일 필터', cycle: 100, used: 105 },
    { vin: 'FBA32_032068', name: '엔진오일', cycle: 500, used: 231 },
    { vin: 'FBA32_032068', name: '엔진오일 필터', cycle: 250, used: 231 },
    { vin: 'FBA32_032068', name: '에어클리너', cycle: 300, used: 251 },
    { vin: 'FBA32_224250271', name: '감속기 오일', cycle: 500, used: 425 },
    { vin: 'FBA32_DEMO_CS01', name: '작동유 필터', cycle: 250, used: 240 },
    { vin: 'FBA32_DEMO_CS01', name: '감속기 오일', cycle: 500, used: 425 }
  ];
  function supplyStatus(cycle, used) {
    if ([cycle,used].some(function(v){return v==null || typeof v==='boolean' || typeof v==='string' && !v.trim();})) return { state:'unknown', percent:null, rawPercent:null, width:0 };
    cycle = Number(cycle); used = Number(used);
    if (!Number.isFinite(cycle) || cycle <= 0 || !Number.isFinite(used) || used < 0) return { state: 'unknown', percent: null, rawPercent: null, width: 0 };
    var rawPercent = used / cycle * 100;
    var percent = Math.round(rawPercent * 100) / 100;
    return { state: Math.round(rawPercent) >= 90 ? 'need' : Math.round(rawPercent) >= 80 ? 'soon' : 'ok', percent: percent, rawPercent: rawPercent, width: Math.min(100, percent) };
  }
  function supplyPreview(items, limit) {
    limit = limit === undefined ? 4 : Math.max(0, Math.floor(Number(limit) || 0));
    return (Array.isArray(items) ? items : []).map(function (item, index) {
      return Object.assign({}, item, supplyStatus(item.cycle, item.used), { sourceIndex: index });
    }).sort(function (a, b) { return (b.percent === null ? -1 : b.percent) - (a.percent === null ? -1 : a.percent) || a.sourceIndex - b.sourceIndex; }).slice(0, limit);
  }
  function supplyItems(vin) {
    return supplyPreview(supplies.filter(function (item) { return !vin || normalize(item.vin) === normalize(vin); }), supplies.length);
  }
  var sourceRows = [
    ['maintenance', 'FBA32_224250271', '2026-07-03'],
    ['maintenance', 'FBA32_224250271', '2026-07-08'],
    ['maintenance', 'FBA32_224250271', '2026-07-11'],
    ['maintenance', 'FBA32_224250383', '2026-07-14'],
    ['maintenance', 'FBA32_032042', '2026-07-18'],
    ['maintenance', 'FBA32_032042', '2026-07-22'],
    ['supply', 'FBA32_224250271', '2026-05-01'],
    ['supply', 'FBA32_224250271', '2026-05-01'],
    ['supply', 'FBA32_224250383', '2026-05-07'],
    ['supply', 'FBA32_032068', '2026-06-01'],
    ['supply', 'FBA32_032068', '2026-06-01'],
    ['supply', 'FBA32_032068', '2026-06-01'],
    ['error', 'FBA32_224250271', '2026-07-25', 'current'],
    ['error', 'FBA32_032068', '2026-07-20', 'past'],
    ['error', 'FBA32_224250271', '2026-07-24', 'current'],
    ['error', 'FBA32_032042', '2026-07-15', 'past'],
    ['error', 'FBA32_032068', '2026-07-12', 'past'],
    ['error', 'FBA32_224250383', '2026-07-26', 'current'],
    ['supply', 'FBA32_224250271', '2026-06-01'],
    ['supply', 'FBA32_DEMO_CS01', '2026-06-01'],
    ['supply', 'FBA32_DEMO_CS01', '2026-06-01']
  ];
  var supplyIndex = 0;
  var records = sourceRows.map(function (row) {
    var vehicle = sourceVehicles[row[1]];
    var supply = row[0] === 'supply' ? supplies[supplyIndex++] : null;
    return {
      kind: row[0], companyId: '1933', company: '세종물류', group: vehicle.group,
      model: vehicle.model, vin: row[1], type: vehicle.type, date: row[2],
      supplyName: supply ? supply.name : '',
      supplyCycle: supply ? supply.cycle : undefined,
      supplyUsed: supply ? supply.used : undefined,
      supplyState: supply ? supplyStatus(supply.cycle, supply.used).state : '',
      errorState: row[0] === 'error' ? row[3] : ''
    };
  });

  function text(value) { return String(value == null ? '' : value).trim(); }
  function normalize(value) { return text(value).toUpperCase().replace(/[^0-9A-Z가-힣]/g, ''); }
  function matches(record, filter) {
    var companyId = text(filter.companyId);
    if (Array.isArray(filter.companyIds) && filter.companyIds.indexOf(record.companyId) < 0) return false;
    var vehicle = filter.vehicle || filter.veh || '';
    if (companyId && companyId !== 'all' && companyId !== record.companyId) return false;
    if (vehicle && normalize(vehicle) !== normalize(record.vin)) return false;
    if (filter.group && normalize(record.group).indexOf(normalize(filter.group)) < 0) return false;
    if (filter.group && filter.exactGroup && record.group !== filter.group) return false;
    if (filter.type && normalize(record.type) !== normalize(filter.type)) return false;
    if (record.kind === 'supply' && record.supplyState !== 'need' && record.supplyState !== 'soon') return false;
    if (record.kind === 'supply' && filter.supplyState && record.supplyState !== filter.supplyState) return false;
    if (record.kind === 'error' && filter.errorState && record.errorState !== filter.errorState) return false;
    /* 소모품은 교체 필요·임박 상태만 조회한다. 등록일이나 이력 기간은 적용하지 않는다. */
    if (record.kind !== 'supply') {
      if (record.date && filter.from && record.date < filter.from) return false;
      if (record.date && filter.to && record.date > filter.to) return false;
    }
    return true;
  }
  function count(kind, filter) {
    return records.filter(function (record) { return record.kind === kind && matches(record, filter || {}); }).length;
  }
  function totals(filter) {
    return { maintenance: count('maintenance', filter), supply: count('supply', filter), error: count('error', filter) };
  }
  function replace(kind, infos) {
    if (kinds.indexOf(kind) < 0) throw new RangeError('Unknown service record kind: ' + kind);
    if (!Array.isArray(infos)) throw new TypeError('Service record infos must be an array');
    if (kind === 'supply') infos.forEach(function (info) {
      var item = supplies.filter(function (candidate) { return normalize(candidate.vin) === normalize(info.vin) && candidate.name === info.supplyName; })[0];
      if (item && info.supplyCycle !== undefined && info.supplyUsed !== undefined) { item.cycle = Number(info.supplyCycle); item.used = Number(info.supplyUsed); }
    });
    var updated = infos.map(function (info) {
      var company = text(info.company);
      var date = text(info.date).match(/\d{4}-\d{2}-\d{2}/);
      return {
        kind: kind,
        companyId: text(info.companyId) || (normalize(company).indexOf('세종물류') > -1 ? '1933' : ''),
        company: company, group: text(info.group), model: text(info.model), vin: text(info.vin),
        type: text(info.type), date: date ? date[0] : '',
        supplyName: kind === 'supply' ? text(info.supplyName) : '',
        supplyCycle: kind === 'supply' ? info.supplyCycle : undefined,
        supplyUsed: kind === 'supply' ? info.supplyUsed : undefined,
        supplyState: kind === 'supply' ? (info.supplyCycle !== undefined && info.supplyUsed !== undefined ? supplyStatus(info.supplyCycle, info.supplyUsed).state : text(info.supplyState)) : '',
        errorState: kind === 'error' ? text(info.errorState) : ''
      };
    });
    var retained = records.filter(function (record) { return record.kind !== kind; });
    records.splice.apply(records, [0, records.length].concat(retained, updated));
    return updated.length;
  }
  // Service-only identities can open detail without creating collected telemetry
  // or adding vehicles to the fleet/summary population.
  function vehicleIdentity(vin) {
    var key = Object.keys(sourceVehicles).find(function (value) { return normalize(value) === normalize(vin); });
    if (!key) return null;
    return Object.assign({ vin: key, companyId: '1933', companyName: '세종물류',
      serviceOnly: true, catalogOnly: true, conn: null, km: null, min: null, shock: null,
      cumKm: null, cumH: null, soc: null }, sourceVehicles[key]);
  }
  var api = { records: records, count: count, totals: totals, replace: replace, supplyStatus: supplyStatus, supplyPreview: supplyPreview, supplyItems: supplyItems, vehicleIdentity: vehicleIdentity };
  root.MIQServiceRecords = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);

/* Arbitrary demonstration records for the prototype only.
   These are not actual repairs, ECU/BMS codes, or collected vehicle telemetry.
   The caller supplies an ISO date/window; no clock, random values, or catalog mutations are used. */
(function(root,factory){
  var api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.MIQServiceDemo=api;
})(typeof window!=='undefined'?window:globalThis,function(){
  'use strict';
  function text(value){return typeof value==='string'?value.trim():typeof value==='number'&&Number.isFinite(value)?String(value):'';}
  function validDay(value){
    if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value))return false;
    var date=new Date(value+'T00:00:00Z');
    return Number.isFinite(date.getTime())&&date.toISOString().slice(0,10)===value;
  }
  function hash(value){var result=0;for(var index=0;index<value.length;index++)result=(result*31+value.charCodeAt(index))>>>0;return result;}
  function stamp(day,hour,minute){return day+' '+String(hour).padStart(2,'0')+':'+String(minute).padStart(2,'0');}
  var examples={
    '엔진':{category:'차량',prefix:'ENG',items:[
      ['엔진 냉각 계통','냉각수 온도 신호 점검','엔진 냉각수 온도 센서 및 커넥터 확인'],
      ['엔진 윤활 계통','오일 압력 신호 점검','엔진 오일 압력 센서 및 연결부 확인'],
      ['엔진 흡기 계통','흡기 필터 점검 알림','흡기 필터 상태 확인 및 점검 기록']
    ]},
    '리튬':{category:'배터리',prefix:'LI',items:[
      ['리튬 배터리 팩','셀 온도 신호 점검','리튬 배터리 온도 센서 및 커넥터 확인'],
      ['리튬 배터리 충전 계통','충전 연결 상태 점검','리튬 배터리 충전 커넥터 상태 확인'],
      ['리튬 배터리 통신 계통','BMS 통신 점검 알림','리튬 배터리 BMS 연결 상태 확인']
    ]},
    '납산':{category:'배터리',prefix:'PB',items:[
      ['납산 배터리 단자','단자 연결 상태 점검','납산 배터리 단자 및 연결 케이블 상태 확인'],
      ['납산 배터리 충전 계통','충전 연결 상태 점검','납산 배터리 충전 커넥터 상태 확인'],
      ['납산 배터리 전압 계통','전압 신호 점검','납산 배터리 전압 측정 연결부 확인']
    ]},
    vehicle:{category:'차량',prefix:'VEH',items:[
      ['차량 제어 계통','제어 신호 점검','차량 제어기 연결 상태 확인'],
      ['차량 조작 계통','조작 신호 점검','차량 조작 레버 및 신호 연결부 확인'],
      ['차량 통신 계통','단말 통신 점검','차량 단말 및 통신 연결 상태 확인']
    ]}
  };
  function create(fleet,referenceDay){
    var result={maintenance:[],error:[]};
    if(!Array.isArray(fleet)||!validDay(referenceDay))return result;
    var seen=new Set();
    fleet.forEach(function(vehicle){
      if(!vehicle||typeof vehicle!=='object'||typeof vehicle.vin!=='string')return;
      var vin=vehicle.vin.trim();
      if(!/^[a-z0-9][a-z0-9_-]*$/i.test(vin))return;
      var key=vin.replace(/[-_]/g,'').toUpperCase();
      if(seen.has(key))return;
      seen.add(key);
      var seed=hash(key),type=text(vehicle.type),template=Object.prototype.hasOwnProperty.call(examples,type)?examples[type]:examples.vehicle;
      var variant=seed%template.items.length,item=template.items[variant];
      var metadata={companyId:text(vehicle.companyId),company:text(vehicle.companyName),group:text(vehicle.group),model:text(vehicle.model),vin:vin,type:type,date:referenceDay,demo:true};
      var minute=Math.floor(seed/7)%6*10,errorHour=7+seed%8;
      result.maintenance.push(Object.assign({},metadata,{kind:'maintenance',dateTime:stamp(referenceDay,9+seed%7,minute),
        part:item[0],symptom:item[1],detail:item[2],completed:seed%2===0}));
      var error=Object.assign({},metadata,{kind:'error',dateTime:stamp(referenceDay,errorHour,minute),errorState:seed%2===0?'current':'past',
        category:template.category,code:'DEMO-'+template.prefix+'-'+String(variant+1).padStart(2,'0'),level:['a','b','c'][seed%3],spn:'—',fmi:'—',
        description:item[2]});
      if(error.errorState==='past')error.completedAt=stamp(referenceDay,errorHour+2,minute);
      result.error.push(error);
    });
    return result;
  }
  // Explicit current-day review samples. Existing create() callers retain
  // their historical data. Dashboard links pass this same frozen cutoff.
  function createCurrent(fleet,window){
    if(!window||!validDay(window.date)||!/^([01]\d|2[0-3]):00$/.test(window.to||''))return [];
    var end=window.date+' '+window.to,rows=[];
    create(fleet,window.date).error.forEach(function(item){
      var seed=hash(item.vin.replace(/[-_]/g,'').toUpperCase());
      if(seed%4===0)return;
      [0].concat(seed%3===0?[30]:[]).forEach(function(offset,index){
        var parts=item.dateTime.slice(11).split(':'),minute=Number(parts[0])*60+Number(parts[1])+offset;
        var dateTime=stamp(window.date,Math.floor(minute/60),minute%60);
        if(dateTime>=end)return;
        var row=Object.assign({},item,{dateTime:dateTime,currentSample:true,sampleId:window.date+':'+item.vin+':'+index});
        if(row.completedAt&&row.completedAt>=end){row.errorState='current';delete row.completedAt;}
        rows.push(row);
      });
    });
    return rows;
  }
  return {create:create,createCurrent:createCurrent};
});

(function(root){
  'use strict';
  var errors = {
    FBA32_DEMO_CS01: [
      { st: 'cur', code: 'BM-0x0104', msg: '충전 전류 이상', lv: '주의', days: 0, done: null, act: '충전기 커넥터 접점 및 충전 케이블 단선 점검' }
    ],
    FBA32_224250271: [
      { st: 'cur',  code: 'BM-0x0210', msg: '셀 과열 (43℃)',      lv: '주의', days: 0,  done: null,                 act: '차량 정지 후 30분 냉각, 배터리 팩 통풍구 이물 점검' },
      { st: 'past', code: 'BM-0x0308', msg: '셀 전압 편차 초과',   lv: '주의', days: 3,  done: '2026-08-09 15:22',   act: '밸런싱 모드로 완충 1회 실시 후 편차 재확인' },
      { st: 'past', code: 'BM-0x0402', msg: 'BMS 통신 지연',       lv: '정보', days: 12, done: '2026-07-31 09:14',   act: '단말 전원 재인입 후 통신 상태 확인' },
      { st: 'past', code: 'BM-0x0104', msg: '충전 전류 이상',       lv: '주의', days: 24, done: '2026-07-19 20:41',   act: '충전기 커넥터 접점 및 충전 케이블 단선 점검' }
    ],
    FBA20_224250312: [
      { st: 'cur',  code: 'BM-0x0210', msg: '셀 과열 (46℃)',      lv: '경고', days: 0,  done: null,                 act: '차량 정지 후 30분 냉각, 배터리 팩 통풍구 이물 점검' },
      { st: 'past', code: 'BM-0x0501', msg: '절연 저항 저하',       lv: '심각', days: 16, done: '2026-07-29 11:20',   act: '절연 저항 측정 후 서비스 센터 점검 요청' }
    ],
    FBA25_224250188: [
      { st: 'past', code: 'BM-0x0210', msg: '셀 과열 (44℃)',      lv: '경고', days: 11, done: '2026-08-01 16:02',   act: '차량 정지 후 30분 냉각, 배터리 팩 통풍구 이물 점검' },
      { st: 'past', code: 'BM-0x0402', msg: 'BMS 통신 지연',       lv: '정보', days: 27, done: '2026-07-16 10:51',   act: '단말 전원 재인입 후 통신 상태 확인' }
    ],
    FBA16_224250045: [
      { st: 'cur',  code: 'BM-0x0104', msg: '충전 전류 이상',       lv: '주의', days: 0,  done: null,                 act: '충전기 커넥터 접점 및 충전 케이블 단선 점검' },
      { st: 'cur',  code: 'BM-0x0308', msg: '셀 전압 편차 초과',    lv: '주의', days: 4,  done: null,                 act: '밸런싱 모드로 완충 1회 실시 후 편차 재확인' },
      { st: 'past', code: 'BM-0x0104', msg: '충전 전류 이상',       lv: '주의', days: 19, done: '2026-07-25 08:30',   act: '충전기 커넥터 접점 및 충전 케이블 단선 점검' }
    ],
    FBA35_224250403: [
      { st: 'past', code: 'BM-0x0402', msg: 'BMS 통신 지연',       lv: '정보', days: 2,  done: '2026-08-10 10:51',   act: '단말 전원 재인입 후 통신 상태 확인' },
      { st: 'past', code: 'BM-0x0308', msg: '셀 전압 편차 초과',    lv: '주의', days: 21, done: '2026-07-22 17:36',   act: '밸런싱 모드로 완충 1회 실시 후 편차 재확인' }
    ]
  };
  function hasNumber(value){return value!==null&&value!==undefined&&value!==''&&Number.isFinite(Number(value));}
  function seeded(key){var seed=0;for(var i=0;i<key.length;i++)seed=(seed*31+key.charCodeAt(i))>>>0;return function(){seed=(seed*1103515245+12345)&0x7fffffff;return seed/0x7fffffff;};}
  function snapshot(vehicle){
    var soc=hasNumber(vehicle.soc)?Number(vehicle.soc):null, known=!vehicle.catalogOnly&&soc!==null;
    var current=(errors[vehicle.vin]||[]).filter(function(error){return error.st==='cur';});
    function has(word){return current.some(function(error){return error.msg.indexOf(word)>=0;});}
    return {soc:soc,known:known,soh:known?88+Math.round(seeded(vehicle.vin+'stat')()*11):null,
      workMinutes:known?Math.round(soc/100*348):null,chargeMinutes:known?Math.round((100-soc)/100*120):null,
      temperature:known?(has('과열')?'경고':'정상'):'수집 전',charge:known?(has('충전')?'이상':'정상'):'수집 전',battery:known?(has('전압')?'주의':'정상'):'수집 전',abnormal:known&&current.length>0};
  }
  function allowed(rows,role,policy){
    return rows.filter(function(vehicle){return vehicle.type==='리튬'&&(!policy.companyIds||policy.companyIds.indexOf(String(vehicle.companyId||'1933'))>=0)&&(role!=='customer_staff'||vehicle.group==='물류1팀');});
  }
  function filter(rows,selection){return rows.filter(function(vehicle){
    return (!selection.companyId||selection.companyId==='all'||String(vehicle.companyId||'1933')===String(selection.companyId))
      &&(!selection.group||vehicle.group===selection.group)&&(!selection.veh||vehicle.vin===selection.veh)&&(!selection.abnormal||snapshot(vehicle).abnormal);
  });}
  var sortKeys=['vin','soc','soh','workMinutes','chargeMinutes','smartCharge'];
  function sort(rows,key,direction,readSmartCharge){
    if(sortKeys.indexOf(key)<0)return rows.slice();
    var factor=direction==='desc'?-1:1;
    function value(vehicle){
      if(key==='vin')return vehicle.vin||null;
      var info=snapshot(vehicle);
      if(key==='smartCharge'){
        if(!info.known)return null;
        var charge=readSmartCharge?readSmartCharge(vehicle,info.known):'켜짐';
        return charge==='켜짐'?1:charge==='꺼짐'?0:null;
      }
      return info[key];
    }
    return rows.map(function(vehicle,index){return {vehicle:vehicle,value:value(vehicle),index:index};}).sort(function(a,b){
      // Unavailable telemetry remains at the bottom in both directions; zero is a value.
      var aMissing=a.value===null||a.value===undefined,bMissing=b.value===null||b.value===undefined;
      if(aMissing!==bMissing)return aMissing?1:-1;
      if(aMissing)return a.index-b.index;
      var compared=typeof a.value==='number'?a.value-b.value:String(a.value).localeCompare(String(b.value),'ko',{numeric:true});
      return compared?compared*factor:a.index-b.index;
    }).map(function(item){return item.vehicle;});
  }
  root.MIQLithiumListModel={errors:errors,snapshot:snapshot,allowed:allowed,filter:filter,sortKeys:sortKeys,sort:sort};
  if(typeof module==='object'&&module.exports)module.exports=root.MIQLithiumListModel;
})(typeof window!=='undefined'?window:globalThis);

/* Original captured daily-equipment last positions are preserved below.
   The final three entries marked demo:true are separated demonstration locations
   for the customer staff fleet near company 1933's existing Hwaseong position.
   They are not collected GPS measurements. */
window.MIQMapPositions = [
  {
    "vin": "FBA36_225380008",
    "lat": 35.20914,
    "lng": 128.85083,
    "address": "대한민국 경상남도 김해시 칠산로413번길 20",
    "lastDatetime": "2026-08-13 19:29:37"
  },
  {
    "vin": "FBA32_224250271",
    "lat": 37.035446,
    "lng": 126.787238,
    "address": "대한민국 경기도 화성시 우정읍 이화리 1714",
    "lastDatetime": "2026-08-13 19:20:39"
  },
  {
    "vin": "FBA32-002415",
    "lat": 36.378733,
    "lng": 126.578765,
    "address": "대한민국 충청남도 보령시 주교면 관창리 1227-1번지",
    "lastDatetime": "2026-08-13 19:20:51"
  },
  {
    "vin": "FBA34-000619",
    "lat": 35.852396,
    "lng": 127.085745,
    "address": "대한민국 전북특별자치도 전주시 덕진구 팔복동3가 421",
    "lastDatetime": "2026-08-13 16:35:26"
  },
  {
    "vin": "FDB19_225060042",
    "lat": 35.245911,
    "lng": 128.843946,
    "address": "대한민국 경상남도 김해시 주촌면 서부로1701번안길 58-202",
    "lastDatetime": "2026-08-13 19:11:55"
  },
  {
    "vin": "FDB19_225060343",
    "lat": 35.201645,
    "lng": 128.608816,
    "address": "대한민국 경상남도 창원시 성산구 신촌동 501-8",
    "lastDatetime": "2026-08-13 16:41:56"
  },
  {
    "vin": "FDB19-000122",
    "lat": 35.962521,
    "lng": 126.595566,
    "address": "대한민국 전북특별자치도 군산시 소룡동 1597-2",
    "lastDatetime": "2026-08-13 10:27:13"
  },
  {
    "vin": "FDB21_224250226",
    "lat": 35.306725,
    "lng": 128.3319,
    "address": "대한민국 경상남도 함안군 법수면 강주리 820-4",
    "lastDatetime": "2026-08-13 07:58:09"
  },
  {
    "vin": "FDB21_224250275",
    "lat": 35.140811,
    "lng": 128.479441,
    "address": "대한민국 경상남도 창원시 마산합포구 진북면 신촌리 2-5",
    "lastDatetime": "2026-08-13 18:00:00"
  },
  {
    "vin": "FDB21_224250283",
    "lat": 35.181728,
    "lng": 128.607721,
    "address": "대한민국 경상남도 창원시 성산구 두산볼보로 22",
    "lastDatetime": "2026-08-13 08:44:02"
  },
  {
    "vin": "FDB21_224250294",
    "lat": 35.141885,
    "lng": 128.478358,
    "address": "대한민국 경상남도 창원시 마산합포구 진북면 농공단지로 26",
    "lastDatetime": "2026-08-13 16:53:48"
  },
  {
    "vin": "FDB21_224250305",
    "lat": 35.546105,
    "lng": 128.488616,
    "address": "대한민국 경상남도 창녕군 창녕읍 교리 968-37",
    "lastDatetime": "2026-08-13 13:31:03"
  },
  {
    "vin": "FDB21_224250307",
    "lat": 35.413458,
    "lng": 129.336558,
    "address": "대한민국 울산광역시 울주군 온산읍 원산리 714",
    "lastDatetime": "2026-08-06 10:55:19"
  },
  {
    "vin": "FDB21_224250363",
    "lat": 35.212495,
    "lng": 128.91052,
    "address": "대한민국 부산광역시 강서구 식만로 207-16",
    "lastDatetime": "2026-08-13 16:33:23"
  },
  {
    "vin": "FDB21-002985",
    "lat": 35.109806,
    "lng": 128.841013,
    "address": "대한민국 경상남도 창원시 진해구 가주동 15",
    "lastDatetime": "2026-08-13 16:58:54"
  },
  {
    "vin": "FDB21-002991",
    "lat": 35.109988,
    "lng": 128.841086,
    "address": "대한민국 경상남도 창원시 진해구 가주동 25",
    "lastDatetime": "2026-08-13 16:45:10"
  },
  {
    "vin": "FDB21-003185",
    "lat": 35.428196,
    "lng": 129.335678,
    "address": "대한민국 울산광역시 LG온산공장",
    "lastDatetime": "2026-08-13 16:38:59"
  },
  {
    "vin": "FDB21-003358",
    "lat": 35.213861,
    "lng": 128.659886,
    "address": "대한민국 경상남도 창원시 성산구 공단로 303",
    "lastDatetime": "2026-08-13 19:15:16"
  },
  {
    "vin": "FDB21_224250428",
    "lat": 35.301465,
    "lng": 128.833086,
    "address": "대한민국 경상남도 김해시 한림면 안하리 2002-5",
    "lastDatetime": "2026-08-13 17:20:33"
  },
  {
    "vin": "FDB21_224250450",
    "lat": 35.787685,
    "lng": 128.850281,
    "address": "대한민국 경상북도 경산시 남산면 경리 380-2",
    "lastDatetime": "2026-08-13 17:50:54"
  },
  {
    "vin": "FDB21_225060005",
    "lat": 37.035308,
    "lng": 126.763128,
    "address": "대한민국 경기도 화성시 우정읍 매향리 905-49",
    "lastDatetime": "2026-08-13 14:26:51"
  },
  {
    "vin": "FDB21_225060095",
    "lat": 35.516078,
    "lng": 129.384438,
    "address": "대한민국 울산광역시 남구 매암동 1-5",
    "lastDatetime": "2026-08-13 16:01:02"
  },
  {
    "vin": "FDB21_225060126",
    "lat": 35.089435,
    "lng": 128.778393,
    "address": "대한민국 경상남도 창원시 진해구 신항10로 133",
    "lastDatetime": "2026-08-07 16:45:23"
  },
  {
    "vin": "FDB21_225060182",
    "lat": 35.377693,
    "lng": 129.04759,
    "address": "대한민국 경상남도 양산시 상북면 소토리 479-66",
    "lastDatetime": "2026-08-13 08:27:01"
  },
  {
    "vin": "FDB21_225060407",
    "lat": 35.418911,
    "lng": 128.825551,
    "address": "대한민국 경상남도 밀양시 삼랑진읍 용전리 992-8",
    "lastDatetime": "2026-08-13 12:20:15"
  },
  {
    "vin": "FDB21_225380045",
    "lat": 35.28514,
    "lng": 128.401393,
    "address": "대한민국 경상남도 함안군 가야읍 도항리 254-114",
    "lastDatetime": "2026-08-12 16:02:46"
  },
  {
    "vin": "FDB21-001898",
    "lat": 35.282716,
    "lng": 128.31335,
    "address": "대한민국 경상남도 함안군 군북면 사도리 1017-2",
    "lastDatetime": "2026-08-13 16:53:37"
  },
  {
    "vin": "FDB21-001903",
    "lat": 35.231285,
    "lng": 128.641606,
    "address": "대한민국 경상남도 창원시 의창구 사화동 42-1",
    "lastDatetime": "2026-08-13 16:56:07"
  },
  {
    "vin": "FDB21_224030182",
    "lat": 35.200046,
    "lng": 128.59281,
    "address": "대한민국 경상남도 창원시 성산구 신촌동 62-5",
    "lastDatetime": "2026-08-09 09:21:06"
  },
  {
    "vin": "FDB21_224030105",
    "lat": 35.241323,
    "lng": 128.781561,
    "address": "대한민국 경상남도 김해시 진례면 송현리 1045-9",
    "lastDatetime": "2026-08-13 16:01:23"
  },
  {
    "vin": "FDB21_224030076",
    "lat": 37.484351,
    "lng": 126.612971,
    "address": "대한민국 인천광역시 동구 만석동 2-296",
    "lastDatetime": "2026-08-07 09:31:45"
  },
  {
    "vin": "FDB21-002887",
    "lat": 35.203171,
    "lng": 128.601116,
    "address": "대한민국 창원시 세아창원특수강후문",
    "lastDatetime": "2026-08-13 19:17:48"
  },
  {
    "vin": "FDB21-002888",
    "lat": 35.203525,
    "lng": 128.600818,
    "address": "대한민국 창원시 세아창원특수강후문",
    "lastDatetime": "2026-08-13 19:20:19"
  },
  {
    "vin": "FBA32_DEMO_CS01",
    "lat": 37.035646,
    "lng": 126.787038,
    "address": "경기도 화성시 우정읍 이화리",
    "lastDatetime": "2026-09-10 14:00:00",
    "demo": true
  },
  {
    "vin": "FBA18_DEMO_CS02",
    "lat": 37.035246,
    "lng": 126.787238,
    "address": "경기도 화성시 우정읍 이화리",
    "lastDatetime": "2026-09-10 14:00:00",
    "demo": true
  },
  {
    "vin": "FBD30_DEMO_CS03",
    "lat": 37.035446,
    "lng": 126.787538,
    "address": "경기도 화성시 우정읍 이화리",
    "lastDatetime": "2026-09-10 14:00:00",
    "demo": true
  }
];

const MIQCharts=root.MIQCharts;
function efficiency(rows,period,from,to){var state={rows,period},PERIOD={[period]:{from,to}};function build() {
      var range=PERIOD[state.period],axis=MIQCharts.axis(state.period,range.from,range.to);
      var observations=window.MIQObservations,asOf=observations.windowAt(),totals=[];
      var knownRows=state.rows.filter(observations.hasProfile),divisor=knownRows.length||1;
      var columns=axis.dates.map(function(day,hour){
        var value=observations.aggregate(knownRows,day,day,asOf,state.period==='d'?hour:null);
        if(!value.known)return null;
        totals.push(value);
        return {work:value.workMinutes/60/divisor,idle:value.idleMinutes/60/divisor,capacity:value.capacityMinutes/60/divisor};
      });
      var vehicles=state.rows.map(function(vehicle){
        var value=observations.aggregate(vehicle,range.from,state.period==='d'?range.from:range.to,asOf);
        return {vehicle:vehicle,work:value.workMinutes/60,idle:value.idleMinutes/60,capacity:value.capacityMinutes/60,known:!!value.known};
      });
      var totalWork=totals.reduce(function(s,v){return s+v.workMinutes/60;},0);
      var totalIdle=totals.reduce(function(s,v){return s+v.idleMinutes/60;},0),filled=totals.length;
      return {labels:axis.labels,detailLabels:axis.detailLabels,columns:columns,
        top:vehicles.filter(function(v){return v.known;}).sort(function(a,b){return b.work-a.work;}).slice(0,5),vehicles:vehicles,
        filled:filled,bucket:axis.bucket,knownVehicleCount:knownRows.length,
        average:{work:filled?totalWork/divisor/filled:0,idle:filled?totalIdle/divisor/filled:0},
        averageVehicleWorkTotal:totalWork/divisor};
    }
return build();}
function shocks(rows,period,from,to){var state={rows,period},PERIOD={[period]:{from,to}};function build() {
    var p=state.period,range=PERIOD[p],axis=MIQCharts.axis(p,range.from,range.to),obs=window.MIQObservations;
    var series={s3:[],s4:[],s5:[]},byVeh={},filled=0;
    axis.dates.forEach(function(day,hour){
      var rows=obs.intervals(state.rows,day,day,null,p==='d'?hour:null),known=rows.length>0;
      var levels={s3:0,s4:0,s5:0};
      rows.forEach(function(row){
        // Exclusive illustrative levels; every event belongs to one level.
        var level=(row.hour+Number(row.date.slice(-2)))%10;
        levels[level===0?'s5':level<4?'s4':'s3']+=row.shockCount;
        if(!byVeh[row.vin]){var v=state.rows.find(function(v){return v.vin===row.vin;});byVeh[row.vin]={vin:row.vin,model:v.model,total:0};}
        byVeh[row.vin].total+=row.shockCount;
      });
      ['s3','s4','s5'].forEach(function(key){series[key].push(known?levels[key]:null);});
      if(known)filled++;
    });
    return {labels:axis.labels,detailLabels:axis.detailLabels,series:series,
      top:Object.keys(byVeh).map(function(k){return byVeh[k];}).sort(function(a,b){return b.total-a.total;}).slice(0,5),filled:filled};
  }
return build();}
function summaryValue(vehicle,period,from,to){var MIQObservations=root.MIQObservations,state={period},PERIOD={[period]:{range:[from,to]}};function periodValue(vehicle){
    var range=PERIOD[state.period].range;
    var raw=MIQObservations.aggregate(vehicle,range[0],state.period==='d'?range[0]:range[1]);
    return {km:raw.distanceKm,min:raw.runningMinutes,workMin:raw.workMinutes,idleMin:raw.idleMinutes,
      eff:raw.efficiency,operatingEff:raw.efficiency,shock:raw.shockCount,fc:raw.fuelRate,bc:raw.batteryRate};
  }
  function periodTimes(value){return {running:value.min,working:value.workMin,idle:value.idleMin};}
var value=periodValue(vehicle);return {...value,efficiency:value.eff,fuel:value.fc,battery:value.bc};}
function reportValue(label,key,period,from,to){return root.MIQReportSeries.status(label,key,period,from,to);}
const common=root.MIQCommon;
var principals = {
      dealer_owner: 'dealer.park@sejonglog.co.kr', dealer_staff: 'staff.jung@sejonglog.co.kr',
      customer_owner: 'leader.yoon@customer.co.kr', customer_staff: 'user.oh@customer.co.kr'
    };
function seedUserRequests() {
      return [
        { id:'UR-20260706-01', email:'kim.jh@sejong.co.kr', name:'김지훈', role:'고객 직원', company:'(주)세종물류중부지점', phone:'010-****-4821', registered:'2026-07-06 09:41', processed:'', status:'REQ', processor:'', processorRole:'', reason:'', approverId:principals.customer_owner, group:'' },
        { id:'UR-20260705-01', email:'park.sy@sejong.co.kr', name:'박서연', role:'딜러 직원', company:'세종모터스', phone:'010-****-5720', registered:'2026-07-05 16:22', processed:'', status:'REQ', processor:'', processorRole:'', reason:'', approverId:principals.dealer_owner, group:'전체' },
        { id:'UR-20260703-01', email:'ceo@daeyoung-eng.co.kr', name:'정대영', role:'딜러 대표', company:'대영엔지니어링(주)', phone:'010-****-3301', registered:'2026-07-03 11:08', processed:'', status:'REQ', processor:'', processorRole:'', reason:'', approverId:'internal', group:'전체' },
        { id:'UR-20260702-01', email:'lee.ms@minsoo-log.kr', name:'이민수', role:'고객 대표', company:'민수물류', phone:'010-****-6244', registered:'2026-07-02 14:55', processed:'', status:'REQ', processor:'', processorRole:'', reason:'', approverId:principals.dealer_owner, group:'전체' },
        { id:'UR-20260621-01', email:'cho.hj@sejong.co.kr', name:'조현지', role:'고객 직원', company:'(주)세종물류중부지점', phone:'010-****-9018', registered:'2026-06-21 13:20', processed:'2026-06-22 10:14', status:'APRV', processor:'윤태호', processorRole:'고객 대표', reason:'', approverId:principals.customer_owner, group:'테스트그룹' },
        { id:'UR-20260612-01', email:'leader.han@hanbit.co.kr', name:'한지민', role:'고객 대표', company:'한빛산업', phone:'010-****-1184', registered:'2026-06-12 08:44', processed:'2026-06-13 11:08', status:'APRV', processor:'박민아', processorRole:'딜러 대표', reason:'', approverId:principals.dealer_owner, group:'전체' },
        { id:'UR-20260530-01', email:'dealer.temp@sejonglog.co.kr', name:'강도윤', role:'딜러 직원', company:'세종모터스', phone:'010-****-7732', registered:'2026-05-30 16:12', processed:'2026-06-01 09:21', status:'RJCT', processor:'박민아', processorRole:'딜러 대표', reason:'재직 확인 서류가 첨부되지 않았습니다.', approverId:principals.dealer_owner, group:'전체' }
      ];
    }
function currentDemoRequests(legacy, ageDays) {
    return legacy.map(function (record, index) {
      var date = common.dates.addDays(common.dates.today(), -ageDays[index]);
      var registered = common.dates.format(date) + record.registered.slice(10);
      var processed = '';
      if (record.processed) {
        var elapsed = Date.parse(record.processed.replace(' ', 'T')) - Date.parse(record.registered.replace(' ', 'T'));
        var completed = new Date(Date.parse(registered.replace(' ', 'T')) + elapsed);
        processed = common.dates.format(completed) + ' ' + String(completed.getHours()).padStart(2, '0') + ':' + String(completed.getMinutes()).padStart(2, '0');
      }
      return Object.assign({}, record, { registered: registered, processed: processed, demoDateRevision: '20260915-current' });
    });
  }
function nowText() {
    var d = new Date();
    function p(n) { return String(n).padStart(2, '0'); }
    return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) + ' ' + p(d.getHours()) + ':' + p(d.getMinutes());
  }
root.CustomerWebContracts={errors:root.MIQErrors,common:root.MIQCommon,meeting:root.MIQMeeting,charts:MIQCharts,service:root.MIQServiceRecords,demo:root.MIQServiceDemo,observations:root.MIQObservations,reportSeries:root.MIQReportSeries,lithium:root.MIQLithiumListModel,positions:root.MIQMapPositions,efficiency,shocks,summaryValue,reportValue,approvalSeed:function(){return currentDemoRequests(seedUserRequests(),[1,2,3,4,10,16,22]);},existingUsers:["admin@sejonglog.co.kr","cs.lee@sejonglog.co.kr","dealer.park@sejonglog.co.kr","dealer.choi@sejonglog.co.kr","staff.jung@sejonglog.co.kr","staff.kang@sejonglog.co.kr","leader.yoon@customer.co.kr","leader.shin@customer.co.kr","user.oh@customer.co.kr","user.lim@customer.co.kr"],principals,get approvalReference(){return nowText();},legacy:[{"kind":"error","vin":"FBA32_224250271","companyId":"1933","code":"P0003","description":"연료량 조절 밸브 회로 이상","category":"차량","level":"a","spn":"523","fmi":"3","date":"2026-07-25","dateTime":"2026-07-25 08:12","completedAt":null,"errorState":"current","pdfKey":"p0003"},{"kind":"error","vin":"FBA32_032068","companyId":"1933","code":"P0191","description":"연료 레일 압력 센서 범위 이상","category":"차량","level":"b","spn":"157","fmi":"2","date":"2026-07-20","dateTime":"2026-07-20 13:40","completedAt":"2026-07-21 13:40","errorState":"past","pdfKey":null},{"kind":"error","vin":"FBA32_224250271","companyId":"1933","code":"A7","description":"주행 제어 시스템 경고","category":"차량","level":"b","spn":"-","fmi":"-","date":"2026-07-24","dateTime":"2026-07-24 10:30","completedAt":null,"errorState":"current","pdfKey":null},{"kind":"error","vin":"FBA32_032042","companyId":"1933","code":"51","description":"유압 온도 경고","category":"차량","level":"c","spn":"-","fmi":"-","date":"2026-07-15","dateTime":"2026-07-15 10:05","completedAt":"2026-07-16 10:05","errorState":"past","pdfKey":null},{"kind":"error","vin":"FBA32_032068","companyId":"1933","code":"A","description":"시트 안전벨트 미착용","category":"차량","level":"c","spn":"-","fmi":"-","date":"2026-07-12","dateTime":"2026-07-12 09:15","completedAt":"2026-07-13 09:15","errorState":"past","pdfKey":null},{"kind":"error","vin":"FBA32_224250383","companyId":"1933","code":"16","description":"셀 밸런싱 이상","category":"배터리","level":"a","spn":"-","fmi":"-","date":"2026-07-26","dateTime":"2026-07-26 09:30","completedAt":null,"errorState":"current","pdfKey":null},{"kind":"maintenance","vin":"FBA32_224250271","companyId":"1933","date":"2026-07-03","dateTime":"2026-07-03 09:20","part":"트랜스미션","symptom":"오일누유","detail":"변속기 오일 누유 발생, 실링 교체","completed":true},{"kind":"maintenance","vin":"FBA32_224250271","companyId":"1933","date":"2026-07-08","dateTime":"2026-07-08 13:45","part":"조향장치","symptom":"유격발생","detail":"스티어링 링크 조정 및 체결 토크 확인","completed":true},{"kind":"maintenance","vin":"FBA32_224250271","companyId":"1933","date":"2026-07-11","dateTime":"2026-07-11 16:10","part":"전장","symptom":"경고등","detail":"배선 커넥터 접촉 상태 점검","completed":false},{"kind":"maintenance","vin":"FBA32_224250383","companyId":"1933","date":"2026-07-14","dateTime":"2026-07-14 10:00","part":"냉각계통","symptom":"과열","detail":"냉각수 보충 및 호스 누수 점검","completed":true},{"kind":"maintenance","vin":"FBA32_032042","companyId":"1933","date":"2026-07-18","dateTime":"2026-07-18 14:30","part":"유압","symptom":"작동지연","detail":"유압 실린더 점검 및 작동유 보충","completed":false},{"kind":"maintenance","vin":"FBA32_032042","companyId":"1933","date":"2026-07-22","dateTime":"2026-07-22 11:20","part":"브레이크","symptom":"제동불량","detail":"브레이크 패드 마모 상태 확인 후 교체","completed":true}],sourceHashes:{"_mock-data/master/fleet.json":"9448429490b45b7be2501cd867ebc0a62f0bb135bcd367e7c1e47e0dd52b59ba","_mock-data/master/observation-profiles.json":"c3184cf0f6fdca7e2e1c3e0c138ea07f50ecbf230b4a9bf669df9544695febbd","_shared/common-logic.js":"d77b1475070457497dde931fda9d4a83438b1cfc23f067fb716953bc2227cf87","_shared/common-errors.js":"a9cf077be463685f16c5595640c0a9b9f5a4aa99ddb58cbe7c1a2b0dc4c901eb","_shared/vehicle-observations.js":"b5e24277418e22e82b8a06ed5dc20761cda7d1156eb896201b06f4ad21cca7e5","_shared/meeting-model.js":"41cc03e0e4db87e38a1b60f3aed263647c29e4363bc87d2037402a2b8fbf488e","_shared/chart-common.js":"7a02484fc3816be104222d27c65f218ae71b42081605c7eb14bfc23175a1371c","_shared/report-series.js":"d1c19291fbce659ca0c38d4a9434f0084dd73b3dc9acf3a9ac56bc7097689855","_shared/service-records.js":"63ec0adead3eba3a4c99e9895a8c922725866a88f1a5ac4303c82de26f60d435","_shared/service-demo-data.js":"dcd01d3f4b3632d03a3fd4ff741a319008137185f5421a42b12885b693f2ed4d","_shared/lithium-list-model.js":"7303031cad80131e220e3172e7e3d3f1ba0770a2923cc80fd92db1555545376a","_shared/map-positions.js":"f0538ed3d6b1d0ce5dd0ae424da3b0ca3ac2f9d446ca1e5fd614194110433d20","_shared/operation-metrics-enhancements.js":"ab1a628c9c41cf4405b2b70b43230f33a2514ae131c0004fad3034e4b92551c3","Shock/shock-tobe.html":"00914c328cb53d9114d3be86a3058a6f3beb0e3c224395058b4e71bad97ccdef","_shared/vehicle-summary-options.js":"37b02e9b4f5519cde4d56203b02fd35f6cb050d8ea91ea4b44684978f7f165ee","_shared/map-management-enhancements.js":"796cf436894a06bbe4d8ce351ebc4bb3513d92cbf54d2b7ac839a99918dee873","Mgmt User/mgmt-user-tobe.html":"968d0c133d0859308c730176862ae6a605ace593f885032b39e458e96a29a019","Service/service-error-tobe.html":"03a01fe9393e7940c7da8d2931582993c48ca5f59afcc1797f5eb93bd0181057","Service/service-maintenance-tobe.html":"0f64facc9478fd170a82a1a827826309d1871ae7fc92492d904985ecab139242"}};
})(typeof window==='undefined'?globalThis:window);
if(typeof module==='object'&&module.exports)module.exports=globalThis.CustomerWebContracts;
