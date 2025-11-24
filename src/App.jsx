import React, { useState, useEffect, useRef } from 'react';
import { 
  Wind, Layers, PenTool, Heart, Settings, Plus, 
  ChevronRight, ChevronLeft, Image as ImageIcon, 
  CheckCircle, Trash2, X, Save, Upload, Download,
  Anchor, Smile, Frown, Meh, MoreHorizontal, Share
} from 'lucide-react';

// --- 1. 核心数据 Hook (保持不变，确保数据不丢) ---
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

// --- 2. iOS 设计系统 (HIG Guidelines) ---
const IOS = {
  // 背景色：iOS 标准分组背景灰
  bg: 'bg-[#F2F2F7]', 
  // 卡片：白色，大圆角，极轻的阴影
  card: 'bg-white rounded-[20px] shadow-[0_1px_2px_rgba(0,0,0,0.04)] border border-black/[0.02]',
  // 主按钮：深藏青/黑，点击时缩小
  primaryBtn: 'bg-[#1C1C1E] text-white active:scale-95 transition-all duration-200 shadow-md shadow-black/10',
  // 次级按钮：浅灰背景
  secondaryBtn: 'bg-[#E5E5EA] text-[#1C1C1E] active:bg-[#D1D1D6] transition-colors duration-200',
  // 文本系统
  type: {
    largeTitle: 'text-[34px] font-bold tracking-tight text-[#1C1C1E] leading-tight',
    title2: 'text-[22px] font-semibold tracking-tight text-[#1C1C1E]',
    headline: 'text-[17px] font-semibold text-[#1C1C1E] leading-snug',
    body: 'text-[17px] font-normal text-[#3A3A3C] leading-relaxed',
    caption1: 'text-[13px] font-medium text-[#8E8E93]',
    caption2: 'text-[11px] font-medium text-[#AEAEB2]',
  },
  // 输入框
  input: 'w-full bg-[#F2F2F7] rounded-[12px] px-4 py-3.5 text-[17px] placeholder-[#8E8E93] focus:outline-none focus:ring-2 focus:ring-[#007AFF]/20 transition-all',
};

// --- 3. 页面组件 ---

