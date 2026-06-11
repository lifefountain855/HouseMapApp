import React, { useEffect, useRef, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Animated,
  Dimensions,
  Platform,
  TextInput
} from 'react-native';
import { Ionicons } from '@react-native-vector-icons/ionicons';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const SHEET_HEIGHT = SCREEN_HEIGHT * 0.60; // Increase slightly to fit new status editors

const STATUSES = [
  { key: 'none', label: 'Knocked', color: '#8E8E93', icon: 'clipboard-outline' },
  { key: 'no_soliciting', label: 'No Solicit', color: '#8B0000', icon: 'ban-outline' },
  { key: 'not_interested', label: 'No Interest', color: '#FF3B30', icon: 'thumbs-down-outline' },
  { key: 'come_back', label: 'Come Back', color: '#ffd500', icon: 'time-outline' },
  { key: 'appointment', label: 'Appt Set', color: '#34C759', icon: 'calendar-outline' }
];

export default function HouseDetailSheet({
  house,
  onClose,
  onEditPerson,
  onAddPersonToHouse,
  onUpdateStatus,
  onDeleteHouse
}) {
  const slideAnim = useRef(new Animated.Value(SHEET_HEIGHT)).current;
  
  // Local form state for status details
  const [selectedStatus, setSelectedStatus] = useState('none');
  const [comments, setComments] = useState('');
  const [time, setTime] = useState('');
  const [isSaved, setIsSaved] = useState(false);

  // Synchronize local state when house changes
  useEffect(() => {
    if (house) {
      setSelectedStatus(house.status || 'none');
      setComments(house.statusComments || '');
      setTime(house.statusTime || '');
      setIsSaved(false);

      // Slide up
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 8,
        useNativeDriver: true
      }).start();
    } else {
      // Slide down
      Animated.timing(slideAnim, {
        toValue: SHEET_HEIGHT,
        duration: 250,
        useNativeDriver: true
      }).start();
    }
  }, [house]);

  if (!house) return null;

  const handleStatusSelect = (statusKey) => {
    setSelectedStatus(statusKey);
    setIsSaved(false);
    
    // Auto-save the status change with existing comments/time
    onUpdateStatus(house.id, statusKey, comments, time);
  };

  const handleSaveStatusDetails = () => {
    onUpdateStatus(house.id, selectedStatus, comments, time);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000); // Reset saved indicator after 2s
  };

  // Helper to check if comments/time fields are relevant
  const showDetailInputs = selectedStatus == 'come_back' || selectedStatus == 'appointment';

  return (
    <Animated.View 
      style={[
        styles.sheetContainer, 
        { height: showDetailInputs ? SHEET_HEIGHT : '35%' },

        { transform: [{ translateY: slideAnim }] }
      ]}
    >
      {/* Drag Handle Indicator */}
      <View style={styles.dragHandle} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTextContainer}>
          <Text style={styles.addressTitle} numberOfLines={1}>
            {house.address || 'Selected House'}
          </Text>
          <Text style={styles.residentCount}>
            {house.people.length} Resident{house.people.length === 1 ? '' : 's'}
          </Text>
        </View>
        
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Ionicons name="close" size={20} color="#8E8E93" />
        </TouchableOpacity>
      </View>

      {/* Sheet Content Scroll View */}
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        
        {/* House Status Segment */}
        <View style={styles.statusSection}>
          <Text style={styles.sectionTitle}>HOUSE VISITING STATUS</Text>
          <View style={styles.statusSelectorRow}>
            {STATUSES.map((status) => {
              const isActive = selectedStatus === status.key;
              return (
                <TouchableOpacity
                  key={status.key}
                  style={[
                    styles.statusPill,
                    isActive && { backgroundColor: status.color, borderColor: status.color }
                  ]}
                  onPress={() => handleStatusSelect(status.key)}
                >
                  <Ionicons 
                    name={status.icon} 
                    size={18} 
                    color={isActive ? '#FFF' : status.color} 
                  />
                  <Text style={[
                    styles.statusPillLabel,
                    isActive && styles.statusPillLabelActive
                  ]}>
                    {status.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Collapsible Status Details Form */}
        {showDetailInputs ? (
          <View style={styles.statusDetailsCard}>
            <View style={styles.inputContainer}>
              <View style={styles.inputLabelRow}>
                <Ionicons name="time-outline" size={16} color="#8E8E93" />
                <Text style={styles.fieldLabel}>
                  {selectedStatus === 'appointment' ? 'Appointment Date/Time' : 'Follow-up Time (Optional)'}
                </Text>
              </View>
              <TextInput
                style={styles.textInput}
                placeholder={selectedStatus === 'appointment' ? "e.g. Friday 10:00 AM" : "e.g. Tomorrow 4:00 PM"}
                placeholderTextColor="#C7C7CC"
                value={time}
                onChangeText={(text) => {
                  setTime(text);
                  setIsSaved(false);
                }}
              />
            </View>

            <View style={styles.divider} />

            <View style={styles.inputContainer}>
              <View style={styles.inputLabelRow}>
                <Ionicons name="document-text-outline" size={16} color="#8E8E93" />
                <Text style={styles.fieldLabel}>Visit Comments / Notes</Text>
              </View>
              <TextInput
                style={[styles.textInput, styles.multilineInput]}
                placeholder="Add visit outcomes, notes, or instructions..."
                placeholderTextColor="#C7C7CC"
                value={comments}
                onChangeText={(text) => {
                  setComments(text);
                  setIsSaved(false);
                }}
                multiline={true}
                numberOfLines={2}
              />
            </View>

            <TouchableOpacity 
              style={[styles.saveDetailsButton, isSaved && styles.saveDetailsButtonSaved]}
              onPress={handleSaveStatusDetails}
            >
              <Text style={styles.saveDetailsText}>
                {isSaved ? 'Details Saved!' : 'Save Visit Details'}
              </Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {/* Resident Section */}
        {showDetailInputs ? (
          <View style={styles.residentsSection}>
          <Text style={styles.sectionTitle}>RESIDENTS</Text>
          {house.people.length > 0 ? (
            house.people.map((person) => (
              <View key={person.id} style={styles.residentCard}>
                <View style={styles.cardHeader}>
                  <View style={[styles.avatar, { backgroundColor: person.avatarColor || '#007AFF' }]}>
                    <Text style={styles.avatarInitials}>
                      {person.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.nameContainer}>
                    <Text style={styles.nameText}>{person.name}</Text>
                    <View style={[
                      styles.roleBadge, 
                      person.role === 'Owner' ? styles.badgeOwner : 
                      person.role === 'Tenant' ? styles.badgeTenant : 
                      person.role === 'Guest' ? styles.badgeGuest : styles.badgeResident
                    ]}>
                      <Text style={[
                        styles.roleBadgeText,
                        person.role === 'Owner' ? styles.badgeTextOwner : 
                        person.role === 'Tenant' ? styles.badgeTextTenant : 
                        person.role === 'Guest' ? styles.badgeTextGuest : styles.badgeTextResident
                      ]}>
                        {person.role.toUpperCase()}
                      </Text>
                    </View>
                  </View>

                  <TouchableOpacity 
                    style={styles.editButton} 
                    onPress={() => onEditPerson(person, house)}
                  >
                    <Ionicons name="create-outline" size={18} color="#007AFF" />
                    <Text style={styles.editButtonText}>Edit</Text>
                  </TouchableOpacity>
                </View>

                {person.notes ? (
                  <Text style={styles.notesText}>{person.notes}</Text>
                ) : (
                  <Text style={[styles.notesText, styles.noNotesText]}>No additional notes recorded.</Text>
                )}
              </View>
            ))
          ) : (
            <View style={styles.emptyPeopleContainer}>
              <Ionicons name="people-outline" size={36} color="#C6C6C8" />
              <Text style={styles.emptyPeopleText}>No resident profiles attached yet.</Text>
            </View>
          )}
        </View>
         ) : null}
      </ScrollView>


      {/* Bottom Actions Bar */}
      <View style={styles.actionBar}>
        {showDetailInputs ? (
        <TouchableOpacity 
          style={styles.addButton} 
          onPress={() => onAddPersonToHouse(house)}
        >
          <Ionicons name="person-add" size={18} color="#FFF" style={styles.addButtonIcon} />
          <Text style={styles.addButtonText}>Add Person to House</Text>
        </TouchableOpacity>
        ) : null}
      
      {/* Delete empty place button */}
      {house.people.length === 0 ? (
        <TouchableOpacity
          style={[styles.addButton, styles.deleteButton]}
          onPress={() => {
            if (typeof onDeleteHouse === 'function') {
              onDeleteHouse(house.id);
            }
          }}
        >
          <Ionicons name="trash" size={18} color="#FFF" style={styles.addButtonIcon} />
          <Text style={styles.addButtonText}>Delete Place</Text>
        </TouchableOpacity>
      ) : null}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  sheetContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 10,
    zIndex: 9,
  },
  dragHandle: {
    width: 36,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#C6C6C8',
    alignSelf: 'center',
    marginBottom: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E5EA',
  },
  headerTextContainer: {
    flex: 1,
    paddingRight: 16,
  },
  addressTitle: {
    fontSize: 25,
    fontWeight: 'bold',
    color: '#000',
  },
  residentCount: {
    fontSize: 11,
    color: '#8E8E93',
    marginTop: 2,
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100, // Safe space for actions
    flexGrow: 1,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#8E8E93',
    marginBottom: 10,
    letterSpacing: 0.5,
  },
  statusSection: {
    marginBottom: 16,
  },
  statusSelectorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  statusPill: {
    flex: 1,
    minWidth: 60,
    marginHorizontal: 2,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#E5E5EA',
    backgroundColor: '#F8F8F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusPillLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: '#3A3A3C',
    marginTop: 4,
    textAlign: 'center',
  },
  statusPillLabelActive: {
    color: '#FFF',
  },
  statusDetailsCard: {
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
  },
  inputContainer: {
    marginVertical: 4,
  },
  inputLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3A3A3C',
    marginLeft: 6,
  },
  textInput: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 14,
    color: '#000',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#C6C6C8',
  },
  multilineInput: {
    height: 50,
    textAlignVertical: 'top',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#C6C6C8',
    marginVertical: 8,
  },
  saveDetailsButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 8,
  },
  saveDetailsButtonSaved: {
    backgroundColor: '#34C759', // Turns green on success
  },
  saveDetailsText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
  },
  residentsSection: {
    marginTop: 10,
    marginBottom: 10,
  },
  residentCard: {
    backgroundColor: '#F8F8F9',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  avatarInitials: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
  },
  nameContainer: {
    flex: 1,
  },
  nameText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  roleBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 2,
  },
  roleBadgeText: {
    fontSize: 9,
    fontWeight: 'bold',
  },
  badgeOwner: { backgroundColor: '#FFE5EC' },
  badgeTextOwner: { color: '#FF2D55' },
  badgeResident: { backgroundColor: '#E5F1FF' },
  badgeTextResident: { color: '#007AFF' },
  badgeTenant: { backgroundColor: '#EAFBEA' },
  badgeTextTenant: { color: '#4CD964' },
  badgeGuest: { backgroundColor: '#FFF2E6' },
  badgeTextGuest: { color: '#ffd500' },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#E5F1FF',
  },
  editButtonText: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '600',
    marginLeft: 3,
  },
  notesText: {
    fontSize: 13,
    lineHeight: 16,
    color: '#3A3A3C',
  },
  noNotesText: {
    color: '#AEAEB2',
    fontStyle: 'italic',
  },
  emptyPeopleContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    backgroundColor: '#F8F8F9',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderStyle: 'dashed',
    marginBottom: "13%",
  },
  emptyPeopleText: {
    color: '#8E8E93',
    fontSize: 13,
    marginTop: 8,
  },
  actionBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E5E5EA',
    paddingHorizontal: 20,
    paddingVertical: 12,
    ...Platform.select({
      ios: {
        paddingBottom: 24,
      }
    })
  },
  addButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    height: 48,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
    margin: 3,
  },
  addButtonIcon: {
    marginRight: 8,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  // deleteButton: {
  //   backgroundColor: '#FF3B30',
  //   marginLeft: 12,
  // },
  deleteButton: {
    backgroundColor: '#FF3B30',
    borderRadius: 12,
    height: 48,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF3B30',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
    margin: 3,
  },
});
