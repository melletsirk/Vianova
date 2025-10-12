# Configuración de Firebase para VIANOVA

Este documento contiene las instrucciones paso a paso para configurar Firebase correctamente para el sistema de relaciones entre usuarios.

## 📋 Índice
1. [Reglas de Seguridad de Firestore](#reglas-de-seguridad)
2. [Índices Compuestos](#índices-compuestos)
3. [Estructura de Colecciones](#estructura-de-colecciones)
4. [Configuración de Authentication](#configuración-de-authentication)

---

## 🔒 Reglas de Seguridad

### Paso 1: Aplicar las Reglas de Firestore

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Selecciona tu proyecto: **vianovadb**
3. En el menú lateral, ve a **Firestore Database**
4. Haz clic en la pestaña **Reglas**
5. Copia el contenido del archivo `firestore.rules` de este proyecto
6. Pega el contenido en el editor de reglas
7. Haz clic en **Publicar**

### Verificación de Reglas

Las reglas implementadas permiten:
- ✅ Usuarios pueden leer/escribir sus propios datos
- ✅ Usuarios conectados pueden ver datos según su rol
- ✅ Pacientes controlan sus propios datos
- ✅ Profesionales pueden agregar medicaciones y citas
- ✅ Cuidadores pueden ver información del paciente
- ✅ Sistema de invitaciones seguro

---

## 📊 Índices Compuestos

Los índices compuestos son necesarios para queries complejas. Firebase te pedirá crearlos automáticamente cuando ejecutes las queries por primera vez, pero puedes crearlos manualmente:

### Paso 2: Crear Índices Manualmente

1. En **Firestore Database**, ve a la pestaña **Índices**
2. Haz clic en **Agregar índice**
3. Crea los siguientes índices:

#### Índice 1: Relationships por Patient
```
Colección: relationships
Campos indexados:
  - patientId (Ascendente)
  - status (Ascendente)
Estado de consulta: Habilitado
```

#### Índice 2: Relationships por Caregiver
```
Colección: relationships
Campos indexados:
  - caregiverId (Ascendente)
  - status (Ascendente)
Estado de consulta: Habilitado
```

#### Índice 3: Relationships por Professional
```
Colección: relationships
Campos indexados:
  - professionalId (Ascendente)
  - status (Ascendente)
Estado de consulta: Habilitado
```

#### Índice 4: Invitations por Email
```
Colección: invitations
Campos indexados:
  - toEmail (Ascendente)
  - status (Ascendente)
Estado de consulta: Habilitado
```

#### Índice 5: Invitations por Code
```
Colección: invitations
Campos indexados:
  - code (Ascendente)
  - status (Ascendente)
Estado de consulta: Habilitado
```

---

## 🗂️ Estructura de Colecciones

### Paso 3: Crear Colecciones Iniciales

Firebase creará las colecciones automáticamente cuando se agreguen documentos, pero puedes verificar que existan:

#### Colección: `users`
```javascript
{
  uid: string,
  email: string,
  role: 'patient' | 'caregiver' | 'professional',
  name: string (opcional),
  phone: string (opcional),
  profileComplete: boolean,
  createdAt: timestamp,
  updatedAt: timestamp (opcional)
}
```

#### Colección: `relationships`
```javascript
{
  patientId: string,
  patientName: string (opcional),
  patientEmail: string (opcional),
  caregiverId: string (opcional),
  caregiverName: string (opcional),
  caregiverEmail: string (opcional),
  professionalId: string (opcional),
  professionalName: string (opcional),
  professionalEmail: string (opcional),
  status: 'pending' | 'active' | 'rejected' | 'cancelled',
  createdAt: timestamp,
  createdBy: string,
  acceptedAt: timestamp (opcional),
  notes: string (opcional)
}
```

#### Colección: `invitations`
```javascript
{
  fromUserId: string,
  fromUserName: string (opcional),
  fromUserEmail: string,
  fromUserRole: 'patient' | 'caregiver' | 'professional',
  toEmail: string,
  toUserId: string (opcional),
  toRole: 'patient' | 'caregiver' | 'professional',
  patientId: string,
  status: 'pending' | 'accepted' | 'rejected' | 'expired',
  code: string, // 6 dígitos
  message: string (opcional),
  createdAt: timestamp,
  expiresAt: timestamp,
  acceptedAt: timestamp (opcional),
  rejectedAt: timestamp (opcional)
}
```

#### Colección: `patientData/{patientId}`
Subcolecciones:
- `dailyEntries/{date}` - Entradas diarias del paciente
- `medications/{medicationId}` - Medicaciones
- `appointments/{appointmentId}` - Citas médicas
- `alerts/{alertId}` - Alertas importantes

---

## 🔐 Configuración de Authentication

### Paso 4: Verificar Configuración de Email/Password

1. Ve a **Authentication** en el menú lateral
2. Haz clic en la pestaña **Sign-in method**
3. Verifica que **Email/Password** esté habilitado ✅
4. (Opcional) Configura plantillas de email:
   - Ve a **Templates**
   - Personaliza las plantillas para:
     - Verificación de email
     - Restablecimiento de contraseña

### Paso 5: Configurar Dominios Autorizados

1. En **Authentication**, ve a **Settings**
2. En la sección **Authorized domains**, verifica que estén:
   - `localhost` (para desarrollo)
   - Tu dominio de producción (cuando lo tengas)

---

## 🧪 Verificación de la Configuración

### Checklist de Verificación

- [ ] Reglas de Firestore publicadas
- [ ] Índices compuestos creados (o se crearán automáticamente)
- [ ] Colección `users` existe con al menos un documento
- [ ] Email/Password habilitado en Authentication
- [ ] Dominios autorizados configurados

### Probar la Configuración

1. **Crear un usuario de prueba:**
   ```
   Email: test@vianova.com
   Password: Test123456
   Role: patient
   ```

2. **Verificar que el usuario puede:**
   - ✅ Iniciar sesión
   - ✅ Ver su perfil
   - ✅ Crear invitaciones
   - ✅ Aceptar invitaciones

3. **Crear usuarios adicionales para probar relaciones:**
   - Un cuidador: `caregiver@vianova.com`
   - Un profesional: `professional@vianova.com`

---

## 🚀 Próximos Pasos

Una vez completada la configuración de Firebase:

1. **Implementar componentes UI:**
   - ConnectionManager (gestión de conexiones)
   - InvitationCard (tarjetas de invitación)
   - UserSearch (búsqueda de usuarios)

2. **Integrar en dashboards:**
   - Agregar sección de conexiones en cada dashboard
   - Mostrar invitaciones pendientes
   - Permitir gestión de relaciones

3. **Probar flujos completos:**
   - Paciente invita a cuidador
   - Cuidador acepta invitación
   - Profesional agrega paciente
   - Verificar permisos de lectura/escritura

---

## 📞 Soporte

Si encuentras problemas durante la configuración:

1. Verifica los logs en la consola del navegador
2. Revisa los logs de Firestore en Firebase Console
3. Asegúrate de que las reglas de seguridad estén publicadas
4. Verifica que los índices estén en estado "Habilitado"

---

## 🔄 Actualización de Reglas

Si necesitas actualizar las reglas en el futuro:

1. Edita el archivo `firestore.rules`
2. Prueba las reglas localmente (opcional, con Firebase Emulator)
3. Publica las reglas en Firebase Console
4. Verifica que no haya errores en la consola

---

**Última actualización:** 2025-10-12
**Versión:** 1.0.0