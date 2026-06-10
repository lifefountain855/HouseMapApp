import React, { useState, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StyleSheet, View, StatusBar, Alert, Platform, TouchableOpacity } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { database } from './src/database';
import MapArea from './src/components/MapArea';
import SearchBar from './src/components/SearchBar';
import HouseDetailSheet from './src/components/HouseDetailSheet';
import PersonModal from './src/components/PersonModal';

export default function App() {
  const [houses, setHouses] = useState([]);
  const [selectedHouse, setSelectedHouse] = useState(null);
  const [mapType, setMapType] = useState('standard'); // standard, satellite, hybrid
  
  // Modal State
  const [personModalVisible, setPersonModalVisible] = useState(false);
  const [activePerson, setActivePerson] = useState(null);
  const [defaultAddress, setDefaultAddress] = useState('');
  const [pendingCoordinate, setPendingCoordinate] = useState(null);

  const mapRef = useRef(null);
  const [initialRegion, setInitialRegion] = useState(null);

  // Load houses from database on mount
  useEffect(() => {
    async function loadData() {
      const storedHouses = await database.getHouses();
      setHouses(storedHouses);
    }
    loadData();
  }, []);

  const MAP_TYPE_KEY = 'mapType';
  const LAST_REGION_KEY = 'lastRegion';

  // Load saved map type and last region from AsyncStorage
  useEffect(() => {
    (async () => {
      try {
        const [savedMapType, savedRegion] = await Promise.all([
          AsyncStorage.getItem(MAP_TYPE_KEY),
          AsyncStorage.getItem(LAST_REGION_KEY),
        ]);
        if (savedMapType) setMapType(savedMapType);
        if (savedRegion) {
          const parsed = JSON.parse(savedRegion);
          setInitialRegion(parsed);
        }
      } catch (e) {
        console.warn('Failed to load map preferences', e);
      }
    })();
  }, []);

  // Update selected house details if the houses list changes (e.g. after edit/delete)
  const refreshSelectedHouse = (updatedHouses, houseId) => {
    if (houseId) {
      const match = updatedHouses.find(h => h.id === houseId);
      setSelectedHouse(match || null);
    } else {
      setSelectedHouse(null);
    }
  };

  // Handler: Selecting a house marker
  const handleSelectHouse = (house) => {
    setSelectedHouse(house);
  };

  // Handler: Selecting a search result
  const handleSelectSearchResult = (house) => {
    setSelectedHouse(house);
  };

  // Handler: Long press on map to drop a new empty house pin
  const handleMapLongPress = async (coordinate) => {
    
    
    const getAddressFromCoords = async (lat, lng) => {
      // Ensure permissions are fetched first
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.log('Permission to access location was denied');
        return;
      }

      try {
        const response = await Location.reverseGeocodeAsync({
          latitude: lat,
          longitude: lng,
        });

        if (response.length > 0) {
          const closestPlace = response[0];
          // Object includes properties like street, streetNumber, city, region, postalCode
          // console.log("Closest Address: ", closestPlace);
          // console.log("Address Name: ", closestPlace.name);
          return closestPlace.name;
        }
      } catch (error) {
        console.error(error);
      }
    };
    // const address = `House at ${coordinate.latitude.toFixed(4)}, ${coordinate.longitude.toFixed(4)}`;
    const address = await getAddressFromCoords(coordinate.latitude, coordinate.longitude);
    
    // Drop the empty house marker immediately in the database
    const result = await database.addEmptyHouse(
      coordinate.latitude,
      coordinate.longitude,
      address
    );
    
    setHouses(result.houses);
    setSelectedHouse(result.selectedHouse); // Auto-open details sheet for the new empty house
  };

  // Handler: Tap "Add Person to House" button in detail sheet
  const handleAddPersonToHouse = (house) => {
    setPendingCoordinate({
      latitude: house.latitude,
      longitude: house.longitude
    });
    setActivePerson(null);
    setDefaultAddress(house.address || '');
    setPersonModalVisible(true);
  };

  // Handler: Tap "Edit" button for a resident in detail sheet
  const handleEditPerson = (person, house) => {
    setPendingCoordinate({
      latitude: house.latitude,
      longitude: house.longitude
    });
    setActivePerson(person);
    setDefaultAddress(house.address || '');
    setPersonModalVisible(true);
  };

  // Handler: Save form details (Add or Edit)
  const handleSavePerson = async (formData) => {
    let updatedHouses = [];

    if (activePerson) {
      // Edit Mode
      updatedHouses = await database.updatePerson(
        selectedHouse.id,
        activePerson.id,
        formData
      );
      setHouses(updatedHouses);
      refreshSelectedHouse(updatedHouses, selectedHouse.id);
    } else {
      // Add Mode
      const result = await database.addPerson(
        pendingCoordinate.latitude,
        pendingCoordinate.longitude,
        formData.address,
        formData
      );
      setHouses(result.houses);
      setSelectedHouse(result.selectedHouse);
    }

    setPersonModalVisible(false);
    setActivePerson(null);
    setPendingCoordinate(null);
  };

  // Handler: Delete a person record
  const handleDeletePerson = async (personId) => {
    Alert.alert(
      "Confirm Deletion",
      "Are you sure you want to delete this resident record?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: async () => {
            const updatedHouses = await database.deletePerson(selectedHouse.id, personId);
            setHouses(updatedHouses);
            
            refreshSelectedHouse(updatedHouses, selectedHouse.id);
            setPersonModalVisible(false);
            setActivePerson(null);
          }
        }
      ]
    );
  };

  // Handler: Update House Visiting Status (Color, comments, return time)
  const handleUpdateHouseStatus = async (houseId, status, comments, time) => {
    const updatedHouses = await database.updateHouseStatus(houseId, status, comments, time);
    setHouses(updatedHouses);
    refreshSelectedHouse(updatedHouses, houseId);
  };

  // Handler: Map Type Cycling (Standard -> Satellite -> Hybrid)
  const cycleMapType = () => {
    setMapType(prevType => {
      const next = prevType === 'standard' ? 'satellite' : prevType === 'satellite' ? 'hybrid' : 'standard';
      AsyncStorage.setItem(MAP_TYPE_KEY, next).catch(() => {});
      return next;
    });
  };

  // Save last region when the map stops moving
  const handleRegionChangeComplete = async (region) => {
    try {
      await AsyncStorage.setItem(LAST_REGION_KEY, JSON.stringify(region));
    } catch (e) {
      console.warn('Failed to save last region', e);
    }
  };

  // Handler: Navigation to Current GPS Location
  const goToUserLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          "Permission Denied",
          "Please enable location services in your device settings to view your current position."
        );
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced
      });

      if (mapRef.current) {
        mapRef.current.animateToRegion({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01
        }, 800);
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Could not retrieve your current location. Please try again.");
    }
  };

  return (
    <SafeAreaProvider>
      <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Floating Apple-style Search Bar */}
      <SearchBar 
        houses={houses} 
        onSelectResult={handleSelectSearchResult} 
      />

      {/* Floating Map Controls Panel */}
      <View style={styles.floatingControls}>
        <TouchableOpacity style={styles.controlButton} onPress={cycleMapType} activeOpacity={0.7}>
          <Ionicons name="layers" size={22} color="#007AFF" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.controlButton} onPress={goToUserLocation} activeOpacity={0.7}>
          <Ionicons name="navigate" size={22} color="#007AFF" />
        </TouchableOpacity>
      </View>

      {/* Main Map View */}
      <MapArea
        mapRef={mapRef}
        houses={houses}
        selectedHouse={selectedHouse}
        onSelectHouse={handleSelectHouse}
        onMapLongPress={handleMapLongPress}
        mapType={mapType}
        initialRegion={initialRegion}
        onRegionChangeComplete={handleRegionChangeComplete}
      />

      {/* Slide-up Resident Details Sheet */}
      <HouseDetailSheet
        house={selectedHouse}
        onClose={() => setSelectedHouse(null)}
        onEditPerson={handleEditPerson}
        onAddPersonToHouse={handleAddPersonToHouse}
        onUpdateStatus={handleUpdateHouseStatus}
      />

      {/* Profile Form Modal (Add / Edit / Delete) */}
      <PersonModal
        visible={personModalVisible}
        onClose={() => {
          setPersonModalVisible(false);
          setActivePerson(null);
        }}
        onSave={handleSavePerson}
        onDelete={handleDeletePerson}
        person={activePerson}
        defaultAddress={defaultAddress}
        coordinate={pendingCoordinate}
      />
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  floatingControls: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 116 : 96,
    right: 16,
    zIndex: 10,
    gap: 8,
  },
  controlButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  }
});
