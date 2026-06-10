import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@house_map_records';

// Generate a random color for avatars
const COLORS = ['#FF2D55', '#ffd500', '#4CD964', '#5AC8FA', '#007AFF', '#5856D6', '#AF52DE', '#FF3B30'];
function getRandomColor() {
  return COLORS[Math.floor(Math.random() * COLORS.length)];
}

// Initial mock data with statuses pre-loaded
const MOCK_HOUSES = [
  {
    id: 'house_1',
    latitude: 37.7749,
    longitude: -122.4194,
    address: '1024 Market St, San Francisco, CA',
    status: 'come_back',
    statusComments: 'Talked to John, but Sarah was out. Need to follow up about signing.',
    statusTime: 'Tomorrow at 4:00 PM',
    people: [
      {
        id: 'p1',
        name: 'Sarah Connor',
        role: 'Owner',
        notes: 'Enjoys gardening. Works from home as a tech consultant. Extremely friendly.',
        avatarColor: '#FF2D55',
        createdAt: new Date().toISOString()
      },
      {
        id: 'p2',
        name: 'John Connor',
        role: 'Resident',
        notes: 'High school student. Loves skateboarding and robotics.',
        avatarColor: '#007AFF',
        createdAt: new Date().toISOString()
      }
    ]
  },
  {
    id: 'house_2',
    latitude: 37.7833,
    longitude: -122.4167,
    address: '450 Sutter St, San Francisco, CA',
    status: 'appointment',
    statusComments: 'Appointment set to complete contract signing.',
    statusTime: 'Friday at 10:00 AM',
    people: [
      {
        id: 'p3',
        name: 'Dr. Marcus Vance',
        role: 'Tenant',
        notes: 'Dentist. Speaks Spanish. Usually away on weekends.',
        avatarColor: '#4CD964',
        createdAt: new Date().toISOString()
      }
    ]
  },
  {
    id: 'house_3',
    latitude: 37.7699,
    longitude: -122.4468,
    address: '501 Stanyan St, San Francisco, CA',
    status: 'no_soliciting',
    statusComments: 'Has "No Soliciting" sign on front door and gate.',
    statusTime: '',
    people: [
      {
        id: 'p4',
        name: 'Elena Rostova',
        role: 'Resident',
        notes: 'Professional pianist. Quiet neighbor, practices during the day.',
        avatarColor: '#AF52DE',
        createdAt: new Date().toISOString()
      }
    ]
  }
];

export const database = {
  /**
   * Fetch all house records
   */
  async getHouses() {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEY);
      if (data !== null) {
        return JSON.parse(data);
      } 
      else {
        // Initialize with mock data if storage is empty
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(MOCK_HOUSES));
        return MOCK_HOUSES;
      }
    } catch (e) {
      console.error('Failed to load houses from storage:', e);
      return [];
    }
  },

  /**
   * Overwrite all house records
   */
  async saveHouses(houses) {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(houses));
      return true;
    } catch (e) {
      console.error('Failed to save houses to storage:', e);
      return false;
    }
  },

  /**
   * Create an empty house at coordinates. Returns the houses list and the newly created house.
   */
  async addEmptyHouse(latitude, longitude, address) {
    const houses = await this.getHouses();
    
    // Check if a house already exists near this coordinate
    const threshold = 0.0001;
    let house = houses.find(h => 
      Math.abs(h.latitude - latitude) < threshold && 
      Math.abs(h.longitude - longitude) < threshold
    );

    if (!house) {
      house = {
        id: 'h_' + Math.random().toString(36).substr(2, 9),
        latitude,
        longitude,
        address: address || `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`,
        status: 'none',
        statusComments: '',
        statusTime: '',
        people: []
      };
      houses.push(house);
      await this.saveHouses(houses);
    }
    
    return { houses, selectedHouse: house };
  },

  /**
   * Add a new person. Appends to existing house if coordinates match, otherwise creates a house.
   */
  async addPerson(latitude, longitude, address, personDetails) {
    const houses = await this.getHouses();
    
    // Check if a house already exists near this coordinate
    const threshold = 0.0001;
    let house = houses.find(h => 
      Math.abs(h.latitude - latitude) < threshold && 
      Math.abs(h.longitude - longitude) < threshold
    );

    const newPerson = {
      id: 'p_' + Math.random().toString(36).substr(2, 9),
      name: personDetails.name || 'Anonymous',
      role: personDetails.role || 'Resident',
      notes: personDetails.notes || '',
      avatarColor: getRandomColor(),
      createdAt: new Date().toISOString()
    };

    if (house) {
      // Add to existing house
      house.people.push(newPerson);
      if (!house.address && address) {
        house.address = address;
      }
    } else {
      // Create new house
      house = {
        id: 'h_' + Math.random().toString(36).substr(2, 9),
        latitude,
        longitude,
        address: address || `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`,
        status: 'none',
        statusComments: '',
        statusTime: '',
        people: [newPerson]
      };
      houses.push(house);
    }

    await this.saveHouses(houses);
    return { houses, selectedHouse: house };
  },

  /**
   * Update details of an existing person record
   */
  async updatePerson(houseId, personId, updatedDetails) {
    const houses = await this.getHouses();
    const house = houses.find(h => h.id === houseId);
    
    if (house) {
      const personIndex = house.people.findIndex(p => p.id === personId);
      if (personIndex !== -1) {
        house.people[personIndex] = {
          ...house.people[personIndex],
          name: updatedDetails.name || house.people[personIndex].name,
          role: updatedDetails.role || house.people[personIndex].role,
          notes: updatedDetails.notes ?? house.people[personIndex].notes
        };
        
        if (updatedDetails.address) {
          house.address = updatedDetails.address;
        }

        await this.saveHouses(houses);
      }
    }
    return houses;
  },

  /**
   * Update the prospecting/interest status of a house
   */
  async updateHouseStatus(houseId, status, comments, time) {
    const houses = await this.getHouses();
    const house = houses.find(h => h.id === houseId);
    
    if (house) {
      house.status = status || 'none';
      house.statusComments = comments || '';
      house.statusTime = time || '';
      await this.saveHouses(houses);
    }
    return houses;
  },

  /**
   * Delete a person record. If house is empty after deletion, removes the house.
   */
  async deletePerson(houseId, personId) {
    let houses = await this.getHouses();
    const houseIndex = houses.findIndex(h => h.id === houseId);
    
    if (houseIndex !== -1) {
      const house = houses[houseIndex];
      house.people = house.people.filter(p => p.id !== personId);
      
      if (house.people.length === 0) {
        // We no longer delete the house if it has 0 residents, because we want it to remain on the map as an empty house with a status!
        // This is a crucial update! Let's just save the house with people = []
      }
      
      await this.saveHouses(houses);
    }
    return houses;
  },

  /**
   * Reset the database to mock data
   */
  async resetDatabase() {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(MOCK_HOUSES));
    return MOCK_HOUSES;
  }
};
