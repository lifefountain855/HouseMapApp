import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  TextInput,
  Text,
  TouchableOpacity,
  FlatList,
  Keyboard,
  Platform
} from 'react-native';
import { Ionicons } from '@react-native-vector-icons/ionicons';

export default function SearchBar({ houses, onSelectResult }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [focused, setFocused] = useState(false);

  const handleSearch = (text) => {
    setQuery(text);
    if (!text.trim()) {
      setResults([]);
      return;
    }

    const q = text.toLowerCase();
    const filtered = [];

    houses.forEach(house => {
      const addressMatch = house.address && house.address.toLowerCase().includes(q);
      
      // Check if any person matches
      const matchingPeople = house.people.filter(p => 
        p.name.toLowerCase().includes(q) ||
        p.notes.toLowerCase().includes(q) ||
        p.role.toLowerCase().includes(q)
      );

      if (addressMatch || matchingPeople.length > 0) {
        filtered.push({
          house,
          addressMatch,
          matchingPeople
        });
      }
    });

    setResults(filtered);
  };

  const handleItemPress = (item) => {
    Keyboard.dismiss();
    setQuery('');
    setResults([]);
    setFocused(false);
    onSelectResult(item.house);
  };

  const clearSearch = () => {
    setQuery('');
    setResults([]);
    Keyboard.dismiss();
  };

  return (
    <View style={styles.container}>
      {/* Search Input Bar */}
      <View style={[styles.searchBar, focused && styles.searchBarFocused]}>
        <Ionicons name="search" size={20} color="#8E8E93" style={styles.searchIcon} />
        
        <TextInput
          style={styles.input}
          placeholder="Search by address, name, or info..."
          placeholderTextColor="#8E8E93"
          value={query}
          onChangeText={handleSearch}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 200)} // delay to allow clicks
          returnKeyType="search"
        />

        {query.length > 0 ? (
          <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
            <Ionicons name="close-circle" size={18} color="#8E8E93" />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Results Dropdown Overlay */}
      {focused && results.length > 0 ? (
        <View style={styles.resultsContainer}>
          <FlatList
            data={results}
            keyExtractor={(item) => item.house.id}
            keyboardShouldPersistTaps="always"
            renderItem={({ item }) => {
              const displayTitle = item.matchingPeople.length > 0 
                ? item.matchingPeople[0].name 
                : item.house.address;
              
              const displaySub = item.matchingPeople.length > 0
                ? `${item.matchingPeople[0].role} • ${item.house.address}`
                : `${item.house.people.length} Resident${item.house.people.length === 1 ? '' : 's'}`;

              return (
                <TouchableOpacity
                  style={styles.resultItem}
                  onPress={() => handleItemPress(item)}
                >
                  <View style={styles.resultIconContainer}>
                    <Ionicons 
                      name={item.matchingPeople.length > 0 ? "person" : "home"} 
                      size={18} 
                      color="#007AFF" 
                    />
                  </View>
                  <View style={styles.resultTextContainer}>
                    <Text style={styles.resultTitle} numberOfLines={1}>
                      {displayTitle}
                    </Text>
                    <Text style={styles.resultSub} numberOfLines={1}>
                      {displaySub}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color="#C6C6C8" />
                </TouchableOpacity>
              );
            }}
            style={styles.list}
          />
        </View>
      ) : focused && query.trim().length > 0 ? (
        <View style={styles.resultsContainer}>
          <Text style={styles.noResultsText}>No records match "{query}"</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 36,
    left: 16,
    right: 16,
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 5,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 14,
    height: 50,
    paddingHorizontal: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  searchBarFocused: {
    borderColor: '#007AFF',
  },
  searchIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#000',
    height: '100%',
  },
  clearButton: {
    padding: 4,
  },
  resultsContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 14,
    marginTop: 8,
    maxHeight: 250,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  list: {
    paddingVertical: 4,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#F2F2F7',
  },
  resultIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E5F1FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  resultTextContainer: {
    flex: 1,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
  },
  resultSub: {
    fontSize: 13,
    color: '#8E8E93',
    marginTop: 2,
  },
  noResultsText: {
    textAlign: 'center',
    padding: 16,
    color: '#8E8E93',
    fontSize: 14,
  }
});
