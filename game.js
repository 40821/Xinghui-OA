// ========== 游戏状态 ==========
const state = {
  currentPage: 'workbench',
  gameTime: { h: 23, m: 47, s: 0 },
  phase: 0, // 0=正常, 1=零点后, 2=档案阶段, 3=8楼阶段, 4=结局
  isRetro: false,
  emails: [],
  currentEmail: null,
  solved: {
    contact: false,
    fireDoor: false,
    fireReport: false,
    firewall: false,
    fireSeed: false,
    fireSystem: false
  },
  invasionActive: false,
  invasionCountdown: 0,
  invasionInterval: null,
  glitchInterval: null,
  finalInvasion: false,
  treeholeUnlocked: false,
  oldsiteTab: 'mail',
  archiveOpened: [],
  started: false,
  guideComplete: false,
  clockStarted: false,
  eventsScheduled: false,
  eventsTriggered: {
    warning1: false,
    printTask: false,
    scanlines: false,
    noteTxt: false,
    midnight: false
  },
  ending: null
};

const STORAGE_KEY = 'xinghui-zero-login-save-v1';
let isResetting = false;

// ========== 数据定义 ==========
const EMAIL_TEMPLATES = {
  warning1: {
    id: 'warning1',
    sender: '未知用户',
    subject: '系统通知',
    time: '23:49',
    body: '快走，零点前断开内网。\n\n这不是恶作剧。',
    unread: true
  },
  guide1: {
    id: 'guide1',
    sender: '未知用户',
    subject: 'Re: 系统通知',
    time: '00:05',
    body: '往下看，历史档案库有答案。\n\n消防通道密码是大厦建成年份后两位加楼层号。',
    unread: true
  },
  guide2: {
    id: 'guide2',
    sender: '未知用户',
    subject: '去8楼',
    time: '00:15',
    body: '去8楼，删掉他的火种，一切就结束了。\n\n附件：8楼旧站点入口',
    unread: true
  },
  final: {
    id: 'final',
    sender: '陈国华',
    subject: '多谢',
    time: '00:30',
    body: '[附件：监控录像_20040712.dat]\n\n（邮件正文为空）',
    unread: true
  },
  normal: {
    id: 'normal',
    sender: '王经理',
    subject: '方案明天上午要',
    time: '23:30',
    body: '小林，方案明天上午十点前发我，辛苦了。',
    unread: false
  }
};

const DOCS_DATA = [
  { id: 'dept_table', name: '部门工位分配表.xlsx', icon: '📊', meta: '2024-08-01',
    content: '创意部工位分配表\n\n部门编号：0701\n\nA区：\nA01 - 林默（策划）\nA02 - 张婷（设计）\nA03 - 李明（文案）\n\nB区：\nB01 - 王经理（部门主管）\nB02 - 赵雪（设计总监）\n\n备注：创意部编号0701组，门禁权限同部门编号。' }
];

const ANNOUNCEMENTS = [
  { id: 'fire_rule', title: '消防门禁管理规范', date: '2003-03-15', dept: '物业安保部',
    content: '星辉大厦消防门禁管理规范\n\n一、各楼层消防通道实行电子密码锁管理。\n二、通用初始密码规则为：大厦建成年份后两位 + 两位楼层号。\n三、各部门可自行修改密码，但需报物业备案。\n四、紧急情况下，安保人员可使用万能密码解锁。\n五、本规范自发布之日起执行。' },
  { id: 'about', title: '关于我们 - 星辉大厦', date: '长期展示', dept: '物业行政部',
    content: '星辉大厦\n\n建成时间：1999年\n楼层：地上12层，地下2层\n定位：本市地标性商业综合体\n智能化系统：全市首批智能办公写字楼\n物业：星辉物业管理有限公司\n\n© 1999-2024 星辉物业' },
  { id: 'attendance', title: '8月考勤通知', date: '2024-08-10', dept: '创意部0701组',
    content: '各位同事：\n\n8月考勤统计即将开始，请大家确认打卡记录。\n\n创意部0701组\n2024年8月10日' },
  { id: 'night_rule', title: '夜间办公须知', date: '2024-06-01', dept: '物业安保部',
    content: '夜间办公须知\n\n1. 加班至22:00后需在物业登记。\n2. 零点后大楼将启动节能模式，部分区域照明关闭。\n3. 如遇异常情况，请立即联系物业值班室。\n4. 建议不要独自加班至凌晨两点以后。\n\n（第4条是去年加上去的，老员工都懂。）' }
];

const MONITORS = [
  { floor: 3, label: '3F 档案室走廊', type: 'archive', gif: 'monitor_3f_archive.gif', fireGif: 'monitor_3f_fire.gif' },
  { floor: 4, label: '4F 楼道', type: 'corridor', gif: 'monitor_4f_corridor.gif', fireGif: 'monitor_4f_fire.gif' },
  { floor: 5, label: '5F 楼道', type: 'corridor', gif: 'monitor_5f_corridor.gif', fireGif: 'monitor_5f_fire.gif' },
  { floor: 6, label: '6F 楼道', type: 'corridor', gif: 'monitor_6f_corridor.gif', fireGif: 'monitor_6f_fire.gif' },
  { floor: 7, label: '7F 楼道（本层）', type: 'corridor', gif: 'monitor_7f_corridor.gif', fireGif: 'monitor_7f_fire.gif' },
  { floor: 8, label: '8F 楼道', type: 'snow', gif: 'monitor_8f_snow.gif', fireGif: 'monitor_8f_fire.gif' }
];

