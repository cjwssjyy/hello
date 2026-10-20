/* 课程数据唯一来源。更新课程时只需修改本文件，并修改 updatedAt。
 * weeks 是实际开课的教学周；weekday 为周一=1，…，周日=7。
 * 不要删除开头的 window.COURSE_DATA = 或最后的分号。
 * 修改方法、临时调整格式和发布步骤见 使用与维护.md。
 * 日语安排按2026-10-19确认：第7—10周周六晚课；周六下午只排第7周，
 * 第8—10周同一时段保留人工智能导论；第11—18周周日下午两次课。
 */
window.COURSE_DATA = {
  "className": "课程查询",
  "timezone": "Asia/Shanghai",
  "updatedAt": "2026-10-20T21:16:06+08:00",
  "term": {
    "weekOneMonday": "2026-08-31",
    "firstPublishedWeek": 7,
    "lastPublishedWeek": 18,
    "note": "按提供的教务课表周次整理；第7周为10月12日至18日。节假日、补课及后续调整需由学习委员另行维护。"
  },
  "study": {
    "enabled": true,
    "weekdays": [1, 2, 3, 4, 5, 6, 7],
    "checkStart": "18:00",
    "checkEnd": "19:30",
    "start": "18:30",
    "end": "20:00",
    "room": "一教404",
    "note": "晚自习"
  },
  "courses": [
    {
      "id": "japanese-sat-afternoon", "weekday": 6,
      "audience": "japanese",
      "weeks": [7],
      "start": "15:20", "end": "16:50",
      "name": "日语课（日语生注意）", "kind": "",
      "room": "一教B102", "teacher": "", "note": ""
    },
    {
      "id": "japanese-sat-evening", "weekday": 6,
      "audience": "japanese",
      "weeks": [7, 8, 9, 10],
      "start": "18:00", "end": "19:30",
      "name": "日语课（日语生注意）", "kind": "",
      "room": "一教B102", "teacher": "",
      "note": "仅日语生上课；其他同学18:30–20:00在一教404正常晚自习。"
    },
    {
      "id": "japanese-sun-early", "weekday": 7,
      "audience": "japanese",
      "weeks": [11, 12, 13, 14, 15, 16, 17, 18],
      "start": "13:20", "end": "15:00",
      "name": "日语课（日语生注意）", "kind": "",
      "room": "一教B102", "teacher": "", "note": ""
    },
    {
      "id": "japanese-sun-late", "weekday": 7,
      "audience": "japanese",
      "weeks": [11, 12, 13, 14, 15, 16, 17, 18],
      "start": "15:20", "end": "16:50",
      "name": "日语课（日语生注意）", "kind": "",
      "room": "一教B102", "teacher": "", "note": ""
    },
    {
      "id": "english-group1-tue", "weekday": 2,
      "weeks": [7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18],
      "start": "08:20", "end": "10:00",
      "name": "英语课（A，B1,B4,B7,B8）", "kind": "分班课程",
      "room": "", "roomOmitted": true, "teacher": "",
      "note": "仅对应英语分班同学上课；教室和老师请按本人分班安排确认。"
    },
    {
      "id": "english-group2-tue", "weekday": 2,
      "weeks": [7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18],
      "start": "10:20", "end": "12:00",
      "name": "英语课（B2，B3，B5，B6，B9，C1，C2）", "kind": "分班课程",
      "room": "", "roomOmitted": true, "teacher": "",
      "note": "仅对应英语分班同学上课；教室和老师请按本人分班安排确认。"
    },
    {
      "id": "english-group1-thu", "weekday": 4,
      "weeks": [7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18],
      "start": "13:20", "end": "15:00",
      "name": "英语课（A，B1,B4,B7,B8）", "kind": "分班课程",
      "room": "", "roomOmitted": true, "teacher": "",
      "note": "仅对应英语分班同学上课；教室和老师请按本人分班安排确认。"
    },
    {
      "id": "english-group2-thu", "weekday": 4,
      "weeks": [7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18],
      "start": "15:20", "end": "16:50",
      "name": "英语课（B2，B3，B5，B6，B9，C1，C2）", "kind": "分班课程",
      "room": "", "roomOmitted": true, "teacher": "",
      "note": "仅对应英语分班同学上课；教室和老师请按本人分班安排确认。"
    },
    {
      "id": "morning-mon", "weekday": 1,
      "weeks": [7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18],
      "start": "07:30", "end": "08:00",
      "name": "早自习", "kind": "自习",
      "room": "一教404", "teacher": "", "note": ""
    },
    {
      "id": "morning-tue", "weekday": 2,
      "weeks": [7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18],
      "start": "07:30", "end": "08:00",
      "name": "早自习", "kind": "自习",
      "room": "一教404", "teacher": "", "note": ""
    },
    {
      "id": "morning-wed", "weekday": 3,
      "weeks": [7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18],
      "start": "07:30", "end": "08:00",
      "name": "早自习", "kind": "自习",
      "room": "一教404", "teacher": "", "note": ""
    },
    {
      "id": "morning-thu", "weekday": 4,
      "weeks": [7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18],
      "start": "07:30", "end": "08:00",
      "name": "早自习", "kind": "自习",
      "room": "一教404", "teacher": "", "note": ""
    },
    {
      "id": "morning-fri", "weekday": 5,
      "weeks": [7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18],
      "start": "07:30", "end": "08:00",
      "name": "早自习", "kind": "自习",
      "room": "一教404", "teacher": "", "note": ""
    },
    {
      "id": "morning-sat", "weekday": 6,
      "weeks": [7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18],
      "start": "07:30", "end": "08:00",
      "name": "早自习", "kind": "自习",
      "room": "一教404", "teacher": "", "note": ""
    },
    {
      "id": "morning-sun", "weekday": 7,
      "weeks": [7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18],
      "start": "07:30", "end": "08:00",
      "name": "早自习", "kind": "自习",
      "room": "一教404", "teacher": "", "note": ""
    },
    {
      "id": "chem-mon-theory", "weekday": 1,
      "weeks": [3, 4, 10, 12, 13, 14, 15, 17],
      "start": "08:20", "end": "10:00",
      "name": "无机与分析化学B1", "kind": "理论",
      "room": "三教115", "teacher": "于淼", "note": ""
    },
    {
      "id": "chem-mon-lab", "weekday": 1,
      "weeks": [5, 8, 9, 11, 16],
      "start": "08:20", "end": "10:00",
      "name": "无机与分析化学B1", "kind": "实验",
      "room": "实验楼B507", "teacher": "王一婷", "note": ""
    },
    {
      "id": "chem-wed-theory", "weekday": 3,
      "weeks": [3, 4, 10, 12, 13, 14, 15, 17],
      "start": "08:20", "end": "10:00",
      "name": "无机与分析化学B1", "kind": "理论",
      "room": "三教115", "teacher": "于淼", "note": ""
    },
    {
      "id": "chem-wed-lab", "weekday": 3,
      "weeks": [5, 8, 9, 11, 16],
      "start": "08:20", "end": "10:00",
      "name": "无机与分析化学B1", "kind": "实验",
      "room": "实验楼B507", "teacher": "王一婷", "note": ""
    },
    {
      "id": "chinese-thu", "weekday": 4,
      "weeks": [4, 8, 10, 12, 14, 16, 18],
      "start": "08:20", "end": "10:00",
      "name": "大学语文2", "kind": "理论",
      "room": "一教B105", "teacher": "贾晶", "note": ""
    },
    {
      "id": "chem-fri-theory", "weekday": 5,
      "weeks": [3, 5, 9, 11],
      "start": "08:20", "end": "10:00",
      "name": "无机与分析化学B1", "kind": "理论",
      "room": "三教116", "teacher": "于淼", "note": ""
    },
    {
      "id": "math-mon", "weekday": 1,
      "weeks": [3, 4, 5, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18],
      "start": "10:20", "end": "12:00",
      "name": "高等数学A1", "kind": "理论",
      "room": "三教213", "teacher": "牛艳秋", "note": ""
    },
    {
      "id": "chem-thu-lab", "weekday": 4,
      "weeks": [8, 16],
      "start": "10:20", "end": "12:00",
      "name": "无机与分析化学B1", "kind": "实验",
      "room": "实验楼B507", "teacher": "王一婷", "note": ""
    },
    {
      "id": "sport-fri", "weekday": 5,
      "weeks": [3, 4, 5, 8, 9, 10, 11, 12, 13, 14, 15, 16],
      "start": "10:20", "end": "12:00",
      "name": "体育1", "kind": "理论",
      "room": "第一田径场", "teacher": "贾远航", "note": ""
    },
    {
      "id": "art-sat", "weekday": 6,
      "weeks": [3, 4, 5, 8, 9, 10, 11, 12],
      "start": "10:20", "end": "12:00",
      "name": "大学美育", "kind": "理论",
      "room": "二教B203", "teacher": "李辰", "note": ""
    },
    {
      "id": "chinese-mon", "weekday": 1,
      "weeks": [3, 4, 5, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17],
      "start": "13:20", "end": "15:00",
      "name": "大学语文2", "kind": "理论",
      "room": "一教B105", "teacher": "贾晶", "note": ""
    },
    {
      "id": "math-tue", "weekday": 2,
      "weeks": [3, 4, 5, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18],
      "start": "13:20", "end": "15:00",
      "name": "高等数学A1", "kind": "理论",
      "room": "三教213", "teacher": "牛艳秋", "note": ""
    },
    {
      "id": "ethics-fri", "weekday": 5,
      "weeks": [3, 4, 5, 8, 9, 10, 11, 12, 13, 14, 15, 16],
      "start": "13:20", "end": "15:00",
      "name": "思想道德与法治", "kind": "理论",
      "room": "三教121", "teacher": "杜晓红", "note": ""
    },
    {
      "id": "ethics-tue", "weekday": 2,
      "weeks": [3, 4, 5, 8, 9, 10, 11, 12, 13, 14, 15, 16],
      "start": "15:20", "end": "16:50",
      "name": "思想道德与法治", "kind": "理论",
      "room": "三教121", "teacher": "杜晓红", "note": ""
    },
    {
      "id": "ai-fri", "weekday": 5,
      "weeks": [3, 5, 9, 11, 13, 15],
      "start": "15:20", "end": "16:50",
      "name": "人工智能导论", "kind": "理论",
      "room": "实验楼B420", "teacher": "张锦", "note": ""
    },
    {
      "id": "ai-sat", "weekday": 6,
      "weeks": [3, 4, 5, 8, 9, 10, 11, 12, 13, 14],
      "start": "15:20", "end": "16:50",
      "name": "人工智能导论", "kind": "理论",
      "room": "实验楼B420", "teacher": "张锦", "note": ""
    },
    {
      "id": "art-tue", "weekday": 2,
      "weeks": [3, 4, 5, 9, 10, 11, 12],
      "start": "18:00", "end": "19:30",
      "name": "大学美育", "kind": "理论",
      "room": "一教B201", "teacher": "李辰", "note": ""
    },
    {
      "id": "military-thu", "weekday": 4,
      "weeks": [3, 4, 5, 6, 7, 8, 9, 10, 11],
      "start": "18:00", "end": "19:30",
      "name": "军事理论", "kind": "理论",
      "room": "一教B202", "teacher": "于霄达", "note": ""
    },
    {
      "id": "military-fri", "weekday": 5,
      "weeks": [3, 4, 5, 6, 7, 8, 9, 10, 11],
      "start": "18:00", "end": "19:30",
      "name": "军事理论", "kind": "理论",
      "room": "一教B202", "teacher": "于霄达", "note": ""
    }
  ],
  "changes": [
    {
        "id":  "cancel-military-20261022",
        "action":  "cancel",
        "date":  "2026-10-22",
        "courseId":  "military-thu",
        "confirmedAt":  "2026-10-20T21:16:06+08:00",
        "note":  "本周四军事理论改为晚自习：18:30–20:00，一教404，无任课老师。"
    },
    {
        "id":  "cancel-military-20261023",
        "action":  "cancel",
        "date":  "2026-10-23",
        "courseId":  "military-fri",
        "confirmedAt":  "2026-10-20T21:16:06+08:00",
        "note":  "本周五军事理论改为晚自习：18:30–20:00，一教404，无任课老师。"
    }
],
  "studyExceptions": []
};
