<script setup
    lang='ts'>
    import { useAuthStore } from '@/stores/auth';
    import Login from '@/components/Login';
    import WelcomeScreen from '@/components/WelcomeScreen';
    import PatientDashboard from '@/components/PatientDashboard';
    import CaregiverDashboard from '@/components/CaregiverDashboard';
    import ProfessionalDashboard from '@/components/ProfessionalDashboard';
    const authStore = useAuthStore();
    function handleRoleSelect(role: 'patient' | 'caregiver' | 'professional') {
      authStore.updateUserRole(role)
    }
    function handleBack() { authStore.updateUserRole(null) }
    function handleLoginSuccess() { /* Login successful, will show role selection or dashboard */ }</script>
<template>
    <Login v-if="!authStore.isAuthenticated" @loginSuccess="handleLoginSuccess" />
    <component
        v-else
        :is="authStore.userRole === 'patient' ? PatientDashboard : authStore.userRole === 'caregiver' ? CaregiverDashboard : authStore.userRole === 'professional' ? ProfessionalDashboard : WelcomeScreen"
        @selectRole="handleRoleSelect" @back="handleBack" />
</template>
<style>
.gradient-calm {
    background: linear-gradient(180deg, #f8fafc 0%, #ffffff 40%, #f1f5f9 100%);
}

.safe-area-pt {
    padding-top: env(safe-area-inset-top);
}
</style>
