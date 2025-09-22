import admin from 'firebase-admin';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
dotenv.config();

let firebaseInitialized = false;
let mockMode = process.env.USE_MOCK_DB === 'true' || false;

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  try {
    // Set the project ID explicitly
    const projectId = process.env.FIREBASE_PROJECT_ID || 'wanderer-8ecac';
    
    // Try to initialize with service account key file
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY 
      ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
      : null;

    // Try to load service account from file if not in env
    let serviceAccountKey = serviceAccount;
    if (!serviceAccountKey && process.env.FIREBASE_SERVICE_ACCOUNT_KEY_PATH) {
      try {
        const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_KEY_PATH;
        console.log('🔍 Looking for service account key at:', serviceAccountPath);
        if (fs.existsSync(serviceAccountPath)) {
          const serviceAccountFile = fs.readFileSync(serviceAccountPath, 'utf8');
          serviceAccountKey = JSON.parse(serviceAccountFile);
          console.log('✅ Loaded service account from file');
        } else {
          console.log('⚠️ Service account file not found at:', serviceAccountPath);
        }
      } catch (error) {
        console.warn('⚠️ Failed to load service account from file:', error.message);
      }
    }

    if (serviceAccountKey) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccountKey),
        projectId: projectId,
        databaseURL: `https://${projectId}-default-rtdb.firebaseio.com`,
        storageBucket: `${projectId}.appspot.com`
      });
      console.log('✅ Firebase Admin SDK initialized with service account');
      firebaseInitialized = true;
    } else {
      // Initialize with explicit project ID for development
      admin.initializeApp({
        projectId: projectId,
        databaseURL: `https://${projectId}-default-rtdb.firebaseio.com`,
        storageBucket: `${projectId}.appspot.com`
      });
      console.log(`✅ Firebase Admin SDK initialized with project ID: ${projectId}`);
      firebaseInitialized = true;
    }
  } catch (error) {
    console.error('❌ Firebase Admin SDK initialization failed:', error.message);
    console.log('🔧 Falling back to development mode with in-memory storage');
    mockMode = true;
    firebaseInitialized = false;
  }
}

// File-based persistent storage for development

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(process.cwd(), 'data');
const CONVERSATIONS_FILE = path.join(DATA_DIR, 'conversations.json');
const MESSAGES_FILE = path.join(DATA_DIR, 'messages.json');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Load data from files or initialize empty
const loadFromFile = (filePath, defaultValue = {}) => {
  try {
    if (fs.existsSync(filePath)) {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      return new Map(Object.entries(data));
    }
  } catch (error) {
    console.warn(`⚠️ Failed to load ${filePath}:`, error.message);
  }
  return new Map(Object.entries(defaultValue));
};

// Save data to files
const saveToFile = (filePath, map) => {
  try {
    const obj = Object.fromEntries(map);
    fs.writeFileSync(filePath, JSON.stringify(obj, null, 2));
  } catch (error) {
    console.error(`❌ Failed to save ${filePath}:`, error.message);
  }
};

// Persistent storage with file backup
const memoryStore = {
  conversations: loadFromFile(CONVERSATIONS_FILE),
  messages: loadFromFile(MESSAGES_FILE),
  users: loadFromFile(USERS_FILE)
};

// Auto-save function
const autoSave = () => {
  saveToFile(CONVERSATIONS_FILE, memoryStore.conversations);
  saveToFile(MESSAGES_FILE, memoryStore.messages);
  saveToFile(USERS_FILE, memoryStore.users);
};

// Save data every 10 seconds
setInterval(autoSave, 10000);

