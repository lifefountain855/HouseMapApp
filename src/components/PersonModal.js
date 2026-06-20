import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from 'react-native';
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

const ROLES = ['Owner', 'Resident', 'Guest'];

function ModalContent({ visible, onClose, onSave, onDelete, person, defaultAddress, coordinate }) {
  const insets = useSafeAreaInsets(); // This will now accurately grab the top notch height!

  const [name, setName] = useState('');
  const [role, setRole] = useState('Owner');
  const [notes, setNotes] = useState('');
  const [address, setAddress] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (person) {
      setName(person.name || '');
      setRole(person.role || 'Owner');
      setNotes(person.notes || '');
      setAddress(defaultAddress || '');
    } else {
      setName('');
      setRole('Owner');
      setNotes('');
      setAddress(defaultAddress || '');
    }
    setError('');
  }, [person, defaultAddress, visible]);

  const handleSave = () => {
    if (!name.trim()) {
      setError('Please enter a name');
      return;
    }
    onSave({
      name: name.trim(),
      role,
      notes: notes.trim(),
      address: address.trim()
    });
  };

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        {/* The paddingTop dynamically pushes the header below the notch/status bar */}
        <View style={[styles.header, { paddingTop: Math.max(insets.top, 20) }]}>
          <TouchableOpacity style={styles.headerButton} onPress={onClose}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          
          <Text style={styles.headerTitle}>
            {person ? 'Edit Profile' : 'New Record'}
          </Text>
          
          <TouchableOpacity style={styles.headerButton} onPress={handleSave}>
            <Text style={styles.saveText}>{person ? 'Save' : 'Add'}</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          {/* ... keeping the rest of your ScrollView exactly the same ... */}
          <View style={styles.avatarContainer}>
            <View style={[styles.avatar, { backgroundColor: person ? person.avatarColor : '#007AFF' }]}>
              <Text style={styles.avatarInitials}>
                {name ? name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : '?'}
              </Text>
            </View>
            <Text style={styles.avatarSubtitle}>
              {coordinate ? `At ${coordinate.latitude.toFixed(4)}, ${coordinate.longitude.toFixed(4)}` : ''}
            </Text>
          </View>

          {error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>PERSONAL DETAILS</Text>
            <View style={styles.card}>
              <View style={styles.inputRow}>
                <Text style={styles.inputLabel}>Full Name</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="John Doe"
                  placeholderTextColor="#999"
                  value={name}
                  onChangeText={(text) => {
                    setName(text);
                    if (error) setError('');
                  }}
                />
              </View>
              
              <View style={styles.divider} />
              
              <View style={styles.inputRow}>
                <Text style={styles.inputLabel}>Address</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="123 Main St, City, ST"
                  placeholderTextColor="#999"
                  value={address}
                  onChangeText={setAddress}
                />
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>ROLE AT HOUSE</Text>
            <View style={styles.roleContainer}>
              {ROLES.map((r) => (
                <TouchableOpacity
                  key={r}
                  style={[styles.rolePill, role === r && styles.rolePillSelected]}
                  onPress={() => setRole(r)}
                >
                  <Text style={[styles.roleText, role === r && styles.roleTextSelected]}>
                    {r}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>ADDITIONAL DETAILS & INFO</Text>
            <View style={styles.card}>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                placeholder="Add contact info, notes, or community observations here..."
                placeholderTextColor="#999"
                value={notes}
                onChangeText={setNotes}
                multiline={true}
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
          </View>

          {person && onDelete ? (
            <TouchableOpacity style={styles.deleteButton} onPress={() => onDelete(person.id)}>
              <Text style={styles.deleteButtonText}>Delete Person Record</Text>
            </TouchableOpacity>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

// 2. Main Export wraps everything cleanly in SafeAreaProvider
export default function PersonModal(props) {
  return (
    <Modal
      animationType="slide"
      transparent={false}
      visible={props.visible}
      onRequestClose={props.onClose}
    >
      <SafeAreaProvider>
        <ModalContent {...props} />
      </SafeAreaProvider>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7', // iOS Grouped Background color
  },
  keyboardView: {
    flex: 1,
  },
  header: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center', 
  borderBottomWidth: StyleSheet.hairlineWidth,
  borderBottomColor: '#C6C6C8',
  backgroundColor: '#FFF',
  paddingHorizontal: 16,
  paddingBottom: 12, 
  // marginTop: Platform.OS === 'ios' ? 35 : 0, // Account for status bar on Android
},
  headerButton: {
    paddingVertical: 12,
    minWidth: 60,
  },
  cancelText: {
    fontSize: 17,
    color: '#FF3B30', // Apple Red
  },
  saveText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#007AFF', // Apple Blue
    textAlign: 'right',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000',
    paddingVertical: 12,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  avatarContainer: {
    alignItems: 'center',
    marginVertical: 24,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarInitials: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFF',
    letterSpacing: 1,
  },
  avatarSubtitle: {
    marginTop: 8,
    fontSize: 13,
    color: '#8E8E93',
  },
  errorContainer: {
    backgroundColor: '#FFE5E5',
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFAAAA',
  },
  errorText: {
    color: '#D8000C',
    fontSize: 14,
    textAlign: 'center',
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionLabel: {
    fontSize: 13,
    color: '#6E6E73',
    marginBottom: 8,
    marginLeft: 4,
    fontWeight: '500',
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 10,
    overflow: 'hidden',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 48,
  },
  inputLabel: {
    width: 90,
    fontSize: 16,
    color: '#000',
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#000',
    height: '100%',
  },
  textArea: {
    padding: 16,
    height: 120,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#C6C6C8',
    marginLeft: 16,
  },
  roleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#FFF',
    padding: 8,
    borderRadius: 10,
  },
  rolePill: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 7,
    marginHorizontal: 2,
  },
  rolePillSelected: {
    backgroundColor: '#007AFF', // Blue highlight
  },
  roleText: {
    fontSize: 14,
    color: '#000',
    fontWeight: '500',
  },
  roleTextSelected: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  deleteButton: {
    backgroundColor: '#FFF',
    marginHorizontal: 16,
    marginTop: 32,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: '#FF3B30',
    fontSize: 16,
    fontWeight: '600',
  }
});