const ARCHIVE_DOCS = [
  { id: 'newspaper', name: '2004年7月13日 城市晚报', icon: '📰',
    content: '星辉大厦深夜发生火灾 一名保安遇难\n\n本报讯 7月12日深夜，本市星辉大厦发生特大火灾。消防部门接警后迅速赶赴现场，于凌晨3时将大火扑灭。\n\n据调查，起火点位于大厦配电室，系电路老化所致。火灾造成一名夜班保安不幸遇难，另有数人因吸入浓烟送医治疗，均无生命危险。\n\n遇难保安陈国华，52岁，在大厦任职保安已有一年。据同事反映，陈国华工作认真负责，火灾发生时本已逃出大楼，后折返进入火场搜救被困人员，不幸遇难。\n\n目前大厦已暂停使用，事故原因正在进一步调查中。',
    handwrittenImage: 'handwritten_note_fire_truth.png' },
  { id: 'staff_list', name: '2004年员工名录（部分）', icon: '📋',
    content: '星辉大厦2004年在职员工名录\n\n【保安部】\n陈国华  工号：0312  入职：2003年\n刘德顺  工号：0315  入职：2002年\n张卫国  工号：0318  入职：2004年\n\n【8楼 鼎盛贸易】\n周建  行政专员 入职：2001年8月15日\n（2004年7月离职，去向不明）\n李梅  销售经理 工号：0012 入职：2002年\n王建国  物业主管 工号：0001 入职：2000年\n赵晓燕  行政专员 工号：0259 入职：2003年' },
  { id: 'repair_log', name: '物业报修记录', icon: '🔧',
    content: '物业报修系统 - 2004年7月记录\n\n7月10日 14:32\n报修人：周建（8楼鼎盛贸易）\n报修内容：申请领取煤油2升、清洁工具一套\n理由：清理办公室顽固污渍\n处理人：刘德顺\n状态：已发放\n\n7月11日 09:15\n报修人：李梅（8楼鼎盛贸易）\n报修内容：办公室有异味，疑似煤气泄漏\n处理人：电工班检查，未发现泄漏\n状态：已处理' },
  { id: 'duty_log', name: '保安值班记录', icon: '📔',
    content: '保安值班记录\n值班员：0312 陈国华\n\n7月10日 23:00  全楼巡逻完毕，一切正常。\n7月11日 01:30  8楼有灯光，上去看了，是周建在加班，聊了两句，他说在整理东西。\n7月11日 23:00  全楼巡逻，8楼还有人，没上去打扰。\n7月12日 23:47  8楼有烟味，上去看……\n\n（记录到此中断，字迹潦草，最后几个字几乎无法辨认）' },
  { id: 'fire_report', name: '【加密】2004.07.12火灾内部调查', icon: '🔒', encrypted: true,
    content: '星辉大厦2004.07.12火灾内部调查报告\n文件编号：XF-2004-0712\n密级：内部\n\n一、起火点认定\n经现场勘查，真实起火点位于8楼鼎盛贸易公司办公室内，而非官方通报的配电室。现场发现煤油残留痕迹，疑似人为纵火。\n\n二、遇难者情况\n1. 陈国华（保安，工号0312）：尸体在8楼楼梯间被发现，怀里抱着一名年轻男性。陈本已逃生，折返上楼救人时被坍塌楼板困住，窒息身亡。\n2. 身份不明男性焦尸：在8楼办公室内发现，经DNA比对，确认为离职员工周建。死因为窒息及烧伤，系纵火者本人未能逃出。\n\n三、结论\n火灾系周建人为纵火。周建因被辞退心生怨恨，深夜返回公司纵火报复，自己也未能逃出。\n\n四、善后\n为避免负面影响，对外统一口径为"电路老化意外"。旧系统数据全部备份封存，未做删除。\n\n老陈怀里还抱着个小伙子，没救过来。—— 刘德顺 记' },
  { id: 'property_notes', name: '【加密】物业内部工作笔记', icon: '🔒', encrypted: true, password: '0001',
    content: '物业内部工作笔记（历届主管记录）\n\n2005年：\n旧系统备份没删干净，零点到两点会跳出来，别管，过了时间自己就好。叮嘱夜班保安别巡逻，就待在值班室。\n\n2012年：\n楼里有两个"东西"，一个坏的，一个好的。坏的在8楼，会勾着人留下；好的是以前的老保安，会提醒人走。两个互相压着，暂时没出事。\n\n2018年：\n别让任何人在零点后登录8楼的旧站点，那里是根。碰了就会被缠上，跑不掉。\n\n2023年：\n被缠上的人，最后都变成了系统里的新文档，永远在加班。想送走坏的，就得烧了他的"火种"；老陈说的，他懂。\n\n老陈的权限是最高的，119加他的组号，全楼消防都能调。' },
  { id: 'chen_log', name: '陈国华私人日志（残页）', icon: '📓',
    content: '值班日记（私人）\n\n3月15日：\n今天入职，大厦挺气派的，工资也还行。老伴说让我注意身体，别太累。\n\n5月20日：\n8楼小周最近总垂着头，和领导吵了好几次，看着怪可怜的。有时候加班到很晚，我上去巡楼给他带杯热水。\n\n6月30日：\n晚上巡逻总听见脚步声，可能是我年纪大了，耳朵不好使。\n\n7月10日：\n小周来领煤油，说是打扫卫生。我多嘴问了一句，他没抬头，说"清理一些该清理的东西"。我当时没在意，现在想想……\n\n（后面的页面被撕掉了）' }
];

const TREEHOLE_POSTS = [
  { time: '2006-07-13 02:14', content: '昨晚加班到零点，word自己多了一行"快走吧"，我今天就提离职了，这楼邪门得很。' },
  { time: '2010-03-22 23:45', content: '消防密码老掉牙了，99加楼层号，没人想着改。' },
  { time: '2013-07-12 01:30', content: '打印机半夜自己响，出来的纸边全是焦黑的，有没有人知道这楼以前是不是出过火灾？' },
  { time: '2018-12-05 23:50', content: '保安大叔人挺好的，上次我忘带钥匙，他半夜过来给我开门，今天问物业，说他们夜班从来没人巡逻过。' },
  { time: '2024-06-30 18:20', content: '老员工说零点之后一定要走，别问为什么。每年七月十二号尤其别加班，听劝。' }
];

const OLDSITE_DATA = {
  mail: [
    { name: '人事辞退通知', from: '人事部', content: '周建同志：\n\n因你在工作中多次出现重大失误，给公司造成严重损失，经公司研究决定，自2004年7月8日起解除与你的劳动合同。\n\n请于7月10日前办理离职手续。\n\n鼎盛贸易有限公司人事部\n2004年7月8日' },
    { name: '未发送的回复邮件', from: '周建（草稿）', content: '凭什么！？\n\n那个失误根本不是我一个人的责任！王建国把账做错了，凭什么全推到我头上？李梅跟经理有一腿你们都看不见是吧？\n\n入职那天是我这辈子最开心的日子，从那天起我以为我能留下来。我在这公司干了三年，天天加班到深夜，你们就这么对我？\n\n好，你们不让我好过，我也不会让你们好过。我要让所有人都付出代价，让所有人都陪我留在这栋楼里。\n\n（邮件未发送，保存在草稿箱）' }
  ],
  docs: [
    { name: '考勤记录_2004年7月', content: '鼎盛贸易 2004年7月考勤记录\n\n周建：\n7月1日  加班至23:40\n7月2日  加班至00:15\n7月3日  加班至23:50\n7月5日  加班至01:20\n7月7日  加班至00:30\n7月8日  （辞退通知发出）\n7月9日  深夜滞留 02:00离开\n7月10日  深夜滞留 01:45离开\n7月11日  深夜滞留 02:10离开\n\n（离职后仍多次深夜进入公司）' },
    { name: '员工卡信息', content: '员工卡信息\n\n姓名：周建\n部门：行政部\n职位：行政专员\n入职日期：2001年8月15日\n员工卡号：DS-2001-0815\n状态：已注销（2004年7月8日）' }
  ],
  personal: [
    { name: '【加密压缩包】火种.zip', encrypted: true, content: '周建手写纵火计划书（扫描件）\n\n时间：7月12日深夜，等所有人都走了之后。\n地点：8楼办公室，从会议室开始烧。\n工具：煤油（已领取）、打火机。\n\n计划：\n1. 23:30进入大楼，保安老陈认识我，不会拦。\n2. 23:45在办公室各处泼洒煤油。\n3. 00:00点火，然后锁门离开。\n4. 让整层楼都烧起来，让公司什么都不剩。\n\n他们不是觉得我不重要吗？那就让他们记住我。\n让所有还能正常上班的人，都陪我留在这栋楼里。\n\n[附音频文件：复仇宣言.wav]\n（音频内容：一段低沉的、充满恨意的独白，背景有打火机开盖的声音）' }
  ],
  bbs: [
    { name: '2004-06-20 吐槽帖', content: '楼主：匿名\n周建最近状态好差，刚才和经理吵起来了，说要同归于尽，怪吓人的。\n\n回复1：他被辞退了吧？听说了。\n回复2：可怜人必有可恨之处，自己工作做不好怪谁。\n回复3：别这么说，他平时人挺好的。' },
    { name: '2004-07-11 加班帖', content: '楼主：加班狗\n今晚谁加班？我总觉得周建今天会回来，他下午来公司楼下转了一圈。\n\n回复1：我在，别怕，保安在呢。\n回复2：我也在，8楼灯亮着的。\n回复3：你们小心点，我先走了。' },
    { name: '2004-07-12 23:50 最后一帖', content: '楼主：李梅\n有没有人闻到焦味？好像是从走廊那边来的。\n\n（此帖之后无任何回复，BBS永久停更）' },
    { name: '2005-??-?? 匿名回帖', content: '是陈叔救了我，他把我背到楼梯口，自己又回去找其他人了。\n我没等到他出来。\n对不起。' }
  ]
};

