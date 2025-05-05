-- Sample Subscription Plans
INSERT INTO subscription_plans (name, description, price, currency, duration_days, features, is_active)
VALUES
  ('Free', 'Basic access to property listings', 0, 'AED', 30, '{"listings": 3, "matches": 10, "ai_chat": false, "featured_listings": false, "analytics": false}', true),
  ('Premium', 'Enhanced access with AI recommendations', 49.99, 'AED', 30, '{"listings": 10, "matches": 50, "ai_chat": true, "featured_listings": false, "analytics": true}', true),
  ('Professional', 'Full access with featured listings', 99.99, 'AED', 30, '{"listings": 30, "matches": 100, "ai_chat": true, "featured_listings": true, "analytics": true}', true);

-- Sample Properties
INSERT INTO properties (
  title, 
  description, 
  price, 
  currency, 
  property_type, 
  status, 
  bedrooms, 
  bathrooms, 
  area, 
  area_unit, 
  location, 
  features, 
  images, 
  is_featured, 
  is_verified, 
  is_negotiable
)
VALUES
  (
    'Luxury Apartment in Downtown',
    'Stunning apartment with panoramic views of the city skyline. This modern apartment features high-end finishes, an open floor plan, and floor-to-ceiling windows.',
    1500000,
    'AED',
    'apartment',
    'active',
    2,
    2,
    1200,
    'sqft',
    '{"address": "Downtown Dubai", "city": "Dubai", "country": "UAE", "coordinates": {"lat": 25.204849, "lng": 55.270783}}',
    '{"pool": true, "gym": true, "parking": true, "security": true, "balcony": true}',
    '["https://images.unsplash.com/photo-1522708323590-d24dbb6b0267", "https://images.unsplash.com/photo-1560448204-603b3fc33ddc", "https://images.unsplash.com/photo-1484154218962-a197022b5858"]',
    true,
    true,
    true
  ),
  (
    'Spacious Villa in Palm Jumeirah',
    'Exquisite villa located on the iconic Palm Jumeirah. This property offers luxurious living with private beach access, a swimming pool, and stunning sea views.',
    12000000,
    'AED',
    'villa',
    'active',
    5,
    6,
    6500,
    'sqft',
    '{"address": "Palm Jumeirah", "city": "Dubai", "country": "UAE", "coordinates": {"lat": 25.112350, "lng": 55.138779}}',
    '{"pool": true, "garden": true, "parking": true, "security": true, "beach_access": true, "maid_room": true}',
    '["https://images.unsplash.com/photo-1613977257363-707ba9348227", "https://images.unsplash.com/photo-1613977257592-4a9a32f9141b", "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9"]',
    true,
    true,
    true
  ),
  (
    'Modern Townhouse in Arabian Ranches',
    'Beautiful townhouse in the prestigious Arabian Ranches community. This family-friendly property features a spacious layout, modern amenities, and access to community facilities.',
    3500000,
    'AED',
    'townhouse',
    'active',
    3,
    3.5,
    2800,
    'sqft',
    '{"address": "Arabian Ranches", "city": "Dubai", "country": "UAE", "coordinates": {"lat": 25.026707, "lng": 55.252678}}',
    '{"garden": true, "parking": true, "community_pool": true, "playground": true}',
    '["https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6", "https://images.unsplash.com/photo-1558036117-15d82a90b9b1", "https://images.unsplash.com/photo-1560185007-cde436f6a4d0"]',
    false,
    true,
    true
  ),
  (
    'Penthouse with Burj Khalifa View',
    'Exclusive penthouse offering breathtaking views of the Burj Khalifa and Dubai skyline. This luxury residence features premium finishes, a private terrace, and top-of-the-line appliances.',
    8500000,
    'AED',
    'penthouse',
    'active',
    4,
    4.5,
    4200,
    'sqft',
    '{"address": "Business Bay", "city": "Dubai", "country": "UAE", "coordinates": {"lat": 25.185358, "lng": 55.262726}}',
    '{"pool": true, "gym": true, "parking": true, "security": true, "terrace": true, "smart_home": true}',
    '["https://images.unsplash.com/photo-1600607687644-c7531e489ece", "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d", "https://images.unsplash.com/photo-1600566752355-35792bedcfea"]',
    true,
    true,
    false
  ),
  (
    'Studio Apartment in Dubai Marina',
    'Cozy studio apartment in the heart of Dubai Marina. Perfect for investors or young professionals, this property offers modern living with stunning marina views.',
    750000,
    'AED',
    'apartment',
    'active',
    0,
    1,
    550,
    'sqft',
    '{"address": "Dubai Marina", "city": "Dubai", "country": "UAE", "coordinates": {"lat": 25.080406, "lng": 55.143764}}',
    '{"pool": true, "gym": true, "parking": true, "security": true, "balcony": true}',
    '["https://images.unsplash.com/photo-1502672260266-1c1ef2d93688", "https://images.unsplash.com/photo-1554995207-c18c203602cb", "https://images.unsplash.com/photo-1560448204-e02f11c3d0c2"]',
    false,
    true,
    true
  ),
  (
    'Office Space in DIFC',
    'Premium office space in Dubai International Financial Centre. This commercial property offers a prestigious address, modern facilities, and excellent connectivity.',
    4200000,
    'AED',
    'commercial',
    'active',
    null,
    2,
    1800,
    'sqft',
    '{"address": "DIFC", "city": "Dubai", "country": "UAE", "coordinates": {"lat": 25.211760, "lng": 55.275703}}',
    '{"parking": true, "security": true, "meeting_rooms": true, "reception": true}',
    '["https://images.unsplash.com/photo-1497366754035-f200968a6e72", "https://images.unsplash.com/photo-1497366811353-6870744d04b2", "https://images.unsplash.com/photo-1604328698692-f76ea9498e76"]',
    false,
    true,
    true
  ),
  (
    'Beachfront Apartment in JBR',
    'Stunning beachfront apartment in Jumeirah Beach Residence. Enjoy direct beach access, sea views, and resort-style living in this well-appointed property.',
    2800000,
    'AED',
    'apartment',
    'active',
    2,
    2.5,
    1500,
    'sqft',
    '{"address": "JBR", "city": "Dubai", "country": "UAE", "coordinates": {"lat": 25.080925, "lng": 55.134440}}',
    '{"pool": true, "gym": true, "parking": true, "security": true, "beach_access": true}',
    '["https://images.unsplash.com/photo-1560185008-a33f5c7b1844", "https://images.unsplash.com/photo-1560184897-ae75f418493e", "https://images.unsplash.com/photo-1560185127-6ed189bf02f4"]',
    true,
    true,
    true
  ),
  (
    'Family Home in Mirdif',
    'Spacious family home in the quiet residential area of Mirdif. This property features a large garden, multiple living areas, and is close to schools and amenities.',
    4500000,
    'AED',
    'villa',
    'active',
    4,
    4,
    3500,
    'sqft',
    '{"address": "Mirdif", "city": "Dubai", "country": "UAE", "coordinates": {"lat": 25.217697, "lng": 55.418131}}',
    '{"garden": true, "parking": true, "maid_room": true, "storage": true}',
    '["https://images.unsplash.com/photo-1564013799919-ab600027ffc6", "https://images.unsplash.com/photo-1576941089067-2de3c901e126", "https://images.unsplash.com/photo-1598928506311-c55ded91a20c"]',
    false,
    true,
    true
  ),
  (
    'Investment Opportunity in Sports City',
    'Great investment opportunity in Dubai Sports City. This apartment offers excellent rental yields and is located in a growing community with sports facilities.',
    950000,
    'AED',
    'apartment',
    'active',
    1,
    1,
    750,
    'sqft',
    '{"address": "Sports City", "city": "Dubai", "country": "UAE", "coordinates": {"lat": 25.032564, "lng": 55.226761}}',
    '{"pool": true, "gym": true, "parking": true, "sports_facilities": true}',
    '["https://images.unsplash.com/photo-1493809842364-78817add7ffb", "https://images.unsplash.com/photo-1502005097973-6a7082348e28", "https://images.unsplash.com/photo-1560185007-5f0bb1866cab"]',
    false,
    true,
    true
  ),
  (
    'Retail Space in Dubai Mall',
    'Prime retail space in the world-famous Dubai Mall. This commercial property offers high foot traffic, prestigious location, and excellent business potential.',
    15000000,
    'AED',
    'commercial',
    'active',
    null,
    1,
    2200,
    'sqft',
    '{"address": "Dubai Mall", "city": "Dubai", "country": "UAE", "coordinates": {"lat": 25.197197, "lng": 55.279376}}',
    '{"storage": true, "display_windows": true, "high_ceiling": true}',
    '["https://images.unsplash.com/photo-1582037928769-181cf6ea3a9c", "https://images.unsplash.com/photo-1604328698692-f76ea9498e76", "https://images.unsplash.com/photo-1604328471023-7c8fe11f5f5b"]',
    true,
    true,
    false
  );

