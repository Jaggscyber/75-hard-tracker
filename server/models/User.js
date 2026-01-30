const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  
  // Game Stats
  currentStreak: { type: Number, default: 0 },
  lastCompletedDate: { type: Date, default: null }, // To check for missed days
  startDate: { type: Date, default: Date.now },
  
  // Custom Habits Template (e.g., "Read 10 pages", "Drink 3L water")
  habits: [{ 
    title: String, 
    id: String // Simple unique ID for the habit
  }],

  // Daily Logs (History of what happened each day)
  dailyLogs: [{
    date: String, // Format "YYYY-MM-DD"
    completedHabits: [String], // Array of habit IDs completed
    fullyCompleted: Boolean,
    failReason: String
  }],

  // Weight Tracking
  weights: [{
    date: { type: Date, default: Date.now },
    value: Number
  }]
});

module.exports = mongoose.model('User', UserSchema);