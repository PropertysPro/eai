import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a name'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: 6,
    select: false
  },
  phone: {
    type: String,
    trim: true
  },
  profileImage: {
    type: String,
    default: ''
  },
  preferences: {
    language: {
      type: String,
      enum: ['en', 'ar', 'zh', 'ru'],
      default: 'en'
    },
    notifications: {
      matches: {
        type: Boolean,
        default: true
      },
      marketUpdates: {
        type: Boolean,
        default: true
      },
      newListings: {
        type: Boolean,
        default: true
      },
      subscriptionUpdates: {
        type: Boolean,
        default: true
      }
    },
    biometricAuth: {
      type: Boolean,
      default: false
    },
    darkMode: {
      type: Boolean,
      default: false
    },
    propertyPreferences: {
      locations: [String],
      propertyTypes: [String],
      budgetMin: Number,
      budgetMax: Number,
      requestingPrice: Number,
      isNegotiable: {
        type: Boolean,
        default: true
      },
      interests: [String]
    }
  },
  savedProperties: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Property'
  }],
  subscription: {
    plan: {
      type: String,
      enum: ['free', 'monthly', 'biannual', 'annual'],
      default: 'free'
    },
    startDate: Date,
    endDate: Date,
    status: {
      type: String,
      enum: ['active', 'expired', 'cancelled'],
      default: 'active'
    }
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  resetPasswordToken: String,
  resetPasswordExpire: Date
}, {
  timestamps: true
});

// Encrypt password before saving
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Match password
UserSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

export default mongoose.model('User', UserSchema);