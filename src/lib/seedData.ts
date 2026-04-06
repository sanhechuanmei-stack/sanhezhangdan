import type { Partner, Project, BillRecord, SharingRecord, ExpenseCategory } from '@/types';

export interface AppState {
  partners: Partner[];
  projects: Project[];
  bills: BillRecord[];
  sharingRecords: SharingRecord[];
  expenseCategories: ExpenseCategory[];
}

export function getSeedData(): AppState {
  const partners: Partner[] = [
    { id: 'p1', name: '老李', status: 'active', type: 'main' },
    { id: 'p2', name: '小靓', status: 'active', type: 'main' },
    { id: 'p3', name: '橙子', status: 'active', type: 'main' },
    { id: 'p4', name: '喵喵龙', status: 'active', type: 'special' },
    { id: 'p5', name: '老范', status: 'active', type: 'special' },
  ];

  const projects: Project[] = [
    {
      id: 'proj1',
      name: '研习社',
      type: 'internal',
      status: 'active',
      partnerIds: ['p1', 'p2', 'p3'],
      sharingRatios: { p1: 33.33, p2: 33.33, p3: 33.34 },
    },
    {
      id: 'proj2',
      name: '三和·小剪刀',
      type: 'internal',
      status: 'active',
      partnerIds: ['p1', 'p2', 'p4'],
      sharingRatios: { p1: 40, p2: 40, p4: 20 },
    },
    {
      id: 'proj3',
      name: '线下课',
      type: 'internal',
      status: 'active',
      partnerIds: ['p1', 'p2', 'p3'],
      sharingRatios: { p1: 33.33, p2: 33.33, p3: 33.34 },
      periods: ['第3期', '第4期', '第5期'],
    },
    {
      id: 'proj4',
      name: 'AI网站',
      type: 'cooperation',
      status: 'active',
      partnerIds: ['p1', 'p2', 'p5'],
      sharingRatios: { p1: 40, p2: 40, p5: 20 },
      prioritySharing: { partnerId: 'p5', percentage: 10 },
    },
  ];

  const expenseCategories: ExpenseCategory[] = [
    { id: 'cat1', name: 'DOU+投流' },
    { id: 'cat2', name: '抖币充值' },
    { id: 'cat3', name: '群红包' },
    { id: 'cat4', name: '场地费用' },
    { id: 'cat5', name: '物料费用' },
    { id: 'cat6', name: '差旅费用' },
    { id: 'cat7', name: '其他工资' },
    { id: 'cat8', name: '软件工具充值' },
    { id: 'cat9', name: '学习资料/内容采购' },
    { id: 'cat10', name: '新设备引入' },
    { id: 'cat11', name: '退款/售后支出' },
    { id: 'cat12', name: '其他支出' },
    { id: 'cat13', name: '线下课花销' },
    { id: 'cat14', name: '差旅费' },
    { id: 'cat15', name: '场地费' },
    { id: 'cat16', name: '物料费' },
    { id: 'cat17', name: 'AI花销' },
    { id: 'cat18', name: '其他费用' },
  ];

  const bills: BillRecord[] = [
    // 研习社 - 3月
    { id: 'b1', projectId: 'proj1', date: '2026-03-15', income: 1299, incomeNote: '学员报名-张同学' },
    { id: 'b2', projectId: 'proj1', date: '2026-03-14', income: 999, incomeNote: '学员报名-王同学' },
    { id: 'b3', projectId: 'proj1', date: '2026-03-12', income: 1999, incomeNote: '高级课程-李同学' },
    { id: 'b4', projectId: 'proj1', date: '2026-03-10', expenseCategory: '物料费用', expense: 150, expenseNote: '购买打印材料' },
    { id: 'b5', projectId: 'proj1', date: '2026-03-08', income: 1999, incomeNote: '高级课程-陈同学' },
    { id: 'b6', projectId: 'proj1', date: '2026-03-05', expenseCategory: 'DOU+投流', expense: 600, expenseNote: '推广视频' },
    { id: 'b7', projectId: 'proj1', date: '2026-03-03', income: 2999, incomeNote: '新学员-刘同学' },
    { id: 'b8', projectId: 'proj1', date: '2026-03-01', income: 999, incomeNote: '学员报名-赵同学' },
    // 研习社 - 2月
    { id: 'b9', projectId: 'proj1', date: '2026-02-28', income: 1999, incomeNote: '高级课程' },
    { id: 'b10', projectId: 'proj1', date: '2026-02-25', expenseCategory: 'DOU+投流', expense: 800, expenseNote: '2月推广' },
    { id: 'b11', projectId: 'proj1', date: '2026-02-20', income: 2999, incomeNote: '新学员' },
    { id: 'b12', projectId: 'proj1', date: '2026-02-15', income: 999, incomeNote: '学员报名' },
    { id: 'b13', projectId: 'proj1', date: '2026-02-10', expenseCategory: '软件工具充值', expense: 299, expenseNote: '课程平台订阅' },
    { id: 'b14', projectId: 'proj1', date: '2026-02-05', income: 1299, incomeNote: '学员报名' },
    { id: 'b15', projectId: 'proj1', date: '2026-02-03', income: 1999, incomeNote: '学员报名' },
    // 研习社 - 1月
    { id: 'b16', projectId: 'proj1', date: '2026-01-28', income: 2999, incomeNote: '高级课程' },
    { id: 'b17', projectId: 'proj1', date: '2026-01-20', income: 1299, incomeNote: '学员报名' },
    { id: 'b18', projectId: 'proj1', date: '2026-01-15', expenseCategory: 'DOU+投流', expense: 500, expenseNote: '1月推广' },
    { id: 'b19', projectId: 'proj1', date: '2026-01-10', income: 999, incomeNote: '学员报名' },
    { id: 'b20', projectId: 'proj1', date: '2026-01-05', income: 1999, incomeNote: '高级课程' },
    // 三和·小剪刀 - 3月
    { id: 'b21', projectId: 'proj2', date: '2026-03-14', income: 4500, incomeNote: '品牌宣传片' },
    { id: 'b22', projectId: 'proj2', date: '2026-03-11', income: 3200, incomeNote: '剪辑合作' },
    { id: 'b23', projectId: 'proj2', date: '2026-03-09', expenseCategory: '软件工具充值', expense: 199, expenseNote: 'PR订阅' },
    { id: 'b24', projectId: 'proj2', date: '2026-03-07', income: 1800, incomeNote: '短视频项目' },
    { id: 'b25', projectId: 'proj2', date: '2026-03-04', income: 2600, incomeNote: '企业短视频' },
    { id: 'b26', projectId: 'proj2', date: '2026-03-02', expenseCategory: '其他工资', expense: 1500, expenseNote: '兼职剪辑费' },
    // 三和·小剪刀 - 2月
    { id: 'b27', projectId: 'proj2', date: '2026-02-26', income: 5800, incomeNote: '年会视频制作' },
    { id: 'b28', projectId: 'proj2', date: '2026-02-20', income: 2400, incomeNote: '短视频合作' },
    { id: 'b29', projectId: 'proj2', date: '2026-02-15', expenseCategory: '新设备引入', expense: 3200, expenseNote: '补光灯+麦克风' },
    { id: 'b30', projectId: 'proj2', date: '2026-02-10', income: 1600, incomeNote: '剪辑外包' },
    { id: 'b31', projectId: 'proj2', date: '2026-02-05', income: 3500, incomeNote: '企业宣传片' },
    // 三和·小剪刀 - 1月
    { id: 'b32', projectId: 'proj2', date: '2026-01-25', income: 2800, incomeNote: '短视频制作' },
    { id: 'b33', projectId: 'proj2', date: '2026-01-18', income: 4200, incomeNote: '品牌视频' },
    { id: 'b34', projectId: 'proj2', date: '2026-01-12', expenseCategory: '软件工具充值', expense: 199, expenseNote: 'PR订阅' },
    { id: 'b35', projectId: 'proj2', date: '2026-01-08', income: 1900, incomeNote: '剪辑项目' },
    // 线下课 - 第5期
    { id: 'b36', projectId: 'proj3', date: '2026-03-15', income: 3980, incomeNote: '第5期学员报名', period: '第5期' },
    { id: 'b37', projectId: 'proj3', date: '2026-03-14', income: 3980, incomeNote: '第5期学员报名', period: '第5期' },
    { id: 'b38', projectId: 'proj3', date: '2026-03-13', income: 3980, incomeNote: '第5期学员报名', period: '第5期' },
    { id: 'b39', projectId: 'proj3', date: '2026-03-12', expenseCategory: '场地费用', expense: 2000, expenseNote: '酒店会议室', period: '第5期' },
    { id: 'b40', projectId: 'proj3', date: '2026-03-11', income: 3980, incomeNote: '第5期学员报名', period: '第5期' },
    { id: 'b41', projectId: 'proj3', date: '2026-03-10', income: 3980, incomeNote: '第5期学员报名', period: '第5期' },
    { id: 'b42', projectId: 'proj3', date: '2026-03-08', expenseCategory: '差旅费用', expense: 1480, expenseNote: '机票+酒店', period: '第5期' },
    { id: 'b43', projectId: 'proj3', date: '2026-03-07', expenseCategory: '物料费用', expense: 360, expenseNote: '课程资料印刷', period: '第5期' },
    { id: 'b44', projectId: 'proj3', date: '2026-03-06', income: 3980, incomeNote: '第5期学员报名', period: '第5期' },
    // 线下课 - 第4期
    { id: 'b45', projectId: 'proj3', date: '2026-02-22', income: 3980, incomeNote: '第4期学员报名', period: '第4期' },
    { id: 'b46', projectId: 'proj3', date: '2026-02-20', income: 3980, incomeNote: '第4期学员报名', period: '第4期' },
    { id: 'b47', projectId: 'proj3', date: '2026-02-18', income: 3980, incomeNote: '第4期学员报名', period: '第4期' },
    { id: 'b48', projectId: 'proj3', date: '2026-02-15', expenseCategory: '场地费用', expense: 1800, expenseNote: '场地租用', period: '第4期' },
    { id: 'b49', projectId: 'proj3', date: '2026-02-12', income: 3980, incomeNote: '第4期学员报名', period: '第4期' },
    { id: 'b50', projectId: 'proj3', date: '2026-02-10', expenseCategory: '差旅费用', expense: 1200, expenseNote: '高铁+住宿', period: '第4期' },
    { id: 'b51', projectId: 'proj3', date: '2026-02-08', income: 3980, incomeNote: '第4期学员报名', period: '第4期' },
    { id: 'b52', projectId: 'proj3', date: '2026-02-05', expenseCategory: '物料费用', expense: 280, expenseNote: '课程资料', period: '第4期' },
    // 线下课 - 第3期
    { id: 'b53', projectId: 'proj3', date: '2026-01-18', income: 3980, incomeNote: '第3期学员报名', period: '第3期' },
    { id: 'b54', projectId: 'proj3', date: '2026-01-16', income: 3980, incomeNote: '第3期学员报名', period: '第3期' },
    { id: 'b55', projectId: 'proj3', date: '2026-01-14', income: 3980, incomeNote: '第3期学员报名', period: '第3期' },
    { id: 'b56', projectId: 'proj3', date: '2026-01-12', expenseCategory: '场地费用', expense: 2200, expenseNote: '场地租用', period: '第3期' },
    { id: 'b57', projectId: 'proj3', date: '2026-01-10', expenseCategory: '差旅费用', expense: 980, expenseNote: '交通住宿', period: '第3期' },
    { id: 'b58', projectId: 'proj3', date: '2026-01-08', income: 3980, incomeNote: '第3期学员报名', period: '第3期' },
    // AI网站 - 3月
    { id: 'b59', projectId: 'proj4', date: '2026-03-14', income: 2980, incomeNote: '企业官网定制-A客户' },
    { id: 'b60', projectId: 'proj4', date: '2026-03-12', income: 1580, incomeNote: '落地页制作-B客户' },
    { id: 'b61', projectId: 'proj4', date: '2026-03-10', expenseCategory: '软件工具充值', expense: 299, expenseNote: 'AI工具月费' },
    { id: 'b62', projectId: 'proj4', date: '2026-03-08', income: 4800, incomeNote: '电商网站开发-C客户' },
    { id: 'b63', projectId: 'proj4', date: '2026-03-05', income: 1200, incomeNote: '网站维护续费-D客户' },
    { id: 'b64', projectId: 'proj4', date: '2026-03-03', expenseCategory: '其他工资', expense: 800, expenseNote: '外包设计费' },
    // AI网站 - 2月
    { id: 'b65', projectId: 'proj4', date: '2026-02-25', income: 3600, incomeNote: '品牌官网-E客户' },
    { id: 'b66', projectId: 'proj4', date: '2026-02-20', income: 1980, incomeNote: '小程序页面-F客户' },
    { id: 'b67', projectId: 'proj4', date: '2026-02-15', expenseCategory: '软件工具充值', expense: 299, expenseNote: 'AI工具月费' },
    { id: 'b68', projectId: 'proj4', date: '2026-02-10', income: 2400, incomeNote: '企业官网-G客户' },
    { id: 'b69', projectId: 'proj4', date: '2026-02-05', expenseCategory: 'DOU+投流', expense: 500, expenseNote: '推广投放' },
    { id: 'b70', projectId: 'proj4', date: '2026-02-03', income: 2800, incomeNote: '企业网站-H客户' },
    // AI网站 - 1月
    { id: 'b71', projectId: 'proj4', date: '2026-01-28', income: 3200, incomeNote: '品牌官网-I客户' },
    { id: 'b72', projectId: 'proj4', date: '2026-01-22', income: 1680, incomeNote: '落地页-J客户' },
    { id: 'b73', projectId: 'proj4', date: '2026-01-15', expenseCategory: '软件工具充值', expense: 299, expenseNote: 'AI工具月费' },
    { id: 'b74', projectId: 'proj4', date: '2026-01-10', income: 2200, incomeNote: '企业官网-K客户' },
    { id: 'b75', projectId: 'proj4', date: '2026-01-05', expenseCategory: '其他工资', expense: 600, expenseNote: '外包设计费' },
  ];

  const sharingRecords: SharingRecord[] = [
    // 研习社分成 — 应分约6951/6951/6953
    { id: 's1', date: '2026-01-25', projectId: 'proj1', partnerId: 'p1', amount: 1500, note: '1月结算' },
    { id: 's2', date: '2026-01-25', projectId: 'proj1', partnerId: 'p2', amount: 1500, note: '1月结算' },
    { id: 's3', date: '2026-01-25', projectId: 'proj1', partnerId: 'p3', amount: 1500, note: '1月结算' },
    { id: 's4', date: '2026-02-28', projectId: 'proj1', partnerId: 'p1', amount: 2000, note: '2月结算' },
    { id: 's5', date: '2026-02-28', projectId: 'proj1', partnerId: 'p2', amount: 2000, note: '2月结算' },
    { id: 's6', date: '2026-02-28', projectId: 'proj1', partnerId: 'p3', amount: 1500, note: '2月结算' },
    { id: 's7', date: '2026-03-10', projectId: 'proj1', partnerId: 'p1', amount: 1000, note: '3月结算' },
    { id: 's8', date: '2026-03-10', projectId: 'proj1', partnerId: 'p2', amount: 1000, note: '3月结算' },
    { id: 's9', date: '2026-03-10', projectId: 'proj1', partnerId: 'p3', amount: 1000, note: '3月结算' },
    // p1已分4500 < 6951 ✓  p2已分4500 < 6951 ✓  p3已分4000 < 6953 ✓

    // 三和·小剪刀分成 — 应分约9929/9929/4964
    { id: 's10', date: '2026-01-28', projectId: 'proj2', partnerId: 'p1', amount: 2000, note: '1月结算' },
    { id: 's11', date: '2026-01-28', projectId: 'proj2', partnerId: 'p2', amount: 2000, note: '1月结算' },
    { id: 's12', date: '2026-01-28', projectId: 'proj2', partnerId: 'p4', amount: 1000, note: '1月结算' },
    { id: 's13', date: '2026-02-28', projectId: 'proj2', partnerId: 'p1', amount: 2500, note: '2月结算' },
    { id: 's14', date: '2026-02-28', projectId: 'proj2', partnerId: 'p2', amount: 2500, note: '2月结算' },
    { id: 's15', date: '2026-02-28', projectId: 'proj2', partnerId: 'p4', amount: 1200, note: '2月结算' },
    { id: 's16', date: '2026-03-10', projectId: 'proj2', partnerId: 'p1', amount: 1500, note: '3月结算' },
    { id: 's17', date: '2026-03-10', projectId: 'proj2', partnerId: 'p2', amount: 1500, note: '3月结算' },
    { id: 's18', date: '2026-03-10', projectId: 'proj2', partnerId: 'p4', amount: 800, note: '3月结算' },
    // p1已分6000 < 9929 ✓  p2已分6000 < 9929 ✓  p4已分3000 < 4964 ✓

    // 线下课分成 — 应分约13995/13995/13999
    { id: 's19', date: '2026-01-20', projectId: 'proj3', partnerId: 'p1', amount: 2000, note: '第3期结算', period: '第3期' },
    { id: 's20', date: '2026-01-20', projectId: 'proj3', partnerId: 'p2', amount: 2000, note: '第3期结算', period: '第3期' },
    { id: 's21', date: '2026-01-20', projectId: 'proj3', partnerId: 'p3', amount: 2000, note: '第3期结算', period: '第3期' },
    { id: 's22', date: '2026-02-25', projectId: 'proj3', partnerId: 'p1', amount: 3000, note: '第4期结算', period: '第4期' },
    { id: 's23', date: '2026-02-25', projectId: 'proj3', partnerId: 'p2', amount: 3000, note: '第4期结算', period: '第4期' },
    { id: 's24', date: '2026-02-25', projectId: 'proj3', partnerId: 'p3', amount: 2500, note: '第4期结算', period: '第4期' },
    { id: 's25', date: '2026-03-12', projectId: 'proj3', partnerId: 'p1', amount: 4000, note: '第5期结算', period: '第5期' },
    { id: 's26', date: '2026-03-12', projectId: 'proj3', partnerId: 'p2', amount: 4000, note: '第5期结算', period: '第5期' },
    { id: 's27', date: '2026-03-12', projectId: 'proj3', partnerId: 'p3', amount: 3500, note: '第5期结算', period: '第5期' },
    // p1已分9000 < 13995 ✓  p2已分9000 < 13995 ✓  p3已分8000 < 13999 ✓

    // AI网站分成 — 应分约7841/7841/6483
    { id: 's28', date: '2026-01-28', projectId: 'proj4', partnerId: 'p1', amount: 1500, note: '1月结算' },
    { id: 's29', date: '2026-01-28', projectId: 'proj4', partnerId: 'p2', amount: 1500, note: '1月结算' },
    { id: 's30', date: '2026-01-28', projectId: 'proj4', partnerId: 'p5', amount: 1000, note: '1月结算' },
    { id: 's31', date: '2026-02-28', projectId: 'proj4', partnerId: 'p1', amount: 2000, note: '2月结算' },
    { id: 's32', date: '2026-02-28', projectId: 'proj4', partnerId: 'p2', amount: 2000, note: '2月结算' },
    { id: 's33', date: '2026-02-28', projectId: 'proj4', partnerId: 'p5', amount: 1500, note: '2月结算' },
    { id: 's34', date: '2026-03-10', projectId: 'proj4', partnerId: 'p1', amount: 1500, note: '3月结算' },
    { id: 's35', date: '2026-03-10', projectId: 'proj4', partnerId: 'p2', amount: 1500, note: '3月结算' },
    { id: 's36', date: '2026-03-10', projectId: 'proj4', partnerId: 'p5', amount: 1000, note: '3月结算' },
    // p1已分5000 < 7841 ✓  p2已分5000 < 7841 ✓  p5已分3500 < 6483 ✓
  ];

  return { partners, projects, bills, sharingRecords, expenseCategories };
}