// ========== 存档 ==========
function getSavePayload() {
  return {
    currentPage: state.currentPage,
    gameTime: state.gameTime,
    phase: state.phase,
    isRetro: state.isRetro,
    emails: state.emails,
    solved: state.solved,
    invasionActive: state.invasionActive,
    invasionCountdown: state.invasionCountdown,
    finalInvasion: state.finalInvasion,
    treeholeUnlocked: state.treeholeUnlocked,
    oldsiteTab: state.oldsiteTab,
    archiveOpened: state.archiveOpened,
    started: state.started,
    guideComplete: state.guideComplete,
    eventsScheduled: state.eventsScheduled,
    eventsTriggered: state.eventsTriggered,
    ending: state.ending,
    docs: DOCS_DATA
  };
}

function saveGame() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(getSavePayload()));
  } catch (err) {
    console.warn('保存进度失败', err);
  }
}

function loadGame() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    const saved = JSON.parse(raw);
    Object.assign(state, {
      currentPage: saved.currentPage || 'workbench',
      gameTime: saved.gameTime || { h: 23, m: 47, s: 0 },
      phase: saved.phase || 0,
      isRetro: !!saved.isRetro,
      emails: Array.isArray(saved.emails) ? saved.emails : [EMAIL_TEMPLATES.normal],
      solved: { ...state.solved, ...(saved.solved || {}) },
      invasionActive: !!saved.invasionActive,
      invasionCountdown: saved.invasionCountdown || 0,
      finalInvasion: !!saved.finalInvasion,
      treeholeUnlocked: !!saved.treeholeUnlocked,
      oldsiteTab: saved.oldsiteTab || 'mail',
      archiveOpened: Array.isArray(saved.archiveOpened) ? saved.archiveOpened : [],
      started: !!saved.started,
      guideComplete: !!saved.guideComplete,
      eventsScheduled: false,
      eventsTriggered: { ...state.eventsTriggered, ...(saved.eventsTriggered || {}) },
      ending: saved.ending || null
    });
    if (Array.isArray(saved.docs)) {
      DOCS_DATA.splice(0, DOCS_DATA.length, ...saved.docs);
    }
    return true;
  } catch (err) {
    console.warn('读取进度失败', err);
    return false;
  }
}

function resetGame() {
  isResetting = true;
  localStorage.removeItem(STORAGE_KEY);
  location.reload();
}

function confirmResetGame() {
  showConfirmModal(
    '重新开始游戏',
    '当前进度会被清除，并从 23:47 重新进入星辉办公系统。',
    resetGame
  );
}

// ========== 初始化 ==========
function initGame() {
  const hasSave = loadGame();
  if (!hasSave) state.emails = [EMAIL_TEMPLATES.normal];
  renderEmails();
  renderDocs();
  renderAnnouncements();
  renderMonitors();
  renderArchive();
  renderTreehole();
  renderOldsite('mail');
  restoreUIFromState(hasSave);
  saveGame();
  // 页面加载后自动启动；刷新时从本地进度恢复。
}

function restoreUIFromState(hasSave) {
  updateClockDisplay();

  if (state.isRetro || state.eventsTriggered.midnight) {
    applyMidnightUI(false);
  }

  if (state.eventsTriggered.scanlines) {
    document.getElementById('scanlines').classList.add('show');
  }

  if (state.treeholeUnlocked) {
    document.getElementById('navTreehole').style.display = 'flex';
  }

  if (state.solved.contact) {
    document.getElementById('contactUnlockCard').style.display = 'none';
    document.getElementById('contactCard').style.display = 'block';
  }

  if (state.solved.fireDoor) {
    document.getElementById('fireDoorStatus').textContent = '已解锁';
    document.getElementById('fireDoorStatus').className = 'status normal';
    document.getElementById('fireDoorBtn').disabled = true;
    document.getElementById('fireDoorBtn').textContent = '已解锁';
    document.getElementById('fireDoorImage').src = state.isRetro ? 'access_firedoor_fire.png' : 'access_firedoor_unlocked.png';
    unlockModule('navMonitor', '监控系统');
    unlockModule('navArchive', '历史档案库');
  }

  if (state.solved.firewall || state.phase >= 3 || state.finalInvasion || state.solved.fireSeed || state.solved.fireSystem) {
    unlockModule('navOldsite', '8楼旧站点');
  }

  if (state.solved.fireSeed || state.finalInvasion || state.solved.fireSystem) {
    unlockModule('navFire', '消防联动系统');
  }

  renderOldsite(state.oldsiteTab || 'mail');

  if (state.solved.fireSystem || state.ending === 'good') {
    document.getElementById('fireStatus').textContent = '火情已扑灭，系统恢复正常';
    document.getElementById('fireStatus').className = 'fire-status ok';
    document.getElementById('fireActivateBtn').disabled = true;
    document.getElementById('fireActivateBtn').textContent = '已启动';
  }

  if (state.invasionActive && state.invasionCountdown > 0 && !state.ending) {
    resumeInvasion();
  }

  navigate(state.currentPage || 'workbench');

  if (state.ending) {
    showEnding(state.ending, false);
  }

  if (hasSave && state.started) {
    state.guideComplete = true;
  }
}

// ========== 开始游戏 ==========
function startGame() {
  if (state.ending) return;
  if (state.started && state.clockStarted) return;
  state.started = true;
  const intro = document.getElementById('introScreen');
  if (intro) {
    intro.classList.add('hide');
    setTimeout(() => {
      intro.style.display = 'none';
    }, 420);
  }
  startClock();
  showToast('系统已登录，欢迎回来，林默。', 'success');
  if (!state.guideComplete) {
    setTimeout(() => startGuide(), 700);
  } else {
    scheduleEvents();
  }
  saveGame();
}

// ========== 新手引导 ==========
let guideStep = 0;
let guideClickHandler = null;
const guideSteps = [
  {
    target: '.nav-item[data-page="email"]',
    text: '这是公司邮箱。你收到了一封来自经理的邮件，先去看看吧。',
    position: 'right',
    page: null
  },
  {
    target: '.nav-item[data-page="docs"]',
    text: '文档中心存放着部门文件和资料，平时可以在这里查找需要的文档。',
    position: 'right',
    page: null
  },
  {
    target: '.nav-item[data-page="announcements"]',
    text: '物业公告栏里有大厦的各项管理规定。建议仔细看看，有些信息可能派上用场。',
    position: 'right',
    page: null
  },
  {
    target: '.nav-item[data-page="access"]',
    text: '门禁与电梯调度页面可以查看大楼出入口状态。如果遇到紧急情况，这里可能是关键。',
    position: 'right',
    page: null
  },
  {
    target: '.nav-item[data-page="workbench"]',
    text: '好了，系统基本操作你已经熟悉了。回到工作台继续赶方案吧，今晚还很长。',
    position: 'right',
    page: null,
    isLast: true
  }
];

