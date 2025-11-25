import React, { useState, useEffect, useMemo } from 'react';
import { 
  Wind, Layers, PenTool, Heart, Settings, Plus, 
  ChevronRight, ChevronLeft, Image as ImageIcon, 
  CheckCircle, Trash2, X, Save, Upload, Download,
  Anchor, Smile, Frown, Meh, MoreHorizontal, Share,
  Zap, Clock, Flag, Target, BookOpen, Quote, Search, Filter
} from 'lucide-react';

// --- 1. 核心数据 Hook (LocalStorage 持久化) ---
const useStickyState = (defaultValue, key) => {
  const [value, setValue] = useState(() => {
    try {
      const stickyValue = window.localStorage.getItem(key);
      return stickyValue !== null ? JSON.parse(stickyValue) : defaultValue;
    } catch (error) {
      return defaultValue;
    }
  });
  useEffect(() => {
    window.localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);
  return [value, setValue];
};

// --- 2. iOS 设计系统 (极简/留白/小字号) ---
const IOS = {
  bg: 'bg-[#F2F2F7]', 
  white: 'bg-white',
  card: 'bg-white rounded-[16px] shadow-[0_0.5px_2px_rgba(0,0,0,0.05)] border border-black/[0.03]',
  // 按钮：克制的小圆角，深色主色
  primaryBtn: 'bg-[#1C1C1E] text-white active:scale-95 transition-all duration-200 shadow-sm',
  secondaryBtn: 'bg-[#E5E5EA] text-[#1C1C1E] active:bg-[#D1D1D6] transition-colors duration-200',
  ghostBtn: 'text-[#007AFF] active:opacity-60 transition-opacity',
  // 字体：系统级排版
  type: {
    large: 'text-[34px] font-bold tracking-tight text-[#1C1C1E] leading-tight',
    title2: 'text-[20px] font-semibold tracking-tight text-[#1C1C1E]',
    headline: 'text-[17px] font-semibold text-[#1C1C1E] leading-snug',
    body: 'text-[15px] font-normal text-[#3A3A3C] leading-relaxed',
    caption: 'text-[13px] font-medium text-[#8E8E93]',
    tiny: 'text-[11px] font-medium text-[#AEAEB2] uppercase tracking-wider',
  },
  input: 'w-full bg-[#F2F2F7] rounded-[10px] px-3 py-2.5 text-[15px] placeholder-[#8E8E93] focus:outline-none focus:bg-[#E5E5EA] transition-all',
  divider: 'border-b border-[#C6C6C8]/40',
};

// --- 3. 智能推荐算法引擎 (generateTodayPlan) ---
const generateTodayPlan = (tasks, energyLevel) => {
  // 过滤掉已完成的任务
  const pendingTasks = tasks.filter(t => !t.completed);
  if (pendingTasks.length === 0) return [];

  // 评分权重配置
  const SCORES = {
    PRIORITY: { 'P0': 100, 'P1': 50, 'P2': 20, 'P3': 0 },
    ENERGY_MATCH: 30,    // 精力匹配奖励
    ENERGY_MISMATCH: -50,// 精力透支惩罚
    DUE_SOON: 80,        // 临期奖励
    OVERDUE: 200         // 过期最高优
  };

  const eMap = { 'Low': 1, 'Med': 2, 'High': 3 };
  const userE = eMap[energyLevel] || 2;

  // 计算得分
  const scoredTasks = pendingTasks.map(task => {
    let score = 0;
    
    // 1. 优先级得分
    score += SCORES.PRIORITY[task.priority] || 0;

    // 2. 截止日期得分
    if (task.dueDate) {
      const daysLeft = (new Date(task.dueDate) - new Date()) / (1000 * 3600 * 24);
      if (daysLeft < 0) score += SCORES.OVERDUE; 
      else if (daysLeft < 2) score += SCORES.DUE_SOON;
    }

    // 3. 精力匹配 (核心逻辑)
    const taskE = eMap[task.energyNeed] || 2;
    if (userE < taskE) score += SCORES.ENERGY_MISMATCH; // 状态不好别做难事
    if (userE === 3 && taskE === 3) score += SCORES.ENERGY_MATCH; // 状态好优先攻坚

    // 4. 耗时惩罚 (如果精力低，不做长耗时任务)
    if (userE === 1 && (task.estimateMin > 60)) score -= 30;

    return { ...task, score };
  });

  // 排序
  scoredTasks.sort((a, b) => b.score - a.score);

  // 策略：选 1 个最高分主任务 + 最多 2 个顺手小任务
  const mainTask = scoredTasks[0];
  const fillerTasks = scoredTasks.slice(1).filter(t => {
    // 填充条件：耗时短 或 精力需求低
    return (t.estimateMin <= 30) || t.energyNeed === 'Low';
  }).slice(0, 2);

  return [mainTask, ...fillerTasks].filter(Boolean);
};

// --- 4. 通用组件 ---
const NavBar = ({ title, onBack, rightAction }) => (
  <div className={`bg-white/80 backdrop-blur-xl border-b border-[#C6C6C8]/50 px-4 h-[44px] flex items-center justify-between sticky top-0 z-20`}>
    <div className="flex-1 flex justify-start">
      {onBack && (
        <button onClick={onBack} className="flex items-center text-[#007AFF] text-[16px] -ml-2 active:opacity-50">
          <ChevronLeft size={22}/> 返回
        </button>
      )}
    </div>
    <div className="font-semibold text-[17px] text-[#1C1C1E]">{title}</div>
    <div className="flex-1 flex justify-end">{rightAction}</div>
  </div>
);

const Sheet = ({ isOpen, onClose, children, title }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center">
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
      <div className="bg-[#F2F2F7] w-full max-w-md rounded-t-[20px] h-[85vh] overflow-hidden flex flex-col animate-slide-up shadow-2xl relative">
        <div className="bg-white px-4 py-3 flex justify-between items-center border-b border-[#C6C6C8]/50 shrink-0">
          <button onClick={onClose} className="text-[#007AFF] text-[16px]">取消</button>
          <span className="font-semibold text-[16px]">{title}</span>
          <div className="w-8"></div>
        </div>
        <div className="flex-1 overflow-y-auto p-5 pb-20">
          {children}
        </div>
      </div>
    </div>
  );
};

