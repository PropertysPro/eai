import { Property } from '@/types/property';

export const mockProperties: Property[] = [
  {
    id: '1',
    title: 'Luxury Apartment in Downtown Dubai',
    description: 'Stunning 2-bedroom apartment with panoramic views of Burj Khalifa and Dubai Fountain. This modern apartment features high-end finishes, floor-to-ceiling windows, and a spacious balcony. The building offers premium amenities including a swimming pool, gym, and 24/7 security.',
    price: 1850000,
    currency: 'AED',
    type: 'apartment',
    status: 'active',
    location: 'Downtown Dubai',
    address: 'Burj Vista, Downtown Dubai',
    city: 'Dubai',
    country: 'UAE',
    
    bedrooms: 2,
    bathrooms: 2.5,
    area: 1250,
    areaUnit: 'sqft',
    features: [
      'Balcony',
      'Floor 15',
      'Parking',
      'View: Burj Khalifa'
    ],
    amenities: ['Swimming Pool', 'Gym', 'Sauna', '24/7 Security', 'Concierge'],
    imageUrl: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTB8fGx1eHVyeSUyMGFwYXJ0bWVudHxlbnwwfHwwfHx8MA%3D%3D',
    images: [
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTB8fGx1eHVyeSUyMGFwYXJ0bWVudHxlbnwwfHwwfHx8MA%3D%3D',
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8YXBhcnRtZW50JTIwbGl2aW5nJTIwcm9vbXxlbnwwfHwwfHx8MA%3D%3D',
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTd8fGFwYXJ0bWVudCUyMGtpdGNoZW58ZW58MHx8MHx8fDA%3D',
      'https://images.unsplash.com/photo-1560185007-c5ca9d2c014d?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTB8fGFwYXJ0bWVudCUyMGJhdGhyb29tfGVufDB8fDB8fHww'
    ],
    
    createdAt: '2023-10-15T10:30:00Z',
    updatedAt: '2023-10-20T14:45:00Z',
    featured: true,
    isHot: true,
    isMatch: true,
    isNew: false,
    
    
    
    
    
  },
  {
    id: '2',
    title: 'Beachfront Villa on Palm Jumeirah',
    description: 'Exclusive 5-bedroom villa with private beach access on Palm Jumeirah. This luxurious property features a private pool, garden, and stunning sea views. The villa includes a modern kitchen, spacious living areas, and a home theater. Perfect for those seeking privacy and luxury.',
    price: 15000000,
    currency: 'AED',
    type: 'villa',
    status: 'active',
    location: 'Palm Jumeirah',
    address: 'Frond M, Palm Jumeirah',
    city: 'Dubai',
    country: 'UAE',
    
    bedrooms: 5,
    bathrooms: 6,
    area: 7500,
    areaUnit: 'sqft',
    features: [
      'Private Pool',
      'Garden',
      'Beach Access',
      'Parking'
    ],
    amenities: ['Private Beach', 'Swimming Pool', 'Garden', 'Home Theater', 'Smart Home System', 'Maid\'s Room'],
    imageUrl: 'https://images.unsplash.com/photo-1613977257363-707ba9348227?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8bHV4dXJ5JTIwdmlsbGF8ZW58MHx8MHx8fDA%3D',
    images: [
      'https://images.unsplash.com/photo-1613977257363-707ba9348227?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8bHV4dXJ5JTIwdmlsbGF8ZW58MHx8MHx8fDA%3D',
      'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTB8fGx1eHVyeSUyMHZpbGxhJTIwbGl2aW5nJTIwcm9vbXxlbnwwfHwwfHx8MA%3D%3D',
      'https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTJ8fGx1eHVyeSUyMHZpbGxhJTIwa2l0Y2hlbnxlbnwwfHwwfHx8MA%3D%3D',
      'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTR8fGx1eHVyeSUyMHZpbGxhJTIwcG9vbHxlbnwwfHwwfHx8MA%3D%3D'
    ],
    
    createdAt: '2023-09-05T08:15:00Z',
    updatedAt: '2023-10-18T11:20:00Z',
    featured: true,
    isHot: true,
    isMatch: false,
    isNew: false,
    
    
    
    
    
  },
  {
    id: '3',
    title: 'Modern Townhouse in Arabian Ranches',
    description: 'Beautiful 3-bedroom townhouse in the family-friendly community of Arabian Ranches. This property features a modern design, spacious living areas, and a private garden. The community offers excellent amenities including parks, swimming pools, and sports facilities.',
    price: 2500000,
    currency: 'AED',
    type: 'townhouse',
    status: 'active',
    location: 'Arabian Ranches',
    address: 'Palmera 2, Arabian Ranches',
    city: 'Dubai',
    country: 'UAE',
    
    bedrooms: 3,
    bathrooms: 3.5,
    area: 2200,
    areaUnit: 'sqft',
    features: [
      'Garden',
      '2 Floors',
      'Parking',
      'Study Room'
    ],
    amenities: ['Community Pool', 'Parks', 'Tennis Court', 'Basketball Court', 'Jogging Track', '24/7 Security'],
    imageUrl: 'https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8dG93bmhvdXNlfGVufDB8fDB8fHww',
    images: [
      'https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8dG93bmhvdXNlfGVufDB8fDB8fHww',
      'https://images.unsplash.com/photo-1560185127-6ed189bf02f4?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NHx8dG93bmhvdXNlJTIwbGl2aW5nJTIwcm9vbXxlbnwwfHwwfHx8MA%3D%3D',
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTB8fHRvd25ob3VzZSUyMGtpdGNoZW58ZW58MHx8MHx8fDA%3D',
      'https://images.unsplash.com/photo-1600566752654-77f45c7defa8?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTh8fHRvd25ob3VzZSUyMGJlZHJvb218ZW58MHx8MHx8fDA%3D'
    ],
    
    createdAt: '2023-10-01T09:45:00Z',
    updatedAt: '2023-10-15T16:30:00Z',
    featured: false,
    isHot: false,
    isMatch: true,
    isNew: true,
    
    
    
    
    
  },
  {
    id: '4',
    title: 'Luxury Penthouse in Dubai Marina',
    description: 'Spectacular 4-bedroom penthouse with panoramic views of Dubai Marina and the Arabian Gulf. This exclusive property features high ceilings, premium finishes, and a private terrace. The building offers world-class amenities including infinity pools, spa, and concierge services.',
    price: 12000000,
    currency: 'AED',
    type: 'penthouse',
    status: 'active',
    location: 'Dubai Marina',
    address: 'Marina Crown, Dubai Marina',
    city: 'Dubai',
    country: 'UAE',
    
    bedrooms: 4,
    bathrooms: 5,
    area: 5000,
    areaUnit: 'sqft',
    features: [
      'Terrace',
      'Penthouse Floor',
      'Parking',
      'View: Marina & Sea'
    ],
    amenities: ['Infinity Pool', 'Gym', 'Spa', 'Concierge', 'Valet Parking', 'Private Elevator'],
    imageUrl: 'https://images.unsplash.com/photo-1622015663084-307d19eabca2?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8cGVudGhvdXNlfGVufDB8fDB8fHww',
    images: [
      'https://images.unsplash.com/photo-1622015663084-307d19eabca2?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8cGVudGhvdXNlfGVufDB8fDB8fHww',
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8cGVudGhvdXNlJTIwbGl2aW5nJTIwcm9vbXxlbnwwfHwwfHx8MA%3D%3D',
      'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NHx8cGVudGhvdXNlJTIwa2l0Y2hlbnxlbnwwfHwwfHx8MA%3D%3D',
      'https://images.unsplash.com/photo-1600210492493-0946911123ea?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NHx8cGVudGhvdXNlJTIwdGVycmFjZXxlbnwwfHwwfHx8MA%3D%3D'
    ],
    
    createdAt: '2023-09-20T14:00:00Z',
    updatedAt: '2023-10-10T09:15:00Z',
    featured: true,
    isHot: true,
    isMatch: true,
    isNew: false,
    
    
    
    
    
  },
  {
    id: '5',
    title: 'Spacious Office in Business Bay',
    description: 'Modern office space in the heart of Business Bay. This commercial property offers an open floor plan, meeting rooms, and stunning views of the Dubai Canal. The building features state-of-the-art facilities and is located near major transportation hubs.',
    price: 3500000,
    currency: 'AED',
    type: 'office',
    status: 'active',
    location: 'Business Bay',
    address: 'Aspect Tower, Business Bay',
    city: 'Dubai',
    country: 'UAE',
    
    bedrooms: 0,
    bathrooms: 2,
    area: 3000,
    areaUnit: 'sqft',
    features: [
      'Meeting Rooms',
      'Floor 12',
      'Parking',
      'Reception Area'
    ],
    amenities: ['24/7 Access', 'Security', 'Visitor Parking', 'Cafeteria', 'High-speed Internet', 'Conference Facilities'],
    imageUrl: 'https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8b2ZmaWNlJTIwc3BhY2V8ZW58MHx8MHx8fDA%3D',
    images: [
      'https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8b2ZmaWNlJTIwc3BhY2V8ZW58MHx8MHx8fDA%3D',
      'https://images.unsplash.com/photo-1497215842964-222b430dc094?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Nnx8b2ZmaWNlJTIwc3BhY2V8ZW58MHx8MHx8fDA%3D',
      'https://images.unsplash.com/photo-1577412647305-991150c7d163?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTB8fG9mZmljZSUyMG1lZXRpbmclMjByb29tfGVufDB8fDB8fHww',
      'https://images.unsplash.com/photo-1600508774634-4e11d34730e2?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTV8fG9mZmljZSUyMHJlY2VwdGlvbnxlbnwwfHwwfHx8MA%3D%3D'
    ],
    
    createdAt: '2023-10-05T11:30:00Z',
    updatedAt: '2023-10-18T13:45:00Z',
    featured: false,
    isHot: false,
    isMatch: false,
    isNew: true,
    
    
    
    
    
  },
  {
    id: '6',
    title: 'Luxury Studio Apartment in JBR',
    description: 'Stylish studio apartment in Jumeirah Beach Residence with direct beach access. This fully furnished property features modern design, high-quality finishes, and a balcony with sea views. The building offers premium amenities and is surrounded by restaurants, shops, and entertainment options.',
    price: 950000,
    currency: 'AED',
    type: 'studio',
    status: 'active',
    location: 'Jumeirah Beach Residence (JBR)',
    address: 'Sadaf 5, JBR',
    city: 'Dubai',
    country: 'UAE',
    
    bedrooms: 0,
    bathrooms: 1,
    area: 550,
    areaUnit: 'sqft',
    features: [
      'Balcony',
      'Floor 10',
      'Parking',
      'Furnished'
    ],
    amenities: ['Swimming Pool', 'Gym', 'Beach Access', 'Retail Outlets', 'Restaurants', '24/7 Security'],
    imageUrl: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NHx8YXBhcnRtZW50JTIwc3R1ZGlvfGVufDB8fDB8fHww',
    images: [
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NHx8YXBhcnRtZW50JTIwc3R1ZGlvfGVufDB8fDB8fHww',
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8YXBhcnRtZW50JTIwbGl2aW5nJTIwcm9vbXxlbnwwfHwwfHx8MA%3D%3D',
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTd8fGFwYXJ0bWVudCUyMGtpdGNoZW58ZW58MHx8MHx8fDA%3D',
      'https://images.unsplash.com/photo-1560185007-c5ca9d2c014d?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTB8fGFwYXJ0bWVudCUyMGJhdGhyb29tfGVufDB8fDB8fHww'
    ],
    
    createdAt: '2023-10-12T10:00:00Z',
    updatedAt: '2023-10-19T15:30:00Z',
    featured: false,
    isHot: false,
    isMatch: true,
    isNew: true,
    
    
    
    
    
  },
  {
    id: '7',
    title: 'Elegant Villa in Emirates Hills',
    description: 'Magnificent 6-bedroom villa in the prestigious Emirates Hills community. This luxury property sits on a large plot with landscaped gardens and a private pool. The villa features high ceilings, marble flooring, and premium finishes throughout. Perfect for those seeking exclusivity and privacy.',
    price: 25000000,
    currency: 'AED',
    type: 'villa',
    status: 'active',
    location: 'Emirates Hills',
    address: 'Sector E, Emirates Hills',
    city: 'Dubai',
    country: 'UAE',
    
    bedrooms: 6,
    bathrooms: 7,
    area: 12000,
    areaUnit: 'sqft',
    features: [
      'Private Pool',
      'Garden',
      '3 Floors',
      'Parking'
    ],
    amenities: ['Private Pool', 'Garden', 'Home Theater', 'Maid\'s Room', 'Driver\'s Room', 'BBQ Area', 'Golf Course View'],
    imageUrl: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Nnx8bHV4dXJ5JTIwdmlsbGF8ZW58MHx8MHx8fDA%3D',
    images: [
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Nnx8bHV4dXJ5JTIwdmlsbGF8ZW58MHx8MHx8fDA%3D',
      'https://images.unsplash.com/photo-1600210491892-03d54c0aaf87?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NHx8bHV4dXJ5JTIwdmlsbGElMjBsaXZpbmclMjByb29tfGVufDB8fDB8fHww',
      'https://images.unsplash.com/photo-1600566753376-12c8ab8e17a9?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTB8fGx1eHVyeSUyMHZpbGxhJTIwa2l0Y2hlbnxlbnwwfHwwfHx8MA%3D%3D',
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTZ8fGx1eHVyeSUyMHZpbGxhJTIwcG9vbHxlbnwwfHwwfHx8MA%3D%3D'
    ],
    
    createdAt: '2023-09-15T09:00:00Z',
    updatedAt: '2023-10-17T14:00:00Z',
    featured: true,
    isHot: true,
    isMatch: false,
    isNew: false,
    
    
    
    
    
  },
  {
    id: '8',
    title: 'Modern Apartment in City Walk',
    description: 'Contemporary 1-bedroom apartment in the vibrant City Walk community. This stylish property features an open-plan layout, high-quality finishes, and a balcony. The development offers a range of lifestyle amenities and is surrounded by retail outlets, restaurants, and entertainment venues.',
    price: 1200000,
    currency: 'AED',
    type: 'apartment',
    status: 'active',
    location: 'City Walk',
    address: 'Building 12, City Walk',
    city: 'Dubai',
    country: 'UAE',
    
    bedrooms: 1,
    bathrooms: 1.5,
    area: 850,
    areaUnit: 'sqft',
    features: [
      'Balcony',
      'Floor 5',
      'Parking',
      'Smart Home'
    ],
    amenities: ['Swimming Pool', 'Gym', 'Children\'s Play Area', 'Retail Outlets', 'Restaurants', '24/7 Security'],
    imageUrl: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8OHx8YXBhcnRtZW50fGVufDB8fDB8fHww',
    images: [
      'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8OHx8YXBhcnRtZW50fGVufDB8fDB8fHww',
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8YXBhcnRtZW50JTIwbGl2aW5nJTIwcm9vbXxlbnwwfHwwfHx8MA%3D%3D',
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTd8fGFwYXJ0bWVudCUyMGtpdGNoZW58ZW58MHx8MHx8fDA%3D',
      'https://images.unsplash.com/photo-1560185007-c5ca9d2c014d?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTB8fGFwYXJ0bWVudCUyMGJhdGhyb29tfGVufDB8fDB8fHww'
    ],
    
    createdAt: '2023-10-08T13:15:00Z',
    updatedAt: '2023-10-20T10:30:00Z',
    featured: false,
    isHot: false,
    isMatch: true,
    isNew: true,
    
    
    
    
    
  }
];