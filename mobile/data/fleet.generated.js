/* GENERATED FILE - DO NOT EDIT DIRECTLY.
   Source: ../master/fleet.json
   Build: node ../tools/build-fleet-generated.mjs
   Purpose: synchronous classic-script bridge for file:// prototype execution. */
(function (global) {
  'use strict';
  var mockData = global.MIQ_MOCK_DATA = global.MIQ_MOCK_DATA || {};
  mockData.fleet = {
  "schemaVersion": "1.0.0",
  "dataset": "MACHINE IQ prototype fleet master",
  "defaultCompany": {
    "companyId": "1933",
    "companyName": "(주)세종물류중부지점"
  },
  "powerTypes": [
    "엔진",
    "납산",
    "리튬"
  ],
  "dashboardCompanies": [
    {
      "companyId": "1933",
      "companyName": "(주)세종물류중부지점",
      "vehicleCount": 13,
      "connected": 11,
      "disconnected": 2,
      "running": 8,
      "idle": 3,
      "fault": 2,
      "replacementNeeded": 1,
      "replacementSoon": 1,
      "dashboardRoles": [
        "internal",
        "dealer_owner",
        "dealer_staff"
      ]
    },
    {
      "companyId": "12894",
      "companyName": "중원건기",
      "vehicleCount": 23,
      "connected": 20,
      "disconnected": 3,
      "running": 13,
      "idle": 7,
      "fault": 1,
      "replacementNeeded": 1,
      "replacementSoon": 3,
      "dashboardRoles": [
        "internal",
        "dealer_owner",
        "dealer_staff"
      ]
    },
    {
      "companyId": "33767",
      "companyName": "두산지게차 경남중부판매 주식회사",
      "vehicleCount": 5,
      "connected": 4,
      "disconnected": 1,
      "running": 3,
      "idle": 1,
      "fault": 0,
      "replacementNeeded": 1,
      "replacementSoon": 1,
      "dashboardRoles": [
        "internal",
        "dealer_owner",
        "dealer_staff"
      ]
    },
    {
      "companyId": "364",
      "companyName": "온양지게차(호성건설중기)",
      "vehicleCount": 3,
      "connected": 2,
      "disconnected": 1,
      "running": 1,
      "idle": 1,
      "fault": 0,
      "replacementNeeded": 0,
      "replacementSoon": 0,
      "dashboardRoles": [
        "internal",
        "dealer_owner",
        "dealer_staff"
      ]
    },
    {
      "companyId": "3703",
      "companyName": "태형금속공업(주)",
      "vehicleCount": 1,
      "connected": 1,
      "disconnected": 0,
      "running": 1,
      "idle": 0,
      "fault": 0,
      "replacementNeeded": 0,
      "replacementSoon": 0,
      "dashboardRoles": [
        "internal",
        "dealer_owner",
        "dealer_staff"
      ]
    },
    {
      "companyId": "demo-company-006",
      "companyName": "서울한빛물류(주)",
      "vehicleCount": 18,
      "connected": 14,
      "disconnected": 4,
      "running": 7,
      "idle": 7,
      "fault": 0,
      "replacementNeeded": 0,
      "replacementSoon": 1,
      "dashboardRoles": [
        "internal",
        "dealer_owner",
        "dealer_staff"
      ],
      "demo": true
    },
    {
      "companyId": "demo-company-007",
      "companyName": "서울새솔산업(주)",
      "vehicleCount": 35,
      "connected": 27,
      "disconnected": 8,
      "running": 14,
      "idle": 13,
      "fault": 1,
      "replacementNeeded": 3,
      "replacementSoon": 3,
      "dashboardRoles": [
        "internal",
        "dealer_owner",
        "dealer_staff"
      ],
      "demo": true
    },
    {
      "companyId": "demo-company-008",
      "companyName": "서울미래지게차(주)",
      "vehicleCount": 52,
      "connected": 40,
      "disconnected": 12,
      "running": 21,
      "idle": 19,
      "fault": 2,
      "replacementNeeded": 1,
      "replacementSoon": 5,
      "dashboardRoles": [
        "internal",
        "dealer_owner",
        "dealer_staff"
      ],
      "demo": true
    },
    {
      "companyId": "demo-company-009",
      "companyName": "서울대명유통(주)",
      "vehicleCount": 13,
      "connected": 10,
      "disconnected": 3,
      "running": 5,
      "idle": 5,
      "fault": 3,
      "replacementNeeded": 4,
      "replacementSoon": 1,
      "dashboardRoles": [
        "internal",
        "dealer_owner",
        "dealer_staff"
      ],
      "demo": true
    },
    {
      "companyId": "demo-company-010",
      "companyName": "서울청우정밀(주)",
      "vehicleCount": 30,
      "connected": 24,
      "disconnected": 6,
      "running": 13,
      "idle": 11,
      "fault": 0,
      "replacementNeeded": 2,
      "replacementSoon": 3,
      "dashboardRoles": [
        "internal",
        "dealer_owner",
        "dealer_staff"
      ],
      "demo": true
    },
    {
      "companyId": "demo-company-011",
      "companyName": "부산한빛물류(주)",
      "vehicleCount": 47,
      "connected": 38,
      "disconnected": 9,
      "running": 21,
      "idle": 17,
      "fault": 1,
      "replacementNeeded": 0,
      "replacementSoon": 5,
      "dashboardRoles": [
        "internal",
        "dealer_owner",
        "dealer_staff"
      ],
      "demo": true
    },
    {
      "companyId": "demo-company-012",
      "companyName": "부산새솔산업(주)",
      "vehicleCount": 8,
      "connected": 6,
      "disconnected": 2,
      "running": 3,
      "idle": 3,
      "fault": 2,
      "replacementNeeded": 3,
      "replacementSoon": 1,
      "dashboardRoles": [
        "internal",
        "dealer_owner",
        "dealer_staff"
      ],
      "demo": true
    },
    {
      "companyId": "demo-company-013",
      "companyName": "부산미래지게차(주)",
      "vehicleCount": 25,
      "connected": 21,
      "disconnected": 4,
      "running": 12,
      "idle": 9,
      "fault": 3,
      "replacementNeeded": 1,
      "replacementSoon": 3,
      "dashboardRoles": [
        "internal"
      ],
      "demo": true
    },
    {
      "companyId": "demo-company-014",
      "companyName": "부산대명유통(주)",
      "vehicleCount": 42,
      "connected": 35,
      "disconnected": 7,
      "running": 20,
      "idle": 15,
      "fault": 0,
      "replacementNeeded": 4,
      "replacementSoon": 5,
      "dashboardRoles": [
        "internal"
      ],
      "demo": true
    },
    {
      "companyId": "demo-company-015",
      "companyName": "부산청우정밀(주)",
      "vehicleCount": 59,
      "connected": 50,
      "disconnected": 9,
      "running": 30,
      "idle": 20,
      "fault": 1,
      "replacementNeeded": 2,
      "replacementSoon": 1,
      "dashboardRoles": [
        "internal"
      ],
      "demo": true
    },
    {
      "companyId": "demo-company-016",
      "companyName": "대구한빛물류(주)",
      "vehicleCount": 20,
      "connected": 17,
      "disconnected": 3,
      "running": 10,
      "idle": 7,
      "fault": 2,
      "replacementNeeded": 0,
      "replacementSoon": 3,
      "dashboardRoles": [
        "internal"
      ],
      "demo": true
    },
    {
      "companyId": "demo-company-017",
      "companyName": "대구새솔산업(주)",
      "vehicleCount": 37,
      "connected": 32,
      "disconnected": 5,
      "running": 20,
      "idle": 12,
      "fault": 3,
      "replacementNeeded": 3,
      "replacementSoon": 5,
      "dashboardRoles": [
        "internal"
      ],
      "demo": true
    },
    {
      "companyId": "demo-company-018",
      "companyName": "대구미래지게차(주)",
      "vehicleCount": 54,
      "connected": 47,
      "disconnected": 7,
      "running": 29,
      "idle": 18,
      "fault": 0,
      "replacementNeeded": 1,
      "replacementSoon": 1,
      "dashboardRoles": [
        "internal"
      ],
      "demo": true
    },
    {
      "companyId": "demo-company-019",
      "companyName": "대구대명유통(주)",
      "vehicleCount": 15,
      "connected": 13,
      "disconnected": 2,
      "running": 8,
      "idle": 5,
      "fault": 1,
      "replacementNeeded": 4,
      "replacementSoon": 3,
      "dashboardRoles": [
        "internal"
      ],
      "demo": true
    },
    {
      "companyId": "demo-company-020",
      "companyName": "대구청우정밀(주)",
      "vehicleCount": 32,
      "connected": 28,
      "disconnected": 4,
      "running": 18,
      "idle": 10,
      "fault": 2,
      "replacementNeeded": 2,
      "replacementSoon": 5,
      "dashboardRoles": [
        "internal"
      ],
      "demo": true
    },
    {
      "companyId": "demo-company-021",
      "companyName": "인천한빛물류(주)",
      "vehicleCount": 49,
      "connected": 44,
      "disconnected": 5,
      "running": 29,
      "idle": 15,
      "fault": 3,
      "replacementNeeded": 0,
      "replacementSoon": 1,
      "dashboardRoles": [
        "internal"
      ],
      "demo": true
    },
    {
      "companyId": "demo-company-022",
      "companyName": "인천새솔산업(주)",
      "vehicleCount": 10,
      "connected": 9,
      "disconnected": 1,
      "running": 6,
      "idle": 3,
      "fault": 0,
      "replacementNeeded": 3,
      "replacementSoon": 3,
      "dashboardRoles": [
        "internal"
      ],
      "demo": true
    },
    {
      "companyId": "demo-company-023",
      "companyName": "인천미래지게차(주)",
      "vehicleCount": 27,
      "connected": 25,
      "disconnected": 2,
      "running": 17,
      "idle": 8,
      "fault": 1,
      "replacementNeeded": 1,
      "replacementSoon": 5,
      "dashboardRoles": [
        "internal"
      ],
      "demo": true
    },
    {
      "companyId": "demo-company-024",
      "companyName": "인천대명유통(주)",
      "vehicleCount": 44,
      "connected": 41,
      "disconnected": 3,
      "running": 28,
      "idle": 13,
      "fault": 2,
      "replacementNeeded": 4,
      "replacementSoon": 1,
      "dashboardRoles": [
        "internal"
      ],
      "demo": true
    },
    {
      "companyId": "demo-company-025",
      "companyName": "인천청우정밀(주)",
      "vehicleCount": 5,
      "connected": 5,
      "disconnected": 0,
      "running": 3,
      "idle": 2,
      "fault": 3,
      "replacementNeeded": 2,
      "replacementSoon": 3,
      "dashboardRoles": [
        "internal"
      ],
      "demo": true
    },
    {
      "companyId": "demo-company-026",
      "companyName": "광주한빛물류(주)",
      "vehicleCount": 22,
      "connected": 21,
      "disconnected": 1,
      "running": 15,
      "idle": 6,
      "fault": 0,
      "replacementNeeded": 0,
      "replacementSoon": 5,
      "dashboardRoles": [
        "internal"
      ],
      "demo": true
    },
    {
      "companyId": "demo-company-027",
      "companyName": "광주새솔산업(주)",
      "vehicleCount": 39,
      "connected": 29,
      "disconnected": 10,
      "running": 21,
      "idle": 8,
      "fault": 1,
      "replacementNeeded": 3,
      "replacementSoon": 1,
      "dashboardRoles": [
        "internal"
      ],
      "demo": true
    },
    {
      "companyId": "demo-company-028",
      "companyName": "광주미래지게차(주)",
      "vehicleCount": 56,
      "connected": 43,
      "disconnected": 13,
      "running": 31,
      "idle": 12,
      "fault": 2,
      "replacementNeeded": 1,
      "replacementSoon": 3,
      "dashboardRoles": [
        "internal"
      ],
      "demo": true
    },
    {
      "companyId": "demo-company-029",
      "companyName": "광주대명유통(주)",
      "vehicleCount": 17,
      "connected": 13,
      "disconnected": 4,
      "running": 9,
      "idle": 4,
      "fault": 3,
      "replacementNeeded": 4,
      "replacementSoon": 5,
      "dashboardRoles": [
        "internal"
      ],
      "demo": true
    },
    {
      "companyId": "demo-company-030",
      "companyName": "광주청우정밀(주)",
      "vehicleCount": 34,
      "connected": 27,
      "disconnected": 7,
      "running": 20,
      "idle": 7,
      "fault": 0,
      "replacementNeeded": 2,
      "replacementSoon": 1,
      "dashboardRoles": [
        "internal"
      ],
      "demo": true
    },
    {
      "companyId": "demo-company-031",
      "companyName": "대전한빛물류(주)",
      "vehicleCount": 51,
      "connected": 40,
      "disconnected": 11,
      "running": 30,
      "idle": 10,
      "fault": 1,
      "replacementNeeded": 0,
      "replacementSoon": 3,
      "dashboardRoles": [
        "internal"
      ],
      "demo": true
    },
    {
      "companyId": "demo-company-032",
      "companyName": "대전새솔산업(주)",
      "vehicleCount": 12,
      "connected": 10,
      "disconnected": 2,
      "running": 8,
      "idle": 2,
      "fault": 2,
      "replacementNeeded": 3,
      "replacementSoon": 5,
      "dashboardRoles": [
        "internal"
      ],
      "demo": true
    },
    {
      "companyId": "demo-company-033",
      "companyName": "대전미래지게차(주)",
      "vehicleCount": 29,
      "connected": 23,
      "disconnected": 6,
      "running": 18,
      "idle": 5,
      "fault": 3,
      "replacementNeeded": 1,
      "replacementSoon": 1,
      "dashboardRoles": [
        "internal"
      ],
      "demo": true
    },
    {
      "companyId": "demo-company-034",
      "companyName": "대전대명유통(주)",
      "vehicleCount": 46,
      "connected": 38,
      "disconnected": 8,
      "running": 30,
      "idle": 8,
      "fault": 0,
      "replacementNeeded": 4,
      "replacementSoon": 3,
      "dashboardRoles": [
        "internal"
      ],
      "demo": true
    },
    {
      "companyId": "demo-company-035",
      "companyName": "대전청우정밀(주)",
      "vehicleCount": 7,
      "connected": 6,
      "disconnected": 1,
      "running": 5,
      "idle": 1,
      "fault": 1,
      "replacementNeeded": 2,
      "replacementSoon": 5,
      "dashboardRoles": [
        "internal"
      ],
      "demo": true
    },
    {
      "companyId": "demo-company-036",
      "companyName": "울산한빛물류(주)",
      "vehicleCount": 24,
      "connected": 20,
      "disconnected": 4,
      "running": 16,
      "idle": 4,
      "fault": 2,
      "replacementNeeded": 0,
      "replacementSoon": 1,
      "dashboardRoles": [
        "internal"
      ],
      "demo": true
    },
    {
      "companyId": "demo-company-037",
      "companyName": "울산새솔산업(주)",
      "vehicleCount": 41,
      "connected": 35,
      "disconnected": 6,
      "running": 28,
      "idle": 7,
      "fault": 3,
      "replacementNeeded": 3,
      "replacementSoon": 3,
      "dashboardRoles": [
        "internal"
      ],
      "demo": true
    },
    {
      "companyId": "demo-company-038",
      "companyName": "울산미래지게차(주)",
      "vehicleCount": 58,
      "connected": 50,
      "disconnected": 8,
      "running": 41,
      "idle": 9,
      "fault": 0,
      "replacementNeeded": 1,
      "replacementSoon": 5,
      "dashboardRoles": [
        "internal"
      ],
      "demo": true
    },
    {
      "companyId": "demo-company-039",
      "companyName": "울산대명유통(주)",
      "vehicleCount": 19,
      "connected": 17,
      "disconnected": 2,
      "running": 14,
      "idle": 3,
      "fault": 1,
      "replacementNeeded": 4,
      "replacementSoon": 1,
      "dashboardRoles": [
        "internal"
      ],
      "demo": true
    },
    {
      "companyId": "demo-company-040",
      "companyName": "울산청우정밀(주)",
      "vehicleCount": 36,
      "connected": 32,
      "disconnected": 4,
      "running": 27,
      "idle": 5,
      "fault": 2,
      "replacementNeeded": 2,
      "replacementSoon": 3,
      "dashboardRoles": [
        "internal"
      ],
      "demo": true
    },
    {
      "companyId": "demo-company-041",
      "companyName": "수원한빛물류(주)",
      "vehicleCount": 53,
      "connected": 47,
      "disconnected": 6,
      "running": 40,
      "idle": 7,
      "fault": 3,
      "replacementNeeded": 0,
      "replacementSoon": 5,
      "dashboardRoles": [
        "internal"
      ],
      "demo": true
    },
    {
      "companyId": "demo-company-042",
      "companyName": "수원새솔산업(주)",
      "vehicleCount": 14,
      "connected": 13,
      "disconnected": 1,
      "running": 7,
      "idle": 6,
      "fault": 0,
      "replacementNeeded": 3,
      "replacementSoon": 1,
      "dashboardRoles": [
        "internal"
      ],
      "demo": true
    },
    {
      "companyId": "demo-company-043",
      "companyName": "수원미래지게차(주)",
      "vehicleCount": 31,
      "connected": 28,
      "disconnected": 3,
      "running": 14,
      "idle": 14,
      "fault": 1,
      "replacementNeeded": 1,
      "replacementSoon": 3,
      "dashboardRoles": [
        "internal"
      ],
      "demo": true
    },
    {
      "companyId": "demo-company-044",
      "companyName": "수원대명유통(주)",
      "vehicleCount": 48,
      "connected": 44,
      "disconnected": 4,
      "running": 23,
      "idle": 21,
      "fault": 2,
      "replacementNeeded": 4,
      "replacementSoon": 5,
      "dashboardRoles": [
        "internal"
      ],
      "demo": true
    },
    {
      "companyId": "demo-company-045",
      "companyName": "수원청우정밀(주)",
      "vehicleCount": 9,
      "connected": 8,
      "disconnected": 1,
      "running": 4,
      "idle": 4,
      "fault": 3,
      "replacementNeeded": 2,
      "replacementSoon": 1,
      "dashboardRoles": [
        "internal"
      ],
      "demo": true
    },
    {
      "companyId": "demo-company-046",
      "companyName": "용인한빛물류(주)",
      "vehicleCount": 26,
      "connected": 24,
      "disconnected": 2,
      "running": 13,
      "idle": 11,
      "fault": 0,
      "replacementNeeded": 0,
      "replacementSoon": 3,
      "dashboardRoles": [
        "internal"
      ],
      "demo": true
    },
    {
      "companyId": "demo-company-047",
      "companyName": "용인새솔산업(주)",
      "vehicleCount": 43,
      "connected": 41,
      "disconnected": 2,
      "running": 23,
      "idle": 18,
      "fault": 1,
      "replacementNeeded": 3,
      "replacementSoon": 5,
      "dashboardRoles": [
        "internal"
      ],
      "demo": true
    },
    {
      "companyId": "demo-company-048",
      "companyName": "용인미래지게차(주)",
      "vehicleCount": 60,
      "connected": 45,
      "disconnected": 15,
      "running": 25,
      "idle": 20,
      "fault": 2,
      "replacementNeeded": 1,
      "replacementSoon": 1,
      "dashboardRoles": [
        "internal"
      ],
      "demo": true
    },
    {
      "companyId": "demo-company-049",
      "companyName": "용인대명유통(주)",
      "vehicleCount": 21,
      "connected": 16,
      "disconnected": 5,
      "running": 9,
      "idle": 7,
      "fault": 3,
      "replacementNeeded": 4,
      "replacementSoon": 3,
      "dashboardRoles": [
        "internal"
      ],
      "demo": true
    },
    {
      "companyId": "demo-company-050",
      "companyName": "용인청우정밀(주)",
      "vehicleCount": 38,
      "connected": 29,
      "disconnected": 9,
      "running": 17,
      "idle": 12,
      "fault": 0,
      "replacementNeeded": 2,
      "replacementSoon": 5,
      "dashboardRoles": [
        "internal"
      ],
      "demo": true
    },
    {
      "companyId": "demo-company-051",
      "companyName": "평택한빛물류(주)",
      "vehicleCount": 55,
      "connected": 43,
      "disconnected": 12,
      "running": 25,
      "idle": 18,
      "fault": 1,
      "replacementNeeded": 0,
      "replacementSoon": 1,
      "dashboardRoles": [
        "internal"
      ],
      "demo": true
    },
    {
      "companyId": "demo-company-052",
      "companyName": "평택새솔산업(주)",
      "vehicleCount": 16,
      "connected": 13,
      "disconnected": 3,
      "running": 8,
      "idle": 5,
      "fault": 2,
      "replacementNeeded": 3,
      "replacementSoon": 3,
      "dashboardRoles": [
        "internal"
      ],
      "demo": true
    },
    {
      "companyId": "demo-company-053",
      "companyName": "평택미래지게차(주)",
      "vehicleCount": 33,
      "connected": 26,
      "disconnected": 7,
      "running": 16,
      "idle": 10,
      "fault": 3,
      "replacementNeeded": 1,
      "replacementSoon": 5,
      "dashboardRoles": [
        "internal"
      ],
      "demo": true
    },
    {
      "companyId": "demo-company-054",
      "companyName": "평택대명유통(주)",
      "vehicleCount": 50,
      "connected": 41,
      "disconnected": 9,
      "running": 25,
      "idle": 16,
      "fault": 0,
      "replacementNeeded": 4,
      "replacementSoon": 1,
      "dashboardRoles": [
        "internal"
      ],
      "demo": true
    },
    {
      "companyId": "demo-company-055",
      "companyName": "평택청우정밀(주)",
      "vehicleCount": 11,
      "connected": 9,
      "disconnected": 2,
      "running": 6,
      "idle": 3,
      "fault": 1,
      "replacementNeeded": 2,
      "replacementSoon": 3,
      "dashboardRoles": [
        "internal"
      ],
      "demo": true
    },
    {
      "companyId": "demo-company-056",
      "companyName": "천안한빛물류(주)",
      "vehicleCount": 28,
      "connected": 23,
      "disconnected": 5,
      "running": 15,
      "idle": 8,
      "fault": 2,
      "replacementNeeded": 0,
      "replacementSoon": 5,
      "dashboardRoles": [
        "internal"
      ],
      "demo": true
    },
    {
      "companyId": "demo-company-057",
      "companyName": "천안새솔산업(주)",
      "vehicleCount": 45,
      "connected": 38,
      "disconnected": 7,
      "running": 25,
      "idle": 13,
      "fault": 3,
      "replacementNeeded": 3,
      "replacementSoon": 1,
      "dashboardRoles": [
        "internal"
      ],
      "demo": true
    },
    {
      "companyId": "demo-company-058",
      "companyName": "천안미래지게차(주)",
      "vehicleCount": 6,
      "connected": 5,
      "disconnected": 1,
      "running": 3,
      "idle": 2,
      "fault": 0,
      "replacementNeeded": 1,
      "replacementSoon": 3,
      "dashboardRoles": [
        "internal"
      ],
      "demo": true
    },
    {
      "companyId": "demo-company-059",
      "companyName": "천안대명유통(주)",
      "vehicleCount": 23,
      "connected": 20,
      "disconnected": 3,
      "running": 13,
      "idle": 7,
      "fault": 1,
      "replacementNeeded": 4,
      "replacementSoon": 5,
      "dashboardRoles": [
        "internal"
      ],
      "demo": true
    },
    {
      "companyId": "demo-company-060",
      "companyName": "천안청우정밀(주)",
      "vehicleCount": 40,
      "connected": 35,
      "disconnected": 5,
      "running": 24,
      "idle": 11,
      "fault": 2,
      "replacementNeeded": 2,
      "replacementSoon": 1,
      "dashboardRoles": [
        "internal"
      ],
      "demo": true
    },
    {
      "companyId": "demo-company-061",
      "companyName": "아산한빛물류(주)",
      "vehicleCount": 57,
      "connected": 50,
      "disconnected": 7,
      "running": 35,
      "idle": 15,
      "fault": 3,
      "replacementNeeded": 0,
      "replacementSoon": 3,
      "dashboardRoles": [
        "internal"
      ],
      "demo": true
    },
    {
      "companyId": "demo-company-062",
      "companyName": "아산새솔산업(주)",
      "vehicleCount": 18,
      "connected": 16,
      "disconnected": 2,
      "running": 11,
      "idle": 5,
      "fault": 0,
      "replacementNeeded": 3,
      "replacementSoon": 5,
      "dashboardRoles": [
        "internal"
      ],
      "demo": true
    },
    {
      "companyId": "demo-company-063",
      "companyName": "아산미래지게차(주)",
      "vehicleCount": 35,
      "connected": 32,
      "disconnected": 3,
      "running": 23,
      "idle": 9,
      "fault": 1,
      "replacementNeeded": 1,
      "replacementSoon": 1,
      "dashboardRoles": [
        "internal"
      ],
      "demo": true
    },
    {
      "companyId": "demo-company-064",
      "companyName": "아산대명유통(주)",
      "vehicleCount": 52,
      "connected": 47,
      "disconnected": 5,
      "running": 34,
      "idle": 13,
      "fault": 2,
      "replacementNeeded": 4,
      "replacementSoon": 3,
      "dashboardRoles": [
        "internal"
      ],
      "demo": true
    },
    {
      "companyId": "demo-company-065",
      "companyName": "아산청우정밀(주)",
      "vehicleCount": 13,
      "connected": 12,
      "disconnected": 1,
      "running": 9,
      "idle": 3,
      "fault": 3,
      "replacementNeeded": 2,
      "replacementSoon": 5,
      "dashboardRoles": [
        "internal"
      ],
      "demo": true
    },
    {
      "companyId": "demo-company-066",
      "companyName": "청주한빛물류(주)",
      "vehicleCount": 30,
      "connected": 28,
      "disconnected": 2,
      "running": 21,
      "idle": 7,
      "fault": 0,
      "replacementNeeded": 0,
      "replacementSoon": 1,
      "dashboardRoles": [
        "internal"
      ],
      "demo": true
    },
    {
      "companyId": "demo-company-067",
      "companyName": "청주새솔산업(주)",
      "vehicleCount": 47,
      "connected": 44,
      "disconnected": 3,
      "running": 33,
      "idle": 11,
      "fault": 1,
      "replacementNeeded": 3,
      "replacementSoon": 3,
      "dashboardRoles": [
        "internal"
      ],
      "demo": true
    },
    {
      "companyId": "demo-company-068",
      "companyName": "청주미래지게차(주)",
      "vehicleCount": 8,
      "connected": 8,
      "disconnected": 0,
      "running": 6,
      "idle": 2,
      "fault": 2,
      "replacementNeeded": 1,
      "replacementSoon": 5,
      "dashboardRoles": [
        "internal"
      ],
      "demo": true
    },
    {
      "companyId": "demo-company-069",
      "companyName": "청주대명유통(주)",
      "vehicleCount": 25,
      "connected": 19,
      "disconnected": 6,
      "running": 15,
      "idle": 4,
      "fault": 3,
      "replacementNeeded": 4,
      "replacementSoon": 1,
      "dashboardRoles": [
        "internal"
      ],
      "demo": true
    },
    {
      "companyId": "demo-company-070",
      "companyName": "청주청우정밀(주)",
      "vehicleCount": 42,
      "connected": 32,
      "disconnected": 10,
      "running": 25,
      "idle": 7,
      "fault": 0,
      "replacementNeeded": 2,
      "replacementSoon": 3,
      "dashboardRoles": [
        "internal"
      ],
      "demo": true
    },
    {
      "companyId": "demo-company-071",
      "companyName": "전주한빛물류(주)",
      "vehicleCount": 59,
      "connected": 45,
      "disconnected": 14,
      "running": 36,
      "idle": 9,
      "fault": 1,
      "replacementNeeded": 0,
      "replacementSoon": 5,
      "dashboardRoles": [
        "internal"
      ],
      "demo": true
    },
    {
      "companyId": "demo-company-072",
      "companyName": "전주새솔산업(주)",
      "vehicleCount": 20,
      "connected": 16,
      "disconnected": 4,
      "running": 13,
      "idle": 3,
      "fault": 2,
      "replacementNeeded": 3,
      "replacementSoon": 1,
      "dashboardRoles": [
        "internal"
      ],
      "demo": true
    },
    {
      "companyId": "demo-company-073",
      "companyName": "전주미래지게차(주)",
      "vehicleCount": 37,
      "connected": 29,
      "disconnected": 8,
      "running": 23,
      "idle": 6,
      "fault": 3,
      "replacementNeeded": 1,
      "replacementSoon": 3,
      "dashboardRoles": [
        "internal"
      ],
      "demo": true
    },
    {
      "companyId": "demo-company-074",
      "companyName": "전주대명유통(주)",
      "vehicleCount": 54,
      "connected": 43,
      "disconnected": 11,
      "running": 35,
      "idle": 8,
      "fault": 0,
      "replacementNeeded": 4,
      "replacementSoon": 5,
      "dashboardRoles": [
        "internal"
      ],
      "demo": true
    },
    {
      "companyId": "demo-company-075",
      "companyName": "전주청우정밀(주)",
      "vehicleCount": 15,
      "connected": 12,
      "disconnected": 3,
      "running": 10,
      "idle": 2,
      "fault": 1,
      "replacementNeeded": 2,
      "replacementSoon": 1,
      "dashboardRoles": [
        "internal"
      ],
      "demo": true
    },
    {
      "companyId": "demo-company-076",
      "companyName": "군산한빛물류(주)",
      "vehicleCount": 32,
      "connected": 26,
      "disconnected": 6,
      "running": 22,
      "idle": 4,
      "fault": 2,
      "replacementNeeded": 0,
      "replacementSoon": 3,
      "dashboardRoles": [
        "internal"
      ],
      "demo": true
    },
    {
      "companyId": "demo-company-077",
      "companyName": "군산새솔산업(주)",
      "vehicleCount": 49,
      "connected": 41,
      "disconnected": 8,
      "running": 35,
      "idle": 6,
      "fault": 3,
      "replacementNeeded": 3,
      "replacementSoon": 5,
      "dashboardRoles": [
        "internal"
      ],
      "demo": true
    },
    {
      "companyId": "demo-company-078",
      "companyName": "군산미래지게차(주)",
      "vehicleCount": 10,
      "connected": 8,
      "disconnected": 2,
      "running": 4,
      "idle": 4,
      "fault": 0,
      "replacementNeeded": 1,
      "replacementSoon": 1,
      "dashboardRoles": [
        "internal"
      ],
      "demo": true
    },
    {
      "companyId": "demo-company-079",
      "companyName": "군산대명유통(주)",
      "vehicleCount": 27,
      "connected": 23,
      "disconnected": 4,
      "running": 12,
      "idle": 11,
      "fault": 1,
      "replacementNeeded": 4,
      "replacementSoon": 3,
      "dashboardRoles": [
        "internal"
      ],
      "demo": true
    },
    {
      "companyId": "demo-company-080",
      "companyName": "군산청우정밀(주)",
      "vehicleCount": 44,
      "connected": 38,
      "disconnected": 6,
      "running": 20,
      "idle": 18,
      "fault": 2,
      "replacementNeeded": 2,
      "replacementSoon": 5,
      "dashboardRoles": [
        "internal"
      ],
      "demo": true
    },
    {
      "companyId": "demo-company-081",
      "companyName": "창원한빛물류(주)",
      "vehicleCount": 5,
      "connected": 4,
      "disconnected": 1,
      "running": 2,
      "idle": 2,
      "fault": 3,
      "replacementNeeded": 0,
      "replacementSoon": 1,
      "dashboardRoles": [
        "internal"
      ],
      "demo": true
    },
    {
      "companyId": "demo-company-082",
      "companyName": "창원새솔산업(주)",
      "vehicleCount": 22,
      "connected": 19,
      "disconnected": 3,
      "running": 10,
      "idle": 9,
      "fault": 0,
      "replacementNeeded": 3,
      "replacementSoon": 3,
      "dashboardRoles": [
        "internal"
      ],
      "demo": true
    },
    {
      "companyId": "demo-company-083",
      "companyName": "창원미래지게차(주)",
      "vehicleCount": 39,
      "connected": 35,
      "disconnected": 4,
      "running": 19,
      "idle": 16,
      "fault": 1,
      "replacementNeeded": 1,
      "replacementSoon": 5,
      "dashboardRoles": [
        "internal"
      ],
      "demo": true
    },
    {
      "companyId": "demo-company-084",
      "companyName": "창원대명유통(주)",
      "vehicleCount": 56,
      "connected": 50,
      "disconnected": 6,
      "running": 28,
      "idle": 22,
      "fault": 2,
      "replacementNeeded": 4,
      "replacementSoon": 1,
      "dashboardRoles": [
        "internal"
      ],
      "demo": true
    },
    {
      "companyId": "demo-company-085",
      "companyName": "창원청우정밀(주)",
      "vehicleCount": 17,
      "connected": 15,
      "disconnected": 2,
      "running": 9,
      "idle": 6,
      "fault": 3,
      "replacementNeeded": 2,
      "replacementSoon": 3,
      "dashboardRoles": [
        "internal"
      ],
      "demo": true
    },
    {
      "companyId": "demo-company-086",
      "companyName": "김해한빛물류(주)",
      "vehicleCount": 34,
      "connected": 31,
      "disconnected": 3,
      "running": 18,
      "idle": 13,
      "fault": 0,
      "replacementNeeded": 0,
      "replacementSoon": 5,
      "dashboardRoles": [
        "internal"
      ],
      "demo": true
    },
    {
      "companyId": "demo-company-087",
      "companyName": "김해새솔산업(주)",
      "vehicleCount": 51,
      "connected": 47,
      "disconnected": 4,
      "running": 28,
      "idle": 19,
      "fault": 1,
      "replacementNeeded": 3,
      "replacementSoon": 1,
      "dashboardRoles": [
        "internal"
      ],
      "demo": true
    },
    {
      "companyId": "demo-company-088",
      "companyName": "김해미래지게차(주)",
      "vehicleCount": 12,
      "connected": 11,
      "disconnected": 1,
      "running": 7,
      "idle": 4,
      "fault": 2,
      "replacementNeeded": 1,
      "replacementSoon": 3,
      "dashboardRoles": [
        "internal"
      ],
      "demo": true
    },
    {
      "companyId": "demo-company-089",
      "companyName": "김해대명유통(주)",
      "vehicleCount": 29,
      "connected": 28,
      "disconnected": 1,
      "running": 17,
      "idle": 11,
      "fault": 3,
      "replacementNeeded": 4,
      "replacementSoon": 5,
      "dashboardRoles": [
        "internal"
      ],
      "demo": true
    },
    {
      "companyId": "demo-company-090",
      "companyName": "김해청우정밀(주)",
      "vehicleCount": 46,
      "connected": 35,
      "disconnected": 11,
      "running": 22,
      "idle": 13,
      "fault": 0,
      "replacementNeeded": 2,
      "replacementSoon": 1,
      "dashboardRoles": [
        "internal"
      ],
      "demo": true
    },
    {
      "companyId": "demo-company-091",
      "companyName": "양산한빛물류(주)",
      "vehicleCount": 7,
      "connected": 5,
      "disconnected": 2,
      "running": 3,
      "idle": 2,
      "fault": 1,
      "replacementNeeded": 0,
      "replacementSoon": 3,
      "dashboardRoles": [
        "internal"
      ],
      "demo": true
    },
    {
      "companyId": "demo-company-092",
      "companyName": "양산새솔산업(주)",
      "vehicleCount": 24,
      "connected": 18,
      "disconnected": 6,
      "running": 12,
      "idle": 6,
      "fault": 2,
      "replacementNeeded": 3,
      "replacementSoon": 5,
      "dashboardRoles": [
        "internal"
      ],
      "demo": true
    },
    {
      "companyId": "demo-company-093",
      "companyName": "양산미래지게차(주)",
      "vehicleCount": 41,
      "connected": 32,
      "disconnected": 9,
      "running": 21,
      "idle": 11,
      "fault": 3,
      "replacementNeeded": 1,
      "replacementSoon": 1,
      "dashboardRoles": [
        "internal"
      ],
      "demo": true
    },
    {
      "companyId": "demo-company-094",
      "companyName": "양산대명유통(주)",
      "vehicleCount": 58,
      "connected": 46,
      "disconnected": 12,
      "running": 30,
      "idle": 16,
      "fault": 0,
      "replacementNeeded": 4,
      "replacementSoon": 3,
      "dashboardRoles": [
        "internal"
      ],
      "demo": true
    },
    {
      "companyId": "demo-company-095",
      "companyName": "양산청우정밀(주)",
      "vehicleCount": 19,
      "connected": 15,
      "disconnected": 4,
      "running": 10,
      "idle": 5,
      "fault": 1,
      "replacementNeeded": 2,
      "replacementSoon": 5,
      "dashboardRoles": [
        "internal"
      ],
      "demo": true
    },
    {
      "companyId": "demo-company-096",
      "companyName": "제주한빛물류(주)",
      "vehicleCount": 36,
      "connected": 29,
      "disconnected": 7,
      "running": 20,
      "idle": 9,
      "fault": 2,
      "replacementNeeded": 0,
      "replacementSoon": 1,
      "dashboardRoles": [
        "internal"
      ],
      "demo": true
    },
    {
      "companyId": "demo-company-097",
      "companyName": "제주새솔산업(주)",
      "vehicleCount": 53,
      "connected": 43,
      "disconnected": 10,
      "running": 30,
      "idle": 13,
      "fault": 3,
      "replacementNeeded": 3,
      "replacementSoon": 3,
      "dashboardRoles": [
        "internal"
      ],
      "demo": true
    },
    {
      "companyId": "demo-company-098",
      "companyName": "제주미래지게차(주)",
      "vehicleCount": 14,
      "connected": 12,
      "disconnected": 2,
      "running": 8,
      "idle": 4,
      "fault": 0,
      "replacementNeeded": 1,
      "replacementSoon": 5,
      "dashboardRoles": [
        "internal"
      ],
      "demo": true
    },
    {
      "companyId": "demo-company-099",
      "companyName": "제주대명유통(주)",
      "vehicleCount": 31,
      "connected": 26,
      "disconnected": 5,
      "running": 18,
      "idle": 8,
      "fault": 1,
      "replacementNeeded": 4,
      "replacementSoon": 1,
      "dashboardRoles": [
        "internal"
      ],
      "demo": true
    },
    {
      "companyId": "demo-company-100",
      "companyName": "제주청우정밀(주)",
      "vehicleCount": 48,
      "connected": 41,
      "disconnected": 7,
      "running": 30,
      "idle": 11,
      "fault": 2,
      "replacementNeeded": 2,
      "replacementSoon": 3,
      "dashboardRoles": [
        "internal"
      ],
      "demo": true
    }
  ],
  "vehicles": [
    {
      "companyId": "1933",
      "companyName": "(주)세종물류중부지점",
      "catalogOnly": false,
      "model": "B30S-7",
      "vin": "FBA32_224250271",
      "group": "기본그룹",
      "type": "리튬",
      "cumKm": 12430,
      "cumH": 3180,
      "conn": true,
      "soc": 80,
      "km": 16,
      "min": 461,
      "summaryDetail": {
        "workMinutes": 430,
        "idleMinutes": 31,
        "supplyDueCount": 1,
        "activeErrorCount": 2
      },
      "eff": 93.2,
      "shock": 2,
      "bc": 2.4
    },
    {
      "companyId": "1933",
      "companyName": "(주)세종물류중부지점",
      "catalogOnly": false,
      "model": "D25S-9",
      "vin": "FBD25_113920044",
      "group": "기본그룹",
      "type": "엔진",
      "cumKm": 28910,
      "cumH": 5640,
      "conn": false,
      "soc": null,
      "km": 212,
      "min": 5772,
      "summaryDetail": {
        "workMinutes": 4502,
        "idleMinutes": 1270,
        "supplyDueCount": null,
        "activeErrorCount": null
      },
      "eff": 3.8,
      "shock": 9,
      "fc": 3.8
    },
    {
      "companyId": "1933",
      "companyName": "(주)세종물류중부지점",
      "catalogOnly": false,
      "model": "B18S-7",
      "vin": "FBA18_224250094",
      "group": "테스트그룹",
      "type": "납산",
      "cumKm": 9870,
      "cumH": 2410,
      "conn": true,
      "soc": null,
      "km": 15,
      "min": 1000,
      "summaryDetail": {
        "workMinutes": 644,
        "idleMinutes": 356,
        "supplyDueCount": null,
        "activeErrorCount": null
      },
      "eff": 64.4,
      "shock": 1,
      "bc": 1.9
    },
    {
      "companyId": "1933",
      "companyName": "(주)세종물류중부지점",
      "catalogOnly": false,
      "model": "B20S-7",
      "vin": "FBA20_224250312",
      "group": "기본그룹",
      "type": "리튬",
      "cumKm": 7240,
      "cumH": 1860,
      "conn": true,
      "soc": 62,
      "km": 34,
      "min": 1265,
      "summaryDetail": {
        "workMinutes": 1121,
        "idleMinutes": 144,
        "supplyDueCount": null,
        "activeErrorCount": null
      },
      "eff": 88.6,
      "shock": 3,
      "bc": 2.1
    },
    {
      "companyId": "1933",
      "companyName": "(주)세종물류중부지점",
      "catalogOnly": false,
      "model": "B25S-7",
      "vin": "FBA25_224250188",
      "group": "기본그룹",
      "type": "리튬",
      "cumKm": 15120,
      "cumH": 4020,
      "conn": true,
      "soc": 45,
      "km": 58,
      "min": 2598,
      "summaryDetail": {
        "workMinutes": 2375,
        "idleMinutes": 223,
        "supplyDueCount": null,
        "activeErrorCount": null
      },
      "eff": 91.4,
      "shock": 5,
      "bc": 2.8
    },
    {
      "companyId": "1933",
      "companyName": "(주)세종물류중부지점",
      "catalogOnly": false,
      "model": "D30S-9",
      "vin": "FBD30_113920117",
      "group": "테스트그룹",
      "type": "엔진",
      "cumKm": 33480,
      "cumH": 6210,
      "conn": true,
      "soc": null,
      "km": 187,
      "min": 5307,
      "summaryDetail": {
        "workMinutes": 3927,
        "idleMinutes": 1380,
        "supplyDueCount": null,
        "activeErrorCount": null
      },
      "eff": 4.1,
      "shock": 7,
      "fc": 4.1
    },
    {
      "companyId": "1933",
      "companyName": "(주)세종물류중부지점",
      "catalogOnly": false,
      "model": "B16S-7",
      "vin": "FBA16_224250045",
      "group": "물류2팀",
      "type": "리튬",
      "cumKm": 4530,
      "cumH": 1120,
      "conn": false,
      "soc": 27,
      "km": 12,
      "min": 592,
      "summaryDetail": {
        "workMinutes": 562,
        "idleMinutes": 30,
        "supplyDueCount": null,
        "activeErrorCount": null
      },
      "eff": 95,
      "shock": 0,
      "bc": 1.6
    },
    {
      "companyId": "1933",
      "companyName": "(주)세종물류중부지점",
      "catalogOnly": false,
      "model": "B35S-7",
      "vin": "FBA35_224250403",
      "group": "테스트그룹",
      "type": "리튬",
      "cumKm": 19760,
      "cumH": 5080,
      "conn": true,
      "soc": 71,
      "km": 76,
      "min": 3693,
      "summaryDetail": {
        "workMinutes": 3313,
        "idleMinutes": 380,
        "supplyDueCount": null,
        "activeErrorCount": null
      },
      "eff": 89.7,
      "shock": 4,
      "bc": 3.2
    },
    {
      "companyId": "1933",
      "companyName": "(주)세종물류중부지점",
      "catalogOnly": false,
      "model": "D18S-9",
      "vin": "FBD18_113920062",
      "group": "물류2팀",
      "type": "엔진",
      "cumKm": 21340,
      "cumH": 3970,
      "conn": true,
      "soc": null,
      "km": 143,
      "min": 3129,
      "summaryDetail": {
        "workMinutes": 2566,
        "idleMinutes": 563,
        "supplyDueCount": null,
        "activeErrorCount": null
      },
      "eff": 3.5,
      "shock": 6,
      "fc": 3.5
    },
    {
      "companyId": "1933",
      "companyName": "(주)세종물류중부지점",
      "catalogOnly": false,
      "model": "B22S-7",
      "vin": "FBA22_224250226",
      "group": "테스트그룹",
      "type": "납산",
      "cumKm": 11090,
      "cumH": 2880,
      "conn": false,
      "soc": null,
      "km": 22,
      "min": 1104,
      "summaryDetail": {
        "workMinutes": 786,
        "idleMinutes": 318,
        "supplyDueCount": null,
        "activeErrorCount": null
      },
      "eff": 71.2,
      "shock": 2,
      "bc": 2
    },
    {
      "vin": "FDB19-000122",
      "model": "D50S-9",
      "type": "엔진",
      "companyId": "12894",
      "companyName": "중원건기",
      "group": "기본그룹",
      "km": 0,
      "min": 239,
      "operatingRate": 6.2,
      "efficiencyRate": 99.5,
      "eff": 99.5,
      "shock": 0,
      "fc": 3.7,
      "bc": null,
      "soc": null,
      "energyRate": null,
      "conn": null,
      "cumKm": null,
      "cumH": null,
      "catalogOnly": true
    },
    {
      "vin": "FDB19_225060343",
      "model": "D50S-9",
      "type": "엔진",
      "companyId": "12894",
      "companyName": "중원건기",
      "group": "기본그룹",
      "km": 5,
      "min": 1316,
      "operatingRate": 15.2,
      "efficiencyRate": 98.7,
      "eff": 98.7,
      "shock": 61,
      "fc": 4.3,
      "bc": null,
      "soc": null,
      "energyRate": 45,
      "conn": true,
      "cumKm": null,
      "cumH": null,
      "catalogOnly": true
    },
    {
      "vin": "FDB19_225060042",
      "model": "D50S-9",
      "type": "엔진",
      "companyId": "33767",
      "companyName": "두산지게차 경남중부판매 주식회사",
      "group": "기본그룹",
      "km": 16,
      "min": 4600,
      "operatingRate": 56.4,
      "efficiencyRate": 97.2,
      "eff": 97.2,
      "shock": 430,
      "fc": 6,
      "bc": null,
      "soc": null,
      "energyRate": null,
      "conn": null,
      "cumKm": null,
      "cumH": null,
      "catalogOnly": true
    },
    {
      "vin": "FDB21-001898",
      "model": "D70S-9",
      "type": "엔진",
      "companyId": "33767",
      "companyName": "두산지게차 경남중부판매 주식회사",
      "group": "기본그룹",
      "km": 27,
      "min": 2044,
      "operatingRate": 42.6,
      "efficiencyRate": 77.5,
      "eff": 77.5,
      "shock": 2,
      "fc": 5,
      "bc": null,
      "soc": null,
      "energyRate": null,
      "conn": null,
      "cumKm": null,
      "cumH": null,
      "catalogOnly": true
    },
    {
      "vin": "FDB21_224250294",
      "model": "D70S-9",
      "type": "엔진",
      "companyId": "12894",
      "companyName": "중원건기",
      "group": "기본그룹",
      "km": 6,
      "min": 1501,
      "operatingRate": 31.3,
      "efficiencyRate": 99.3,
      "eff": 99.3,
      "shock": 23,
      "fc": 5.3,
      "bc": null,
      "soc": null,
      "energyRate": null,
      "conn": null,
      "cumKm": null,
      "cumH": null,
      "catalogOnly": true
    },
    {
      "vin": "FDB21_225060126",
      "model": "D70S-9",
      "type": "엔진",
      "companyId": "12894",
      "companyName": "중원건기",
      "group": "기본그룹",
      "km": 0,
      "min": 51,
      "operatingRate": 2.1,
      "efficiencyRate": 98.3,
      "eff": 98.3,
      "shock": 0,
      "fc": 5.5,
      "bc": null,
      "soc": null,
      "energyRate": null,
      "conn": null,
      "cumKm": null,
      "cumH": null,
      "catalogOnly": true
    },
    {
      "vin": "FDB21_224250450",
      "model": "D70S-9",
      "type": "엔진",
      "companyId": "12894",
      "companyName": "중원건기",
      "group": "기본그룹",
      "km": 27,
      "min": 8426,
      "operatingRate": 125.4,
      "efficiencyRate": 97.2,
      "eff": 97.2,
      "shock": 241,
      "fc": 4.2,
      "bc": null,
      "soc": null,
      "energyRate": null,
      "conn": null,
      "cumKm": null,
      "cumH": null,
      "catalogOnly": true
    },
    {
      "vin": "FDB21_224250307",
      "model": "D70S-9",
      "type": "엔진",
      "companyId": "12894",
      "companyName": "중원건기",
      "group": "기본그룹",
      "km": 0,
      "min": 32,
      "operatingRate": 3.4,
      "efficiencyRate": 84.5,
      "eff": 84.5,
      "shock": 0,
      "fc": 6.7,
      "bc": null,
      "soc": null,
      "energyRate": null,
      "conn": null,
      "cumKm": null,
      "cumH": null,
      "catalogOnly": true
    },
    {
      "vin": "FDB21_224250283",
      "model": "D70S-9",
      "type": "엔진",
      "companyId": "12894",
      "companyName": "중원건기",
      "group": "기본그룹",
      "km": 0,
      "min": 237,
      "operatingRate": 6.2,
      "efficiencyRate": 98.1,
      "eff": 98.1,
      "shock": 23,
      "fc": 4.8,
      "bc": null,
      "soc": null,
      "energyRate": null,
      "conn": null,
      "cumKm": null,
      "cumH": null,
      "catalogOnly": true
    },
    {
      "vin": "FDB21_225060005",
      "model": "D70S-9",
      "type": "엔진",
      "companyId": "33767",
      "companyName": "두산지게차 경남중부판매 주식회사",
      "group": "기본그룹",
      "km": 3,
      "min": 2066,
      "operatingRate": 35.9,
      "efficiencyRate": 99.4,
      "eff": 99.4,
      "shock": 3,
      "fc": 3.1,
      "bc": null,
      "soc": null,
      "energyRate": null,
      "conn": null,
      "cumKm": null,
      "cumH": null,
      "catalogOnly": true
    },
    {
      "vin": "FDB21_225060182",
      "model": "D70S-9",
      "type": "엔진",
      "companyId": "12894",
      "companyName": "중원건기",
      "group": "기본그룹",
      "km": 4,
      "min": 469,
      "operatingRate": 13.9,
      "efficiencyRate": 97,
      "eff": 97,
      "shock": 5,
      "fc": 4.5,
      "bc": null,
      "soc": null,
      "energyRate": null,
      "conn": null,
      "cumKm": null,
      "cumH": null,
      "catalogOnly": true
    },
    {
      "vin": "FDB21_225380045",
      "model": "D70S-9",
      "type": "엔진",
      "companyId": "364",
      "companyName": "온양지게차(호성건설중기)",
      "group": "기본그룹",
      "km": 240,
      "min": 600,
      "operatingRate": 20.8,
      "efficiencyRate": 99.7,
      "eff": 99.7,
      "shock": 83,
      "fc": 7,
      "bc": null,
      "soc": null,
      "energyRate": null,
      "conn": null,
      "cumKm": null,
      "cumH": null,
      "catalogOnly": true
    },
    {
      "vin": "FDB21_224250226",
      "model": "D70S-9",
      "type": "엔진",
      "companyId": "12894",
      "companyName": "중원건기",
      "group": "테스트그룹",
      "km": 9,
      "min": 1186,
      "operatingRate": 19,
      "efficiencyRate": 84.4,
      "eff": 84.4,
      "shock": 27,
      "fc": 4.4,
      "bc": null,
      "soc": null,
      "energyRate": null,
      "conn": null,
      "cumKm": null,
      "cumH": null,
      "catalogOnly": true
    },
    {
      "vin": "FDB21_224250363",
      "model": "D70S-9",
      "type": "엔진",
      "companyId": "12894",
      "companyName": "중원건기",
      "group": "테스트그룹",
      "km": 1,
      "min": 702,
      "operatingRate": 11.3,
      "efficiencyRate": 98.9,
      "eff": 98.9,
      "shock": 5,
      "fc": 3.5,
      "bc": null,
      "soc": null,
      "energyRate": null,
      "conn": null,
      "cumKm": null,
      "cumH": null,
      "catalogOnly": true
    },
    {
      "vin": "FDB21_224250428",
      "model": "D70S-9",
      "type": "엔진",
      "companyId": "12894",
      "companyName": "중원건기",
      "group": "테스트그룹",
      "km": 5,
      "min": 1297,
      "operatingRate": 20.8,
      "efficiencyRate": 97.3,
      "eff": 97.3,
      "shock": 5,
      "fc": 4.6,
      "bc": null,
      "soc": null,
      "energyRate": null,
      "conn": null,
      "cumKm": null,
      "cumH": null,
      "catalogOnly": true
    },
    {
      "vin": "FDB21_225060407",
      "model": "D70S-9",
      "type": "엔진",
      "companyId": "12894",
      "companyName": "중원건기",
      "group": "테스트그룹",
      "km": 16,
      "min": 8949,
      "operatingRate": 133.2,
      "efficiencyRate": 63.4,
      "eff": 63.4,
      "shock": 106,
      "fc": 3.9,
      "bc": null,
      "soc": null,
      "energyRate": null,
      "conn": null,
      "cumKm": null,
      "cumH": null,
      "catalogOnly": true
    },
    {
      "vin": "FDB21_224250305",
      "model": "D70S-9",
      "type": "엔진",
      "companyId": "3703",
      "companyName": "태형금속공업(주)",
      "group": "테스트그룹",
      "km": 20,
      "min": 2614,
      "operatingRate": 34,
      "efficiencyRate": 74.7,
      "eff": 74.7,
      "shock": 1,
      "fc": 4,
      "bc": null,
      "soc": null,
      "energyRate": null,
      "conn": null,
      "cumKm": null,
      "cumH": null,
      "catalogOnly": true
    },
    {
      "vin": "FDB21-001903",
      "model": "D70S-9",
      "type": "엔진",
      "companyId": "33767",
      "companyName": "두산지게차 경남중부판매 주식회사",
      "group": "테스트그룹",
      "km": 37,
      "min": 5934,
      "operatingRate": 77.3,
      "efficiencyRate": 94.7,
      "eff": 94.7,
      "shock": 196,
      "fc": 4.3,
      "bc": null,
      "soc": null,
      "energyRate": null,
      "conn": null,
      "cumKm": null,
      "cumH": null,
      "catalogOnly": true
    },
    {
      "vin": "FDB21_224250275",
      "model": "D70S-9",
      "type": "엔진",
      "companyId": "12894",
      "companyName": "중원건기",
      "group": "테스트그룹",
      "km": 12,
      "min": 2912,
      "operatingRate": 67.4,
      "efficiencyRate": 99.5,
      "eff": 99.5,
      "shock": 0,
      "fc": 4.2,
      "bc": null,
      "soc": null,
      "energyRate": null,
      "conn": null,
      "cumKm": null,
      "cumH": null,
      "catalogOnly": true
    },
    {
      "vin": "FDB21_225060095",
      "model": "D70S-9",
      "type": "엔진",
      "companyId": "33767",
      "companyName": "두산지게차 경남중부판매 주식회사",
      "group": "테스트그룹",
      "km": 23,
      "min": 7111,
      "operatingRate": 87.1,
      "efficiencyRate": 93.7,
      "eff": 93.7,
      "shock": 3,
      "fc": 3.4,
      "bc": null,
      "soc": null,
      "energyRate": null,
      "conn": null,
      "cumKm": null,
      "cumH": null,
      "catalogOnly": true
    },
    {
      "vin": "FDB21_224030182",
      "model": "D70S-9",
      "type": "엔진",
      "companyId": "364",
      "companyName": "온양지게차(호성건설중기)",
      "group": "테스트그룹",
      "km": 2,
      "min": 835,
      "operatingRate": 43.5,
      "efficiencyRate": 98,
      "eff": 98,
      "shock": 1,
      "fc": 3.2,
      "bc": null,
      "soc": null,
      "energyRate": null,
      "conn": null,
      "cumKm": null,
      "cumH": null,
      "catalogOnly": true
    },
    {
      "vin": "FBA36_225380008",
      "model": "B25SE-7",
      "type": "납산",
      "companyId": "364",
      "companyName": "온양지게차(호성건설중기)",
      "group": "테스트그룹",
      "km": 128,
      "min": 28800,
      "operatingRate": 300,
      "efficiencyRate": 83.1,
      "eff": 83.1,
      "shock": 46,
      "fc": null,
      "bc": null,
      "soc": null,
      "energyRate": 67,
      "conn": false,
      "cumKm": null,
      "cumH": null,
      "catalogOnly": true
    },
    {
      "vin": "FBA32-002415",
      "model": "B30S-7",
      "type": "리튬",
      "companyId": "12894",
      "companyName": "중원건기",
      "group": "물류1팀",
      "km": 148,
      "min": 8613,
      "operatingRate": 119.6,
      "efficiencyRate": 80.7,
      "eff": 80.7,
      "shock": 0,
      "fc": null,
      "bc": null,
      "soc": 80,
      "energyRate": 80,
      "conn": true,
      "cumKm": null,
      "cumH": null,
      "catalogOnly": true
    },
    {
      "vin": "FBA34-000619",
      "model": "B35S-7",
      "type": "리튬",
      "companyId": "12894",
      "companyName": "중원건기",
      "group": "물류1팀",
      "km": 63,
      "min": 2986,
      "operatingRate": 41.5,
      "efficiencyRate": 65.3,
      "eff": 65.3,
      "shock": 6,
      "fc": null,
      "bc": null,
      "soc": null,
      "energyRate": null,
      "conn": null,
      "cumKm": null,
      "cumH": null,
      "catalogOnly": true
    },
    {
      "vin": "FDB21_224030076",
      "model": "D70S-9",
      "type": "엔진",
      "companyId": "12894",
      "companyName": "중원건기",
      "group": "물류1팀",
      "km": 0,
      "min": 6,
      "operatingRate": 1.3,
      "efficiencyRate": 98.9,
      "eff": 98.9,
      "shock": 0,
      "fc": 4.8,
      "bc": null,
      "soc": null,
      "energyRate": null,
      "conn": null,
      "cumKm": null,
      "cumH": null,
      "catalogOnly": true
    },
    {
      "vin": "FDB21-003185",
      "model": "D70S-9",
      "type": "엔진",
      "companyId": "12894",
      "companyName": "중원건기",
      "group": "물류1팀",
      "km": 17,
      "min": 5637,
      "operatingRate": 78.3,
      "efficiencyRate": 99.3,
      "eff": 99.3,
      "shock": 10,
      "fc": 3.8,
      "bc": null,
      "soc": null,
      "energyRate": null,
      "conn": null,
      "cumKm": null,
      "cumH": null,
      "catalogOnly": true
    },
    {
      "vin": "FDB21-002991",
      "model": "D70S-9",
      "type": "엔진",
      "companyId": "12894",
      "companyName": "중원건기",
      "group": "물류1팀",
      "km": 22,
      "min": 4906,
      "operatingRate": 68.1,
      "efficiencyRate": 97,
      "eff": 97,
      "shock": 3,
      "fc": 5,
      "bc": null,
      "soc": null,
      "energyRate": null,
      "conn": null,
      "cumKm": null,
      "cumH": null,
      "catalogOnly": true
    },
    {
      "vin": "FDB21-002888",
      "model": "D70S-9",
      "type": "엔진",
      "companyId": "12894",
      "companyName": "중원건기",
      "group": "물류1팀",
      "km": 50,
      "min": 15393,
      "operatingRate": 229.1,
      "efficiencyRate": 97.9,
      "eff": 97.9,
      "shock": 11,
      "fc": 3.7,
      "bc": null,
      "soc": null,
      "energyRate": null,
      "conn": null,
      "cumKm": null,
      "cumH": null,
      "catalogOnly": true
    },
    {
      "vin": "FDB21-002887",
      "model": "D70S-9",
      "type": "엔진",
      "companyId": "12894",
      "companyName": "중원건기",
      "group": "물류1팀",
      "km": 63,
      "min": 16797,
      "operatingRate": 250,
      "efficiencyRate": 98.5,
      "eff": 98.5,
      "shock": 16,
      "fc": 3.8,
      "bc": null,
      "soc": null,
      "energyRate": null,
      "conn": null,
      "cumKm": null,
      "cumH": null,
      "catalogOnly": true
    },
    {
      "vin": "FDB21_224030105",
      "model": "D70S-9",
      "type": "엔진",
      "companyId": "12894",
      "companyName": "중원건기",
      "group": "물류1팀",
      "km": 3,
      "min": 1120,
      "operatingRate": 21.2,
      "efficiencyRate": 89.7,
      "eff": 89.7,
      "shock": 11,
      "fc": 5.9,
      "bc": null,
      "soc": null,
      "energyRate": null,
      "conn": null,
      "cumKm": null,
      "cumH": null,
      "catalogOnly": true
    },
    {
      "vin": "FDB21-003358",
      "model": "D70S-9",
      "type": "엔진",
      "companyId": "12894",
      "companyName": "중원건기",
      "group": "물류1팀",
      "km": 19,
      "min": 3684,
      "operatingRate": 69.8,
      "efficiencyRate": 98.8,
      "eff": 98.8,
      "shock": 8,
      "fc": 4.1,
      "bc": null,
      "soc": null,
      "energyRate": null,
      "conn": null,
      "cumKm": null,
      "cumH": null,
      "catalogOnly": true
    },
    {
      "vin": "FDB21-002985",
      "model": "D70S-9",
      "type": "엔진",
      "companyId": "12894",
      "companyName": "중원건기",
      "group": "물류1팀",
      "km": 20,
      "min": 4822,
      "operatingRate": 67,
      "efficiencyRate": 97.2,
      "eff": 97.2,
      "shock": 1,
      "fc": 4.5,
      "bc": null,
      "soc": null,
      "energyRate": null,
      "conn": null,
      "cumKm": null,
      "cumH": null,
      "catalogOnly": true
    },
    {
      "companyId": "1933",
      "companyName": "(주)세종물류중부지점",
      "catalogOnly": false,
      "demo": true,
      "group": "물류1팀",
      "model": "B30S-7",
      "vin": "FBA32_DEMO_CS01",
      "type": "리튬",
      "cumKm": 12540,
      "cumH": 3180,
      "conn": true,
      "soc": 78,
      "km": 84,
      "min": 2160,
      "eff": 88,
      "shock": 2,
      "bc": 2.8,
      "summaryDetail": {
        "workMinutes": 1900,
        "idleMinutes": 260,
        "supplyDueCount": 0,
        "activeErrorCount": 1
      }
    },
    {
      "companyId": "1933",
      "companyName": "(주)세종물류중부지점",
      "catalogOnly": false,
      "demo": true,
      "group": "물류1팀",
      "model": "B18S-7",
      "vin": "FBA18_DEMO_CS02",
      "type": "납산",
      "cumKm": 7340,
      "cumH": 1840,
      "conn": false,
      "soc": 46,
      "km": 36,
      "min": 960,
      "eff": 75,
      "shock": 0,
      "bc": 3.2,
      "summaryDetail": {
        "workMinutes": 720,
        "idleMinutes": 240,
        "supplyDueCount": 0,
        "activeErrorCount": 0
      }
    },
    {
      "companyId": "1933",
      "companyName": "(주)세종물류중부지점",
      "catalogOnly": false,
      "demo": true,
      "group": "물류1팀",
      "model": "D30S-9",
      "vin": "FBD30_DEMO_CS03",
      "type": "엔진",
      "cumKm": 18520,
      "cumH": 4260,
      "conn": true,
      "soc": null,
      "km": 126,
      "min": 2820,
      "eff": 3.7,
      "efficiencyRate": 81.9,
      "shock": 1,
      "fc": 3.7,
      "summaryDetail": {
        "workMinutes": 2310,
        "idleMinutes": 510,
        "supplyDueCount": 0,
        "activeErrorCount": 0
      }
    }
  ]
};
})(window);