function startGuide() {
  guideStep = 0;
  showGuideStep();
}

function showGuideStep() {
  detachGuideClickHandler();
  if (guideStep >= guideSteps.length) {
    hideGuide();
    state.guideComplete = true;
    saveGame();
    // 引导完成后，延迟启动剧情事件
    setTimeout(() => {
      showToast('提示：你可以自由探索各个模块，留意异常现象。', 'success');
      scheduleEvents();
    }, 1500);
    return;
  }

  const step = guideSteps[guideStep];
  const target = document.querySelector(step.target);
  if (!target) {
    guideStep++;
    showGuideStep();
    return;
  }

  // 显示遮罩
  document.getElementById('guideOverlay').classList.add('show');

  // 高亮目标
  target.classList.add('guide-highlight');

  // 创建气泡
  removeGuideBubble();
  const bubble = document.createElement('div');
  bubble.className = `guide-bubble ${step.position}`;
  bubble.id = 'guideBubble';
  bubble.innerHTML = `
    <div class="guide-step">引导 ${guideStep + 1}/${guideSteps.length}</div>
    <div class="guide-text">${step.text}</div>
    <button class="guide-next" type="button">${step.isLast ? '完成引导' : '继续'}</button>
  `;
  document.body.appendChild(bubble);

  // 定位气泡
  positionGuideBubble(target, bubble, step.position);

  bubble.querySelector('.guide-next').addEventListener('click', () => {
    if (step.target.startsWith('.nav-item')) {
      const page = target.getAttribute('data-page');
      if (page) navigate(page);
    }
    advanceGuideStep();
  });

  guideClickHandler = (event) => {
    const clickedTarget = event.target.closest(step.target);
    if (!clickedTarget) return;
    setTimeout(() => advanceGuideStep(), 80);
  };
  document.addEventListener('click', guideClickHandler);
}

function advanceGuideStep() {
  detachGuideClickHandler();
  document.querySelectorAll('.guide-highlight').forEach(el => el.classList.remove('guide-highlight'));
  guideStep++;
  setTimeout(() => showGuideStep(), 180);
}

function detachGuideClickHandler() {
  if (!guideClickHandler) return;
  document.removeEventListener('click', guideClickHandler);
  guideClickHandler = null;
}

function positionGuideBubble(target, bubble, position) {
  const rect = target.getBoundingClientRect();
  const bubbleRect = bubble.getBoundingClientRect();

  if (position === 'right') {
    bubble.style.left = (rect.right + 20) + 'px';
    bubble.style.top = (rect.top + rect.height / 2 - bubbleRect.height / 2) + 'px';
  } else if (position === 'left') {
    bubble.style.left = (rect.left - bubbleRect.width - 20) + 'px';
    bubble.style.top = (rect.top + rect.height / 2 - bubbleRect.height / 2) + 'px';
  } else if (position === 'top') {
    bubble.style.left = (rect.left + rect.width / 2 - bubbleRect.width / 2) + 'px';
    bubble.style.top = (rect.top - bubbleRect.height - 20) + 'px';
  } else if (position === 'bottom') {
    bubble.style.left = (rect.left + rect.width / 2 - bubbleRect.width / 2) + 'px';
    bubble.style.top = (rect.bottom + 20) + 'px';
  }
}

function removeGuideBubble() {
  const bubble = document.getElementById('guideBubble');
  if (bubble) bubble.remove();
}

function hideGuide() {
  document.getElementById('guideOverlay').classList.remove('show');
  removeGuideBubble();
  detachGuideClickHandler();
  document.querySelectorAll('.guide-highlight').forEach(el => el.classList.remove('guide-highlight'));
}

// ========== 时钟 ==========
let clockSaveTicks = 0;

function startClock() {
  if (state.clockStarted) return;
  state.clockStarted = true;
  setInterval(() => {
    if (state.ending) return;
    state.gameTime.s += 3; // 加速时间
    if (state.gameTime.s >= 60) {
      state.gameTime.s = 0;
      state.gameTime.m++;
    }
    if (state.gameTime.m >= 60) {
      state.gameTime.m = 0;
      state.gameTime.h++;
    }
    if (state.gameTime.h >= 24) state.gameTime.h = 0;
    updateClockDisplay();
    clockSaveTicks++;
    if (clockSaveTicks % 5 === 0) saveGame();
  }, 1000);
}

function updateClockDisplay() {
  const h = String(state.gameTime.h).padStart(2, '0');
  const m = String(state.gameTime.m).padStart(2, '0');
  const s = String(state.gameTime.s).padStart(2, '0');
  document.getElementById('clock').textContent = `${h}:${m}:${s}`;
}

// ========== 事件调度 ==========
function gameSecondsSinceStart() {
  const start = 23 * 3600 + 47 * 60;
  let current = state.gameTime.h * 3600 + state.gameTime.m * 60 + state.gameTime.s;
  if (current < start) current += 24 * 3600;
  return current - start;
}

function scheduleTimedEvent(key, thresholdSeconds, action) {
  if (state.eventsTriggered[key]) return;
  const remainingGameSeconds = thresholdSeconds - gameSecondsSinceStart();
  const delay = Math.max(0, Math.ceil(remainingGameSeconds / 3) * 1000);
  setTimeout(() => {
    if (state.eventsTriggered[key]) return;
    state.eventsTriggered[key] = true;
    action();
    saveGame();
  }, delay);
}

function scheduleEvents() {
  if (state.eventsScheduled) return;
  state.eventsScheduled = true;

  scheduleTimedEvent('warning1', 2 * 60, () => {
    addEmail(EMAIL_TEMPLATES.warning1);
    showToast('您有一封新邮件（发件人：未知用户）', 'warning');
  });

  scheduleTimedEvent('printTask', 5 * 60, () => {
    if (!DOCS_DATA.find(d => d.id === 'print_task')) {
      DOCS_DATA.push({ id: 'print_task', name: '打印任务_001', icon: '🖨️', meta: '未知创建者',
        content: '[该文档为空白文档]\n\n打印状态：正在打印... 99%\n创建时间：23:52\n操作人：（无记录）\n\n（打印机发出咔哒咔哒的声音，但没有纸张出来）' });
      renderDocs();
    }
    showToast('文档中心：检测到未授权的打印任务', 'warning');
  });

  scheduleTimedEvent('scanlines', 8 * 60, () => {
    document.getElementById('scanlines').classList.add('show');
    showToast('屏幕出现异常扫描线...', 'warning');
  });

  scheduleTimedEvent('noteTxt', 11 * 60, () => {
    if (!DOCS_DATA.find(d => d.id === 'note_txt')) {
      DOCS_DATA.push({ id: 'note_txt', name: '信他的.txt', icon: '📄', meta: '23:58 自动创建',
        content: '信他的。\n\n（文件创建者未知，无法删除）' });
      renderDocs();
    }
    showToast('桌面自动创建了新文件：信他的.txt', 'danger');
  });

  scheduleTimedEvent('midnight', 13 * 60, () => {
    triggerMidnight();
  });

  saveGame();
}

