import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import Confetti from 'react-confetti';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Flame, Scale, CheckSquare, Edit3, AlertTriangle, X, Calendar, Trash2, Plus } from 'lucide-react';

// --- Edit Modal Component (Now with Add & Delete) ---
const EditModal = ({ isOpen, onClose, habits, onSave }) => {
    const [localHabits, setLocalHabits] = useState(habits);

    useEffect(() => { 
        if (habits) setLocalHabits(habits); 
    }, [habits]);

    if (!isOpen) return null;

    const handleChange = (id, newTitle) => {
        setLocalHabits(localHabits.map(h => h.id === id ? { ...h, title: newTitle } : h));
    };

    const handleDelete = (id) => {
        setLocalHabits(localHabits.filter(h => h.id !== id));
    };

    const handleAdd = () => {
        // Create a temp ID based on timestamp so React doesn't complain about keys
        const newHabit = { id: Date.now().toString(), title: '' };
        setLocalHabits([...localHabits, newHabit]);
    };

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
            <div className="bg-gray-800 p-6 rounded-2xl w-full max-w-sm border border-gray-700 shadow-2xl">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-white">Customize Habits</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-white"><X size={20}/></button>
                </div>
                
                <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1 mb-4 custom-scrollbar">
                    {localHabits.map((h) => (
                        <div key={h.id} className="flex gap-2 items-center">
                            <input 
                                value={h.title}
                                onChange={(e) => handleChange(h.id, e.target.value)}
                                placeholder="Enter habit name..."
                                autoFocus={h.title === ''}
                                className="flex-1 bg-gray-900 border border-gray-700 p-3 rounded-xl text-white focus:border-blue-500 outline-none placeholder-gray-600"
                            />
                            <button 
                                onClick={() => handleDelete(h.id)}
                                className="bg-red-900/30 hover:bg-red-900/60 text-red-400 p-3 rounded-xl border border-red-900/50 transition-colors"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                    ))}
                    
                    {localHabits.length === 0 && (
                        <p className="text-center text-gray-500 text-sm py-4">No habits yet. Add one below!</p>
                    )}
                </div>

                <button 
                    onClick={handleAdd}
                    className="w-full mb-6 flex items-center justify-center gap-2 border border-dashed border-gray-600 hover:border-blue-500 hover:text-blue-400 text-gray-400 py-3 rounded-xl transition-all"
                >
                    <Plus size={18} /> Add New Habit
                </button>

                <div className="flex gap-3">
                    <button onClick={onClose} className="flex-1 bg-gray-700 hover:bg-gray-600 py-3 rounded-xl font-bold text-gray-200">Cancel</button>
                    <button onClick={() => onSave(localHabits)} className="flex-1 bg-blue-600 hover:bg-blue-500 py-3 rounded-xl font-bold text-white shadow-lg shadow-blue-900/20">Save Changes</button>
                </div>
            </div>
        </div>
    );
};