const Chip = ({ label, active, onClick, colorClass = 'bg-[#1C1C1E] text-white' }) => (
  <button 
    onClick={onClick}
    className={`whitespace-nowrap px-3 py-1.5 rounded-full text-[13px] font-medium transition-all border ${
      active ? `${colorClass} border-transparent shadow-sm` : 'bg-white border-[#E5E5EA] text-[#8E8E93]'
    }`}
  >
    {label}
  </button>
);

// --- 5. 核心页面视图 ---

// A. 今日 (含智能推荐)
const HomeView = ({ tasks, actions, todayPlan, setTodayPlan }) => {
  const [energy, setEnergy] = useState(null); 

  const runEngine = (lvl) => {
    setEnergy(lvl);
    setTodayPlan(generateTodayPlan(tasks, lvl));
  };

  return (
    <div className="h-full overflow-y-auto px-5 pt-14 pb-32 bg-[#F2F2F7]">
      <div className="flex justify-center mb-8 opacity-50">
        <span className={IOS.type.tiny}>GROWTH CONSOLE</span>
      </div>

      {!energy && todayPlan.length === 0 ? (
        <div className="flex flex-col items-center animate-fade-in mt-10">
          <div className="mb-8 p-4 bg-white rounded-full shadow-sm">
            <Zap size={32} className="text-[#FFD60A]" fill="#FFD60A" />
          </div>
          <h2 className={IOS.type.title2}>你好，设计师。</h2>
          <p className={`${IOS.type.caption} mt-2 mb-10 text-center`}>
            任务池现有 {tasks.filter(t=>!t.completed).length} 个待办。<br/>
            请选择今日精力状态，生成计划。
          </p>
          
          <div className="w-full space-y-3">
            {[
              { l: 'Low', t: '🌱 恢复模式', d: '只做最简单的' },
              { l: 'Med', t: '☁️ 正常节奏', d: '推进主线任务' },
              { l: 'High', t: '🔥 高能冲刺', d: '攻克困难任务' }
            ].map(opt => (
              <button key={opt.l} onClick={() => runEngine(opt.l)} 
                className="w-full bg-white p-4 rounded-[14px] flex justify-between items-center active:scale-[0.98] transition-transform shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
                <span className="text-[15px] font-medium text-[#1C1C1E]">{opt.t}</span>
                <span className="text-[12px] text-[#8E8E93]">{opt.d}</span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="animate-slide-up">
          <div className="flex justify-between items-end mb-6 px-1">
            <div>
              <h2 className={IOS.type.title2}>今日计划</h2>
              <p className={IOS.type.caption}>基于「{energy}」精力推荐</p>
            </div>
            <button onClick={() => {setEnergy(null); setTodayPlan([]);}} className="text-[#007AFF] text-[13px] bg-white px-3 py-1 rounded-full">重置</button>
          </div>

          {todayPlan.length > 0 ? (
            <div className="space-y-4">
              {todayPlan.map((task, idx) => (
                <div key={task.id} className={`${IOS.card} p-5 relative group`}>
                  {idx === 0 && <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#1C1C1E]"></div>}
                  <div className="flex gap-4">
                    <button onClick={() => actions.toggleTask(task.id)} className="mt-0.5 text-[#C7C7CC] hover:text-[#34C759] transition-colors">
                      <CheckCircle size={22} />
                    </button>
                    <div className="flex-1">
                      {idx === 0 && <span className="text-[10px] font-bold text-[#1C1C1E] bg-[#E5E5EA] px-1.5 py-0.5 rounded mb-2 inline-block">今日主线</span>}
                      <h3 className={`${IOS.type.body} font-medium ${task.completed ? 'line-through text-[#C7C7CC]':''}`}>{task.title}</h3>
                      <div className="flex gap-2 mt-2">
                        <span className="text-[10px] text-[#8E8E93] border border-[#E5E5EA] px-1.5 rounded">{task.estimateMin}min</span>
                        <span className="text-[10px] text-[#8E8E93] border border-[#E5E5EA] px-1.5 rounded">{task.priority}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              <button onClick={() => actions.navigate('tasks')} className="w-full py-4 text-[13px] text-[#8E8E93] text-center mt-4">
                手动调整计划 →
              </button>
            </div>
          ) : (
            <div className="text-center mt-20">
              <p className={IOS.type.caption}>没有符合条件的任务</p>
              <button onClick={() => actions.navigate('tasks')} className={`mt-4 ${IOS.primaryBtn} px-6 py-2 rounded-full text-[14px]`}>去任务池添加</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// B. 任务池 (含字段升级)
const TasksView = ({ tasks, actions }) => {
  const [isSheetOpen, setSheetOpen] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', priority: 'P1', energyNeed: 'Med', estimateMin: 30, goalTag: '默认' });

  const handleSubmit = () => {
    if(!newTask.title) return;
    actions.addTask({ ...newTask, id: Date.now(), completed: false, createdAt: Date.now() });
    setSheetOpen(false);
    setNewTask({ title: '', priority: 'P1', energyNeed: 'Med', estimateMin: 30, goalTag: '默认' });
  };

  return (
    <div className="h-full bg-white flex flex-col">
      <div className="px-5 pt-14 pb-2 border-b border-[#F2F2F7]">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h1 className={IOS.type.large}>任务池</h1>
            <p className={IOS.type.caption}>倒空大脑，先收集，再行动</p>
          </div>
          <button onClick={() => setSheetOpen(true)} className={`${IOS.primaryBtn} px-4 py-1.5 rounded-full text-[13px] font-semibold`}>+ 入池</button>
        </div>
        {tasks.length === 0 && (
          <div className="flex gap-2 mt-4 overflow-x-auto no-scrollbar pb-2">
            {['找一张案例做分析', '整理厨房一段', '联系一个客户'].map(t => (
              <button key={t} onClick={() => actions.addTask({title:t, priority:'P2', energyNeed:'Low', estimateMin:15})} 
                className="whitespace-nowrap px-3 py-1.5 border border-[#E5E5EA] rounded-full text-[12px] text-[#8E8E93]">
                {t}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-0 divide-y divide-[#F2F2F7]">
        {tasks.sort((a,b) => b.createdAt - a.createdAt).map(task => (
          <div key={task.id} className="py-4 flex items-start gap-3 group">
            <button onClick={() => actions.toggleTask(task.id)} className={`mt-0.5 ${task.completed ? 'text-[#34C759]' : 'text-[#C7C7CC]'}`}>
              <CheckCircle size={20} />
            </button>
            <div className="flex-1">
              <p className={`${IOS.type.body} ${task.completed ? 'text-[#C7C7CC] line-through' : ''}`}>{task.title}</p>
              <div className="flex gap-2 mt-1.5">
                <span className="text-[10px] text-[#8E8E93] bg-[#F2F2F7] px-1.5 rounded">{task.priority}</span>
                <span className="text-[10px] text-[#8E8E93] bg-[#F2F2F7] px-1.5 rounded">{task.energyNeed}</span>
                <span className="text-[10px] text-[#8E8E93] bg-[#F2F2F7] px-1.5 rounded">{task.estimateMin}m</span>
              </div>
            </div>
            <button onClick={() => actions.deleteTask(task.id)} className="text-[#E5E5EA] active:text-[#FF3B30]"><Trash2 size={16}/></button>
          </div>
        ))}
      </div>

      {/* 新增任务弹窗 */}
      <Sheet isOpen={isSheetOpen} onClose={() => setSheetOpen(false)} title="新任务">
        <div className="space-y-6">
          <div>
            <label className={IOS.type.caption}>任务内容</label>
            <input autoFocus value={newTask.title} onChange={e => setNewTask({...newTask, title: e.target.value})} className={`${IOS.input} mt-2`} placeholder="想做什么？" />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={IOS.type.caption}>优先级 (P0最高)</label>
              <div className="flex gap-1 mt-2">
                {['P0', 'P1', 'P2'].map(p => (
                  <button key={p} onClick={() => setNewTask({...newTask, priority: p})} 
                    className={`flex-1 py-2 rounded-lg text-[13px] font-medium transition-colors ${newTask.priority===p ? 'bg-[#1C1C1E] text-white' : 'bg-white border'}`}>{p}</button>
                ))}
              </div>
            </div>
            <div>
              <label className={IOS.type.caption}>耗能</label>
              <div className="flex gap-1 mt-2">
                {['Low', 'Med', 'High'].map(e => (
                  <button key={e} onClick={() => setNewTask({...newTask, energyNeed: e})} 
                    className={`flex-1 py-2 rounded-lg text-[13px] font-medium transition-colors ${newTask.energyNeed===e ? 'bg-[#1C1C1E] text-white' : 'bg-white border'}`}>{e}</button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className={IOS.type.caption}>预估时间 (分钟)</label>
            <input type="number" value={newTask.estimateMin} onChange={e => setNewTask({...newTask, estimateMin: parseInt(e.target.value)})} className={`${IOS.input} mt-2`} />
          </div>

          <button onClick={handleSubmit} className={`w-full h-[48px] rounded-[12px] ${IOS.primaryBtn} text-[15px] font-semibold mt-4`}>放入任务池</button>
        </div>
      </Sheet>
    </div>
  );
};

// C. 设计 (含完整子路由与筛选)
const DesignView = ({ actions, cases, terms, quotes }) => {
  const [view, setView] = useState('main'); // main, terms, quotes
  const [filter, setFilter] = useState('全部');
  const [draft, setDraft] = useState(null); // for sheets

  const STYLE_TAGS = ['全部', '静谧', '松弛', '温暖', '清冷', '自然', '克制'];

  // 子页面：术语库
  if (view === 'terms') {
    const filteredTerms = filter === '全部' ? terms : terms.filter(t => t.tags?.includes(filter));
    return (
      <div className="h-full bg-white flex flex-col animate-slide-left">
        <NavBar title="术语库" onBack={() => setView('main')} rightAction={<button onClick={() => setDraft({type: 'term'})}><Plus/></button>} />
        <div className="p-4 overflow-y-auto flex-1">
          <input className={`${IOS.input} mb-4`} placeholder="搜索术语..." onChange={(e) => console.log('Search TODO')} />
          <div className="space-y-3">
            {filteredTerms.map(t => (
              <div key={t.id} className="bg-[#F2F2F7] p-4 rounded-[12px]">
                <div className="flex justify-between">
                  <span className="font-bold text-[#1C1C1E]">{t.term}</span>
                  <button onClick={() => actions.deleteTerm(t.id)} className="text-[#C7C7CC]"><X size={14}/></button>
                </div>
                <p className="text-[14px] text-[#3A3A3C] mt-1 leading-relaxed">{t.def}</p>
              </div>
            ))}
          </div>
        </div>
        <Sheet isOpen={draft?.type==='term'} onClose={() => setDraft(null)} title="新术语">
           <div className="space-y-4">
             <input id="t-name" className={IOS.input} placeholder="术语名称"/>
             <textarea id="t-def" className={`${IOS.input} h-32`} placeholder="解释与理解"/>
             <button className={`w-full h-[48px] rounded-[12px] ${IOS.primaryBtn}`} onClick={() => {
               actions.addTerm({id:Date.now(), term: document.getElementById('t-name').value, def: document.getElementById('t-def').value});
               setDraft(null);
             }}>保存</button>
           </div>
        </Sheet>
      </div>
    );
  }

  // 子页面：金句库
  if (view === 'quotes') {
    return (
      <div className="h-full bg-white flex flex-col animate-slide-left">
        <NavBar title="金句库" onBack={() => setView('main')} rightAction={<button onClick={() => setDraft({type: 'quote'})}><Plus/></button>} />
        <div className="p-4 overflow-y-auto flex-1 space-y-4">
          {quotes.map(q => (
            <div key={q.id} className="border border-[#F2F2F7] p-5 rounded-[16px] shadow-sm relative group">
              <div className="text-[16px] font-serif italic text-[#1C1C1E] leading-relaxed">“{q.content}”</div>
              {q.source && <div className="text-right text-[12px] text-[#8E8E93] mt-2">— {q.source}</div>}
              <button onClick={() => actions.deleteQuote(q.id)} className="absolute top-3 right-3 text-[#E5E5EA]"><X size={14}/></button>
            </div>
          ))}
        </div>
        <Sheet isOpen={draft?.type==='quote'} onClose={() => setDraft(null)} title="新金句">
           <div className="space-y-4">
             <textarea id="q-con" className={`${IOS.input} h-32`} placeholder="金句内容..."/>
             <input id="q-src" className={IOS.input} placeholder="来源"/>
             <button className={`w-full h-[48px] rounded-[12px] ${IOS.primaryBtn}`} onClick={() => {
               actions.addQuote({id:Date.now(), content: document.getElementById('q-con').value, source: document.getElementById('q-src').value});
               setDraft(null);
             }}>保存</button>
           </div>
        </Sheet>
      </div>
    );
  }

  // 设计主页
  const filteredCases = filter === '全部' ? cases : cases.filter(c => c.styleTags?.includes(filter));

  return (
    <div className="h-full bg-white flex flex-col">
      <div className="px-5 pt-14 pb-2">
        <div className="flex justify-between items-center mb-6">
          <h1 className={IOS.type.large}>设计训练营</h1>
          <div className="flex gap-2">
            <button onClick={() => setView('terms')} className="bg-[#F2F2F7] px-3 py-1.5 rounded-lg text-[12px] font-medium text-[#1C1C1E]">术语库</button>
            <button onClick={() => setView('quotes')} className="bg-[#F2F2F7] px-3 py-1.5 rounded-lg text-[12px] font-medium text-[#1C1C1E]">金句库</button>
            <button onClick={() => setDraft({type:'case'})} className="bg-[#1C1C1E] text-white px-3 py-1.5 rounded-lg text-[12px] font-medium flex items-center gap-1">
              <Plus size={12}/> 新建
            </button>
          </div>
        </div>
        
        {/* 风格筛选 (可点击) */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-4">
          {STYLE_TAGS.map(tag => (
            <Chip key={tag} label={tag} active={filter === tag} onClick={() => setFilter(tag)} />
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-32 space-y-6">
        {/* 引导卡片 */}
        <div className={`${IOS.card} p-6`}>
          <div className="flex items-center gap-2 mb-4">
            <PenTool size={18} className="text-[#007AFF]"/>
            <h3 className={IOS.type.headline}>今天只做这一件事</h3>
          </div>
          <div className="space-y-2 mb-6">
            <p className={IOS.type.body}>上传案例 → 选氛围 → 写感受 → 拆解 → 金句</p>
          </div>
          <button onClick={() => setDraft({type:'case'})} className={`w-full h-[44px] rounded-[12px] ${IOS.primaryBtn} text-[14px] font-medium`}>开始今日训练</button>
        </div>

        {/* 案例列表 */}
        <div className="space-y-4">
          {filteredCases.map(c => (
            <div key={c.id} className="flex gap-4 p-3 bg-white rounded-xl border border-[#F2F2F7] shadow-sm">
              <div className="w-20 h-20 bg-[#F2F2F7] rounded-lg flex items-center justify-center text-[#C7C7CC] shrink-0">
                <ImageIcon size={24}/>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex gap-2 mb-1">
                  {(c.styleTags || []).map(t => <span key={t} className="text-[10px] bg-[#F2F2F7] px-1.5 rounded text-[#8E8E93]">{t}</span>)}
                </div>
                <p className="text-[13px] text-[#3A3A3C] line-clamp-2 leading-relaxed">{c.analysis || c.feelings}</p>
                {c.quote && <p className="text-[12px] text-[#1C1C1E] font-serif italic mt-2 truncate">"{c.quote}"</p>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 训练 Sheet (简化版) */}
      <Sheet isOpen={draft?.type==='case'} onClose={() => setDraft(null)} title="今日训练">
         <div className="space-y-6">
           <div className="w-full aspect-video bg-[#F2F2F7] rounded-[12px] flex items-center justify-center text-[#8E8E93]">
             <span>点击上传 (模拟)</span>
           </div>
           <div>
             <label className={IOS.type.caption}>主氛围 (可多选)</label>
             <div className="flex flex-wrap gap-2 mt-2">
               {STYLE_TAGS.slice(1).map(t => (
                 <button key={t} className="px-3 py-1.5 border rounded-full text-[12px]"> {t} </button>
               ))}
             </div>
           </div>
           <textarea className={`${IOS.input} h-32`} placeholder="分析与拆解..."/>
           <button className={`w-full h-[48px] rounded-[12px] ${IOS.primaryBtn}`} onClick={() => {
             actions.addCase({id:Date.now(), styleTags:['静谧'], analysis:'模拟数据...'});
             setDraft(null);
           }}>完成并保存</button>
         </div>
      </Sheet>
    </div>
  );
};

// D. 情绪 (含安全锚与筛选)
const EmotionView = ({ actions, anchors, emotions }) => {
  const [view, setView] = useState('main');
  const [val, setVal] = useState(5);
  const [selectedFeelings, setSelectedFeelings] = useState([]);
  const [filterMood, setFilterMood] = useState([]); // 筛选用

  const FEELINGS = ['焦虑', '平静', '难过', '愤怒', '兴奋', '空虚', '麻木', '感激'];

  const toggleFeeling = (f) => {
    if (selectedFeelings.includes(f)) setSelectedFeelings(selectedFeelings.filter(i => i !== f));
    else setSelectedFeelings([...selectedFeelings, f]);
  };

  const toggleFilter = (f) => {
    if (filterMood.includes(f)) setFilterMood(filterMood.filter(i => i !== f));
    else setFilterMood([...filterMood, f]);
  };

  const filteredEmotions = filterMood.length === 0 
    ? emotions 
    : emotions.filter(e => e.tags?.some(t => filterMood.includes(t)));

  // 安全锚子页面
  if (view === 'anchors') {
    return (
      <div className="h-full bg-white flex flex-col animate-slide-left">
        <NavBar title="安全锚" onBack={() => setView('main')} rightAction={<button onClick={() => actions.addAnchor({id:Date.now(), title:'新锚点', content:'呼吸...'})}><Plus/></button>} />
        <div className="p-5 space-y-4 overflow-y-auto">
          {anchors.map(a => (
            <div key={a.id} className={`${IOS.card} p-5 bg-[#FFFCF0] border-[#F0EAD6]`}>
              <h3 className="font-bold text-[#1C1C1E] mb-2">{a.title}</h3>
              <p className="text-[15px] text-[#3A3A3C] whitespace-pre-wrap leading-relaxed">{a.content}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-white flex flex-col px-5 pt-14 pb-32 overflow-y-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className={IOS.type.large}>情绪与边界</h1>
        <button onClick={() => setView('anchors')} className="bg-[#F2F2F7] text-[#8E8E93] px-3 py-1.5 rounded-lg text-[12px] font-medium flex items-center gap-1">
          <Anchor size={14}/> 安全锚
        </button>
      </div>

      {/* 记录卡片 */}
      <div className={`${IOS.card} p-6 border border-[#F2F2F7] shadow-md mb-10`}>
        <div className="mb-8">
          <div className="flex justify-between mb-4">
            <span className={IOS.type.caption}>情绪温度</span>
            <span className="text-[15px] font-mono">{val}/10</span>
          </div>
          <input type="range" min="0" max="10" value={val} onChange={e => setVal(e.target.value)} className="w-full h-1.5 bg-[#F2F2F7] rounded-full appearance-none accent-[#1C1C1E]"/>
        </div>
        
        <div className="mb-8">
          <span className={`${IOS.type.caption} block mb-3`}>此刻感受 (多选)</span>
          <div className="flex flex-wrap gap-2">
            {FEELINGS.map(f => (
              <button key={f} onClick={() => toggleFeeling(f)} 
                className={`px-3 py-1.5 rounded-[8px] text-[13px] border transition-colors ${selectedFeelings.includes(f) ? 'bg-[#1C1C1E] text-white border-[#1C1C1E]' : 'bg-white border-[#E5E5EA] text-[#3A3A3C]'}`}>
                {f}
              </button>
            ))}
          </div>
        </div>

        <button className={`w-full h-[44px] rounded-[12px] ${IOS.primaryBtn} text-[14px] font-semibold`} onClick={() => {
          actions.addEmotion({id:Date.now(), val, tags: selectedFeelings, date: new Date().toLocaleDateString()});
          alert('已记录'); setSelectedFeelings([]);
        }}>保存记录</button>
      </div>

      {/* 历史记录筛选与列表 */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className={IOS.type.caption}>历史记录</h3>
          <div className="flex gap-2 overflow-x-auto max-w-[200px] no-scrollbar">
            {FEELINGS.slice(0,4).map(f => (
              <button key={f} onClick={() => toggleFilter(f)} className={`text-[10px] px-2 py-1 rounded border ${filterMood.includes(f) ? 'bg-black text-white' : 'border-[#E5E5EA]'}`}>{f}</button>
            ))}
          </div>
        </div>
        {filteredEmotions.map(e => (
          <div key={e.id} className="flex justify-between items-center p-4 bg-[#F2F2F7] rounded-[12px]">
            <div className="flex gap-2">
              <span className="font-mono font-bold text-[#1C1C1E] w-8">{e.val}</span>
              <div className="flex gap-1">{e.tags?.map(t => <span key={t} className="text-[12px] text-[#8E8E93] bg-white px-1 rounded">{t}</span>)}</div>
            </div>
            <span className="text-[11px] text-[#C7C7CC]">{e.date}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// --- 6. 主程序入口 ---
export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [showSettings, setShowSettings] = useState(false);

  // 数据源
  const [tasks, setTasks] = useStickyState([], 'gc_tasks');
  const [cases, setCases] = useStickyState([], 'gc_cases');
  const [terms, setTerms] = useStickyState([], 'gc_terms');
  const [quotes, setQuotes] = useStickyState([], 'gc_quotes');
  const [anchors, setAnchors] = useStickyState([{id:1, title:'4-7-8呼吸', content:'吸气4秒，憋气7秒，呼气8秒'}], 'gc_anchors');
  const [emotions, setEmotions] = useStickyState([], 'gc_emotions');
  const [todayPlan, setTodayPlan] = useStickyState([], 'gc_today_plan');

  // 动作集合
  const actions = {
    navigate: setActiveTab,
    addTask: (t) => setTasks([t, ...tasks]),
    toggleTask: (id) => setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t)),
    deleteTask: (id) => setTasks(tasks.filter(t => t.id !== id)),
    addCase: (c) => setCases([c, ...cases]),
    addTerm: (t) => setTerms([t, ...terms]),
    deleteTerm: (id) => setTerms(terms.filter(t => t.id !== id)),
    addQuote: (q) => setQuotes([q, ...quotes]),
    deleteQuote: (id) => setQuotes(quotes.filter(t => t.id !== id)),
    addAnchor: (a) => setAnchors([a, ...anchors]),
    addEmotion: (e) => setEmotions([e, ...emotions]),
    importAll: (d) => { /* 简化版导入逻辑 */ Object.keys(d).forEach(k => window.localStorage.setItem(k, JSON.stringify(d[k]))); window.location.reload(); }
  };

  const allData = { gc_tasks: tasks, gc_cases: cases, gc_terms: terms, gc_quotes: quotes, gc_anchors: anchors, gc_emotions: emotions };

  return (
    <div className={`min-h-screen ${IOS.bg} font-sans selection:bg-[#E5E5EA] text-[#1C1C1E]`}>
      <main className="max-w-md mx-auto min-h-screen relative bg-white shadow-2xl overflow-hidden flex flex-col">
        
        {/* 设置按钮 */}
        {activeTab === 'home' && (
          <button onClick={() => setShowSettings(true)} className="absolute top-6 right-6 z-30 text-[#C7C7CC] hover:text-[#1C1C1E]">
            <Settings size={24} strokeWidth={1.5} />
          </button>
        )}

        <div className="flex-1 overflow-hidden relative">
          {activeTab === 'home' && <HomeView tasks={tasks} actions={actions} todayPlan={todayPlan} setTodayPlan={setTodayPlan} />}
          {activeTab === 'tasks' && <TasksView tasks={tasks} actions={actions} />}
          {activeTab === 'design' && <DesignView cases={cases} terms={terms} quotes={quotes} actions={actions} />}
          {activeTab === 'emotion' && <EmotionView actions={actions} anchors={anchors} emotions={emotions} />}
        </div>

        <nav className="h-[88px] bg-white/90 backdrop-blur-xl border-t border-[#C6C6C8]/30 flex justify-around items-start pt-3 z-40 pb-safe absolute bottom-0 w-full">
          <TabItem icon={Wind} label="今日" active={activeTab === 'home'} onClick={() => setActiveTab('home')} />
          <TabItem icon={Layers} label="任务池" active={activeTab === 'tasks'} onClick={() => setActiveTab('tasks')} />
          <TabItem icon={PenTool} label="设计" active={activeTab === 'design'} onClick={() => setActiveTab('design')} />
          <TabItem icon={Heart} label="情绪" active={activeTab === 'emotion'} onClick={() => setActiveTab('emotion')} />
        </nav>

        {/* 设置弹窗 (简化版) */}
        <Sheet isOpen={showSettings} onClose={() => setShowSettings(false)} title="数据管理">
           <div className="space-y-4 pt-4">
             <button className={`${IOS.secondaryBtn} w-full py-4 rounded-[12px]`} onClick={() => {
               const blob = new Blob([JSON.stringify(allData)], {type: "application/json"});
               const url = URL.createObjectURL(blob);
               const a = document.createElement('a'); a.href = url; a.download = `backup.json`; a.click();
             }}>导出数据备份</button>
             <div className="relative">
                <button className={`${IOS.secondaryBtn} w-full py-4 rounded-[12px]`}>导入数据覆盖</button>
                <input type="file" className="absolute inset-0 opacity-0" onChange={(e) => {
                  const fr = new FileReader(); fr.onload = (ev) => actions.importAll(JSON.parse(ev.target.result)); fr.readAsText(e.target.files[0]);
                }}/>
             </div>
           </div>
        </Sheet>
      </main>
    </div>
  );
}

const TabItem = ({ icon: Icon, label, active, onClick }) => (
  <button onClick={onClick} className={`w-16 flex flex-col items-center gap-1.5 transition-colors duration-200 ${active ? 'text-[#1C1C1E]' : 'text-[#AEAEB2]'}`}>
    <Icon size={26} strokeWidth={active ? 2.3 : 1.8} />
    <span className="text-[10px] font-medium tracking-wide">{label}</span>
  </button>
);
