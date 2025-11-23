import React, { useState, useEffect } from 'react';
import { 
  CheckCircle, PenTool, Heart, Settings, Plus, ArrowLeft, Search, Wind, 
  Activity, Home, Quote, Image as ImageIcon, Save, Book, X, Layers, 
  Calendar, Clock, Trash2, Anchor, Download, Upload, AlertCircle
} from 'lucide-react';

// --- 核心数据层: IndexedDB 驱动 (LocalDB) ---
const DB_NAME = 'GrowthConsoleDB_v1';
const DB_VERSION = 1;
const STORES = {
  TASKS: 'tasks',           // 任务池
  HISTORY: 'history',       // 历史记录
  DESIGN: 'design_logs',    // 设计案例
  TERMS: 'design_terms',    // 术语库
  EMOTION: 'emotion_logs'   // 情绪记录
};

class LocalDB {
  constructor() {
    this.db = null;
    this.initPromise = this.init();
  }

  init() {
    return new Promise((resolve, reject) => {
      if (!window.indexedDB) {
        console.error("Browser does not support IndexedDB");
        return;
      }
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        Object.values(STORES).forEach(storeName => {
          if (!db.objectStoreNames.contains(storeName)) {
            db.createObjectStore(storeName, { keyPath: 'id' });
          }
        });
      };

      request.onsuccess = (event) => {
        this.db = event.target.result;
        resolve(this.db);
      };

      request.onerror = (event) => reject(event.target.error);
    });
  }

  async getStore(storeName, mode = 'readonly') {
    await this.initPromise;
    return this.db.transaction(storeName, mode).objectStore(storeName);
  }

  async getAll(storeName) {
    try {
      const store = await this.getStore(storeName);
      return new Promise((resolve, reject) => {
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => reject(request.error);
      });
    } catch (e) { return []; }
  }

  async add(storeName, data) {
    const store = await this.getStore(storeName, 'readwrite');
    const item = { id: Date.now().toString(), ...data, createdAt: new Date().toISOString() };
    return new Promise((resolve, reject) => {
      const request = store.add(item);
      request.onsuccess = () => resolve(item);
      request.onerror = () => reject(request.error);
    });
  }

  async update(storeName, id, updates) {
    const store = await this.getStore(storeName, 'readwrite');
    return new Promise((resolve, reject) => {
      const getReq = store.get(id);
      getReq.onsuccess = () => {
        const data = getReq.result;
        if (!data) return resolve(null);
        const updated = { ...data, ...updates };
        const putReq = store.put(updated);
        putReq.onsuccess = () => resolve(updated);
      };
      getReq.onerror = () => reject(getReq.error);
    });
  }

  async delete(storeName, id) {
    const store = await this.getStore(storeName, 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async exportAll() {
    const data = {};
    for (const key of Object.values(STORES)) {
      data[key] = await this.getAll(key);
    }
    return data;
  }

  async importAll(data) {
    const storeNames = Object.values(STORES);
    for (const name of storeNames) {
      if (data[name] && Array.isArray(data[name])) {
        const store = await this.getStore(name, 'readwrite');
        await new Promise((resolve) => {
           const clearReq = store.clear();
           clearReq.onsuccess = () => resolve();
        });
        for (const item of data[name]) {
          store.put(item);
        }
      }
    }
  }
}

const db = new LocalDB();

// --- UI Components ---
const Button = ({ children, onClick, variant = 'primary', className = '', disabled = false, size = 'md', icon: Icon }) => {
  const baseStyle = "flex items-center justify-center rounded-lg transition-all duration-200 font-medium tracking-wide disabled:opacity-50 disabled:cursor-not-allowed";
  const sizes = { sm: "px-3 py-1.5 text-xs", md: "px-6 py-3 text-sm" };
  const variants = {
    primary: "bg-slate-800 text-slate-50 hover:bg-slate-700 shadow-sm hover:shadow-md",
    secondary: "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:border-slate-300",
    ghost: "bg-transparent text-slate-500 hover:bg-slate-100",
    outline: "border border-slate-300 text-slate-600 hover:bg-slate-50",
    danger: "bg-rose-50 text-rose-600 border border-rose-100 hover:bg-rose-100"
  };
  return (
    <button onClick={onClick} disabled={disabled} className={`${baseStyle} ${sizes[size]} ${variants[variant]} ${className}`}>
      {Icon && <Icon size={size === 'sm' ? 14 : 16} className="mr-2" />}
      {children}
    </button>
  );
};

const Input = ({ label, value, onChange, placeholder, type = "text", multiline = false, rows = 3 }) => (
  <div className="mb-4">
    {label && <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">{label}</label>}
    {multiline ? (
      <textarea className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-slate-700 focus:outline-none focus:border-slate-400 focus:bg-white transition-colors text-sm leading-relaxed resize-none placeholder:text-slate-300" rows={rows} value={value} onChange={onChange} placeholder={placeholder} />
    ) : (
      <input type={type} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-slate-700 focus:outline-none focus:border-slate-400 focus:bg-white transition-colors text-sm placeholder:text-slate-300" value={value} onChange={onChange} placeholder={placeholder} />
    )}
  </div>
);

const ChipSelect = ({ options, selected, onSelect, label, type = 'multi', max = 99 }) => (
  <div className="mb-5">
    {label && <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">{label}</label>}
    <div className="flex flex-wrap gap-2">
      {options.map(opt => {
        const isSelected = type === 'single' ? selected === opt : selected.includes(opt);
        return (
          <button key={opt} onClick={() => {
              if (type === 'single') onSelect(opt);
              else isSelected ? onSelect(selected.filter(s => s !== opt)) : (selected.length < max && onSelect([...selected, opt]));
            }}
            className={`px-3 py-1.5 rounded text-xs transition-colors border ${isSelected ? 'bg-slate-700 text-white border-slate-700 shadow-sm' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300 hover:bg-slate-50'}`}
          >
            {opt}
          </button>
        );
      })}
    </div>
  </div>
);

const MOOD_OPTIONS = ['静谧', '松弛', '温暖', '清冷', '自然', '克制', '秩序感', '治愈', '明亮通透', '沉稳'];
const STYLE_OPTIONS = ['北欧', '现代极简', '侘寂', '日式', '轻法式', '包豪斯', '工业风', '复古', '其他'];
const DOMAINS = [
  { id: 'design', label: '设计成长', color: 'bg-indigo-50 text-indigo-600 border-indigo-100', weight: 15 },
  { id: 'body', label: '身体调理', color: 'bg-emerald-50 text-emerald-600 border-emerald-100', weight: 10 },
  { id: 'emotion', label: '情绪边界', color: 'bg-rose-50 text-rose-600 border-rose-100', weight: 10 },
  { id: 'finance', label: '搞钱财商', color: 'bg-amber-50 text-amber-600 border-amber-100', weight: 8 },
  { id: 'life', label: '生活杂事', color: 'bg-slate-50 text-slate-500 border-slate-100', weight: 5 },
];

// --- Settings Module ---
const SettingsModule = ({ onBack }) => {
  const handleExport = async () => {
    try {
      const data = await db.exportAll();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `growth_backup_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
    } catch (e) {
      alert("导出失败，请重试");
    }
  };

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = JSON.parse(event.target.result);
        if (window.confirm("确定要导入备份吗？这将覆盖当前所有数据！建议先导出备份。")) {
          await db.importAll(data);
          alert("导入成功！页面将刷新。");
          window.location.reload();
        }
      } catch (err) {
        alert("文件格式错误，请使用正确的备份文件。");
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="p-4 max-w-md mx-auto animate-fade-in">
       <div className="flex items-center mb-6">
          <button onClick={onBack} className="mr-4 p-2 hover:bg-slate-100 rounded-full"><ArrowLeft size={20} className="text-slate-600"/></button>
          <h2 className="text-xl font-light text-slate-800">设置与备份</h2>
       </div>
       <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
               <AlertCircle size={18} className="text-amber-600 mt-0.5 flex-shrink-0"/>
               <div className="text-xs text-amber-800 leading-relaxed">
                 <p className="font-bold mb-1">重要提示：数据与域名绑定</p>
                 <p>你的数据存储在当前浏览器的 IndexedDB 中。如果未来更换网址或切换到新手机，<strong className="underline">数据不会自动同步</strong>。</p>
                 <p className="mt-2">迁移前，请务必先点击「导出备份」，再到新地址「恢复备份」。</p>
               </div>
            </div>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-800 mb-2">数据管理</h3>
            <Button onClick={handleExport} icon={Download} variant="outline" className="w-full mb-3">导出全部数据 (JSON)</Button>
            <div className="relative">
               <input type="file" accept=".json" onChange={handleImport} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"/>
               <Button icon={Upload} variant="ghost" className="w-full">恢复备份 / 导入数据</Button>
            </div>
          </div>
          <div className="pt-4 border-t border-slate-100">
             <h3 className="text-sm font-semibold text-slate-800 mb-2">关于</h3>
             <p className="text-xs text-slate-400">逆袭成长中控台 v2.1 (PWA)</p>
          </div>
       </div>
    </div>
  );
};

const TermModal = ({ isOpen, onClose, initialData = {} }) => {
  const [termData, setTermData] = useState({ term: '', understanding: '', source: '', example: '', tags: [] });
  useEffect(() => { if (isOpen) setTermData({ term: initialData.term || '', understanding: '', source: initialData.source || '日常积累', example: '', tags: initialData.tags || [] }); }, [isOpen, initialData]);

  const handleSave = async () => {
    if (!termData.term || !termData.understanding) return;
    await db.add(STORES.TERMS, termData);
    onClose();
  };
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white w-full max-w-sm rounded-xl shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center p-4 border-b border-slate-50"><h3 className="text-sm font-semibold text-slate-700 flex items-center"><Book size={16} className="mr-2 text-indigo-500"/> 记录术语</h3><button onClick={onClose}><X size={18} className="text-slate-400"/></button></div>
        <div className="p-5 overflow-y-auto">
          <Input label="术语名称" value={termData.term} onChange={e => setTermData({...termData, term: e.target.value})} />
          <Input label="我的理解/翻译" multiline rows={3} value={termData.understanding} onChange={e => setTermData({...termData, understanding: e.target.value})} />
          <Input label="来源" value={termData.source} onChange={e => setTermData({...termData, source: e.target.value})} />
        </div>
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3"><Button variant="ghost" onClick={onClose} size="sm">取消</Button><Button onClick={handleSave} size="sm">存入术语库</Button></div>
      </div>
    </div>
  );
};

// --- Modules ---

const TaskPoolModule = ({ navigateTo }) => {
  const [tasks, setTasks] = useState([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', domain: 'design', deadline: '', importance: 'mid', duration: '30' });

  const loadTasks = async () => {
    const data = await db.getAll(STORES.TASKS);
    setTasks(data.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)));
  };
  useEffect(() => { loadTasks(); }, []);

  const handleAddTask = async () => {
    if (!newTask.title) return;
    await db.add(STORES.TASKS, { ...newTask, status: 'pending' });
    setIsAdding(false);
    setNewTask({ title: '', domain: 'design', deadline: '', importance: 'mid', duration: '30' });
    loadTasks();
  };

  const handleQuickAdd = async (title) => {
    await db.add(STORES.TASKS, { title, domain: 'life', deadline: '', importance: 'mid', duration: '30', status: 'pending' });
    loadTasks();
  };

  const handleDelete = async (id) => {
    await db.delete(STORES.TASKS, id);
    loadTasks();
  };

  return (
    <div className="flex flex-col h-full p-4 pb-20 max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div><h2 className="text-xl font-light text-slate-800">任务池</h2><p className="text-xs text-slate-400 mt-1">倒空大脑，先收集，再行动</p></div>
        <Button onClick={() => setIsAdding(true)} icon={Plus} size="sm">入池</Button>
      </div>
      {isAdding && (
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6 animate-fade-in">
           <Input label="任务标题" value={newTask.title} onChange={e => setNewTask({...newTask, title: e.target.value})} />
           <div className="grid grid-cols-2 gap-4 mb-4">
              <div><label className="block text-xs font-semibold text-slate-400 uppercase mb-2">领域</label><select className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm" value={newTask.domain} onChange={e => setNewTask({...newTask, domain: e.target.value})}>{DOMAINS.map(d => <option key={d.id} value={d.id}>{d.label}</option>)}</select></div>
              <div><label className="block text-xs font-semibold text-slate-400 uppercase mb-2">时间节点</label><input type="date" className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm" value={newTask.deadline} onChange={e => setNewTask({...newTask, deadline: e.target.value})} /></div>
           </div>
           <div className="flex gap-3 justify-end"><Button variant="ghost" size="sm" onClick={() => setIsAdding(false)}>取消</Button><Button size="sm" onClick={handleAddTask}>确认入池</Button></div>
        </div>
      )}
      <div className="flex-1 overflow-y-auto space-y-3">
        {tasks.filter(t => t.status === 'pending').length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <p className="text-slate-500 text-sm mb-6 max-w-xs">先把脑子里的事丢进来，不用排序。<br/>哪怕一句话也行。</p>
            <div className="flex flex-col gap-3 w-full max-w-xs items-center">
               <button onClick={() => handleQuickAdd('找一张案例做分析')} className="bg-white border border-slate-200 text-slate-600 py-3 px-4 rounded-full text-xs shadow-sm hover:border-indigo-200 hover:text-indigo-600 transition-all w-full text-center">找一张案例做分析</button>
               <button onClick={() => handleQuickAdd('整理简历一段')} className="bg-white border border-slate-200 text-slate-600 py-3 px-4 rounded-full text-xs shadow-sm hover:border-indigo-200 hover:text-indigo-600 transition-all w-full text-center">整理简历一段</button>
               <button onClick={() => handleQuickAdd('联系一个供应商/客户')} className="bg-white border border-slate-200 text-slate-600 py-3 px-4 rounded-full text-xs shadow-sm hover:border-indigo-200 hover:text-indigo-600 transition-all w-full text-center">联系一个供应商/客户</button>
               <p className="text-[10px] text-slate-400 mt-2">你也可以自己写一条，越随意越好。</p>
            </div>
          </div>
        ) : (
          tasks.filter(t => t.status === 'pending').map(task => {
            const domainStyle = DOMAINS.find(d => d.id === task.domain) || DOMAINS[4];
            return (
              <div key={task.id} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex justify-between items-start group">
                <div>
                   <div className="flex items-center gap-2 mb-1"><span className={`px-1.5 py-0.5 rounded text-[10px] border ${domainStyle.color}`}>{domainStyle.label}</span><h3 className="text-sm font-medium text-slate-700">{task.title}</h3></div>
                   <div className="flex gap-3 text-[10px] text-slate-400">{task.deadline && <span className="flex items-center"><Calendar size={10} className="mr-1"/> {task.deadline}</span>}<span className="flex items-center"><Clock size={10} className="mr-1"/> {task.duration} min</span></div>
                </div>
                <button onClick={() => handleDelete(task.id)} className="text-slate-300 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity p-2"><Trash2 size={14}/></button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

const HomeView = ({ navigateTo }) => {
  const [planState, setPlanState] = useState('idle'); 
  const [dailyPlan, setDailyPlan] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [showNotTodo, setShowNotTodo] = useState(false);

  const loadTasks = async () => {
    const data = await db.getAll(STORES.TASKS);
    setTasks(data);
  };
  useEffect(() => { loadTasks(); }, []);
  
  const pendingTasksCount = tasks.filter(t => t.status === 'pending').length;

  const generatePlan = () => {
    const pending = tasks.filter(t => t.status === 'pending');
    if (pending.length === 0) { navigateTo('pool'); return; }
    
    const scored = pending.map(t => ({ ...t, score: Math.random() * 100 })).sort((a,b) => b.score - a.score);
    const main = scored[0];
    const getBreakdown = (task) => ({ step: '开始第一步', minStandard: '完成60%即可交差' });

    setDailyPlan({ main: { ...main, ...getBreakdown(main) }, aux: null, notTodo: scored.slice(1) });
    setPlanState('generated');
  };

  const handleCompleteDay = async () => {
    await db.update(STORES.TASKS, dailyPlan.main.id, { status: 'completed' });
    await db.add(STORES.HISTORY, { title: dailyPlan.main.title, rating: 5 });
    setPlanState('idle'); setDailyPlan(null);
    loadTasks();
  };

  if (planState === 'generated') {
    return (
      <div className="flex flex-col h-full p-4 animate-fade-in max-w-md mx-auto">
        <div className="flex items-center justify-between mb-6"><h2 className="text-xl font-light text-slate-800">今日作战计划</h2><span className="text-[10px] text-slate-400 bg-slate-100 px-2 py-1 rounded-full">来自任务池</span></div>
        <div className="bg-slate-800 text-white p-6 rounded-2xl shadow-xl shadow-slate-200 mb-4 relative overflow-hidden">
           <div className="absolute top-0 right-0 p-4 opacity-10"><Wind size={80}/></div>
           <span className="inline-block px-2 py-0.5 rounded text-[10px] bg-white/20 text-white mb-4 backdrop-blur-sm">今日主线 · 唯一重点</span>
           <h2 className="text-2xl font-normal leading-tight mb-6 relative z-10">{dailyPlan.main.title}</h2>
           <div className="bg-white/10 rounded-lg p-4 backdrop-blur-md mb-4 border border-white/5">
              <div className="flex items-start gap-3 mb-3"><Activity size={16} className="text-emerald-300 mt-0.5 flex-shrink-0"/><div><p className="text-xs text-slate-300 uppercase tracking-wide mb-1">最小下一步</p><p className="text-sm font-medium">{dailyPlan.main.step}</p></div></div>
              <div className="flex items-start gap-3"><CheckCircle size={16} className="text-emerald-300 mt-0.5 flex-shrink-0"/><div><p className="text-xs text-slate-300 uppercase tracking-wide mb-1">60分万岁标准</p><p className="text-sm font-medium text-emerald-100">{dailyPlan.main.minStandard}</p></div></div>
           </div>
        </div>
        <div className="mb-8">
           <button onClick={() => setShowNotTodo(!showNotTodo)} className="flex items-center w-full justify-between text-xs text-slate-400 hover:text-slate-600 py-2 border-b border-slate-100"><span>今天不做清单 ({dailyPlan.notTodo.length})</span>{showNotTodo ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}</button>
           {showNotTodo && (<div className="bg-slate-50 rounded-b-lg p-3 space-y-2 animate-fade-in"><p className="text-[10px] text-slate-400 mb-2">AI 判定以下任务暂缓。</p>{dailyPlan.notTodo.map(t => (<div key={t.id} className="text-xs text-slate-500 line-through decoration-slate-300">{t.title}</div>))}</div>)}
        </div>
        <div className="mt-auto"><Button onClick={handleCompleteDay} className="w-full">完成今日打卡</Button><Button variant="ghost" onClick={() => {setPlanState('idle'); setDailyPlan(null);}} className="w-full mt-2 text-xs">重新规划</Button></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full items-center justify-center p-8 text-center animate-fade-in">
      <div className="mb-6 p-4 bg-slate-50 rounded-full text-slate-400 relative">
         <Wind size={32} />
         {pendingTasksCount > 0 && <div className="absolute top-0 right-0 w-3 h-3 bg-indigo-500 rounded-full border-2 border-white"></div>}
      </div>
      <h1 className="text-3xl font-light text-slate-800 mb-3 tracking-tight">你好，设计师。</h1>
      {pendingTasksCount === 0 ? <p className="text-slate-500 mb-2 max-w-xs leading-relaxed">任务池暂时是空的。</p> : <p className="text-slate-500 mb-2 max-w-xs leading-relaxed">任务池里有 <span className="text-indigo-600 font-bold">{pendingTasksCount}</span> 件待办。</p>}
      <div className="mb-10 text-center">
         <p className="text-xs text-slate-400">我会根据时间节点和你今天的状态，<br/>帮你从任务池里选出最重要的 1 件事。</p>
         <p className="text-[10px] text-slate-300 mt-2 bg-slate-100 inline-block px-2 py-1 rounded">AI 只会从【任务池】里挑选，不会凭空生成任务。</p>
      </div>
      <div className="space-y-4 w-full max-w-xs">
        {pendingTasksCount === 0 ? <Button onClick={() => navigateTo('pool')} className="w-full shadow-lg shadow-indigo-100 bg-indigo-600 hover:bg-indigo-700">先丢一件事进任务池</Button> : <Button onClick={generatePlan} className="w-full shadow-lg shadow-slate-200">生成今日任务</Button>}
      </div>
    </div>
  );
};

const DesignModule = () => {
  const [view, setView] = useState('list');
  const [formData, setFormData] = useState({ name: '', type: '客厅', styles: [], primaryMood: '', goldenSentence: '' });
  const [entries, setEntries] = useState([]);
  const [terms, setTerms] = useState([]);
  const [termModal, setTermModal] = useState(false);
  const [termSearch, setTermSearch] = useState('');
  const [gsSearch, setGsSearch] = useState('');

  const loadData = async () => {
    const logs = await db.getAll(STORES.DESIGN);
    const tms = await db.getAll(STORES.TERMS);
    setEntries(logs.sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt)));
    setTerms(tms.sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt)));
  };
  useEffect(() => { loadData(); }, [view]);

  const handleSave = async () => {
    await db.add(STORES.DESIGN, formData);
    setView('list'); setFormData({ name: '', type: '客厅', styles: [], primaryMood: '', goldenSentence: '' });
  };

  if (view === 'terms') {
      const filteredTerms = terms.filter(t => !termSearch || t.term?.toLowerCase().includes(termSearch.toLowerCase()));
      return (
         <div className="p-4 pb-20 animate-fade-in max-w-2xl mx-auto flex flex-col h-full">
          <div className="flex items-center mb-6"><button onClick={() => setView('list')} className="mr-4"><ArrowLeft size={20}/></button><h2 className="text-lg font-medium text-slate-800">术语库</h2></div>
          <div className="mb-4"><Input placeholder="搜索术语..." value={termSearch} onChange={e=>setTermSearch(e.target.value)} /></div>
          <div className="space-y-3 overflow-y-auto flex-1">{filteredTerms.map(t => (<div key={t.id} className="bg-white p-4 rounded-xl border border-slate-200"><h3 className="font-bold">{t.term}</h3><p className="text-sm text-slate-600 mt-1">{t.understanding}</p></div>))}</div>
         </div>
      )
  }

  if (view === 'golden_sentences') {
      const filteredGs = entries.filter(e => e.goldenSentence && (!gsSearch || e.goldenSentence.includes(gsSearch)));
      return (
         <div className="p-4 pb-20 animate-fade-in max-w-2xl mx-auto flex flex-col h-full">
          <div className="flex items-center mb-6"><button onClick={() => setView('list')} className="mr-4"><ArrowLeft size={20}/></button><h2 className="text-lg font-medium text-slate-800">金句库</h2></div>
          <div className="mb-4"><Input placeholder="搜索金句..." value={gsSearch} onChange={e=>setGsSearch(e.target.value)} /></div>
          <div className="space-y-3 overflow-y-auto flex-1">{filteredGs.map(e => (<div key={e.id} className="bg-white p-4 rounded-xl border border-slate-200"><p className="text-lg text-slate-800 mb-2">"{e.goldenSentence}"</p><span className="text-xs text-slate-400">{e.name}</span></div>))}</div>
         </div>
      )
  }

  if (view === 'create') return (
    <div className="p-4 pb-20 animate-fade-in max-w-2xl mx-auto">
      <TermModal isOpen={termModal} onClose={()=>setTermModal(false)} />
      <div className="flex items-center justify-between mb-6">
         <div className="flex items-center"><button onClick={() => setView('list')} className="mr-4"><ArrowLeft size={20}/></button><h2 className="text-lg font-medium text-slate-800">新建分析</h2></div>
         <Button variant="outline" size="sm" onClick={()=>setTermModal(true)} icon={Book}>记录术语 +</Button>
      </div>
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
         <Input label="案例名称" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
         <ChipSelect label="主氛围" required type="single" options={MOOD_OPTIONS} selected={formData.primaryMood} onSelect={val => setFormData({...formData, primaryMood: val})} />
         <Input label="今日金句 / 结论" value={formData.goldenSentence} onChange={e => setFormData({...formData, goldenSentence: e.target.value})} />
         <div className="flex gap-4 pt-4"><Button variant="ghost" onClick={() => setView('list')} className="flex-1">取消</Button><Button onClick={handleSave} className="flex-1" icon={Save}>保存</Button></div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full p-4 max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-6">
          <div><h2 className="text-xl font-light text-slate-800">设计训练营</h2><p className="text-xs text-slate-400 mt-1">积累设计直觉</p></div>
          <div className="flex gap-2">
            <Button onClick={() => setView('terms')} variant="secondary" className="px-3" icon={Book}>术语</Button>
            <Button onClick={() => setView('golden_sentences')} variant="secondary" className="px-3" icon={Quote}>金句</Button>
            <Button onClick={() => setView('create')} icon={Plus} size="sm">新建</Button>
          </div>
      </div>
      <div className="flex-1 overflow-auto space-y-4 pb-20">
        {entries.length===0 ? <div className="text-center py-10 text-slate-400 text-sm">还没有记录。</div> : entries.map(e => (
          <div key={e.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm"><h3 className="font-medium">{e.name}</h3><p className="text-xs text-slate-500 mt-1">{e.primaryMood} · {e.goldenSentence}</p></div>
        ))}
      </div>
    </div>
  );
};

const EmotionModule = () => {
  const [mode, setMode] = useState('log');
  const [emotion, setEmotion] = useState({ temp: 5, tags: [], event: '' });
  const [saved, setSaved] = useState(false);
  const handleSave = async () => { await db.add(STORES.EMOTION, emotion); setSaved(true); setTimeout(() => setSaved(false), 2000); };
  if (mode === 'anchor') return (<div className="fixed inset-0 bg-slate-900 z-50 flex flex-col items-center justify-center p-8 text-center animate-fade-in"><Anchor className="text-slate-400 mb-8 animate-pulse" size={48} /><p className="text-white font-normal text-xl">“亲爱的，你已经做得很好了。”</p><button onClick={() => setMode('log')} className="mt-16 text-slate-500 text-sm">返回</button></div>);
  return (
    <div className="p-6 max-w-md mx-auto animate-fade-in pb-24">
      <div className="flex justify-between items-center mb-6"><h2 className="text-xl font-light text-slate-800">情绪与边界</h2><button onClick={() => setMode('anchor')} className="flex items-center text-xs font-medium text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full"><Anchor size={12} className="mr-1"/> 安全锚</button></div>
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 space-y-6">
        <div><label className="text-xs font-bold text-slate-400 uppercase">情绪温度 {emotion.temp}/10</label><input type="range" min="0" max="10" step="1" value={emotion.temp} onChange={(e) => setEmotion({...emotion, temp: parseInt(e.target.value)})} className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-700"/></div>
        <ChipSelect label="此刻感受" options={['焦虑', '平静', '难过', '愤怒', '兴奋', '空虚', '麻木', '感激']} selected={emotion.tags} onSelect={(t)=>setEmotion(prev=>({...prev, tags: prev.tags.includes(t)?prev.tags.filter(x=>x!==t):[...prev.tags,t]}))} />
        <Button onClick={handleSave} className="w-full" disabled={saved}>{saved ? '记录完成' : '保存记录'}</Button>
      </div>
    </div>
  );
};

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [showSettings, setShowSettings] = useState(false);

  if (showSettings) return <SettingsModule onBack={() => setShowSettings(false)} />;

  const renderContent = () => {
    switch (activeTab) {
      case 'home': return <HomeView navigateTo={setActiveTab} />;
      case 'pool': return <TaskPoolModule navigateTo={setActiveTab} />;
      case 'design': return <DesignModule />;
      case 'emotion': return <EmotionModule />;
      default: return <HomeView navigateTo={setActiveTab} />;
    }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 font-sans text-slate-800">
      <div className="h-14 bg-white border-b border-slate-100 flex items-center justify-center relative flex-shrink-0 z-10">
        <h1 className="text-sm font-semibold tracking-widest text-slate-700 uppercase">Growth Console</h1>
        <button onClick={() => setShowSettings(true)} className="absolute right-4"><Settings size={18} className="text-slate-300 hover:text-slate-600 transition-colors"/></button>
      </div>
      <div className="flex-1 overflow-y-auto overflow-x-hidden relative">{renderContent()}</div>
      <div className="h-16 bg-white border-t border-slate-100 flex items-center justify-around flex-shrink-0 z-10 safe-area-bottom">
        <NavButton active={activeTab === 'home'} onClick={() => setActiveTab('home')} icon={Home} label="今日" />
        <NavButton active={activeTab === 'pool'} onClick={() => setActiveTab('pool')} icon={Layers} label="任务池" />
        <NavButton active={activeTab === 'design'} onClick={() => setActiveTab('design')} icon={PenTool} label="设计" />
        <NavButton active={activeTab === 'emotion'} onClick={() => setActiveTab('emotion')} icon={Heart} label="情绪" />
      </div>
    </div>
  );
}