function triggerMidnight() {
  state.phase = 1;
  state.isRetro = true;
  state.eventsTriggered.midnight = true;
  applyMidnightUI(true);
  saveGame();
}

function applyMidnightUI(showMessages) {
  document.getElementById('browserFrame').classList.add('retro');
  document.getElementById('windowTitle').textContent = '星辉大厦物业内网 v1.0';
  document.getElementById('addressBar').value = 'http://intranet.xinghui大厦.com/v1.0/';
  document.getElementById('systemStatus').textContent = '⚠ 系统异常 - 旧版本覆盖';
  document.getElementById('gateStatus').textContent = '电子锁死';
  document.getElementById('gateStatus').className = 'status locked';
  document.getElementById('elevatorStatus').textContent = '全部停运';
  document.getElementById('elevatorStatus').className = 'status warning';
  state.isRetro = true;
  state.treeholeUnlocked = true;
  document.getElementById('navTreehole').style.display = 'flex';
  updateFireVisuals();

  if (showMessages) {
    showToast('系统时间 00:00 - 界面发生未知变化', 'danger');
    setTimeout(() => showToast('所有电梯停运，一楼大门已锁死', 'danger'), 1500);
    setTimeout(() => showToast('消防通道处于电子锁死状态', 'warning'), 3000);
  }
}

// ========== 导航 ==========
function navigate(page) {
  const navItem = document.querySelector(`.nav-item[data-page="${page}"]`);
  if (navItem && navItem.classList.contains('locked')) {
    showToast('该模块尚未解锁', 'warning');
    return;
  }
  state.currentPage = page;
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  navItem.classList.add('active');
  document.getElementById(`page-${page}`).classList.add('active');
  resetSharedViewer();
  document.getElementById('emailDetailView').style.display = 'none';
  document.getElementById('emailListView').style.display = 'block';

  const titles = {
    workbench: '我的工作台', email: '公司邮箱', docs: '文档中心',
    access: '门禁与电梯', announcements: '物业公告', monitor: '监控系统',
    archive: '历史档案库', fire: '消防联动', oldsite: '8楼旧站点', treehole: '员工树洞'
  };
  document.getElementById('windowTitle').textContent = `星辉办公系统 - ${titles[page]}`;
  setAddress(page);
  saveGame();
}

const ADDRESS_MAP = {
  workbench: '/workbench',
  email: '/mail/inbox',
  docs: '/documents',
  access: '/access-control',
  announcements: '/property/announcements',
  monitor: '/security/monitor',
  archive: '/archive/3f',
  fire: '/fire-control',
  oldsite: '/oldsite/dingsheng',
  treehole: '/treehole'
};

function setAddress(page, detail = '') {
  const base = state.isRetro ? 'http://intranet.xinghui大厦.com/v1.0' : 'http://intranet.xinghui大厦.com';
  const path = ADDRESS_MAP[page] || `/${page}`;
  const suffix = detail ? `/${encodeURIComponent(detail).replace(/%2F/g, '/')}` : '';
  document.getElementById('addressBar').value = `${base}${path}${suffix}`;
}

function resetSharedViewer() {
  const viewer = document.getElementById('docViewer');
  viewer.style.display = 'none';
  viewer.querySelector('.back-btn').textContent = '← 返回文档列表';
  viewer.querySelector('.back-btn').onclick = closeDocViewer;

  const docGrid = document.querySelector('#page-docs .doc-grid');
  if (docGrid) docGrid.style.display = 'grid';

  const announcementList = document.querySelector('#page-announcements .announcement-list');
  if (announcementList) announcementList.style.display = 'block';

  const archiveList = document.getElementById('archiveList');
  if (archiveList) archiveList.style.display = 'block';
}

// ========== 邮箱 ==========
function addEmail(email) {
  const exists = state.emails.some(e => e.id === email.id);
  if (!exists) state.emails.unshift({ ...email });
  renderEmails();
  const badge = document.getElementById('emailBadge');
  const unreadCount = state.emails.filter(e => e.unread).length;
  if (unreadCount > 0) {
    badge.textContent = unreadCount;
    badge.classList.add('show');
  }
  saveGame();
}

function renderEmails() {
  const list = document.getElementById('emailList');
  list.innerHTML = state.emails.map(e => `
    <li class="email-item ${e.unread ? 'unread' : ''}" onclick="openEmail('${e.id}')">
      <span class="sender">${e.sender}</span>
      <span class="subject">${e.subject}</span>
      <span class="time">${e.time}</span>
    </li>
  `).join('');
}

function openEmail(id) {
  const email = state.emails.find(e => e.id === id);
  if (!email) return;
  email.unread = false;
  renderEmails();
  const badge = document.getElementById('emailBadge');
  const unreadCount = state.emails.filter(e => e.unread).length;
  if (unreadCount > 0) badge.textContent = unreadCount;
  else badge.classList.remove('show');

  state.currentEmail = email;
  document.getElementById('emailListView').style.display = 'none';
  document.getElementById('emailDetailView').style.display = 'block';
  document.getElementById('emailMeta').innerHTML = `
    <div><strong>发件人：</strong>${email.sender}</div>
    <div><strong>主题：</strong>${email.subject}</div>
    <div><strong>时间：</strong>${email.time}</div>
  `;
  document.getElementById('emailBody').textContent = email.body;
  setAddress('email', email.id);
  saveGame();
}

function showEmailList() {
  document.getElementById('emailListView').style.display = 'block';
  document.getElementById('emailDetailView').style.display = 'none';
  setAddress('email');
  saveGame();
}

// ========== 文档中心 ==========
function renderDocs() {
  const grid = document.getElementById('docGrid');
  grid.innerHTML = DOCS_DATA.map(d => `
    <div class="doc-card" onclick="openDoc('${d.id}')">
      <div class="doc-icon">${d.icon}</div>
      <div class="doc-name">${d.name}</div>
      <div class="doc-meta">${d.meta}</div>
    </div>
  `).join('');
}

function openDoc(id) {
  const doc = DOCS_DATA.find(d => d.id === id);
  if (!doc) return;
  document.querySelector('#page-docs .doc-grid').style.display = 'none';
  const viewer = document.getElementById('docViewer');
  viewer.style.display = 'block';
  viewer.querySelector('.back-btn').textContent = '← 返回文档列表';
  viewer.querySelector('.back-btn').onclick = closeDocViewer;
  document.getElementById('viewerTitle').textContent = doc.name;
  document.getElementById('viewerContent').textContent = doc.content;
  setAddress('docs', doc.id);
}

function closeDocViewer() {
  const viewer = document.getElementById('docViewer');
  viewer.style.display = 'none';
  if (state.currentPage === 'docs') {
    document.querySelector('#page-docs .doc-grid').style.display = 'grid';
  } else if (state.currentPage === 'announcements') {
    document.querySelector('#page-announcements .announcement-list').style.display = 'block';
  } else if (state.currentPage === 'archive') {
    document.getElementById('archiveList').style.display = 'block';
  }
  viewer.querySelector('.back-btn').textContent = '← 返回文档列表';
  viewer.querySelector('.back-btn').onclick = closeDocViewer;
  setAddress(state.currentPage);
}

