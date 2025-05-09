export interface City {
  id: string; // Unique identifier for the city
  name: string;
  // You can add other properties like latitude, longitude, state/province if needed
}

export interface Country {
  id: string; // Unique identifier for the country
  name: string;
  code: string; // e.g., ISO 3166-1 alpha-2 code like "US", "AE"
  cities: City[];
}

export const COUNTRIES_AND_CITIES: Country[] = [
  {
    id: 'uae',
    name: 'United Arab Emirates',
    code: 'AE',
    cities: [
      { id: 'dxb', name: 'Dubai' },
      { id: 'auh', name: 'Abu Dhabi' },
      { id: 'shj', name: 'Sharjah' },
      { id: 'ajm', name: 'Ajman' },
      { id: 'rak', name: 'Ras Al Khaimah' },
      { id: 'fuj', name: 'Fujairah' },
      { id: 'uaq', name: 'Umm Al Quwain' },
    ],
  },
  {
    id: 'usa',
    name: 'United States of America',
    code: 'US',
    cities: [
      { id: 'nyc', name: 'New York City' },
      { id: 'lax', name: 'Los Angeles' },
      { id: 'chi', name: 'Chicago' },
      { id: 'hou', name: 'Houston' },
      { id: 'phx', name: 'Phoenix' },
    ],
  },
  {
    id: 'can',
    name: 'Canada',
    code: 'CA',
    cities: [
      { id: 'tor', name: 'Toronto' },
      { id: 'mon', name: 'Montreal' },
      { id: 'van', name: 'Vancouver' },
      { id: 'cal', name: 'Calgary' },
      { id: 'ott', name: 'Ottawa' },
    ],
  },
  {
    id: 'sau',
    name: 'Saudi Arabia',
    code: 'SA',
    cities: [
      { id: 'ruh', name: 'Riyadh' },
      { id: 'jed', name: 'Jeddah' },
      { id: 'dmm', name: 'Dammam' },
      { id: 'med', name: 'Medina' },
      { id: 'mec', name: 'Mecca' },
    ],
  },
  {
    id: 'omn',
    name: 'Oman',
    code: 'OM',
    cities: [
      { id: 'mct', name: 'Muscat' },
      { id: 'sll', name: 'Salalah' },
      { id: 'soh', name: 'Sohar' },
      { id: 'nzw', name: 'Nizwa' },
    ],
  },
  {
    id: 'qat',
    name: 'Qatar',
    code: 'QA',
    cities: [
      { id: 'doh', name: 'Doha' },
      { id: 'wak', name: 'Al Wakrah' },
      { id: 'ray', name: 'Al Rayyan' },
    ],
  },
  {
    id: 'bhr',
    name: 'Bahrain',
    code: 'BH',
    cities: [
      { id: 'bah', name: 'Manama' },
      { id: 'muh', name: 'Muharraq' },
      { id: 'rif', name: 'Riffa' },
    ],
  },
  {
    id: 'kwt',
    name: 'Kuwait',
    code: 'KW',
    cities: [
      { id: 'kwi', name: 'Kuwait City' },
      { id: 'jah', name: 'Al Jahra' },
      { id: 'sal', name: 'Salmiya' },
    ],
  },
  {
    id: 'gbr',
    name: 'United Kingdom',
    code: 'GB',
    cities: [
      { id: 'lon', name: 'London' },
      { id: 'man', name: 'Manchester' },
      { id: 'bir', name: 'Birmingham' },
      { id: 'gla', name: 'Glasgow' },
      { id: 'liv', name: 'Liverpool' },
    ],
  },
  {
    id: 'deu',
    name: 'Germany',
    code: 'DE',
    cities: [
      { id: 'ber', name: 'Berlin' },
      { id: 'ham', name: 'Hamburg' },
      { id: 'mun', name: 'Munich' },
      { id: 'fra', name: 'Frankfurt' },
      { id: 'cgn', name: 'Cologne' },
    ],
  },
  {
    id: 'fra',
    name: 'France',
    code: 'FR',
    cities: [
      { id: 'par', name: 'Paris' },
      { id: 'mrs', name: 'Marseille' },
      { id: 'lys', name: 'Lyon' },
      { id: 'tls', name: 'Toulouse' },
      { id: 'nce', name: 'Nice' },
    ],
  },
  {
    id: 'esp',
    name: 'Spain',
    code: 'ES',
    cities: [
      { id: 'mad', name: 'Madrid' },
      { id: 'bcn', name: 'Barcelona' },
      { id: 'val', name: 'Valencia' },
      { id: 'sev', name: 'Seville' },
      { id: 'zar', name: 'Zaragoza' },
    ],
  },
  {
    id: 'ita',
    name: 'Italy',
    code: 'IT',
    cities: [
      { id: 'rom', name: 'Rome' },
      { id: 'mil', name: 'Milan' },
      { id: 'nap', name: 'Naples' },
      { id: 'tur', name: 'Turin' },
      { id: 'pal', name: 'Palermo' },
    ],
  },
  {
    id: 'egy',
    name: 'Egypt',
    code: 'EG',
    cities: [
      { id: 'cai', name: 'Cairo' },
      { id: 'alx', name: 'Alexandria' },
      { id: 'giz', name: 'Giza' },
      { id: 'lxr', name: 'Luxor' },
      { id: 'asw', name: 'Aswan' },
    ],
  },
  {
    id: 'syr',
    name: 'Syria',
    code: 'SY',
    cities: [
      { id: 'dam', name: 'Damascus' },
      { id: 'alp', name: 'Aleppo' },
      { id: 'hms', name: 'Homs' },
    ],
  },
  {
    id: 'jor',
    name: 'Jordan',
    code: 'JO',
    cities: [
      { id: 'amm', name: 'Amman' },
      { id: 'zar', name: 'Zarqa' },
      { id: 'irb', name: 'Irbid' },
    ],
  },
  {
    id: 'lbn',
    name: 'Lebanon',
    code: 'LB',
    cities: [
      { id: 'bey', name: 'Beirut' },
      { id: 'tri', name: 'Tripoli' },
      { id: 'sid', name: 'Sidon' },
    ],
  },
  {
    id: 'tun',
    name: 'Tunisia',
    code: 'TN',
    cities: [
      { id: 'tun', name: 'Tunis' },
      { id: 'sfa', name: 'Sfax' },
      { id: 'sou', name: 'Sousse' },
    ],
  },
  {
    id: 'mar',
    name: 'Morocco',
    code: 'MA',
    cities: [
      { id: 'cas', name: 'Casablanca' },
      { id: 'rab', name: 'Rabat' },
      { id: 'fes', name: 'Fes' },
      { id: 'mar', name: 'Marrakesh' },
    ],
  },
  // Add more countries and cities as needed
];

// Helper function to get all cities
export const getAllCities = (): City[] => {
  return COUNTRIES_AND_CITIES.flatMap(country => country.cities);
};

// Helper function to get cities by country code
export const getCitiesByCountryCode = (countryCode: string): City[] => {
  const country = COUNTRIES_AND_CITIES.find(c => c.code === countryCode.toUpperCase());
  return country ? country.cities : [];
};

// Helper function to get a country by its code
export const getCountryByCode = (countryCode: string): Country | undefined => {
  return COUNTRIES_AND_CITIES.find(c => c.code === countryCode.toUpperCase());
};

// Helper function to get a city by its ID
export const getCityById = (cityId: string): City | undefined => {
  for (const country of COUNTRIES_AND_CITIES) {
    const city = country.cities.find(c => c.id === cityId);
    if (city) {
      return city;
    }
  }
  return undefined;
};
