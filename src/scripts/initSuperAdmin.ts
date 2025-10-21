import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth'
import { doc, setDoc } from 'firebase/firestore'
import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: "AIzaSyCi1McJ5npdsoww9qiOVcyj_0gGFsjvqM4",
  authDomain: "vianovadb.firebaseapp.com",
  projectId: "vianovadb",
  storageBucket: "vianovadb.firebasestorage.app",
  messagingSenderId: "718350529823",
  appId: "1:718350529823:web:fda1e840eae4755c312c2a"
};

// Initialize Firebase for the script
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export async function initializeSuperAdmin() {
  const superAdminEmail = 'admin@vianova.com'
  const superAdminPassword = 'Admin2025'

  console.log('🔄 Starting super admin initialization...')
  console.log('📧 Email:', superAdminEmail)

  try {
    console.log('🔐 Attempting to create user...')
    const userCredential = await createUserWithEmailAndPassword(auth, superAdminEmail, superAdminPassword)
    console.log('✅ User created successfully:', userCredential.user.uid)

    // Update display name
    console.log('👤 Updating profile...')
    await updateProfile(userCredential.user, {
      displayName: 'Super Admin'
    })
    console.log('✅ Profile updated')

    // Create user data in Firestore
    const initialData = {
      uid: userCredential.user.uid,
      email: userCredential.user.email || superAdminEmail,
      role: 'superadmin',
      name: 'Super Admin',
      profileComplete: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    console.log('💾 Saving to Firestore...')
    await setDoc(doc(db, 'users', userCredential.user.uid), initialData)
    console.log('✅ Firestore data saved')

    console.log('🎉 Super admin initialized successfully!')
    console.log('🔑 Credentials:')
    console.log('   Email:', superAdminEmail)
    console.log('   Password:', superAdminPassword)
    return { success: true }
  } catch (error: any) {
    console.log('❌ Error occurred:', error.code, error.message)

    if (error.code === 'auth/email-already-in-use') {
      console.log('ℹ️ Super admin already exists')
      return { success: true, message: 'Super admin already exists' }
    }

    console.error('💥 Failed to initialize super admin:', error.message)
    return { success: false, error: error.message }
  }
}

// Auto-run when executed directly
console.log('🚀 Running super admin initialization script...')
initializeSuperAdmin()
  .then(result => {
    if (result.success) {
      console.log('✅ Script completed successfully')
      if (result.message) {
        console.log('ℹ️', result.message)
      }
    } else {
      console.error('❌ Script failed:', result.error)
    }
  })
  .catch(error => {
    console.error('💥 Unexpected error:', error)
  })