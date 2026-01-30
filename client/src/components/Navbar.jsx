import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Dumbbell } from 'lucide-react';

const Navbar = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const userId = localStorage.getItem('userId');

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  return (
    <nav className="bg-gray-800 border-b border-gray-700 p-4 mb-4 flex justify-between items-center rounded-xl">
      <Link to="/" className="flex items-center gap-2 text-white font-bold text-lg">
        <Dumbbell className="text-blue-500" />
        75 Hard
      </Link>

      <div className="flex gap-4">
        {token ? (
          <>
            <Link to={`/user/${userId}`} className="text-gray-300 hover:text-white">My Profile</Link>
            <button onClick={handleLogout} className="text-red-400 hover:text-red-300">Logout</button>
          </>
        ) : (
          <Link to="/login" className="text-blue-400 hover:text-blue-300">Login</Link>
        )}
      </div>
    </nav>
  );
};

export default Navbar;