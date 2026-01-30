import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { Trophy, Flame, AlertCircle, User } from 'lucide-react';

const Dashboard = () => {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    // Fetch all users for the leaderboard
    axios.get('https://tracker-api-y699.onrender.com/api/users')
      .then(res => setUsers(res.data))
      .catch(err => console.error(err));
  }, []);

  return (
    <div className="pb-20 pt-4 px-4 max-w-md mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-extrabold text-white tracking-tight">75 Hard Challenge</h1>
        <p className="text-gray-400 text-sm mt-1">Race to the Finish Line</p>
      </div>

      {/* Leaderboard List */}
      <div className="space-y-4">
        {users.map((user, index) => {
          // Calculate who is leading
          const leaderStreak = users[0]?.currentStreak || 0;
          const daysBehind = leaderStreak - user.currentStreak;
          
          return (
            <Link to={`/user/${user._id}`} key={user._id} className="block group">
              <div className={`relative p-5 rounded-2xl border transition-all duration-200 transform active:scale-95 shadow-xl
                ${index === 0 
                  ? 'bg-gradient-to-br from-yellow-900/50 to-gray-900 border-yellow-500/50' 
                  : 'bg-gray-800 border-gray-700'}`}>
                
                {/* Rank Badge */}
                <div className={`absolute -left-2 -top-2 w-8 h-8 rounded-full flex items-center justify-center font-bold border-2 shadow-lg
                    ${index === 0 ? 'bg-yellow-500 text-black border-yellow-300' : 
                      index === 1 ? 'bg-gray-300 text-black border-gray-100' :
                      index === 2 ? 'bg-orange-700 text-white border-orange-500' : 'bg-gray-700 text-gray-400 border-gray-600'}`}>
                    {index + 1}
                </div>

                <div className="flex justify-between items-center pl-4">
                  
                  {/* User Info */}
                  <div className="flex items-center gap-3">
                    <div className="bg-gray-700 p-2 rounded-full">
                        <User size={20} className="text-gray-300" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-white group-hover:text-blue-400 transition-colors">
                        {user.username}
                      </h3>
                      {index > 0 && daysBehind > 0 ? (
                        <span className="text-xs text-red-400 flex items-center gap-1 font-medium bg-red-900/20 px-2 py-0.5 rounded-full w-fit">
                          <AlertCircle size={10} /> {daysBehind} days behind
                        </span>
                      ) : (
                         <span className="text-xs text-green-400 font-medium">Leading the pack!</span>
                      )}
                    </div>
                  </div>

                  {/* Streak Count */}
                  <div className="text-right">
                    <div className="flex items-center justify-end gap-1 text-orange-400 font-bold text-2xl">
                      <Flame size={24} fill="currentColor" className="animate-pulse" />
                      {user.currentStreak}
                    </div>
                    <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">Streak</span>
                  </div>

                </div>
              </div>
            </Link>
          );
        })}
      </div>
      
      {/* Empty State / Invite */}
      {users.length === 0 && (
          <div className="text-center text-gray-500 mt-10">
              No players yet. Be the first to join!
          </div>
      )}
    </div>
  );
};

export default Dashboard;