// ========== 公告 ==========
function renderAnnouncements() {
  const list = document.getElementById('announcementList');
  list.innerHTML = ANNOUNCEMENTS.map(a => `
    <li class="announcement-item" onclick="openAnnouncement('${a.id}')">
      <div class="an-title">${a.title}</div>
      <div class="an-meta">${a.date} · ${a.dept}</div>
      <div class="an-preview">${a.content.substring(0, 50)}...</div>
    </li>
  `).join('');
}

function openAnnouncement(id) {
  const a = ANNOUNCEMENTS.find(x => x.id === id);
  if (!a) return;
  document.querySelector('#page-announcements .announcement-list').style.display = 'none';
  const viewer = document.getElementById('docViewer');
  viewer.style.display = 'block';
  viewer.querySelector('.back-btn').textContent = '← 返回公告列表';
  viewer.querySelector('.back-btn').onclick = closeDocViewer;
  document.getElementById('viewerTitle').textContent = a.title;
  document.getElementById('viewerContent').textContent = a.content;
  setAddress('announcements', a.id);
}

// ========== 监控 ==========
function renderMonitors() {
  const grid = document.getElementById('monitorGrid');
  grid.innerHTML = MONITORS.map(m => `
    <div class="monitor-cell ${m.type}" onclick="clickMonitor(${m.floor})">
      <img class="monitor-footage" src="${getMonitorSource(m)}" alt="${m.label}" data-floor="${m.floor}">
      <div class="cam-label">CAM-${m.floor}F</div>
      <div class="cam-time" id="camTime-${m.floor}">00:00:00</div>
      <div class="noise"></div>
      <div class="face-jump" id="face-${m.floor}">💀</div>
    </div>
  `).join('');
}

function getMonitorSource(monitor) {
  return state.isRetro ? monitor.fireGif : monitor.gif;
}

function updateFireVisuals() {
  document.getElementById('gateImage').src = 'access_gate_fire.png';
  document.getElementById('elevatorImage').src = 'access_elevator_fire.png';
  document.getElementById('fireDoorImage').src = 'access_firedoor_fire.png';
  MONITORS.forEach(m => {
    const img = document.querySelector(`.monitor-footage[data-floor="${m.floor}"]`);
    if (img) img.src = getMonitorSource(m);
  });
}

function clickMonitor(floor) {
  const monitor = MONITORS.find(m => m.floor === floor);
  if (monitor) openMonitorModal(monitor);

  if (floor === 8) {
    // 8楼监控：脸贴镜头
    const face = document.getElementById('face-8');
    face.style.display = 'flex';
    showToast('8楼监控：检测到异常人形', 'danger');
    setTimeout(() => { face.style.display = 'none'; }, 2000);
  } else if (floor === 3) {
    showToast('3楼档案室：门自动打开，灯光亮起', 'warning');
    if (!state.solved.fireReport) {
      // 提示去档案库
      setTimeout(() => showToast('系统解锁了新模块：历史档案库', 'success'), 1000);
    }
  }
}

function openMonitorModal(monitor) {
  document.getElementById('monitorModalTitle').textContent = monitor.label;
  document.getElementById('monitorModalSubtitle').textContent = `CAM-${monitor.floor}F · ${monitor.type === 'snow' ? '信号异常' : '实时画面'}`;
  const img = document.getElementById('monitorModalImage');
  img.src = getMonitorSource(monitor);
  img.alt = monitor.label;
  document.getElementById('monitorModal').classList.add('show');
}

function closeMonitorModal() {
  document.getElementById('monitorModal').classList.remove('show');
}

// ========== 档案库 ==========
function renderArchive() {
  const list = document.getElementById('archiveList');
  list.innerHTML = ARCHIVE_DOCS.map(d => `
    <div class="archive-folder ${d.encrypted ? 'encrypted' : ''}" onclick="openArchiveDoc('${d.id}')">
      <span class="folder-icon">${d.icon}</span>
      <span class="folder-name">${d.name}</span>
      ${d.encrypted ? '<span style="margin-left:auto;font-size:11px;color:#999">🔒 加密</span>' : ''}
    </div>
  `).join('');
}

function openArchiveDoc(id) {
  const doc = ARCHIVE_DOCS.find(d => d.id === id);
  if (!doc) return;

  if (doc.encrypted && id === 'fire_report' && !state.solved.fireReport) {
    showPasswordModal('fireReport');
    return;
  }
  if (doc.encrypted && id === 'property_notes' && !state.archiveOpened.includes('property_notes')) {
    showPasswordModal('propertyNotes');
    return;
  }

  // 显示文档
  const list = document.getElementById('archiveList');
  list.style.display = 'none';
  const viewer = document.getElementById('docViewer');
  viewer.style.display = 'block';
  viewer.querySelector('.back-btn').textContent = '← 返回档案列表';
  viewer.querySelector('.back-btn').onclick = closeDocViewer;
  document.getElementById('viewerTitle').textContent = doc.name;
  const viewerContent = document.getElementById('viewerContent');
  viewerContent.textContent = doc.content;
  if (doc.handwrittenImage) {
    const img = document.createElement('img');
    img.className = 'handwritten-note-image';
    img.src = doc.handwrittenImage;
    img.alt = '手写批注';
    viewerContent.appendChild(img);
  }
  setAddress('archive', doc.id);

  // 读到值班记录后触发入侵
  if (id === 'duty_log' && !state.invasionActive && state.phase < 2) {
    setTimeout(() => triggerInvasion(), 3000);
  }
}

// ========== 入侵机制 ==========
function triggerInvasion() {
  if (state.invasionActive) return;
  state.invasionActive = true;
  state.phase = 2;
  state.invasionCountdown = 30;

  startInvasionVisuals(false);
  showToast('未知用户正在入侵您的设备！点击顶部红色警告栏的「立即阻断」按钮', 'danger');
  setTimeout(() => showToast('阻断码提示：火灾发生日期（月+日）', 'warning'), 1500);
  saveGame();
}

function resumeInvasion() {
  startInvasionVisuals(state.finalInvasion);
}

function startInvasionVisuals(isFinal) {
  document.getElementById('invasionBanner').classList.add('show');
  document.getElementById('burnEdges').classList.add('show');
  document.getElementById('invasionTimer').textContent = state.invasionCountdown;
  document.getElementById('systemStatus').textContent = isFinal ? '⚠ 系统崩溃倒计时！' : '⚠ 正在被入侵！';
  if (isFinal) document.getElementById('fireOverlay').classList.add('show');

  clearInterval(state.invasionInterval);
  clearInterval(state.glitchInterval);
  state.glitchInterval = setInterval(spawnGlitch, isFinal ? 400 : 600);

  if (isFinal) {
    const faceInterval = setInterval(() => {
      if (!state.invasionActive) { clearInterval(faceInterval); return; }
      const content = document.getElementById('mainContent');
      const popup = document.createElement('div');
      popup.className = 'glitch-popup';
      popup.style.fontSize = '28px';
      popup.textContent = '👁️🔥';
      popup.style.left = Math.random() * 70 + '%';
      popup.style.top = Math.random() * 70 + '%';
      content.appendChild(popup);
      setTimeout(() => popup.remove(), 1500);
    }, 800);
  }

  state.invasionInterval = setInterval(() => {
    state.invasionCountdown--;
    document.getElementById('invasionTimer').textContent = state.invasionCountdown;
    saveGame();
    if (state.invasionCountdown <= 0) {
      clearInterval(state.invasionInterval);
      clearInterval(state.glitchInterval);
      onInvasionSuccess();
    }
  }, 1000);
}