// A. 今日 (Home) - 还原截图 1
const HomeView = ({ tasks, actions }) => {
  const featuredTask = tasks.find(t => !t.completed);

  return (
    <div className="px-6 pt-14 pb-32 animate-fade-in">
      {/* 顶部极简标题 */}
      <div className="flex justify-center mb-12 opacity-60">
        <span className="text-[11px] font-bold tracking-[2px] uppercase">Growth Console</span>
      </div>

      <div className="flex flex-col items-center text-center">
        {featuredTask ? (
          // 有任务状态
          <div className="w-full mt-8 animate-slide-up">
             <div className="mb-8 flex justify-center">
                <div className="w-20 h-20 bg-[#007AFF]/10 rounded-full flex items-center justify-center text-[#007AFF] animate-pulse-slow">
                  <Wind size={40} strokeWidth={1.5} />
                </div>
             </div>
             <h2 className={IOS.type.title2}>今日专注</h2>
             <p className={`${IOS.type.caption1} mt-2 mb-10`}>AI 为你精选了最重要的 1 件事</p>
             
             <div className={`${IOS.card} p-8 text-left relative overflow-hidden group active:scale-[0.99] transition-transform duration-300`}>
               <div className="absolute top-0 left-0 w-1.5 h-full bg-[#007AFF]"></div>
               <span className="text-[11px] font-bold text-[#007AFF] uppercase tracking-wider mb-3 block">Top Priority</span>
               <h3 className="text-[20px] font-medium text-[#1C1C1E] mb-8 leading-relaxed line-clamp-3">{featuredTask.title}</h3>
               
               <button 
                 onClick={() => actions.toggleTask(featuredTask.id)} 
                 className="w-full py-3 rounded-xl border border-[#E5E5EA] flex items-center justify-center gap-2 text-[15px] text-[#8E8E93] hover:text-[#007AFF] hover:border-[#007AFF]/30 transition-all active:bg-[#F2F2F7]"
               >
                 <CheckCircle size={18} /> <span>完成任务</span>
               </button>
             </div>
          </div>
        ) : (
          // 空状态 (完全还原截图文案)
          <div className="w-full mt-8 animate-fade-in">
            <div className="mb-6 flex justify-center">
              <Wind size={64} strokeWidth={1} className="text-[#C7C7CC]" />
            </div>
            
            <h1 className={`${IOS.type.title2} mb-3`}>你好，设计师。</h1>
            <p className={`${IOS.type.body} text-[#8E8E93] mb-8`}>任务池暂时是空的。</p>

            <p className={`${IOS.type.caption1} max-w-[260px] mx-auto leading-relaxed mb-8`}>
              我会根据时间节点和你今天的状态，<br/>
              帮你从任务池里选出最重要的 1 件事。
            </p>

            <div className="bg-white px-4 py-3 rounded-xl shadow-sm border border-black/[0.02] mb-10 inline-block">
              <p className={IOS.type.caption2}>
                AI 只会从【任务池】里挑选，不会凭空生成任务。
              </p>
            </div>

            <button 
              onClick={() => actions.navigate('tasks')}
              className={`w-full h-[52px] rounded-[14px] ${IOS.primaryBtn} text-[17px] font-semibold tracking-wide`}
            >
              先丢一件事进任务池
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// B. 任务池 (Tasks) - 还原截图 2
const TasksView = ({ tasks, actions }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [inputVal, setInputVal] = useState('');

  const handleAdd = () => {
    if (inputVal.trim()) {
      actions.addTask(inputVal);
      setInputVal('');
      setIsAdding(false);
    }
  };

  return (
    <div className="px-5 pt-16 pb-32 min-h-full bg-white">
      <div className="flex justify-between items-start mb-2">
        <div>
          <h1 className={IOS.type.largeTitle}>任务池</h1>
          <p className={`${IOS.type.caption1} mt-1`}>倒空大脑，先收集，再行动</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="bg-[#1C1C1E] text-white px-5 py-2 rounded-full text-[15px] font-semibold active:scale-90 transition-transform shadow-lg shadow-black/10"
        >
          + 入池
        </button>
      </div>

      {isAdding && (
        <div className="mt-6 mb-4 animate-slide-down">
          <input 
            autoFocus
            className={`${IOS.input} bg-[#F2F2F7]`}
            placeholder="写下任务，回车保存..."
            value={inputVal}
            onChange={e => setInputVal(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
            onBlur={() => !inputVal && setIsAdding(false)}
          />
        </div>
      )}

      {tasks.length === 0 ? (
        <div className="mt-24 text-center space-y-12 animate-fade-in">
          <p className={`${IOS.type.body} text-[#8E8E93]`}>
            先把脑子里的事丢进来，不用排序。<br/>
            哪怕一句话也行。
          </p>
          
          <div className="space-y-3 px-2">
            {['找一张案例做分析', '整理厨房一段', '联系一个供应商/客户'].map(text => (
              <button 
                key={text} 
                onClick={() => actions.addTask(text)}
                className="w-full py-4 border border-[#E5E5EA] rounded-[16px] text-[15px] text-[#3A3A3C] font-medium active:bg-[#F2F2F7] active:scale-[0.98] transition-all"
              >
                {text}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="mt-8 space-y-0 divide-y divide-[#E5E5EA] border-t border-[#E5E5EA]">
          {tasks.map(task => (
            <div key={task.id} className="py-5 flex items-start justify-between group animate-fade-in">
              <div className="flex items-start gap-4 pr-4">
                <button 
                  onClick={() => actions.toggleTask(task.id)}
                  className={`mt-0.5 w-6 h-6 rounded-full border-[1.5px] flex-shrink-0 flex items-center justify-center transition-all ${
                    task.completed ? 'bg-[#34C759] border-[#34C759]' : 'border-[#C7C7CC]'
                  }`}
                >
                  {task.completed && <CheckCircle size={14} className="text-white" strokeWidth={3} />}
                </button>
                <span className={`text-[17px] leading-relaxed ${task.completed ? 'text-[#C7C7CC] line-through decoration-1' : 'text-[#1C1C1E]'}`}>
                  {task.title}
                </span>
              </div>
              <button onClick={() => actions.deleteTask(task.id)} className="text-[#D1D1D6] active:text-[#FF3B30] p-1 -mr-2">
                <Trash2 size={18} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// C. 设计 (Design) - 还原截图 3
const DesignView = ({ actions }) => {
  const [isTraining, setIsTraining] = useState(false);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({ img: null, atmosphere: '', feelings: '', analysis: '', quote: '' });

  const TAGS = ['全部', '静谧', '松弛', '温暖', '清冷', '自然', '克制'];

  const handleFinish = () => {
    setIsTraining(false);
    setStep(1);
    setFormData({ img: null, atmosphere: '', feelings: '', analysis: '', quote: '' });
    alert("训练完成，已归档至案例库");
  };

  // 训练模式 (全屏 Modal)
  if (isTraining) {
    return (
      <div className="fixed inset-0 bg-white z-50 flex flex-col animate-slide-up">
        {/* Modal Header */}
        <div className="px-6 pt-14 pb-4 flex justify-between items-center bg-white/80 backdrop-blur-xl border-b border-[#F2F2F7]">
          <button onClick={() => setIsTraining(false)} className="text-[#8E8E93] text-[17px]">取消</button>
          <span className="font-semibold text-[17px]">今日训练 ({step}/5)</span>
          <div className="w-8"></div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-8">
          {step === 1 && (
            <div className="flex flex-col items-center justify-center h-[60vh] animate-fade-in">
              <div className="w-full aspect-[4/3] bg-[#F2F2F7] rounded-[20px] flex flex-col items-center justify-center text-[#8E8E93] active:bg-[#E5E5EA] transition-colors cursor-pointer">
                <ImageIcon size={48} strokeWidth={1} className="mb-3 opacity-50" />
                <span className="text-[15px] font-medium">点击上传案例图</span>
              </div>
            </div>
          )}
          {step === 2 && (
            <div className="mt-4 animate-fade-in">
              <h3 className={IOS.type.title2}>选一个主氛围词</h3>
              <div className="flex flex-wrap gap-3 mt-8">
                {TAGS.slice(1).map(t => (
                  <button key={t} onClick={() => setFormData({...formData, atmosphere: t})}
                    className={`px-6 py-3 rounded-full text-[15px] font-medium transition-all ${
                      formData.atmosphere === t ? 'bg-[#1C1C1E] text-white shadow-lg shadow-black/20' : 'bg-[#F2F2F7] text-[#1C1C1E]'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          )}
          {step >= 3 && (
            <div className="mt-4 space-y-6 animate-fade-in">
               <h3 className={IOS.type.title2}>
                 {step === 3 ? '写 3-5 个感受词' : step === 4 ? '色彩/材质/构图分析' : '最后写一句金句'}
               </h3>
               <textarea 
                 autoFocus
                 className="w-full bg-[#F2F2F7] rounded-[16px] p-5 text-[17px] h-64 resize-none focus:outline-none leading-relaxed"
                 placeholder={step === 5 ? "留白不是空洞，而是..." : "点击输入..."}
                 value={step===3?formData.feelings:step===4?formData.analysis:formData.quote}
                 onChange={e => {
                   const val = e.target.value;
                   if(step===3) setFormData({...formData, feelings: val});
                   else if(step===4) setFormData({...formData, analysis: val});
                   else setFormData({...formData, quote: val});
                 }}
               />
            </div>
          )}
        </div>

        <div className="px-6 pb-10 pt-4 bg-white border-t border-[#F2F2F7]">
          <button onClick={() => step < 5 ? setStep(step + 1) : handleFinish()} className={`w-full h-[52px] rounded-[14px] ${IOS.primaryBtn} text-[17px] font-semibold`}>
            {step < 5 ? '下一步' : '完成训练'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="px-0 pt-16 pb-32 h-full overflow-y-auto bg-white">
      <div className="px-5 mb-6 flex items-center justify-between">
        <h1 className={IOS.type.largeTitle}>设计训练营</h1>
        <div className="flex gap-3">
          <button className="px-3 py-1.5 text-[13px] font-medium text-[#007AFF]">术语库</button>
          <button className="px-3 py-1.5 text-[13px] font-medium text-[#007AFF]">金句库</button>
          <button className="w-8 h-8 bg-[#F2F2F7] rounded-full flex items-center justify-center text-[#1C1C1E]">
            <Plus size={18}/>
          </button>
        </div>
      </div>

      {/* 氛围 Scroll */}
      <div className="flex gap-3 overflow-x-auto px-5 pb-4 no-scrollbar mb-4">
        {TAGS.map((t, i) => (
          <button key={t} className={`whitespace-nowrap px-4 py-1.5 rounded-full text-[13px] font-medium shadow-sm border ${i === 0 ? 'bg-[#1C1C1E] text-white border-[#1C1C1E]' : 'bg-white border-[#E5E5EA] text-[#8E8E93]'}`}>
            {t}
          </button>
        ))}
      </div>

      <div className="px-5">
        <div className={`${IOS.card} p-6 relative overflow-hidden`}>
          <div className="flex items-center gap-2 mb-5">
            <PenTool size={18} className="text-[#0A84FF]" />
            <h3 className={IOS.type.headline}>今天只做这一件事</h3>
          </div>
          
          <div className="space-y-4 mb-10">
            {[
              '上传1张喜欢的案例图', '选1个主氛围词', '写3-5个感受词', '用色彩/材质/构图解释它', '最后写一句金句。'
            ].map((text, i) => (
              <div key={i} className="flex items-start gap-3 text-[15px] text-[#3A3A3C] leading-normal">
                <span className="text-[#C7C7CC] font-mono">0{i+1}</span> {text}
              </div>
            ))}
          </div>

          <button onClick={() => setIsTraining(true)} className={`w-full h-[46px] rounded-[12px] ${IOS.primaryBtn} text-[15px] font-semibold`}>
            开始今日训练
          </button>
        </div>
      </div>
    </div>
  );
};

// D. 情绪 (Emotion) - 还原截图 4
const EmotionView = ({ actions }) => {
  const [val, setVal] = useState(5);
  
  return (
    <div className="px-5 pt-16 pb-32 h-full overflow-y-auto bg-white">
      <div className="flex justify-between items-center mb-10">
        <h1 className={IOS.type.largeTitle}>情绪与边界</h1>
        <button className="bg-[#F2F2F7] text-[#8E8E93] px-3 py-1.5 rounded-lg text-[12px] font-medium flex items-center gap-1 active:bg-[#E5E5EA]">
          <Anchor size={12}/> 安全锚
        </button>
      </div>

      <div className={`${IOS.card} p-6 border border-[#F2F2F7] shadow-lg shadow-black/[0.02]`}>
        <div className="mb-10">
          <div className="flex justify-between mb-5">
            <span className={IOS.type.caption1}>情绪温度</span>
            <span className="text-[15px] font-medium text-[#1C1C1E] font-mono">{val}/10</span>
          </div>
          <input 
            type="range" min="0" max="10" value={val} onChange={e => setVal(e.target.value)}
            className="w-full h-1.5 bg-[#F2F2F7] rounded-full appearance-none cursor-pointer accent-[#1C1C1E]"
          />
        </div>

        <div className="mb-10">
          <span className={`${IOS.type.caption1} block mb-4`}>此刻感受</span>
          <div className="flex flex-wrap gap-2.5">
            {['焦虑', '平静', '难过', '愤怒', '兴奋', '空虚', '麻木', '感激'].map(f => (
              <button key={f} className="px-4 py-2 rounded-[10px] border border-[#E5E5EA] text-[14px] text-[#3A3A3C] active:bg-[#1C1C1E] active:text-white active:border-[#1C1C1E] transition-colors">
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-10">
          <span className={`${IOS.type.caption1} block mb-4`}>影响最大的事</span>
          <textarea 
            className="w-full bg-[#F2F2F7] rounded-[14px] p-4 text-[15px] h-28 resize-none placeholder-[#C7C7CC] focus:outline-none focus:bg-[#E5E5EA] transition-colors"
            placeholder="发生了什么？"
          />
        </div>

        <button className={`w-full h-[46px] rounded-[12px] ${IOS.primaryBtn} text-[15px] font-semibold`}>
          保存记录
        </button>
      </div>
    </div>
  );
};

// --- 4. 设置弹窗 (Settings) ---
const SettingsModal = ({ isOpen, onClose, data, actions }) => {
  if (!isOpen) return null;
  
  const exportJSON = () => {
    const blob = new Blob([JSON.stringify(data)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `growth_backup_${new Date().toISOString().slice(0,10)}.json`;
    a.click();
  };

  const importJSON = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const json = JSON.parse(e.target.result);
          actions.importData(json);
          alert('导入成功');
        } catch(err) { alert('文件错误'); }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center animate-fade-in">
      <div className="bg-white w-full sm:w-[320px] sm:rounded-[24px] rounded-t-[24px] p-6 pb-10 animate-slide-up shadow-2xl">
        <div className="flex justify-between items-center mb-8">
          <h2 className={IOS.type.title2}>设置</h2>
          <button onClick={onClose} className="p-2 bg-[#F2F2F7] rounded-full text-[#8E8E93] hover:bg-[#E5E5EA]"><X size={18}/></button>
        </div>
        
        <div className="space-y-4">
          <button onClick={exportJSON} className="w-full flex items-center justify-between p-4 bg-[#F2F2F7] rounded-[14px] text-[15px] font-medium text-[#1C1C1E] active:bg-[#E5E5EA] transition-colors">
             <span>导出数据备份</span> <Download size={18} className="text-[#8E8E93]"/>
          </button>
          <div className="relative">
            <button className="w-full flex items-center justify-between p-4 bg-[#F2F2F7] rounded-[14px] text-[15px] font-medium text-[#1C1C1E] active:bg-[#E5E5EA] transition-colors">
               <span>导入数据 (覆盖)</span> <Upload size={18} className="text-[#8E8E93]"/>
            </button>
            <input type="file" onChange={importJSON} className="absolute inset-0 opacity-0 cursor-pointer"/>
          </div>
          <p className="text-[12px] text-[#8E8E93] px-2 pt-2 leading-relaxed text-center">
            数据仅保存在本地浏览器。<br/>请定期导出 JSON 文件以防丢失。
          </p>
        </div>
      </div>
    </div>
  );
};

// --- 5. 主程序 ---
export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [showSettings, setShowSettings] = useState(false);

  const [tasks, setTasks] = useStickyState([], 'gc_tasks');
  const [cases, setCases] = useStickyState([], 'gc_cases');

  const actions = {
    navigate: setActiveTab,
    addTask: (title) => setTasks([{ id: Date.now(), title, completed: false }, ...tasks]),
    toggleTask: (id) => setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t)),
    deleteTask: (id) => setTasks(tasks.filter(t => t.id !== id)),
    addCase: (c) => setCases([c, ...cases]),
    importData: (d) => { if(d.tasks) setTasks(d.tasks); if(d.cases) setCases(d.cases); }
  };

  return (
    <div className={`min-h-screen ${IOS.bg} font-sans selection:bg-[#E5E5EA] text-[#1C1C1E]`}>
      <main className="max-w-md mx-auto min-h-screen relative bg-white shadow-2xl overflow-hidden flex flex-col">
        
        {/* 设置按钮 (仅 Home 显示) */}
        {activeTab === 'home' && (
          <button 
            onClick={() => setShowSettings(true)} 
            className="absolute top-6 right-6 z-30 text-[#C7C7CC] hover:text-[#1C1C1E] transition-colors"
          >
            <Settings size={24} strokeWidth={1.5} />
          </button>
        )}

        {/* 页面内容区域 */}
        <div className="flex-1 overflow-hidden relative">
          {activeTab === 'home' && <HomeView tasks={tasks} actions={actions} />}
          {activeTab === 'tasks' && <TasksView tasks={tasks} actions={actions} />}
          {activeTab === 'design' && <DesignView cases={cases} actions={actions} />}
          {activeTab === 'emotion' && <EmotionView actions={actions} />}
        </div>

        {/* 底部 Tab Bar (iOS 毛玻璃风格) */}
        <nav className="h-[88px] bg-white/85 backdrop-blur-xl border-t border-black/[0.05] flex justify-around items-start pt-3 z-40 pb-safe absolute bottom-0 w-full">
          <TabItem icon={Wind} label="今日" active={activeTab === 'home'} onClick={() => setActiveTab('home')} />
          <TabItem icon={Layers} label="任务池" active={activeTab === 'tasks'} onClick={() => setActiveTab('tasks')} />
          <TabItem icon={PenTool} label="设计" active={activeTab === 'design'} onClick={() => setActiveTab('design')} />
          <TabItem icon={Heart} label="情绪" active={activeTab === 'emotion'} onClick={() => setActiveTab('emotion')} />
        </nav>

        <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} data={{tasks, cases}} actions={actions} />
      </main>
    </div>
  );
}

const TabItem = ({ icon: Icon, label, active, onClick }) => (
  <button 
    onClick={onClick} 
    className={`w-16 flex flex-col items-center gap-1.5 transition-colors duration-200 ${active ? 'text-[#1C1C1E]' : 'text-[#AEAEB2]'}`}
  >
    <Icon size={26} strokeWidth={active ? 2.3 : 1.8} />
    <span className="text-[10px] font-medium tracking-wide">{label}</span>
  </button>
);
