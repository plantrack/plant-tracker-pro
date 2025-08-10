// SIMPLIFIED VERSION - Direct connection without complicated setup
// Replace App.js content with this if having connection issues

import React, { useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Alert,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';

// UPDATE THIS URL WITH YOUR CURRENT PUBLIC URL
const API_URL = 'https://ef6026c56d26025b6211b9d8bba63115.serveo.net';

export default function App() {
  const [loading, setLoading] = useState(false);
  const [testResult, setTestResult] = useState('');

  const testConnection = async () => {
    setLoading(true);
    setTestResult('Testing connection...');
    
    try {
      const response = await fetch(`${API_URL}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setTestResult(`✅ Connected! Server says: ${JSON.stringify(data)}`);
      } else {
        setTestResult(`❌ Server responded with: ${response.status}`);
      }
    } catch (error) {
      setTestResult(`❌ Connection failed: ${error.message}`);
    }
    
    setLoading(false);
  };

  const testLogin = async () => {
    setLoading(true);
    setTestResult('Testing login...');
    
    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: 'demo',
          password: 'demo123'
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setTestResult(`✅ Login successful! Token: ${data.token.substring(0, 20)}...`);
      } else {
        setTestResult(`❌ Login failed: ${data.error}`);
      }
    } catch (error) {
      setTestResult(`❌ Login error: ${error.message}`);
    }
    
    setLoading(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Plant Tracker Connection Test</Text>
        
        <Text style={styles.url}>API URL: {API_URL}</Text>
        
        <TouchableOpacity 
          style={styles.button} 
          onPress={testConnection}
          disabled={loading}
        >
          <Text style={styles.buttonText}>Test Connection</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.button} 
          onPress={testLogin}
          disabled={loading}
        >
          <Text style={styles.buttonText}>Test Login (demo/demo123)</Text>
        </TouchableOpacity>
        
        {loading && <ActivityIndicator size="large" color="#4CAF50" />}
        
        <Text style={styles.result}>{testResult}</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  url: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    fontFamily: 'monospace',
  },
  button: {
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 5,
    marginVertical: 10,
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: 'bold',
  },
  result: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#fff',
    borderRadius: 5,
    fontSize: 14,
  },
});