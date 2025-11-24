import React, { useState, useEffect, useRef } from 'react';
import { 
  Tent, CheckSquare, BookOpen, User, Settings, 
  Plus, ChevronRight, ChevronLeft, Image as ImageIcon, 
  Palette, Box, Layout, Save, Share, Download, Upload,
  Smile, Frown, Meh, Search, Hash, X, Trash2, Quote
} from 'lucide-react';

// --- 1. 数据持久化 Hook (LocalStorage) ---
const useStickyState = (defaultValue, key) => {
  const [value, setValue] = useState(() => {
    try {
      const stickyValue = window.localStorage.getItem(key);
      return stickyValue !== null ? JSON.parse(stickyValue) : defaultValue;
    } catch (error) {
      console.error('Storage Error:', error);
      return defaultValue;
    }
  });
  useEffect(() => {
    window.localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);
  return [value, setValue];
};

// --- 2. 样式系统 (静谧/自然/克制) ---
const STYLES = {
  bg: 'bg-[#FDFCF8]', // 暖白纸张色
  card: 'bg-white shadow-sm border border-stone-100 rounded-2xl',
  text: 'text-stone-800',
  subText: 'text-stone-400',
  accent: 'bg-stone-800 text-white', // 克制的黑色主色
  accentLight: 'bg-stone-100 text-stone-600',
  input: 'w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-stone-700 focus:outline-none focus:border-stone-400 transition-colors placeholder:text-stone-300',
  btnPrimary: 'w-full bg-stone-800 text-white font-medium py-3 rounded-xl active:scale-95 transition-transform flex items-center justify-center gap-2',
  btnSecondary: 'w-full bg-stone-100 text-stone-600 font-medium py-3 rounded-xl active:scale-95 transition-transform',
  tag: (active) => `px-3 py-1 rounded-full text-xs font-medium transition-colors ${active ? 'bg-stone-800 text-white' : 'bg-stone-100 text-stone-500'}`,
};

// --- 3. 辅助组件 ---
const Chip = ({ label, active, onClick }) => (
  <button onClick={onClick} className={STYLES.tag(active)}>
    {label}
  </button>
);

const SectionTitle = ({ title, sub }) => (
  <div className="mb-6">
    <h2 className="text-2xl font-bold tracking-tight text-stone-800">{title}</h2>
    {sub && <p className="text-sm text-stone-400 mt-1 font-light">{sub}</p>}
  </div>
);

const EmptyState = ({ text }) => (
  <div className="py-12 text-center">
    <div className="w-16 h-16 bg-stone-50 rounded-full flex items-center justify-center mx-auto mb-3">
      <Box className="text-stone-300" />
    </div>
    <p className="text-stone-400 text-sm">{text}</p>
  </div>
);

// --- 4. 核心页面组件 ---

// 首页：设计训练营
const HomeView = ({ data, actions }) => {
  const [step, setStep] = useState(0); // 0=未开始, 1-5=训练中
  const [draft, setDraft] = useState({
    img: null, atmosphere: '', keywords: '', color: '', material: '', composition: '', quote: ''
  });

  const ATMOSPHERES = ['静谧', '松弛', '温暖', '清冷', '自然', '克制', '前卫'];

  const finishTraining = () => {
    // 1. 保存到案例库
    const newCase = {
      id: Date.now(),
      ...draft,
      date: new Date().toLocaleDateString(),
      tags: [draft.atmosphere]
    };
    actions.addCase(newCase);

    // 2. 如果有金句，保存到金句库
    if (draft.quote) {
      actions.addQuote({
        id: Date.now() + 1,
        content: draft.quote,
        source: '今日训练',
        tags: [draft.atmosphere]
      });
    }

    // 3. 完成
    setStep(0);
    setDraft({ img: null, atmosphere: '', keywords: '', color: '', material: '', composition: '', quote: '' });
    alert('🎉 训练完成！已沉淀到素材库。');
  };

  if (step === 0) {
    return (
      <div className="space-y-6 animate-fade-in">
        <SectionTitle title="设计训练营" sub="积累你的设计直觉" />
        
        {/* 顶部入口 */}
        <div className="grid grid-cols-2 gap-4">
          <button onClick={() => actions.navigate('terms')} className={`${STYLES.card} p-4 flex flex-col items-center justify-center gap-2 hover:border-stone-300 transition-colors`}>
            <BookOpen className="text-stone-400" />
            <span className="text-sm font-medium">术语库</span>
          </button>
          <button onClick={() => actions.navigate('quotes')} className={`${STYLES.card} p-4 flex flex-col items-center justify-center gap-2 hover:border-stone-300 transition-colors`}>
            <Quote className="text-stone-400" />
            <span className="text-sm font-medium">金句库</span>
          </button>
        </div>

        {/* 核心卡片 */}
        <div className="bg-stone-900 rounded-2xl p-6 text-white shadow-xl shadow-stone-900/10">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-xl font-bold mb-1">今天只做这一件事</h3>
              <p className="text-stone-400 text-xs">每日 15 分钟刻意练习</p>
            </div>
            <Tent className="text-stone-500" />
          </div>
          
          <ul className="space-y-3 text-sm text-stone-300 mb-8 font-light">
            <li className="flex gap-2"><div className="w-5 h-5 rounded-full bg-stone-800 flex items-center justify-center text-xs">1</div> 选一张喜欢的案例图</li>
            <li className="flex gap-2"><div className="w-5 h-5 rounded-full bg-stone-800 flex items-center justify-center text-xs">2</div> 提取主氛围与感受词</li>
            <li className="flex gap-2"><div className="w-5 h-5 rounded-full bg-stone-800 flex items-center justify-center text-xs">3</div> 拆解色彩/材质/构图</li>
            <li className="flex gap-2"><div className="w-5 h-5 rounded-full bg-stone-800 flex items-center justify-center text-xs">4</div> 提炼一句设计金句</li>
          </ul>

          <button onClick={() => setStep(1)} className="w-full bg-white text-stone-900 font-bold py-3 rounded-xl active:scale-95 transition-transform">
            开始今日训练
          </button>
        </div>
      </div>
    );
  }

  // 训练流程 Step 1-5
  return (
    <div className="min-h-[80vh] flex flex-col justify-between animate-slide-up">
      <div>
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => setStep(step - 1)} className="p-2 -ml-2 text-stone-400"><ChevronLeft /></button>
          <span className="text-sm font-bold text-stone-400">Step {step} / 5</span>
          <div className="w-8" />
        </div>

        {step === 1 && (
          <div className="space-y-4">
            <h3 className="text-xl font-bold">1. 选择案例</h3>
            <p className="text-stone-500 text-sm">上传一张今天打动你的图片</p>
            <div className="aspect-square bg-stone-100 rounded-2xl border-2 border-dashed border-stone-200 flex flex-col items-center justify-center text-stone-400 relative overflow-hidden">
              {draft.img ? (
                <div className="w-full h-full bg-stone-200 flex items-center justify-center text-stone-500">
                   {/* 这里简化处理，实际可以使用 FileReader */}
                   已选择图片 (模拟)
                </div>
              ) : (
                <>
                  <ImageIcon size={32} className="mb-2" />
                  <span className="text-xs">点击上传 (模拟)</span>
                </>
              )}
              <input type="button" onClick={() => setDraft({...draft, img: true})} className="absolute inset-0 opacity-0 cursor-pointer" />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <h3 className="text-xl font-bold">2. 定义氛围</h3>
            <div>
              <label className="text-xs font-bold text-stone-400 uppercase mb-3 block">主氛围</label>
              <div className="flex flex-wrap gap-2">
                {ATMOSPHERES.map(attr => (
                  <Chip key={attr} label={attr} active={draft.atmosphere === attr} onClick={() => setDraft({...draft, atmosphere: attr})} />
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-stone-400 uppercase mb-3 block">感受词 (3-5个)</label>
              <input 
                type="text" 
                placeholder="例如：静谧、透气、粗糙..."
                className={STYLES.input}
                value={draft.keywords}
                onChange={e => setDraft({...draft, keywords: e.target.value})}
              />
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h3 className="text-xl font-bold">3. 维度拆解</h3>
            <div className="space-y-3">
              <div className="relative">
                <Palette size={16} className="absolute left-4 top-4 text-stone-400" />
                <input className={`${STYLES.input} pl-10`} placeholder="色彩分析..." value={draft.color} onChange={e => setDraft({...draft, color: e.target.value})} />
              </div>
              <div className="relative">
                <Box size={16} className="absolute left-4 top-4 text-stone-400" />
                <input className={`${STYLES.input} pl-10`} placeholder="材质/肌理..." value={draft.material} onChange={e => setDraft({...draft, material: e.target.value})} />
              </div>
              <div className="relative">
                <Layout size={16} className="absolute left-4 top-4 text-stone-400" />
                <input className={`${STYLES.input} pl-10`} placeholder="构图/布局..." value={draft.composition} onChange={e => setDraft({...draft, composition: e.target.value})} />
              </div>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <h3 className="text-xl font-bold">4. 提炼金句</h3>
            <p className="text-stone-500 text-sm">一句话总结这次的设计洞察</p>
            <textarea 
              className={`${STYLES.input} h-32 resize-none pt-4`} 
              placeholder="例如：'留白不是空洞，而是呼吸的空间。'"
              value={draft.quote}
              onChange={e => setDraft({...draft, quote: e.target.value})}
            />
          </div>
        )}
        
        {step === 5 && (
           <div className="text-center py-10 space-y-4">
             <div className="w-20 h-20 bg-stone-900 rounded-full flex items-center justify-center text-white mx-auto mb-4">
               <CheckSquare size={32} />
             </div>
             <h3 className="text-2xl font-bold">Ready?</h3>
             <p className="text-stone-500">此次训练将被归档到案例库</p>
           </div>
        )}
      </div>

      <button onClick={() => step < 5 ? setStep(step + 1) : finishTraining()} className={STYLES.btnPrimary}>
        {step < 5 ? <>下一步 <ChevronRight size={16} /></> : '完成训练'}
      </button>
    </div>
  );
};

// 任务池页面
const TasksView = ({ tasks, actions }) => {
  const [filter, setFilter] = useState('全部');
  const [isAdding, setIsAdding] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', tag: '默认', priority: '普通' });

  const TAGS = ['全部', '静谧', '自然', '学习', '复盘'];

  const handleAdd = () => {
    if(!newTask.title) return;
    actions.addTask({ ...newTask, id: Date.now(), status: 'todo' });
    setIsAdding(false);
    setNewTask({ title: '', tag: '默认', priority: '普通' });
  };

  const filteredTasks = filter === '全部' ? tasks : tasks.filter(t => t.tag === filter);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-end">
        <SectionTitle title="任务池" sub="待办与计划" />
        <button onClick={() => setIsAdding(!isAdding)} className="p-2 bg-stone-900 text-white rounded-full mb-6 shadow-lg">
          <Plus size={20} />
        </button>
      </div>

      {isAdding && (
        <div className={`${STYLES.card} p-4 mb-6 space-y-3 animate-slide-down border-stone-300`}>
          <input className={STYLES.input} placeholder="任务标题..." autoFocus value={newTask.title} onChange={e => setNewTask({...newTask, title: e.target.value})} />
          <div className="flex gap-2 overflow-x-auto pb-2">
            {['静谧', '自然', '学习', '复盘'].map(t => (
              <Chip key={t} label={t} active={newTask.tag === t} onClick={() => setNewTask({...newTask, tag: t})} />
            ))}
          </div>
          <button onClick={handleAdd} className={STYLES.btnPrimary}>添加任务</button>
        </div>
      )}

      <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
        {TAGS.map(t => <Chip key={t} label={t} active={filter === t} onClick={() => setFilter(t)} />)}
      </div>

      <div className="space-y-3">
        {filteredTasks.length === 0 ? <EmptyState text="暂无任务" /> : filteredTasks.map(task => (
          <div key={task.id} className={`${STYLES.card} p-4 flex items-center justify-between group`}>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => actions.toggleTask(task.id)}
                className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${task.status === 'done' ? 'bg-stone-400 border-stone-400' : 'border-stone-300'}`}
              >
                {task.status === 'done' && <CheckSquare size={12} className="text-white" />}
              </button>
              <div>
                <p className={`font-medium ${task.status === 'done' ? 'text-stone-400 line-through' : 'text-stone-800'}`}>{task.title}</p>
                <span className="text-xs text-stone-400 bg-stone-100 px-1.5 py-0.5 rounded">{task.tag}</span>
              </div>
            </div>
            <button onClick={() => actions.deleteTask(task.id)} className="text-stone-300 hover:text-red-400"><Trash2 size={16}/></button>
          </div>
        ))}
      </div>
    </div>
  );
};

// 案例库页面
const CasesView = ({ cases }) => {
  return (
    <div className="space-y-6 animate-fade-in">
      <SectionTitle title="设计案例" sub="你的审美资产" />
      <div className="space-y-4">
        {cases.length === 0 ? <EmptyState text="完成今日训练以积累案例" /> : cases.map(c => (
          <div key={c.id} className={`${STYLES.card} overflow-hidden`}>
            <div className="h-32 bg-stone-200 flex items-center justify-center text-stone-400">
               {/* 占位图 */}
               <ImageIcon />
            </div>
            <div className="p-4">
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-bold bg-stone-100 text-stone-600 px-2 py-1 rounded uppercase">{c.atmosphere}</span>
                <span className="text-xs text-stone-300">{c.date}</span>
              </div>
              <p className="text-stone-500 text-sm mb-3">"{c.keywords}"</p>
              {c.quote && (
                <div className="bg-stone-50 p-3 rounded-lg text-xs text-stone-600 italic border-l-2 border-stone-300">
                  {c.quote}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// 设置/我的 页面
const MineView = ({ data, actions }) => {
  const [mood, setMood] = useState(null);

  const exportData = () => {
    const dataStr = JSON.stringify(data, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `growth_console_backup_${new Date().toLocaleDateString()}.json`;
    link.click();
  };

  const importData = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target.result);
        actions.importAll(imported);
        alert('导入成功！');
      } catch (err) {
        alert('文件格式错误');
      }
    };
    reader.readAsText(file);
  };

  const addMood = (type) => {
    actions.addEmotion({ id: Date.now(), type, date: new Date().toLocaleString() });
    setMood(type);
    setTimeout(() => setMood(null), 2000);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <SectionTitle title="我的" sub="数据与状态" />

      {/* 情绪记录 */}
      <div className={STYLES.card + " p-6 text-center"}>
        <h3 className="text-sm font-bold text-stone-400 uppercase mb-4">此刻状态</h3>
        <div className="flex justify-center gap-8">
          {[
            { icon: Smile, label: '开心', color: 'text-amber-500' },
            { icon: Meh, label: '平淡', color: 'text-stone-400' },
            { icon: Frown, label: '压力', color: 'text-rose-400' },
          ].map(m => (
            <button key={m.label} onClick={() => addMood(m.label)} className="flex flex-col items-center gap-2 transition-transform hover:scale-110">
              <m.icon size={32} className={m.color} />
              <span className="text-xs text-stone-500">{m.label}</span>
            </button>
          ))}
        </div>
        {mood && <p className="text-xs text-stone-400 mt-4 animate-bounce">已记录: {mood}</p>}
      </div>

      {/* 数据管理 */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-stone-400 uppercase pl-1">数据管理</h3>
        <button onClick={exportData} className={STYLES.btnSecondary}>
          <Download size={18} /> 导出全部数据 (JSON)
        </button>
        <div className="relative">
          <button className={STYLES.btnSecondary}>
            <Upload size={18} /> 导入数据 (覆盖)
          </button>
          <input type="file" onChange={importData} className="absolute inset-0 opacity-0 cursor-pointer" />
        </div>
        <p className="text-xs text-stone-300 text-center px-4">
          数据存储在本地浏览器中。清除缓存会丢失数据，请定期导出备份。
        </p>
      </div>

      <div className="pt-8 text-center">
         <div className="inline-block px-3 py-1 bg-stone-100 rounded-full text-xs text-stone-400">
           Growth Console v1.0
         </div>
      </div>
    </div>
  );
};

// --- 5. 主程序 ---
export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  
  // 数据池
  const [tasks, setTasks] = useStickyState([], 'gc_tasks');
  const [cases, setCases] = useStickyState([], 'gc_cases');
  const [terms, setTerms] = useStickyState([], 'gc_terms');
  const [quotes, setQuotes] = useStickyState([], 'gc_quotes');
  const [emotions, setEmotions] = useStickyState([], 'gc_emotions');

  // 全局动作
  const actions = {
    navigate: setActiveTab,
    addTask: (t) => setTasks([t, ...tasks]),
    toggleTask: (id) => setTasks(tasks.map(t => t.id === id ? { ...t, status: t.status === 'done' ? 'todo' : 'done' } : t)),
    deleteTask: (id) => setTasks(tasks.filter(t => t.id !== id)),
    addCase: (c) => setCases([c, ...cases]),
    addQuote: (q) => setQuotes([q, ...quotes]),
    addEmotion: (e) => setEmotions([e, ...emotions]),
    importAll: (data) => {
      if(data.tasks) setTasks(data.tasks);
      if(data.cases) setCases(data.cases);
      if(data.terms) setTerms(data.terms);
      if(data.quotes) setQuotes(data.quotes);
      if(data.emotions) setEmotions(data.emotions);
    }
  };

  const allData = { tasks, cases, terms, quotes, emotions };

  return (
    <div className={`min-h-screen ${STYLES.bg} ${STYLES.text} font-sans selection:bg-stone-200 pb-24`}>
      <main className="max-w-md mx-auto min-h-screen relative p-6">
        
        {activeTab === 'home' && <HomeView data={allData} actions={actions} />}
        {activeTab === 'tasks' && <TasksView tasks={tasks} actions={actions} />}
        {activeTab === 'cases' && <CasesView cases={cases} />}
        {activeTab === 'mine' && <MineView data={allData} actions={actions} />}
        
        {/* 术语库和金句库作为简单的子页面展示（略，为保持代码简洁，这里用 Tab 切换演示） */}
        {activeTab === 'terms' && (
             <div className="animate-fade-in">
                 <button onClick={() => setActiveTab('home')} className="mb-4 text-stone-400 flex items-center gap-1"><ChevronLeft size={16}/> 返回</button>
                 <SectionTitle title="术语库" sub="专业词汇积累" />
                 <EmptyState text="待开发：这里将展示术语列表" />
             </div>
        )}
        {activeTab === 'quotes' && (
             <div className="animate-fade-in">
                 <button onClick={() => setActiveTab('home')} className="mb-4 text-stone-400 flex items-center gap-1"><ChevronLeft size={16}/> 返回</button>
                 <SectionTitle title="金句库" sub="设计哲思" />
                 <div className="space-y-4">
                    {quotes.map(q => (
                        <div key={q.id} className={`${STYLES.card} p-4 italic text-stone-600`}>"{q.content}"</div>
                    ))}
                    {quotes.length === 0 && <EmptyState text="完成训练以收集金句" />}
                 </div>
             </div>
        )}

      </main>

      {/* 底部导航栏 (Mobile Tab Bar) */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-stone-200 pb-safe">
        <div className="max-w-md mx-auto flex justify-around items-center h-16 px-2">
          <NavBtn icon={Tent} label="训练营" active={activeTab === 'home'} onClick={() => setActiveTab('home')} />
          <NavBtn icon={CheckSquare} label="任务" active={activeTab === 'tasks'} onClick={() => setActiveTab('tasks')} />
          <NavBtn icon={BookOpen} label="案例" active={activeTab === 'cases'} onClick={() => setActiveTab('cases')} />
          <NavBtn icon={Settings} label="我的" active={activeTab === 'mine'} onClick={() => setActiveTab('mine')} />
        </div>
      </nav>
    </div>
  );
}

const NavBtn = ({ icon: Icon, label, active, onClick }) => (
  <button onClick={onClick} className={`flex flex-col items-center justify-center w-full h-full gap-1 ${active ? 'text-stone-900' : 'text-stone-300'}`}>
    <Icon size={22} strokeWidth={active ? 2.5 : 2} />
    <span className="text-[10px] font-medium">{label}</span>
  </button>
);