// --- Main Profile Component ---
const UserProfile = () => {
  const { id } = useParams();
  const [user, setUser] = useState(null);
  const [todayLog, setTodayLog] = useState({ completedHabits: [] });
  const [showConfetti, setShowConfetti] = useState(false);
  const [weightInput, setWeightInput] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState('');
  
  const isMe = localStorage.getItem('userId') === id; 
  const token = localStorage.getItem('token');

  useEffect(() => { fetchData(); }, [id]);

  const fetchData = async () => {
    try {
      const res = await axios.get(`https://tracker-api-y699.onrender.com/api/user/${id}`, { headers: { 'x-auth-token': token } });
      setUser(res.data);
      const todayStr = new Date().toISOString().split('T')[0];
      const log = res.data.dailyLogs.find(l => l.date === todayStr) || { completedHabits: [] };
      setTodayLog(log);
    } catch (err) {
      console.error(err);
      setError("Failed to load profile.");
    }
  };

  const toggleHabit = async (habitId) => {
    if (!isMe) return;
    const isChecked = !todayLog.completedHabits.includes(habitId);
    const newCompleted = isChecked ? [...todayLog.completedHabits, habitId] : todayLog.completedHabits.filter(h => h !== habitId);
    
    setTodayLog({ ...todayLog, completedHabits: newCompleted });

    try {
        const res = await axios.post('https://tracker-api-y699.onrender.com/api/log', { habitId, isChecked }, { headers: { 'x-auth-token': token } });
        if (res.data.fullyCompleted) setShowConfetti(true);
        if (res.data.currentStreak !== undefined) setUser(prev => ({ ...prev, currentStreak: res.data.currentStreak }));
    } catch (err) { 
        console.error("Log failed", err);
        // Optional: Revert UI if needed, or just silent fail
    }
  };

  const updateWeight = async () => {
    if (!weightInput) return;
    try {
        await axios.post('https://tracker-api-y699.onrender.com/api/weight', { weight: weightInput }, { headers: { 'x-auth-token': token } });
        fetchData();
        setWeightInput('');
    } catch (err) { alert("Failed to update weight"); }
  };

  const saveHabits = async (newHabits) => {
    // Filter out empty titles before saving
    const validHabits = newHabits.filter(h => h.title.trim() !== "");
    
    try {
        // Send to backend
        const res = await axios.post('https://tracker-api-y699.onrender.com/api/update-habits', { habits: validHabits }, { headers: {'x-auth-token': token}});
        
        // Update local state immediately with the response (which should contain clean IDs)
        setUser({...user, habits: res.data.habits || validHabits}); 
        setIsEditing(false);
    } catch (err) { 
        console.error(err);
        alert("Failed to update habits. Check your internet or login status."); 
    }
  };

  if (error) return <div className="text-center mt-10 text-red-500">{error}</div>;
  if (!user) return <div className="text-center mt-10 text-white animate-pulse">Loading Profile...</div>;

  // --- Logic for 75 Day Grid ---
  const startDate = new Date(user.startDate || user.dailyLogs[0]?.date || new Date());
  const todayDate = new Date();
  todayDate.setHours(0,0,0,0);

  const fullJourney = Array.from({ length: 75 }, (_, i) => {
      const current = new Date(startDate);
      current.setDate(startDate.getDate() + i);
      current.setHours(0,0,0,0);
      
      const dateStr = current.toISOString().split('T')[0];
      const log = user.dailyLogs.find(l => l.date === dateStr);
      
      let status = 'future';
      if (current.getTime() === todayDate.getTime()) status = 'today';
      else if (current < todayDate) {
          status = log?.fullyCompleted ? 'done' : 'missed';
      } else if (log?.fullyCompleted) {
          status = 'done'; 
      }

      return { day: i + 1, date: dateStr, status };
  });

  const lastWeightDate = user.weights.length > 0 ? new Date(user.weights[user.weights.length - 1].date) : null;
  const isWeightDue = lastWeightDate ? (new Date() - lastWeightDate) / (1000 * 60 * 60 * 24) > 7 : true;

  return (
    <div className="pb-24 pt-4 px-1 max-w-md mx-auto">
      {showConfetti && <Confetti numberOfPieces={200} recycle={false} />}
      
      {/* 🔔 Alert */}
      {isMe && isWeightDue && (
          <div className="mb-4 bg-yellow-900/30 border border-yellow-600/50 p-3 rounded-xl flex items-center gap-3">
              <AlertTriangle className="text-yellow-500" size={20} />
              <p className="text-sm font-bold text-yellow-200">Time to update your weight!</p>
          </div>
      )}

      {/* 👤 Header */}
      <div className="bg-gray-800 border border-gray-700 p-6 rounded-2xl mb-6 text-center shadow-lg relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>
        <h2 className="text-3xl font-extrabold text-white mb-1">{user.username}</h2>
        
        <div className="flex justify-center items-center gap-3 mt-5">
            <div className="bg-orange-900/20 text-orange-400 px-4 py-2 rounded-xl flex flex-col items-center border border-orange-500/30 min-w-[80px]">
                <Flame size={20} fill="currentColor" className="mb-1" />
                <span className="text-lg font-bold">{user.currentStreak}</span>
                <span className="text-[10px] uppercase font-bold opacity-70">Streak</span>
            </div>
            <div className="bg-blue-900/20 text-blue-400 px-4 py-2 rounded-xl flex flex-col items-center border border-blue-500/30 min-w-[80px]">
                <Scale size={20} className="mb-1" />
                <span className="text-lg font-bold">{user.weights.length > 0 ? user.weights[user.weights.length-1].value : '--'}</span>
                <span className="text-[10px] uppercase font-bold opacity-70">Kg</span>
            </div>
        </div>
      </div>

      {/* ✅ Habits */}
      <div className="flex justify-between items-end mb-3 px-1">
           <h3 className="text-lg font-bold text-gray-200 flex items-center gap-2"><CheckSquare size={18} className="text-blue-500"/> Daily Protocol</h3>
           {isMe && <button onClick={() => setIsEditing(true)} className="text-xs flex items-center gap-1 bg-gray-800 border border-gray-700 px-3 py-1.5 rounded-lg text-gray-300 hover:text-white transition-colors"><Edit3 size={12}/> Customize</button>}
      </div>

      <div className="space-y-3 mb-8">
        {user.habits.map(habit => {
            const isDone = todayLog.completedHabits.includes(habit.id);
            return (
                <div key={habit.id} onClick={() => toggleHabit(habit.id)} className={`relative p-4 rounded-xl border-2 transition-all cursor-pointer group shadow-sm flex items-center gap-4
                        ${isDone ? 'bg-green-900/20 border-green-500/50' : 'bg-gray-800 border-gray-700 hover:bg-gray-750'}`}>
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${isDone ? 'bg-green-500 border-green-500' : 'border-gray-500'}`}>
                        {isDone && <CheckSquare size={14} className="text-black" strokeWidth={4} />}
                    </div>
                    <span className={`font-semibold text-lg ${isDone ? 'text-gray-500 line-through' : 'text-gray-100'}`}>{habit.title}</span>
                </div>
            );
        })}
      </div>

      {/* 🗺️ 75 Day Roadmap */}
      <h3 className="text-lg font-bold text-gray-200 mb-3 px-1 flex items-center gap-2">
          <Calendar size={18} className="text-blue-500"/>
          75 Day Journey
      </h3>
      <div className="bg-gray-800 border border-gray-700 p-4 rounded-xl mb-6 shadow-lg">
          <div className="grid grid-cols-7 gap-2">
            {fullJourney.map((day) => (
                <div key={day.day} className={`aspect-square rounded-lg flex flex-col items-center justify-center text-[10px] font-bold border transition-all relative
                    ${day.status === 'done' ? 'bg-green-500 text-black border-green-400' : 
                      day.status === 'missed' ? 'bg-red-900/40 text-red-400 border-red-800' : 
                      day.status === 'today' ? 'bg-blue-600 text-white border-blue-400 animate-pulse' :
                      'bg-gray-900 text-gray-600 border-gray-800'}`}>
                    
                    <span>{day.day}</span>
                    {day.status === 'done' && <CheckSquare size={8} strokeWidth={4}/>}
                    {day.status === 'missed' && <X size={8} strokeWidth={4}/>}
                </div>
            ))}
          </div>
          <div className="flex justify-between mt-4 text-xs text-gray-400 px-2">
              <div className="flex items-center gap-1"><div className="w-2 h-2 bg-green-500 rounded-sm"></div>Done</div>
              <div className="flex items-center gap-1"><div className="w-2 h-2 bg-blue-600 rounded-sm"></div>Today</div>
              <div className="flex items-center gap-1"><div className="w-2 h-2 bg-red-900/40 border border-red-800 rounded-sm"></div>Missed</div>
          </div>
      </div>

      {/* ⚖️ Weight Chart */}
      <h3 className="text-lg font-bold text-gray-200 mb-3 px-1 flex items-center gap-2"><Scale size={18} className="text-blue-500"/> Weight History</h3>
      <div className="bg-gray-800 border border-gray-700 p-4 rounded-xl mb-6 shadow-lg">
        <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={user.weights}>
                    <YAxis domain={['auto', 'auto']} stroke="#6b7280" fontSize={11} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '8px'}} itemStyle={{color: '#fff'}} />
                    <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={3} dot={{r:4}} />
                </LineChart>
            </ResponsiveContainer>
        </div>
        {isMe && (
            <div className="mt-4 flex gap-2">
                <input type="number" value={weightInput} onChange={(e) => setWeightInput(e.target.value)} placeholder="Current Weight (kg)" className="flex-1 bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500" />
                <button onClick={updateWeight} className="bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold px-6 py-3 shadow-lg">Log</button>
            </div>
        )}
      </div>

      <EditModal isOpen={isEditing} onClose={() => setIsEditing(false)} habits={user.habits} onSave={saveHabits} />
    </div>
  );
};

export default UserProfile;