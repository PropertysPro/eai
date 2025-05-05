import mongoose from 'mongoose';

const PropertySchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please provide a title'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Please provide a description']
  },
  price: {
    type: Number,
    required: [true, 'Please provide a price']
  },
  requestingPrice: {
    type: Number,
    default: function() {
      return this.price;
    }
  },
  isNegotiable: {
    type: Boolean,
    default: true
  },
  currency: {
    type: String,
    default: 'AED'
  },
  location: {
    type: String,
    required: [true, 'Please provide a location']
  },
  coordinates: {
    lat: Number,
    lng: Number
  },
  type: {
    type: String,
    enum: ['buy', 'sell', 'rent', 'lease', 'invest'],
    required: [true, 'Please provide a property type']
  },
  propertyType: {
    type: String,
    enum: ['apartment', 'villa', 'townhouse', 'penthouse', 'office', 'retail', 'land', 'warehouse'],
    required: [true, 'Please provide a property category']
  },
  features: {
    bedrooms: Number,
    bathrooms: Number,
    area: Number,
    areaUnit: {
      type: String,
      default: 'sqft'
    },
    parking: Number,
    furnished: Boolean,
    amenities: [String],
    yearBuilt: Number
  },
  images: [{
    url: String,
    caption: String
  }],
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  inquiries: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    message: String,
    timestamp: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['pending', 'responded', 'closed'],
      default: 'pending'
    }
  }],
  views: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['active', 'pending', 'sold', 'rented', 'inactive'],
    default: 'active'
  },
  // Distressed Deal fields
  isDistressed: {
    type: Boolean,
    default: false
  },
  distressReason: {
    type: String,
    enum: ['Foreclosure', 'Relocation', 'Financial Hardship', 'Divorce', 'Estate Sale', 'Job Loss', 'Medical Emergency', 'Other', ''],
    default: ''
  },
  originalPrice: {
    type: Number,
    default: 0
  },
  distressedDealApproved: {
    type: Boolean,
    default: false
  },
  distressedDealStartDate: {
    type: Date
  },
  distressedDealEndDate: {
    type: Date
  },
  distressedDealDuration: {
    type: Number,
    default: 7,
    min: 1
  },
  distressedDealDailyFee: {
    type: Number,
    default: 100
  },
  distressedDealPaymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'overdue', ''],
    default: 'pending'
  }
}, {
  timestamps: true
});

// Create index for location-based searches
PropertySchema.index({ location: 'text', title: 'text', description: 'text' });

export default mongoose.model('Property', PropertySchema);