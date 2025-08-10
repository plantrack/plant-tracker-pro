import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  Image,
  TextInput,
  ScrollView,
  Alert,
  FlatList,
  Modal,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
  Dimensions,
  Platform
} from 'react-native';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from './config';
const { width } = Dimensions.get('window');

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [farmName, setFarmName] = useState('');
  
  const [location, setLocation] = useState(null);
  const [image, setImage] = useState(null);
  const [notes, setNotes] = useState('');
  const [plantType, setPlantType] = useState('');
  const [growthStage, setGrowthStage] = useState('');
  const [heightCm, setHeightCm] = useState('');
  const [healthScore, setHealthScore] = useState('');
  const [selectedField, setSelectedField] = useState(null);
  
  const [fields, setFields] = useState([]);
  const [plants, setPlants] = useState([]);
  const [locations, setLocations] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  
  const [showFieldModal, setShowFieldModal] = useState(false);
  const [showLocationHistory, setShowLocationHistory] = useState(false);
  const [newFieldName, setNewFieldName] = useState('');
  const [newFieldSize, setNewFieldSize] = useState('');
  const [newFieldCrop, setNewFieldCrop] = useState('');
  
  const [activeTab, setActiveTab] = useState('capture');

  useEffect(() => {
    checkAuthStatus();
    requestPermissions();
  }, []);

  useEffect(() => {
    if (isAuthenticated && token) {
      loadUserData();
    }
  }, [isAuthenticated, token]);

  const checkAuthStatus = async () => {
    try {
      const savedToken = await AsyncStorage.getItem('authToken');
      const savedUser = await AsyncStorage.getItem('userData');
      if (savedToken && savedUser) {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error('Auth check error:', error);
    }
  };

  const requestPermissions = async () => {
    try {
      const { status: locationStatus } = await Location.requestForegroundPermissionsAsync();
      if (locationStatus === 'granted') {
        const currentLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High
        });
        setLocation(currentLocation);
      }
      
      const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
      if (cameraStatus !== 'granted') {
        Alert.alert('Permission Required', 'Camera permission is needed to take photos');
      }
    } catch (error) {
      console.error('Permission error:', error);
    }
  };

  const handleAuth = async () => {
    if (!username || !password) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }
    
    if (!isLogin && !email) {
      Alert.alert('Error', 'Email is required for registration');
      return;
    }
    
    setLoading(true);
    
    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
      const body = isLogin 
        ? { username, password }
        : { username, email, password, farm_name: farmName };
      
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      
      const data = await response.json();
      
      if (response.ok) {
        await AsyncStorage.setItem('authToken', data.token);
        await AsyncStorage.setItem('userData', JSON.stringify(data.user));
        setToken(data.token);
        setUser(data.user);
        setIsAuthenticated(true);
        setUsername('');
        setPassword('');
        setEmail('');
        setFarmName('');
      } else {
        Alert.alert('Error', data.error || 'Authentication failed');
      }
    } catch (error) {
      Alert.alert('Error', 'Network error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const loadUserData = async () => {
    await Promise.all([
      fetchFields(),
      fetchPlants(),
      fetchLocations()
    ]);
  };

  const fetchFields = async () => {
    try {
      const response = await fetch(`${API_URL}/api/fields`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setFields(data);
      }
    } catch (error) {
      console.error('Error fetching fields:', error);
    }
  };

  const fetchPlants = async () => {
    try {
      const params = location 
        ? `?latitude=${location.coords.latitude}&longitude=${location.coords.longitude}&radius=100`
        : '';
      
      const response = await fetch(`${API_URL}/api/plants${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setPlants(data);
      }
    } catch (error) {
      console.error('Error fetching plants:', error);
    }
  };

  const fetchLocations = async () => {
    try {
      const response = await fetch(`${API_URL}/api/plants/locations`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setLocations(data);
      }
    } catch (error) {
      console.error('Error fetching locations:', error);
    }
  };

  const takePhoto = async () => {
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      base64: false
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
      
      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High
      });
      setLocation(currentLocation);
    }
  };

  const savePlant = async () => {
    if (!image || !location) {
      Alert.alert('Error', 'Please take a photo first');
      return;
    }
    
    setLoading(true);
    
    try {
      const formData = new FormData();
      formData.append('photo', {
        uri: image,
        type: 'image/jpeg',
        name: 'plant.jpg'
      });
      formData.append('latitude', location.coords.latitude.toString());
      formData.append('longitude', location.coords.longitude.toString());
      formData.append('notes', notes);
      formData.append('plant_type', plantType);
      formData.append('growth_stage', growthStage);
      formData.append('height_cm', heightCm);
      formData.append('health_score', healthScore);
      if (selectedField) {
        formData.append('field_id', selectedField.toString());
      }

      const response = await fetch(`${API_URL}/api/plants`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        },
        body: formData
      });

      if (response.ok) {
        Alert.alert('Success', 'Plant record saved successfully');
        resetForm();
        fetchPlants();
        fetchLocations();
      } else {
        const error = await response.json();
        Alert.alert('Error', error.error || 'Failed to save plant record');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to save. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const createField = async () => {
    if (!newFieldName) {
      Alert.alert('Error', 'Field name is required');
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await fetch(`${API_URL}/api/fields`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: newFieldName,
          size_acres: newFieldSize || 0,
          crop_type: newFieldCrop
        })
      });

      if (response.ok) {
        Alert.alert('Success', 'Field created successfully');
        setNewFieldName('');
        setNewFieldSize('');
        setNewFieldCrop('');
        setShowFieldModal(false);
        fetchFields();
      } else {
        const error = await response.json();
        Alert.alert('Error', error.error || 'Failed to create field');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to create field');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setImage(null);
    setNotes('');
    setPlantType('');
    setGrowthStage('');
    setHeightCm('');
    setHealthScore('');
    setSelectedField(null);
  };

  const logout = async () => {
    await AsyncStorage.removeItem('authToken');
    await AsyncStorage.removeItem('userData');
    setIsAuthenticated(false);
    setToken(null);
    setUser(null);
    setPlants([]);
    setFields([]);
    setLocations([]);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadUserData();
    setRefreshing(false);
  };

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.authContainer}>
          <View style={styles.authBox}>
            <Text style={styles.logo}>🌱</Text>
            <Text style={styles.appTitle}>Plant Tracker</Text>
            <Text style={styles.authSubtitle}>
              {isLogin ? 'Login to your account' : 'Create new account'}
            </Text>
            
            <TextInput
              style={styles.input}
              placeholder="Username"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
            />
            
            {!isLogin && (
              <>
                <TextInput
                  style={styles.input}
                  placeholder="Email"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                <TextInput
                  style={styles.input}
                  placeholder="Farm Name (optional)"
                  value={farmName}
                  onChangeText={setFarmName}
                />
              </>
            )}
            
            <TextInput
              style={styles.input}
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
            
            <TouchableOpacity 
              style={[styles.authButton, loading && styles.disabledButton]}
              onPress={handleAuth}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.authButtonText}>
                  {isLogin ? 'Login' : 'Register'}
                </Text>
              )}
            </TouchableOpacity>
            
            <TouchableOpacity onPress={() => setIsLogin(!isLogin)}>
              <Text style={styles.switchAuthText}>
                {isLogin ? 'Need an account? Register' : 'Have an account? Login'}
              </Text>
            </TouchableOpacity>
            
            <View style={styles.demoBox}>
              <Text style={styles.demoText}>Demo Account:</Text>
              <Text style={styles.demoCredentials}>Username: demo</Text>
              <Text style={styles.demoCredentials}>Password: demo123</Text>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Plant Tracker</Text>
        <TouchableOpacity onPress={logout} style={styles.logoutButton}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.userInfo}>
        <Text style={styles.welcomeText}>Welcome, {user?.username}</Text>
        {user?.farm_name && (
          <Text style={styles.farmText}>{user.farm_name}</Text>
        )}
      </View>
      
      <View style={styles.tabs}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'capture' && styles.activeTab]}
          onPress={() => setActiveTab('capture')}
        >
          <Text style={[styles.tabText, activeTab === 'capture' && styles.activeTabText]}>
            Capture
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'history' && styles.activeTab]}
          onPress={() => setActiveTab('history')}
        >
          <Text style={[styles.tabText, activeTab === 'history' && styles.activeTabText]}>
            History
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'fields' && styles.activeTab]}
          onPress={() => setActiveTab('fields')}
        >
          <Text style={[styles.tabText, activeTab === 'fields' && styles.activeTabText]}>
            Fields
          </Text>
        </TouchableOpacity>
      </View>
      
      {activeTab === 'capture' && (
        <ScrollView 
          style={styles.content}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {location && (
            <View style={styles.locationCard}>
              <Text style={styles.locationLabel}>Current Location</Text>
              <Text style={styles.locationText}>
                {location.coords.latitude.toFixed(6)}, {location.coords.longitude.toFixed(6)}
              </Text>
            </View>
          )}
          
          {image ? (
            <View style={styles.imageContainer}>
              <Image source={{ uri: image }} style={styles.capturedImage} />
              <TouchableOpacity 
                style={styles.retakeButton}
                onPress={() => setImage(null)}
              >
                <Text style={styles.retakeButtonText}>Retake Photo</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.captureButton} onPress={takePhoto}>
              <Text style={styles.captureIcon}>📷</Text>
              <Text style={styles.captureButtonText}>Take Photo</Text>
            </TouchableOpacity>
          )}
          
          {image && (
            <View style={styles.form}>
              <Text style={styles.formTitle}>Plant Details</Text>
              
              <View style={styles.fieldSelector}>
                <Text style={styles.label}>Field (optional)</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <TouchableOpacity
                    style={[styles.fieldChip, !selectedField && styles.selectedFieldChip]}
                    onPress={() => setSelectedField(null)}
                  >
                    <Text style={styles.fieldChipText}>No Field</Text>
                  </TouchableOpacity>
                  {fields.map(field => (
                    <TouchableOpacity
                      key={field.id}
                      style={[styles.fieldChip, selectedField === field.id && styles.selectedFieldChip]}
                      onPress={() => setSelectedField(field.id)}
                    >
                      <Text style={styles.fieldChipText}>{field.name}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
              
              <TextInput
                style={styles.input}
                placeholder="Plant Type (e.g., Corn, Wheat)"
                value={plantType}
                onChangeText={setPlantType}
              />
              
              <TextInput
                style={styles.input}
                placeholder="Growth Stage (e.g., Seedling, Flowering)"
                value={growthStage}
                onChangeText={setGrowthStage}
              />
              
              <View style={styles.row}>
                <TextInput
                  style={[styles.input, styles.halfInput]}
                  placeholder="Height (cm)"
                  value={heightCm}
                  onChangeText={setHeightCm}
                  keyboardType="numeric"
                />
                
                <TextInput
                  style={[styles.input, styles.halfInput]}
                  placeholder="Health Score (1-100)"
                  value={healthScore}
                  onChangeText={setHealthScore}
                  keyboardType="numeric"
                />
              </View>
              
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Notes"
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={3}
              />
              
              <TouchableOpacity 
                style={[styles.saveButton, loading && styles.disabledButton]}
                onPress={savePlant}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.saveButtonText}>Save Plant Record</Text>
                )}
              </TouchableOpacity>
            </View>
          )}
          
          {plants.length > 0 && (
            <View style={styles.nearbySection}>
              <Text style={styles.sectionTitle}>Nearby Plants</Text>
              {plants.slice(0, 5).map((plant, index) => (
                <View key={plant.id} style={styles.plantCard}>
                  {plant.photo_path && (
                    <Image 
                      source={{ uri: `${API_URL}${plant.photo_path}` }}
                      style={styles.plantThumb}
                    />
                  )}
                  <View style={styles.plantInfo}>
                    <Text style={styles.plantType}>
                      {plant.plant_type || 'Unknown Plant'}
                    </Text>
                    <Text style={styles.plantStage}>{plant.growth_stage}</Text>
                    <Text style={styles.plantDate}>
                      {new Date(plant.timestamp).toLocaleDateString()}
                    </Text>
                  </View>
                  {plant.health_score && (
                    <View style={[
                      styles.healthBadge,
                      { backgroundColor: plant.health_score > 70 ? '#27ae60' : 
                                       plant.health_score > 40 ? '#f39c12' : '#e74c3c' }
                    ]}>
                      <Text style={styles.healthText}>{plant.health_score}</Text>
                    </View>
                  )}
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      )}
      
      {activeTab === 'history' && (
        <FlatList
          data={locations}
          keyExtractor={(item) => item.location_id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={styles.locationItem}
              onPress={() => {
                setShowLocationHistory(true);
              }}
            >
              <View style={styles.locationIcon}>
                <Text>📍</Text>
              </View>
              <View style={styles.locationDetails}>
                <Text style={styles.locationCoords}>
                  {item.latitude.toFixed(6)}, {item.longitude.toFixed(6)}
                </Text>
                <Text style={styles.locationStats}>
                  {item.photo_count} photos • Last: {new Date(item.last_visit).toLocaleDateString()}
                </Text>
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>🌱</Text>
              <Text style={styles.emptyText}>No plants recorded yet</Text>
              <Text style={styles.emptySubtext}>Take your first photo to get started</Text>
            </View>
          }
        />
      )}
      
      {activeTab === 'fields' && (
        <View style={styles.content}>
          <TouchableOpacity 
            style={styles.addFieldButton}
            onPress={() => setShowFieldModal(true)}
          >
            <Text style={styles.addFieldText}>+ Add New Field</Text>
          </TouchableOpacity>
          
          <FlatList
            data={fields}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <View style={styles.fieldCard}>
                <Text style={styles.fieldName}>{item.name}</Text>
                {item.crop_type && (
                  <Text style={styles.fieldCrop}>Crop: {item.crop_type}</Text>
                )}
                {item.size_acres > 0 && (
                  <Text style={styles.fieldSize}>{item.size_acres} acres</Text>
                )}
              </View>
            )}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>No fields created yet</Text>
              </View>
            }
          />
        </View>
      )}
      
      <Modal
        visible={showFieldModal}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Create New Field</Text>
            
            <TextInput
              style={styles.input}
              placeholder="Field Name"
              value={newFieldName}
              onChangeText={setNewFieldName}
            />
            
            <TextInput
              style={styles.input}
              placeholder="Size (acres)"
              value={newFieldSize}
              onChangeText={setNewFieldSize}
              keyboardType="numeric"
            />
            
            <TextInput
              style={styles.input}
              placeholder="Crop Type"
              value={newFieldCrop}
              onChangeText={setNewFieldCrop}
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => setShowFieldModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.confirmButton, loading && styles.disabledButton]}
                onPress={createField}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.confirmButtonText}>Create</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  authContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  authBox: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  logo: {
    fontSize: 60,
    textAlign: 'center',
    marginBottom: 10,
  },
  appTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2c3e50',
    textAlign: 'center',
    marginBottom: 10,
  },
  authSubtitle: {
    fontSize: 16,
    color: '#7f8c8d',
    textAlign: 'center',
    marginBottom: 30,
  },
  input: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e1e8ed',
  },
  authButton: {
    backgroundColor: '#27ae60',
    padding: 18,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 15,
  },
  authButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  switchAuthText: {
    color: '#3498db',
    textAlign: 'center',
    fontSize: 16,
  },
  demoBox: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
  },
  demoText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
    marginBottom: 5,
  },
  demoCredentials: {
    fontSize: 13,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e8ed',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  logoutButton: {
    padding: 8,
  },
  logoutText: {
    color: '#e74c3c',
    fontSize: 16,
  },
  userInfo: {
    padding: 15,
    backgroundColor: '#fff',
    marginBottom: 10,
  },
  welcomeText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
  },
  farmText: {
    fontSize: 14,
    color: '#7f8c8d',
    marginTop: 2,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e8ed',
  },
  tab: {
    flex: 1,
    padding: 15,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 3,
    borderBottomColor: '#27ae60',
  },
  tabText: {
    fontSize: 16,
    color: '#7f8c8d',
  },
  activeTabText: {
    color: '#27ae60',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 15,
  },
  locationCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
  },
  locationLabel: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 5,
  },
  locationText: {
    fontSize: 16,
    color: '#2c3e50',
    fontWeight: '500',
  },
  captureButton: {
    backgroundColor: '#27ae60',
    padding: 40,
    borderRadius: 15,
    alignItems: 'center',
    marginBottom: 20,
  },
  captureIcon: {
    fontSize: 48,
    marginBottom: 10,
  },
  captureButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  imageContainer: {
    marginBottom: 20,
  },
  capturedImage: {
    width: '100%',
    height: 250,
    borderRadius: 10,
    marginBottom: 10,
  },
  retakeButton: {
    backgroundColor: '#e74c3c',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  retakeButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  form: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    marginBottom: 20,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 8,
  },
  fieldSelector: {
    marginBottom: 15,
  },
  fieldChip: {
    backgroundColor: '#f1f3f5',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
  },
  selectedFieldChip: {
    backgroundColor: '#27ae60',
  },
  fieldChipText: {
    color: '#2c3e50',
    fontSize: 14,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfInput: {
    flex: 0.48,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  saveButton: {
    backgroundColor: '#27ae60',
    padding: 18,
    borderRadius: 10,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.6,
  },
  nearbySection: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 15,
  },
  plantCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    alignItems: 'center',
  },
  plantThumb: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 15,
  },
  plantInfo: {
    flex: 1,
  },
  plantType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
  },
  plantStage: {
    fontSize: 14,
    color: '#7f8c8d',
    marginTop: 2,
  },
  plantDate: {
    fontSize: 12,
    color: '#95a5a6',
    marginTop: 2,
  },
  healthBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  healthText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  locationItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 15,
    marginHorizontal: 15,
    marginVertical: 5,
    borderRadius: 10,
    alignItems: 'center',
  },
  locationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f1f3f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  locationDetails: {
    flex: 1,
  },
  locationCoords: {
    fontSize: 16,
    fontWeight: '500',
    color: '#2c3e50',
  },
  locationStats: {
    fontSize: 14,
    color: '#7f8c8d',
    marginTop: 2,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 15,
  },
  emptyText: {
    fontSize: 18,
    color: '#7f8c8d',
    marginBottom: 5,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#95a5a6',
  },
  addFieldButton: {
    backgroundColor: '#3498db',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 20,
  },
  addFieldText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  fieldCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  fieldName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
  },
  fieldCrop: {
    fontSize: 14,
    color: '#7f8c8d',
    marginTop: 5,
  },
  fieldSize: {
    fontSize: 14,
    color: '#95a5a6',
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 25,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  cancelButton: {
    flex: 0.45,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: '#95a5a6',
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  confirmButton: {
    flex: 0.45,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: '#27ae60',
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});