// Initialize with sample user data
const initializeSampleUsers = () => {
  const sampleUsers = [
    {
      id: 'JPZ4tYsvQHbrkXR9GOCcS0srW463',
      name: 'Jaljala',
      email: 'jaljala@example.com',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
      age: 21,
      bio: 'A simple man, hs'
    },
    {
      id: 'PtiqNeg6GBSpPhVFRe0CooKbgEn1',
      name: 'Travel Buddy',
      email: 'buddy@example.com',
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b9a7c7a5?w=150&h=150&fit=crop&crop=face',
      age: 25,
      bio: 'Love to explore new places!'
    },
    {
      id: 'user_10',
      name: 'Alex Explorer',
      email: 'alex@example.com',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
      age: 28,
      bio: 'Adventure seeker and photographer'
    },
    {
      id: 'I8FKq5vERTWsp5GTrNt4pVYGPZo2',
      name: 'Maya Wanderer',
      email: 'maya@example.com',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
      age: 24,
      bio: 'Digital nomad and travel blogger'
    }
  ];

  sampleUsers.forEach(user => {
    memoryStore.users.set(user.id, user);
  });
  
  console.log(`🔧 Mock: Initialized ${sampleUsers.length} sample users`);
};

// Mock Firestore interface for development
const createMockFirestore = () => ({
  collection: (name) => ({
    doc: (id) => ({
      get: async () => {
        const data = memoryStore[name]?.get(id);
        return {
          exists: () => !!data,
          data: () => data,
          id
        };
      },
      set: async (data) => {
        if (!memoryStore[name]) memoryStore[name] = new Map();
        memoryStore[name].set(id, { ...data, id });
        autoSave(); // Save after modification
        return { id };
      },
      update: async (data) => {
        if (!memoryStore[name]) memoryStore[name] = new Map();
        const existing = memoryStore[name].get(id) || {};
        memoryStore[name].set(id, { ...existing, ...data, id });
        autoSave(); // Save after modification
        return { id };
      }
    }),
    add: async (data) => {
      const id = `mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      if (!memoryStore[name]) memoryStore[name] = new Map();
      const docData = { 
        ...data, 
        id,
        timestamp: data.timestamp || new Date().toISOString(),
        createdAt: data.createdAt || new Date().toISOString(),
        updatedAt: data.updatedAt || new Date().toISOString()
      };
      memoryStore[name].set(id, docData);
      console.log(`📝 Mock: Added ${name} document with ID: ${id}`);
      autoSave(); // Save after modification
      return { 
        id,
        get: async () => ({
          exists: () => true,
          data: () => docData,
          id
        }),
        update: async (updateData) => {
          const existing = memoryStore[name].get(id) || {};
          const updated = { ...existing, ...updateData, id };
          memoryStore[name].set(id, updated);
          console.log(`📝 Mock: Updated ${name} document with ID: ${id}`);
          autoSave(); // Save after modification
          return { id };
        }
      };
    },
    where: (field, op, value) => ({
      limit: (limitCount) => ({
        get: async () => {
          if (!memoryStore[name]) return { docs: [] };
          let docs = Array.from(memoryStore[name].values());
          
          // Apply where filter
          docs = docs.filter(doc => {
            if (op === '==') return doc[field] === value;
            if (op === 'array-contains') return Array.isArray(doc[field]) && doc[field].includes(value);
            if (op === '!=') return doc[field] !== value;
            return true;
          });
          
          // Apply limit
          docs = docs.slice(0, limitCount);
          
          return {
            empty: docs.length === 0,
            docs: docs.map(data => ({
              id: data.id,
              data: () => data
            }))
          };
        }
      }),
      orderBy: (orderField, direction = 'asc') => ({
        limit: (limitCount) => ({
          get: async () => {
            if (!memoryStore[name]) return { docs: [] };
            let docs = Array.from(memoryStore[name].values());
            
            // Apply where filter
            docs = docs.filter(doc => {
              if (op === '==') return doc[field] === value;
              if (op === 'array-contains') return Array.isArray(doc[field]) && doc[field].includes(value);
              if (op === '!=') return doc[field] !== value;
              return true;
            });
            
            // Apply ordering
            docs.sort((a, b) => {
              const aVal = new Date(a[orderField]).getTime();
              const bVal = new Date(b[orderField]).getTime();
              return direction === 'desc' ? bVal - aVal : aVal - bVal;
            });
            
            // Apply limit
            docs = docs.slice(0, limitCount);
            
            return {
              docs: docs.map(data => ({
                id: data.id,
                data: () => data
              }))
            };
          }
        }),
        get: async () => {
          if (!memoryStore[name]) return { docs: [] };
          let docs = Array.from(memoryStore[name].values());
          
          // Apply where filter
          docs = docs.filter(doc => {
            if (op === '==') return doc[field] === value;
            if (op === 'array-contains') return Array.isArray(doc[field]) && doc[field].includes(value);
            if (op === '!=') return doc[field] !== value;
            return true;
          });
          
          // Apply ordering
          docs.sort((a, b) => {
            const aVal = new Date(a[orderField]).getTime();
            const bVal = new Date(b[orderField]).getTime();
            return direction === 'desc' ? bVal - aVal : aVal - bVal;
          });
          
          return {
            empty: docs.length === 0,
            docs: docs.map(data => ({
              id: data.id,
              data: () => data
            }))
          };
        }
      }),
      get: async () => {
        if (!memoryStore[name]) return { docs: [] };
        let docs = Array.from(memoryStore[name].values());
        
        // Apply where filter
        docs = docs.filter(doc => {
          if (op === '==') return doc[field] === value;
          if (op === 'array-contains') return Array.isArray(doc[field]) && doc[field].includes(value);
          if (op === '!=') return doc[field] !== value;
          return true;
        });
        
        return {
          docs: docs.map(data => ({
            id: data.id,
            data: () => data
          }))
        };
      }
    }),
    get: async () => {
      if (!memoryStore[name]) return { docs: [] };
      const docs = Array.from(memoryStore[name].values());
      return {
        docs: docs.map(data => ({
          id: data.id,
          data: () => data
        }))
      };
    }
  })
});

// Mock FieldValue for development
const mockFieldValue = {
  serverTimestamp: () => new Date().toISOString()
};

// Create a wrapper that falls back to mock mode on authentication errors
const createDbWrapper = () => {
  if (mockMode) {
    return createMockFirestore();
  }
  
  const realDb = admin.firestore();
  const mockDb = createMockFirestore();
  
  // Proxy to catch authentication errors and fall back to mock
  return new Proxy(realDb, {
    get(target, prop) {
      if (typeof target[prop] === 'function') {
        return (...args) => {
          try {
            const result = target[prop](...args);
            // If it's a promise, catch authentication errors
            if (result && typeof result.then === 'function') {
              return result.catch(error => {
                if (error.message.includes('default credentials') || 
                    error.message.includes('authentication') ||
                    error.message.includes('Project Id')) {
                  console.log('🔧 Firebase auth failed, falling back to mock mode for this operation');
                  return mockDb[prop](...args);
                }
                throw error;
              });
            }
            return result;
          } catch (error) {
            if (error.message.includes('default credentials') || 
                error.message.includes('authentication') ||
                error.message.includes('Project Id')) {
              console.log('🔧 Firebase auth failed, falling back to mock mode for this operation');
              return mockDb[prop](...args);
            }
            throw error;
          }
        };
      }
      return target[prop];
    }
  });
};

export const db = createDbWrapper();
export const auth = mockMode ? null : admin.auth();
export const storage = mockMode ? null : admin.storage();
export const admin_mock = { firestore: { FieldValue: mockFieldValue } };
export { admin };

// Log current mode
if (mockMode) {
  console.log('🔧 Running in MOCK mode with file persistence');
  console.log('💾 Data will be saved to ./data/ directory');
  console.log('🔧 To use Firebase, set up proper authentication credentials');
  initializeSampleUsers(); // Initialize sample users for development
  
  // Graceful shutdown - save data when process exits
  process.on('SIGINT', () => {
    console.log('\n💾 Saving data before shutdown...');
    autoSave();
    process.exit(0);
  });
  
  process.on('SIGTERM', () => {
    console.log('\n💾 Saving data before shutdown...');
    autoSave();
    process.exit(0);
  });
} else {
  console.log('🔥 Running with Firebase Firestore');
}
