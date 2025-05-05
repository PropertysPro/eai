import mongoose from 'mongoose';

const MessageSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true
  },
  sender: {
    type: String,
    enum: ['user', 'ai'],
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  attachments: [{
    type: {
      type: String,
      enum: ['image', 'document', 'audio', 'location'],
      required: true
    },
    url: {
      type: String,
      required: true
    },
    name: String,
    size: Number,
    duration: Number,
    location: {
      latitude: Number,
      longitude: Number,
      address: String
    }
  }]
});

const ChatSessionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    default: 'Ella AI'
  },
  messages: [MessageSchema],
  lastMessage: {
    type: String,
    default: ''
  },
  unread: {
    type: Number,
    default: 0
  },
  context: {
    propertySearch: {
      locations: [String],
      propertyTypes: [String],
      budgetMin: Number,
      budgetMax: Number,
      purpose: String
    },
    recentTopics: [String],
    propertyReferences: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Property'
    }]
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Add methods to the schema
ChatSessionSchema.methods = {
  // Mark all messages as read
  markAsRead: function() {
    this.unread = 0;
    return this.save();
  },
  
  // Add a message to the session
  addMessage: function(message) {
    this.messages.push(message);
    this.lastMessage = message.text.substring(0, 100);
    this.updatedAt = Date.now();
    
    if (message.sender === 'ai') {
      this.unread += 1;
    }
    
    return this.save();
  },
  
  // End the session (mark as inactive)
  endSession: function() {
    this.isActive = false;
    return this.save();
  },
  
  // Reactivate the session
  reactivateSession: function() {
    this.isActive = true;
    this.updatedAt = Date.now();
    return this.save();
  }
};

// Static methods
ChatSessionSchema.statics = {
  // Get active sessions for a user
  getActiveSessionsForUser: function(userId) {
    return this.find({ 
      user: userId,
      isActive: true
    })
    .sort({ updatedAt: -1 })
    .exec();
  },
  
  // Get all sessions for a user
  getAllSessionsForUser: function(userId) {
    return this.find({ user: userId })
      .sort({ updatedAt: -1 })
      .exec();
  },
  
  // Create a new session
  createSession: function(userId, title = 'Ella AI') {
    return this.create({
      user: userId,
      title,
      messages: [],
      lastMessage: '',
      unread: 0,
      isActive: true
    });
  }
};

export default mongoose.model('ChatSession', ChatSessionSchema);