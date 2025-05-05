import mongoose from 'mongoose';

const SubscriptionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  id: {
    type: String,
    required: true,
    unique: true
  },
  price: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'AED'
  },
  duration: {
    type: String,
    enum: ['month', '6months', 'year'],
    required: true
  },
  features: [{
    type: String,
    required: true
  }],
  isPopular: {
    type: Boolean,
    default: false
  },
  limits: {
    propertiesPerMonth: Number,
    inquiriesPerDay: Number,
    aiMessagesPerDay: Number,
    savedProperties: Number
  },
  active: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

export default mongoose.model('Subscription', SubscriptionSchema);