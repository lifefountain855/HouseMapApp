import React, { useRef, useEffect, useState } from 'react';
import { StyleSheet, View, Text, Platform, Animated } from 'react-native';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';

// Default to Rexburg coordinates
const DEFAULT_REGION = {
  latitude:  43.835,
  longitude: -111.780,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

// Map status to visual colors
const STATUS_COLORS = {
  none: '#007AFF',            // Blue (Default)
  no_soliciting: '#8B0000',   // Dark Red
  not_interested: '#FF3B30',  // Red
  come_back: '#ffd500',       // Gold / Orange-Yellow
  appointment: '#34C759',     // Green
};
const DARK_STATUS_COLORS = {
  none: '#0056b3',            // Dark Blue (Default)
  no_soliciting: '#6b0000',   // Dark Red
  not_interested: '#cc2929',  // Dark Red
  come_back: '#ccaa00',       // Gold / Orange-Yellow
  appointment: '#289e47',     // Dark Green
};

const LIGHT = "#fafafa"
const DARK = "#1c1c1c"
// function getThemeColor(status, isDarkMode) {
//   return isDarkMode ? DARK_STATUS_COLORS[status] || DARK_STATUS_COLORS.none : STATUS_COLORS[status] || STATUS_COLORS.none;
// }

export default function MapArea({
  houses,
  selectedHouse,
  onSelectHouse,
  onMapLongPress,
  mapRef,
  mapType = 'standard',
  initialRegion = null,
  onRegionChangeComplete = null,
}) {
  
  const [showBanner, setShowBanner] = useState(true);
  const opacityAnim = useRef(new Animated.Value(1));

  // Workaround for Android marker rendering: briefly allow tracksViewChanges after houses change
  const [tracksViewChanges, setTracksViewChanges] = useState(true);
  useEffect(() => {
    // Enable re-rendering while markers are updating, then disable for performance
    setTracksViewChanges(true);
    const t = setTimeout(() => setTracksViewChanges(false), 800);
    return () => clearTimeout(t);
  }, [houses]);

  // Auto-hide banner after 5 seconds with fade-out animation
  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.timing(opacityAnim.current, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }).start(() => {
        setShowBanner(false);
      });
    }, 5000);

    return () => {
      clearTimeout(timer);
      opacityAnim.current.stopAnimation();
    };
  }, []);

  // Center map on selected house when it changes
  useEffect(() => {
    if (selectedHouse && mapRef.current) {
      try {
        mapRef.current.animateToRegion({
          latitude: Number(selectedHouse.latitude) - 0.001,
          longitude: Number(selectedHouse.longitude),
          latitudeDelta: 0.003,
          longitudeDelta: 0.003,
        }, 600);
      } catch (e) {
        console.warn('Failed to animate to selectedHouse', e);
      }
    }
  }, [selectedHouse]);

  // Animate to saved initial region when loaded (smooth 250ms)
  useEffect(() => {
    if (initialRegion && mapRef && mapRef.current) {
      try {
        mapRef.current.animateToRegion(initialRegion, 250);
      } catch (e) {
        console.warn('Failed to animate to initialRegion', e);
      }
    }
  }, [initialRegion]);

  const handleLongPress = (e) => {
    const { coordinate } = e.nativeEvent;
    if (onMapLongPress) {
      onMapLongPress(coordinate);
    }
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_DEFAULT}
        initialRegion={initialRegion || DEFAULT_REGION}
        onLongPress={handleLongPress}
        onRegionChangeComplete={(region) => {
          if (onRegionChangeComplete) onRegionChangeComplete(region);
        }}
        showsUserLocation={true}
        showsMyLocationButton={false}
        // showsCompass={true}
        showsCompass={false}
        mapType={mapType}
        // moves the apple and legal labels to bottom left
        appleLogoInsets={{ top: 0, left: 0, bottom: 50, right: 0 }}
        legalLabelInsets={{ top: 0, left: 50, bottom: 50, right: 0 }}
      >
        {houses.map((house) => {
          const isSelected = selectedHouse && selectedHouse.id === house.id;
          const status = house.status || 'none';
          const themeColor = STATUS_COLORS[status] || STATUS_COLORS.none;
          const hasPeople = house.people && house.people.length > 0;
          
          return (
            <Marker
              key={house.id}
              coordinate={{
                latitude: Number(house.latitude),
                longitude: Number(house.longitude)
              }}
              onPress={() => onSelectHouse(house)}
              tracksViewChanges={tracksViewChanges}
            >
              {hasPeople ? (
                /* 1. House with Residents: Render Full Apple-style Home Bubble Pin */
                <View style={[
                  styles.markerContainer,
                  isSelected && styles.markerContainerSelected
                ]}>
                  <View style={[
                    styles.markerBubble,
                    { borderColor: LIGHT },
                    isSelected ? { backgroundColor: LIGHT } : { backgroundColor: themeColor }
                  ]}>
                    <Ionicons 
                      name="home" 
                      size={9} 
                      color={isSelected ? themeColor : LIGHT} 
                    />
                  </View>
                </View>
              ) : (
                /* 2. Empty House: Render a minimal colored dot with glowing select background */
                <View style={[
                  styles.dotContainer,
                  isSelected && { backgroundColor: `${themeColor}22` } // 22 is ~13% opacity in Hex
                ]}>
                  <View style={[
                    styles.dot,
                    { 
                      backgroundColor: themeColor,
                      shadowColor: themeColor
                    },
                    isSelected && styles.dotSelected
                  ]} />
                </View>
              )}
            </Marker>
          );
        })}
      </MapView>

      {showBanner && (
        <Animated.View style={[styles.banner, { opacity: opacityAnim.current }]}>
          <Ionicons name="information-circle-outline" size={16} color={LIGHT} style={styles.bannerIcon} />
          <Text style={styles.bannerText}>
            Long-press anywhere on the map to place a new marker
          </Text>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  // Home Bubble Pin Styling
  markerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 44,
    height: 48,
  },
  markerContainerSelected: {
    transform: [{ scale: 1.15 }],
  },
  markerBubble: {
    borderRadius: 12,
    padding: 2.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
    borderWidth: 2,
  },
  // markerArrow: {
  //   width: 0,
  //   height: 0,
  //   backgroundColor: 'transparent',
  //   borderStyle: 'solid',
  //   borderLeftWidth: 6,
  //   borderRightWidth: 6,
  //   borderTopWidth: 6,
  //   borderLeftColor: 'transparent',
  //   borderRightColor: 'transparent',
  //   alignSelf: 'center',
  //   marginTop: -1,
  // },

  // Dot Marker Styling
  dotContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: LIGHT,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 3,
    elevation: 4,
  },
  dotSelected: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2.8,
  },
  banner: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 40 : 20,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    pointerEvents: 'none',
  },
  bannerIcon: {
    marginRight: 6,
  },
  bannerText: {
    color: LIGHT,
    fontSize: 12,
    fontWeight: '500',
  }
});