function spawnGlitch() {
  const content = document.getElementById('mainContent');
  const glitch = document.createElement('div');
  glitch.className = 'glitch-popup';
  const texts = ['留下来陪我', '系统错误', '01001010', '你逃不掉', 'ERROR', '加入我们', '🔥🔥🔥'];
  glitch.textContent = texts[Math.floor(Math.random() * texts.length)];
  glitch.style.left = Math.random() * 80 + '%';
  glitch.style.top = Math.random() * 80 + '%';
  content.appendChild(glitch);
  setTimeout(() => glitch.remove(), 2000);
}

function stopInvasion() {
  state.invasionActive = false;
  clearInterval(state.invasionInterval);
  clearInterval(state.glitchInterval);
  document.getElementById('invasionBanner').classList.remove('show');
  document.getElementById('burnEdges').classList.remove('show');
  document.getElementById('systemStatus').textContent = '入侵已阻断';
  // 清除残留glitch
  document.querySelectorAll('.glitch-popup').forEach(g => g.remove());
  saveGame();
}

function onInvasionSuccess() {
  // 第一次入侵成功 -> 坏结局条件之一
  state.invasionActive = false;
  document.getElementById('invasionBanner').classList.remove('show');
  document.getElementById('burnEdges').classList.remove('show');
  document.querySelectorAll('.glitch-popup').forEach(g => g.remove());
  saveGame();

  if (state.finalInvasion) {
    // 最终入侵失败 = 坏结局
    showEnding('bad');
  } else {
    // 第一次入侵失败，继续但标记
    showToast('入侵成功...系统被部分控制', 'danger');
    state.solved.firewall = 'failed';
    saveGame();
    // 仍然推进剧情，但会影响结局
    setTimeout(() => {
      addEmail(EMAIL_TEMPLATES.guide2);
      unlockModule('navOldsite', '8楼旧站点');
      showToast('收到新邮件，包含8楼旧站点链接', 'warning');
      saveGame();
    }, 2000);
  }
}

// ========== 最终入侵（8楼火种） ==========
function triggerFinalInvasion() {
  state.finalInvasion = true;
  state.invasionActive = true;
  state.invasionCountdown = 40;
  startInvasionVisuals(true);
  showToast('周建的残影正在接管系统！启动消防系统！', 'danger');
  saveGame();
}

// ========== 8楼旧站点 ==========
function renderOldsite(tab) {
  state.oldsiteTab = tab;
  const content = document.getElementById('oldsiteContent');
  const data = OLDSITE_DATA[tab];

  if (tab === 'personal') {
    content.innerHTML = '<h3>个人文件夹 - 周建</h3>' + data.map(f => `
      <div class="file-item ${f.encrypted ? 'encrypted' : ''}" onclick="openOldsiteFile('${f.name}')">
        📦 ${f.name} ${f.encrypted ? '🔒' : ''}
      </div>
    `).join('');
  } else {
    content.innerHTML = `<h3>${tab === 'mail' ? '员工邮箱' : tab === 'docs' ? '部门文档' : '内部BBS'}</h3>` +
      data.map(f => `
        <div class="file-item" onclick="openOldsiteFile('${f.name}')">
          📄 ${f.name}
        </div>
      `).join('');
  }
  saveGame();
}

function switchOldsiteTab(btn, tab) {
  document.querySelectorAll('.oldsite-nav button').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderOldsite(tab);
}

function openOldsiteFile(name) {
  let file = null;
  for (const tab in OLDSITE_DATA) {
    const found = OLDSITE_DATA[tab].find(f => f.name === name);
    if (found) { file = found; break; }
  }
  if (!file) return;

  if (file.encrypted && !state.solved.fireSeed) {
    showPasswordModal('fireSeed');
    return;
  }

  // 显示内容
  const content = document.getElementById('oldsiteContent');
  content.innerHTML = `
    <div style="margin-bottom:12px"><a href="#" onclick="renderOldsite('${state.oldsiteTab}');return false;" style="color:#000080">← 返回</a></div>
    <h3>${file.name}</h3>
    <div style="white-space:pre-wrap;line-height:1.8;font-size:13px">${file.content}</div>
  `;

  // 打开火种后触发最终入侵
  if (name.includes('火种') && !state.finalInvasion) {
    unlockModule('navFire', '消防联动系统');
    setTimeout(() => triggerFinalInvasion(), 2000);
  }
}

// ========== 树洞 ==========
function renderTreehole() {
  const list = document.getElementById('treeholeList');
  list.innerHTML = TREEHOLE_POSTS.map(p => `
    <div class="treehole-post">
      <div class="post-time">${p.time}</div>
      <div class="post-content">${p.content}</div>
    </div>
  `).join('');
}

// ========== 密码弹窗 ==========
let currentPasswordTarget = null;

function showPasswordModal(target) {
  currentPasswordTarget = target;
  const modal = document.getElementById('passwordModal');
  const input = document.getElementById('passwordInput');
  input.value = '';

  const hints = {
    contact: { title: '解锁内部通讯录', hint: '请输入4位部门编号（创意部编号）' },
    fireDoor: { title: '解锁7楼消防通道', hint: '请输入4位数字密码\n提示：大厦建成年份后两位 + 楼层号' },
    fireReport: { title: '解密火灾调查报告', hint: '请输入4位保安工号' },
    firewall: { title: '防火墙临时阻断', hint: '请输入4位阻断码\n提示：火灾发生日期（月+日）' },
    fireSeed: { title: '解密「火种」压缩包', hint: '请输入4位数字密码\n提示：周建最开心的日子（月+日）' },
    fireSystem: { title: '消防最高权限验证', hint: '请输入4位权限码\n提示：火警电话 + 值班组编号（值班组为0号组）' },
    propertyNotes: { title: '解密物业工作笔记', hint: '请输入4位密码\n提示：第一任物业主管工号' }
  };

  const h = hints[target] || { title: '请输入密码', hint: '请输入4位数字密码' };
  document.getElementById('modalTitle').textContent = h.title;
  document.getElementById('modalHint').textContent = h.hint;
  modal.classList.add('show');
  setTimeout(() => input.focus(), 100);
}

function closePasswordModal() {
  document.getElementById('passwordModal').classList.remove('show');
  currentPasswordTarget = null;
}

function submitPassword() {
  const input = document.getElementById('passwordInput');
  const val = input.value;

  const passwords = {
    contact: '0701',
    fireDoor: '9907',
    fireReport: '0312',
    firewall: '0712',
    fireSeed: '0815',
    fireSystem: '1190',
    propertyNotes: '0001'
  };

  if (val === passwords[currentPasswordTarget]) {
    handlePasswordSuccess(currentPasswordTarget);
    closePasswordModal();
  } else {
    showToast('密码错误，请重试', 'danger');
    input.value = '';
    input.style.borderColor = '#e74c3c';
    setTimeout(() => { input.style.borderColor = '#ddd'; }, 1000);
  }
}

