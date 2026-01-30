const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('./models/User'); 
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors());

// --- Database Connection ---
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB Connected Successfully');
  } catch (err) {
    console.error('❌ MongoDB Connection Error:', err.message);
  }
};
connectDB();

// --- Auth Middleware ---
const auth = (req, res, next) => {
  const token = req.header('x-auth-token');
  if (!token) return res.status(401).send('Access Denied');
  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    req.user = verified;
    next();
  } catch (err) {
    res.status(400).send('Invalid Token');
  }
};

// --- Helper: Date Formatter ---
const getTodayStr = () => new Date().toISOString().split('T')[0];

// --- Routes ---

// 1. Register
app.post('/api/register', async (req, res) => {
  try {
    const existingUser = await User.findOne({ email: req.body.email });
    if (existingUser) return res.status(400).send('Email already exists');

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(req.body.password, salt);
    
    const defaultHabits = [
        { title: "Drink 4L Water", id: "h1" },
        { title: "45min Workout", id: "h2" },
        { title: "Read 10 Pages", id: "h3" },
        { title: "No Junk Food", id: "h4" },
        { title: "Take Progress Pic", id: "h5" }
    ];

    const user = new User({ 
        ...req.body, 
        password: hashedPassword,
        habits: defaultHabits 
    });
    
    await user.save();
    res.send({ user_id: user._id });
  } catch (err) { res.status(500).send(err.message); }
});

// 2. Login
app.post('/api/login', async (req, res) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user) return res.status(400).send('User not found');
  const validPass = await bcrypt.compare(req.body.password, user.password);
  if (!validPass) return res.status(400).send('Invalid password');
  
  // payload uses _id to match middleware
  const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET);
  res.send({ token, user: { id: user._id, username: user.username } });
});

// 3. Get All Users (Dashboard Leaderboard) -> WITH AUTO-RESET LOGIC
app.get('/api/users', async (req, res) => {
  let users = await User.find().select('-password');
  
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  // Check every user for missed days
  for (let user of users) {
    if (user.currentStreak > 0 && user.dailyLogs.length > 0) {
      // Find the last date they successfully completed everything
      const lastLog = user.dailyLogs.reverse().find(log => log.fullyCompleted);
      
      if (lastLog) {
          const lastDate = lastLog.date;
          // If the last completion wasn't Today AND wasn't Yesterday, they broke the streak.
          if (lastDate !== todayStr && lastDate !== yesterdayStr) {
              user.currentStreak = 0;
              await user.save(); // Save the reset to database
          }
      }
    }
  }

  // Sort by streak (Highest first)
  users.sort((a, b) => b.currentStreak - a.currentStreak);
  res.json(users);
});

// 4. Get Single User Profile
app.get('/api/user/:id', auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    res.json(user);
  } catch (err) {
    res.status(404).send('User not found');
  }
});

// 5. UPDATE HABITS (*** NEWLY ADDED ***)
app.post('/api/update-habits', auth, async (req, res) => {
    try {
        const { habits } = req.body; // Expecting array of {id, title}
        const user = await User.findById(req.user._id);
        
        if (!user) return res.status(404).json({ msg: "User not found" });

        // Update the user's habits
        user.habits = habits;
        
        await user.save();
        res.json({ habits: user.habits });
    } catch (err) {
        console.error("Update Habits Error:", err);
        res.status(500).send("Server Error");
    }
});

// 6. Toggle Habit (Check/Uncheck)
app.post('/api/log', auth, async (req, res) => {
  const { habitId, isChecked } = req.body;
  const user = await User.findById(req.user._id);
  const todayStr = getTodayStr();
  
  let log = user.dailyLogs.find(l => l.date === todayStr);
  if (!log) {
    log = { date: todayStr, completedHabits: [], fullyCompleted: false };
    user.dailyLogs.push(log);
  }

  if (isChecked) {
    if (!log.completedHabits.includes(habitId)) log.completedHabits.push(habitId);
  } else {
    log.completedHabits = log.completedHabits.filter(id => id !== habitId);
  }

  // Check if ALL current habits are done
  // We compare user.habits (current list) vs log.completedHabits
  const allHabitsDone = user.habits.every(h => log.completedHabits.includes(h.id));
  
  if (allHabitsDone && !log.fullyCompleted) {
    log.fullyCompleted = true;
    user.currentStreak += 1;
  } else if (!allHabitsDone && log.fullyCompleted) {
    log.fullyCompleted = false;
    user.currentStreak = Math.max(0, user.currentStreak - 1);
  }

  await user.save();
  res.json({ currentStreak: user.currentStreak, fullyCompleted: log.fullyCompleted });
});

// 7. Update Weight
app.post('/api/weight', auth, async (req, res) => {
  const user = await User.findById(req.user._id);
  user.weights.push({ value: req.body.weight, date: new Date() });
  await user.save();
  res.json(user.weights);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));