-- Sample Chat Sessions
INSERT INTO chat_sessions (
  id,
  user_id,
  title,
  property_context,
  last_message,
  last_message_time
)
VALUES
  (
    '123e4567-e89b-12d3-a456-426614174000',
    (SELECT id FROM users LIMIT 1),
    'Property Recommendations in Downtown',
    '{"id": "123e4567-e89b-12d3-a456-426614174001", "title": "Luxury Apartment in Downtown", "imageUrl": "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267"}',
    'I can help you find similar properties in that area. Would you like to see more options?',
    NOW() - INTERVAL '2 days'
  ),
  (
    '123e4567-e89b-12d3-a456-426614174002',
    (SELECT id FROM users LIMIT 1),
    'Investment Property Advice',
    null,
    'Based on current market trends, Sports City offers good rental yields for 1-bedroom apartments.',
    NOW() - INTERVAL '5 days'
  );

-- Sample Chat Messages
INSERT INTO chat_messages (
  session_id,
  role,
  content
)
VALUES
  (
    '123e4567-e89b-12d3-a456-426614174000',
    'user',
    'I am looking for a 2-bedroom apartment in Downtown Dubai with a budget of around 1.5 million AED.'
  ),
  (
    '123e4567-e89b-12d3-a456-426614174000',
    'assistant',
    'I found several options that match your criteria. One of the best options is a Luxury Apartment in Downtown with panoramic views of the city skyline for 1.5 million AED. It has 2 bedrooms, 2 bathrooms, and is 1,200 sqft.'
  ),
  (
    '123e4567-e89b-12d3-a456-426614174000',
    'user',
    'That sounds interesting. Does it have any amenities like a pool or gym?'
  ),
  (
    '123e4567-e89b-12d3-a456-426614174000',
    'assistant',
    'Yes, this property includes access to a pool, gym, parking, and 24/7 security. It also has a balcony with city views.'
  ),
  (
    '123e4567-e89b-12d3-a456-426614174000',
    'user',
    'Are there any similar properties in the same area?'
  ),
  (
    '123e4567-e89b-12d3-a456-426614174000',
    'assistant',
    'I can help you find similar properties in that area. Would you like to see more options?'
  ),
  (
    '123e4567-e89b-12d3-a456-426614174002',
    'user',
    'I am looking to invest in a property in Dubai. What areas offer the best rental yields?'
  ),
  (
    '123e4567-e89b-12d3-a456-426614174002',
    'assistant',
    'For investment properties in Dubai, areas like Sports City, JVC, and Discovery Gardens typically offer higher rental yields. What budget range are you considering?'
  ),
  (
    '123e4567-e89b-12d3-a456-426614174002',
    'user',
    'I am looking at around 1 million AED. What type of property would you recommend?'
  ),
  (
    '123e4567-e89b-12d3-a456-426614174002',
    'assistant',
    'Based on current market trends, Sports City offers good rental yields for 1-bedroom apartments.'
  );