function handlePasswordSuccess(target) {
  switch (target) {
    case 'contact':
      state.solved.contact = true;
      document.getElementById('contactUnlockCard').style.display = 'none';
      document.getElementById('contactCard').style.display = 'block';
      showToast('通讯录已解锁', 'success');
      break;
    case 'fireDoor':
      state.solved.fireDoor = true;
      document.getElementById('fireDoorStatus').textContent = '已解锁';
      document.getElementById('fireDoorStatus').className = 'status normal';
      document.getElementById('fireDoorBtn').disabled = true;
      document.getElementById('fireDoorBtn').textContent = '已解锁';
      document.getElementById('fireDoorImage').src = state.isRetro ? 'access_firedoor_fire.png' : 'access_firedoor_unlocked.png';
      unlockModule('navMonitor', '监控系统');
      unlockModule('navArchive', '历史档案库');
      addEmail(EMAIL_TEMPLATES.guide1);
      showToast('消防通道已解锁', 'success');
      setTimeout(() => showToast('系统解锁了新模块：监控系统、历史档案库', 'success'), 1000);
      break;
    case 'fireReport':
      state.solved.fireReport = true;
      showToast('调查报告已解密', 'success');
      openArchiveDoc('fire_report');
      // 解锁消防系统模块（备用）
      break;
    case 'firewall':
      state.solved.firewall = true;
      stopInvasion();
      showToast('入侵已阻断！', 'success');
      addEmail(EMAIL_TEMPLATES.guide2);
      unlockModule('navOldsite', '8楼旧站点');
      setTimeout(() => showToast('收到新邮件，包含8楼旧站点链接', 'warning'), 1000);
      break;
    case 'fireSeed':
      state.solved.fireSeed = true;
      showToast('压缩包已解密', 'success');
      openOldsiteFile('【加密压缩包】火种.zip');
      break;
    case 'fireSystem':
      state.solved.fireSystem = true;
      activateFireSystem();
      break;
    case 'propertyNotes':
      if (!state.archiveOpened.includes('property_notes')) state.archiveOpened.push('property_notes');
      showToast('工作笔记已解密', 'success');
      openArchiveDoc('property_notes');
      break;
  }
  saveGame();
}

// ========== 模块解锁 ==========
function unlockModule(navId, name) {
  const el = document.getElementById(navId);
  el.classList.remove('locked');
  el.innerHTML = el.innerHTML.replace(' 🔒', '');
}

// ========== 消防系统启动 ==========
function activateFireSystem() {
  stopInvasion();
  document.getElementById('fireOverlay').classList.remove('show');
  document.getElementById('fireStatus').textContent = '8楼灭火程序已启动！喷淋系统运行中...';
  document.getElementById('fireStatus').className = 'fire-status alert';
  document.getElementById('fireActivateBtn').disabled = true;
  document.getElementById('fireActivateBtn').textContent = '已启动';

  showToast('消防系统启动，正在清除残影...', 'success');

  setTimeout(() => {
    document.getElementById('fireStatus').textContent = '火情已扑灭，系统恢复正常';
    document.getElementById('fireStatus').className = 'fire-status ok';
    addEmail(EMAIL_TEMPLATES.final);
    showToast('收到来自「陈国华」的邮件', 'success');
  }, 3000);

  setTimeout(() => {
    // 进入结局阶段
    state.phase = 4;
    showEnding('good');
  }, 6000);
}

// ========== 强制断开（普通结局） ==========
function forceDisconnect() {
  showConfirmModal(
    '强制断开内网',
    '这将放弃清除残影，直接逃离大厦。',
    () => {
      stopInvasion();
      showToast('正在强制断开内网连接...', 'warning');
      setTimeout(() => {
        showToast('内网已断开，门禁系统恢复', 'success');
        setTimeout(() => showEnding('normal'), 1500);
      }, 2000);
    }
  );
}

// ========== 结局 ==========
function showEnding(type, persist = true) {
  state.ending = type;
  const screen = document.getElementById('endingScreen');
  screen.className = 'ending-screen show ' + type;

  if (type === 'good') {
    document.getElementById('endingIcon').textContent = '🎖️';
    document.getElementById('endingTitle').textContent = '好结局 · 黎明';
    document.getElementById('endingText').textContent = `清晨的大厦玻璃门被推开，暖金色的阳光铺进来。

你回头看了一眼星辉大厦，一切如常，仿佛昨夜只是一场漫长的噩梦。

回到家后，你发现电脑桌面上多了一个无法删除的png图片。点开是一枚老旧的保安徽章，背面刻着三个字：

陈国华

后来你听说，大厦的内网再也没出过异常。只是偶尔有深夜加班的人说，自己忘关的电脑会被匿名账号悄悄退出系统，桌面上还会多一个空白的「注意安全」txt文档。

没有人知道是谁做的，但大家都默认，楼里有个很负责任的夜班保安。

他终于下班了。`;
  } else if (type === 'normal') {
    document.getElementById('endingIcon').textContent = '🌙';
    document.getElementById('endingTitle').textContent = '普通结局 · 余烬';
    document.getElementById('endingText').textContent = `你强制断开了内网，门禁解锁，成功逃出了大厦。

阳光照在身上，但后背总觉得发凉。

回到家打开自己的笔记本，你发现电脑里自动同步了一个无法删除的空白文件夹，命名为「0712」。

每到零点，它就会自动创建无数个空白文档，删也删不完。

周建的残影还留在系统深处，只是暂时沉睡着。

它还在等下一个深夜登录的人。`;
  } else {
    document.getElementById('endingIcon').textContent = '💻';
    document.getElementById('endingTitle').textContent = '坏结局 · 新的残影';
    document.getElementById('endingText').textContent = `系统彻底崩溃。

屏幕全黑几秒后，重新回到最开始的「我的工作台」页面。

你的鼠标彻底失控，光标自动移动到键盘位置，开始一下一下敲击按键。策划方案的文档里不断生成毫无意义的文字，永远写不完。

所有操作都失效，无法关闭页面，无法退出系统，甚至无法刷新。

页面底部慢慢浮现出一行灰色的小字：

「欢迎加入星辉大厦夜班团队。」

你成了7楼新的数字残影，日复一日地重复着加班的动作，等待下一个零点还登录在内网里的人。`;
  }
  if (persist) saveGame();
}

function restartGame() {
  resetGame();
}

// ========== 确认弹窗 ==========
let pendingConfirmAction = null;

function showConfirmModal(title, text, onConfirm) {
  pendingConfirmAction = onConfirm;
  document.getElementById('confirmTitle').textContent = title;
  document.getElementById('confirmText').textContent = text;
  document.getElementById('confirmModal').classList.add('show');
}

function closeConfirmModal() {
  pendingConfirmAction = null;
  document.getElementById('confirmModal').classList.remove('show');
}

function submitConfirmModal() {
  const action = pendingConfirmAction;
  closeConfirmModal();
  if (action) action();
}

// ========== Toast ==========
function showToast(msg, type = '') {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = 'toast ' + type;
  toast.textContent = msg;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.5s';
    setTimeout(() => toast.remove(), 500);
  }, 3500);
}

// ========== 回车键提交密码 ==========
document.getElementById('passwordInput').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') submitPassword();
});

window.addEventListener('beforeunload', () => {
  if (!isResetting) saveGame();
});

// ========== 启动 ==========
initGame();
setTimeout(() => startGame(), 350);

