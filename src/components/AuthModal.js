import React, { useState } from 'react';
import { Modal, View, Text, TextInput, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { supabase } from '../supabase';

export default function AuthModal({ visible, onClose, currentUser }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState('signin'); // or 'signup'

  const handleSignIn = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      onClose();
    } catch (e) {
      Alert.alert('Sign-in failed', e.message || String(e));
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
      Alert.alert('Check your email', 'A confirmation email was sent if required.');
      onClose();
    } catch (e) {
      Alert.alert('Sign-up failed', e.message || String(e));
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      onClose();
    } catch (e) {
      Alert.alert('Sign-out failed', e.message || String(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.backdrop}>
        <View style={styles.container}>
          <Text style={styles.title}>{currentUser ? 'Account' : mode === 'signin' ? 'Sign In' : 'Sign Up'}</Text>

          {currentUser ? (
            <View>
              <Text style={styles.email}>{currentUser.email}</Text>

              <TouchableOpacity style={styles.button} onPress={handleSignOut} disabled={loading}>
                {loading ? <ActivityIndicator color="#fff"/> : <Text style={styles.buttonText}>Sign Out</Text>}
              </TouchableOpacity>

              <TouchableOpacity style={[styles.button, styles.secondary]} onPress={onClose}>
                <Text style={styles.secondaryText}>Close</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View>
              <TextInput
                placeholder="Email"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                style={styles.input}
                editable={!loading}
              />

              <TextInput
                placeholder="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                style={styles.input}
                editable={!loading}
              />

              <TouchableOpacity
                style={styles.button}
                onPress={mode === 'signin' ? handleSignIn : handleSignUp}
                disabled={loading}
              >
                {loading ? <ActivityIndicator color="#fff"/> : <Text style={styles.buttonText}>{mode === 'signin' ? 'Sign In' : 'Create Account'}</Text>}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.link}
                onPress={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
              >
                <Text style={styles.linkText}>{mode === 'signin' ? 'Create an account' : 'Have an account? Sign in'}</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.button, styles.secondary]} onPress={onClose}>
                <Text style={styles.secondaryText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          )}

        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: '90%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
  title: { fontSize: 20, fontWeight: '600', marginBottom: 12 },
  email: { fontSize: 16, marginBottom: 16 },
  input: {
    height: 44,
    borderColor: '#E5E7EB',
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 12,
    paddingHorizontal: 12,
  },
  button: {
    backgroundColor: '#007AFF',
    height: 44,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: { color: '#fff', fontWeight: '600' },
  secondary: { backgroundColor: '#F2F2F7', marginTop: 12 },
  secondaryText: { color: '#000' },
  link: { marginTop: 10, alignItems: 'center' },
  linkText: { color: '#007AFF' },
});