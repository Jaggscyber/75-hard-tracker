import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Dumbbell, Loader2 } from 'lucide-react';

const Login = () => {
  const [isRegister, setIsRegister] = useState(false);
  const [formData, setFormData] = useState({ username: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    // Ensure this matches your server URL
    const API_URL = 'https://tracker-api-y699.onrender.com/api'; 

    try {
      const endpoint = isRegister ? '/register' : '/login';
      const res = await axios.post(`${API_URL}${endpoint}`, formData);

      if (isRegister) {
        setIsRegister(false);
        setError('');
        alert('Account created! Please login.');
      } else {
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('userId', res.data.user.id);
        localStorage.setItem('username', res.data.user.username);
        navigate('/');
        window.location.reload();
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Connection failed. Is the server running?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex flex-col justify-center items-center px-4">
      {/* Brand Logo */}
      <div className="mb-8 text-center">
        <div className="bg-blue-600 p-3 rounded-full inline-block mb-3 shadow-lg shadow-blue-500/30">
            <Dumbbell size={32} className="text-white" />
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">75 Hard</h1>
        <p className="text-gray-400 text-sm mt-1">Discipline. Consistency. Victory.</p>
      </div>

      {/* Card Container */}
      <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 p-6 rounded-2xl w-full max-w-sm shadow-xl">
        <h2 className="text-xl font-bold mb-6 text-white text-center">
          {isRegister ? 'Create Account' : 'Welcome Back'}
        </h2>
        
        {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-200 p-3 rounded-lg mb-4 text-sm text-center">
                {error}
            </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <div>
                <label className="text-xs font-semibold text-gray-400 ml-1 mb-1 block">Username</label>
                <input 
                  name="username" 
                  placeholder="e.g. DavidGoggins" 
                  onChange={handleChange} 
                  className="w-full bg-gray-900 border border-gray-700 focus:border-blue-500 p-3 rounded-lg text-white outline-none transition-all"
                  required 
                />
            </div>
          )}
          
          <div>
            <label className="text-xs font-semibold text-gray-400 ml-1 mb-1 block">Email Address</label>
            <input 
                name="email" 
                type="email" 
                placeholder="name@example.com" 
                onChange={handleChange} 
                className="w-full bg-gray-900 border border-gray-700 focus:border-blue-500 p-3 rounded-lg text-white outline-none transition-all"
                required 
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-400 ml-1 mb-1 block">Password</label>
            <input 
                name="password" 
                type="password" 
                placeholder="••••••••" 
                onChange={handleChange} 
                className="w-full bg-gray-900 border border-gray-700 focus:border-blue-500 p-3 rounded-lg text-white outline-none transition-all"
                required 
            />
          </div>
          
          <button 
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-bold py-3.5 rounded-lg transition-all flex justify-center items-center mt-2 shadow-lg shadow-blue-900/20"
          >
            {loading ? <Loader2 className="animate-spin" /> : (isRegister ? 'Start Challenge' : 'Login')}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-gray-700 text-center">
          <p className="text-gray-400 text-sm">
            {isRegister ? 'Already joined?' : "New here?"} 
            <button 
              onClick={() => setIsRegister(!isRegister)} 
              className="text-blue-400 font-semibold ml-2 hover:text-blue-300 transition-colors"
            >
              {isRegister ? 'Login' : 'Create Account'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;