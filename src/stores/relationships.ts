import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  Timestamp,
  addDoc,
  deleteDoc
} from 'firebase/firestore'
import { db } from '@/firebase'
import { useAuthStore } from './auth'
import type {
  Relationship,
  Invitation,
  ConnectionRequest,
  UserConnection,
  UserRole,
  RelationshipStatus,
  InvitationStatus
} from '@/types/relationships'
import {
  generateInvitationCode,
  getInvitationExpirationDate,
  isInvitationExpired,
  canConnect
} from '@/types/relationships'

export const useRelationshipsStore = defineStore('relationships', () => {
  const authStore = useAuthStore()

  // State
  const relationships = ref<Relationship[]>([])
  const invitations = ref<Invitation[]>([])
  const connectionRequests = ref<ConnectionRequest[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Computed
  const activeRelationships = computed(() =>
    relationships.value.filter(r => r.status === 'active')
  )

  const pendingInvitations = computed(() =>
    invitations.value.filter(i => i.status === 'pending' && !isInvitationExpired(i.expiresAt))
  )

  const receivedInvitations = computed(() =>
    invitations.value.filter(
      i => i.toEmail === authStore.user?.email && i.status === 'pending'
    )
  )

  const sentInvitations = computed(() =>
    invitations.value.filter(
      i => i.fromUserId === authStore.user?.uid && i.status === 'pending'
    )
  )

  const myConnections = computed((): UserConnection[] => {
    const connections: UserConnection[] = []
    const currentUserId = authStore.user?.uid

    if (!currentUserId) return connections

    activeRelationships.value.forEach(rel => {
      // If I'm the patient
      if (rel.patientId === currentUserId) {
        if (rel.caregiverId) {
          connections.push({
            userId: rel.caregiverId,
            userName: rel.caregiverName || 'Cuidador',
            userEmail: rel.caregiverEmail || '',
            userRole: 'caregiver',
            relationshipId: rel.id,
            status: rel.status,
            connectedAt: rel.acceptedAt || rel.createdAt
          })
        }
        if (rel.professionalId) {
          connections.push({
            userId: rel.professionalId,
            userName: rel.professionalName || 'Profesional',
            userEmail: rel.professionalEmail || '',
            userRole: 'professional',
            relationshipId: rel.id,
            status: rel.status,
            connectedAt: rel.acceptedAt || rel.createdAt
          })
        }
      }
      // If I'm the caregiver
      else if (rel.caregiverId === currentUserId) {
        connections.push({
          userId: rel.patientId,
          userName: rel.patientName || 'Paciente',
          userEmail: rel.patientEmail || '',
          userRole: 'patient',
          relationshipId: rel.id,
          status: rel.status,
          connectedAt: rel.acceptedAt || rel.createdAt
        })
        if (rel.professionalId) {
          connections.push({
            userId: rel.professionalId,
            userName: rel.professionalName || 'Profesional',
            userEmail: rel.professionalEmail || '',
            userRole: 'professional',
            relationshipId: rel.id,
            status: rel.status,
            connectedAt: rel.acceptedAt || rel.createdAt
          })
        }
      }
      // If I'm the professional
      else if (rel.professionalId === currentUserId) {
        connections.push({
          userId: rel.patientId,
          userName: rel.patientName || 'Paciente',
          userEmail: rel.patientEmail || '',
          userRole: 'patient',
          relationshipId: rel.id,
          status: rel.status,
          connectedAt: rel.acceptedAt || rel.createdAt
        })
      }
    })

    return connections
  })

  const myPatients = computed(() =>
    myConnections.value.filter(c => c.userRole === 'patient')
  )

  const myCaregivers = computed(() =>
    myConnections.value.filter(c => c.userRole === 'caregiver')
  )

  const myProfessionals = computed(() =>
    myConnections.value.filter(c => c.userRole === 'professional')
  )

  // Actions

  /**
   * Fetch all relationships for the current user
   */
  const fetchRelationships = async () => {
    if (!authStore.user?.uid) return

    loading.value = true
    error.value = null

    try {
      const userId = authStore.user.uid
      const relationshipsRef = collection(db, 'relationships')

      // Query relationships where user is involved
      const queries = [
        query(relationshipsRef, where('patientId', '==', userId)),
        query(relationshipsRef, where('caregiverId', '==', userId)),
        query(relationshipsRef, where('professionalId', '==', userId))
      ]

      const results = await Promise.all(queries.map(q => getDocs(q)))
      const allDocs = results.flatMap(snapshot => snapshot.docs)

      relationships.value = allDocs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        acceptedAt: doc.data().acceptedAt?.toDate()
      })) as Relationship[]
    } catch (err: any) {
      error.value = err.message
      console.error('Error fetching relationships:', err)
    } finally {
      loading.value = false
    }
  }

  /**
   * Fetch invitations for the current user
   */
  const fetchInvitations = async () => {
    if (!authStore.user?.uid) return

    loading.value = true
    error.value = null

    try {
      const userId = authStore.user.uid
      const userEmail = authStore.user.email
      const invitationsRef = collection(db, 'invitations')

      // Query invitations sent by user or sent to user's email
      const queries = [
        query(invitationsRef, where('fromUserId', '==', userId)),
        query(invitationsRef, where('toEmail', '==', userEmail))
      ]

      const results = await Promise.all(queries.map(q => getDocs(q)))
      const allDocs = results.flatMap(snapshot => snapshot.docs)

      // Remove duplicates
      const uniqueDocs = Array.from(new Map(allDocs.map(doc => [doc.id, doc])).values())

      invitations.value = uniqueDocs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        expiresAt: doc.data().expiresAt?.toDate() || new Date(),
        acceptedAt: doc.data().acceptedAt?.toDate(),
        rejectedAt: doc.data().rejectedAt?.toDate()
      })) as Invitation[]
    } catch (err: any) {
      error.value = err.message
      console.error('Error fetching invitations:', err)
    } finally {
      loading.value = false
    }
  }

  /**
   * Create an invitation to connect with another user
   */
  const createInvitation = async (
    toEmail: string,
    toRole: UserRole,
    message?: string
  ): Promise<{ success: boolean; code?: string; error?: string }> => {
    if (!authStore.user?.uid || !authStore.userData?.role) {
      return { success: false, error: 'Usuario no autenticado' }
    }

    const fromRole = authStore.userData.role
    if (!canConnect(fromRole, toRole)) {
      return { success: false, error: 'No tienes permiso para conectar con este rol' }
    }

    loading.value = true
    error.value = null

    try {
      const code = generateInvitationCode()
      const patientId =
        fromRole === 'patient' ? authStore.user.uid : '' // Will be filled when accepted

      const invitation: Omit<Invitation, 'id'> = {
        fromUserId: authStore.user.uid,
        fromUserName: authStore.userData.name,
        fromUserEmail: authStore.user.email || '',
        fromUserRole: fromRole,
        toEmail,
        toRole,
        patientId,
        status: 'pending',
        code,
        message,
        createdAt: new Date(),
        expiresAt: getInvitationExpirationDate()
      }

      const docRef = await addDoc(collection(db, 'invitations'), {
        ...invitation,
        createdAt: Timestamp.fromDate(invitation.createdAt),
        expiresAt: Timestamp.fromDate(invitation.expiresAt)
      })

      invitations.value.push({ id: docRef.id, ...invitation })

      return { success: true, code }
    } catch (err: any) {
      error.value = err.message
      console.error('Error creating invitation:', err)
      return { success: false, error: err.message }
    } finally {
      loading.value = false
    }
  }

  /**
   * Accept an invitation
   */
  const acceptInvitation = async (
    invitationId: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (!authStore.user?.uid) {
      return { success: false, error: 'Usuario no autenticado' }
    }

    loading.value = true
    error.value = null

    try {
      const invitationRef = doc(db, 'invitations', invitationId)
      const invitationDoc = await getDoc(invitationRef)

      if (!invitationDoc.exists()) {
        return { success: false, error: 'Invitación no encontrada' }
      }

      const invitationData = invitationDoc.data()
      const invitation = {
        ...invitationData,
        createdAt: invitationData.createdAt?.toDate() || new Date(),
        expiresAt: invitationData.expiresAt?.toDate() || new Date(),
        acceptedAt: invitationData.acceptedAt?.toDate(),
        rejectedAt: invitationData.rejectedAt?.toDate()
      } as Invitation

      // Check if invitation is expired
      if (isInvitationExpired(invitation.expiresAt)) {
        return { success: false, error: 'La invitación ha expirado' }
      }

      // Update invitation status
      await updateDoc(invitationRef, {
        status: 'accepted',
        toUserId: authStore.user.uid,
        acceptedAt: Timestamp.now()
      })

      // Create or update relationship
      await createRelationshipFromInvitation(invitation)

      // Refresh data
      await Promise.all([fetchInvitations(), fetchRelationships()])

      return { success: true }
    } catch (err: any) {
      error.value = err.message
      console.error('Error accepting invitation:', err)
      return { success: false, error: err.message }
    } finally {
      loading.value = false
    }
  }

  /**
   * Reject an invitation
   */
  const rejectInvitation = async (
    invitationId: string
  ): Promise<{ success: boolean; error?: string }> => {
    loading.value = true
    error.value = null

    try {
      const invitationRef = doc(db, 'invitations', invitationId)
      await updateDoc(invitationRef, {
        status: 'rejected',
        rejectedAt: Timestamp.now()
      })

      await fetchInvitations()

      return { success: true }
    } catch (err: any) {
      error.value = err.message
      console.error('Error rejecting invitation:', err)
      return { success: false, error: err.message }
    } finally {
      loading.value = false
    }
  }

  /**
   * Validate and use an invitation code
   */
  const useInvitationCode = async (
    code: string
  ): Promise<{ success: boolean; invitation?: Invitation; error?: string }> => {
    if (!authStore.user?.email) {
      return { success: false, error: 'Usuario no autenticado' }
    }

    loading.value = true
    error.value = null

    try {
      const invitationsRef = collection(db, 'invitations')
      const q = query(
        invitationsRef,
        where('code', '==', code),
        where('status', '==', 'pending')
      )

      const snapshot = await getDocs(q)

      if (snapshot.empty) {
        return { success: false, error: 'Código de invitación inválido o expirado' }
      }

      const invitationDoc = snapshot.docs[0]
      const invitation = {
        id: invitationDoc.id,
        ...invitationDoc.data(),
        createdAt: invitationDoc.data().createdAt?.toDate() || new Date(),
        expiresAt: invitationDoc.data().expiresAt?.toDate() || new Date()
      } as Invitation

      // Check if invitation is expired
      if (isInvitationExpired(invitation.expiresAt)) {
        return { success: false, error: 'La invitación ha expirado' }
      }

      // Check if invitation is for this user
      if (invitation.toEmail !== authStore.user.email) {
        return { success: false, error: 'Esta invitación no es para ti' }
      }

      return { success: true, invitation }
    } catch (err: any) {
      error.value = err.message
      console.error('Error validating invitation code:', err)
      return { success: false, error: err.message }
    } finally {
      loading.value = false
    }
  }

  /**
   * Create a relationship from an accepted invitation
   */
  const createRelationshipFromInvitation = async (invitation: Invitation) => {
    const currentUserId = authStore.user?.uid
    if (!currentUserId) return

    // Determine patient ID
    let patientId = invitation.patientId
    if (!patientId) {
      // If invitation was from caregiver/professional to patient
      if (invitation.toRole === 'patient') {
        patientId = currentUserId
      } else if (invitation.fromUserRole === 'patient') {
        patientId = invitation.fromUserId
      }
    }

    // Build relationship data
    const relationshipData: any = {
      patientId,
      status: 'active',
      createdAt: Timestamp.now(),
      createdBy: invitation.fromUserId,
      acceptedAt: Timestamp.now()
    }

    // Add user data based on roles
    if (invitation.fromUserRole === 'patient') {
      relationshipData.patientName = invitation.fromUserName
      relationshipData.patientEmail = invitation.fromUserEmail
    }

    if (invitation.toRole === 'caregiver' || invitation.fromUserRole === 'caregiver') {
      const caregiverId =
        invitation.toRole === 'caregiver' ? currentUserId : invitation.fromUserId
      relationshipData.caregiverId = caregiverId
      relationshipData.caregiverEmail =
        invitation.toRole === 'caregiver' ? invitation.toEmail : invitation.fromUserEmail
    }

    if (invitation.toRole === 'professional' || invitation.fromUserRole === 'professional') {
      const professionalId =
        invitation.toRole === 'professional' ? currentUserId : invitation.fromUserId
      relationshipData.professionalId = professionalId
      relationshipData.professionalEmail =
        invitation.toRole === 'professional' ? invitation.toEmail : invitation.fromUserEmail
    }

    // Create relationship document
    await addDoc(collection(db, 'relationships'), relationshipData)
  }

  /**
   * Remove a connection
   */
  const removeConnection = async (
    relationshipId: string
  ): Promise<{ success: boolean; error?: string }> => {
    loading.value = true
    error.value = null

    try {
      await deleteDoc(doc(db, 'relationships', relationshipId))
      await fetchRelationships()

      return { success: true }
    } catch (err: any) {
      error.value = err.message
      console.error('Error removing connection:', err)
      return { success: false, error: err.message }
    } finally {
      loading.value = false
    }
  }

  /**
   * Initialize store - fetch all data
   */
  const initialize = async () => {
    if (!authStore.user?.uid) return

    await Promise.all([fetchRelationships(), fetchInvitations()])
  }

  return {
    // State
    relationships,
    invitations,
    connectionRequests,
    loading,
    error,

    // Computed
    activeRelationships,
    pendingInvitations,
    receivedInvitations,
    sentInvitations,
    myConnections,
    myPatients,
    myCaregivers,
    myProfessionals,

    // Actions
    fetchRelationships,
    fetchInvitations,
    createInvitation,
    acceptInvitation,
    rejectInvitation,
    useInvitationCode,
    removeConnection,
    initialize
  }
})