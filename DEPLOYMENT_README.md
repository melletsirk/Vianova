# Guía de Despliegue Automático en Vercel

## Configuración Inicial

### 1. Configurar Vercel CLI
```bash
npm i -g vercel
vercel login
```

### 2. Configurar el proyecto en Vercel
```bash
vercel --prod
```

### 3. Configurar Variables de Entorno en Vercel
Ve a tu dashboard de Vercel y configura estas variables:

- `VERCEL_WEBHOOK_SECRET`: Un secreto para validar webhooks (genera uno aleatorio)

### 4. Configurar GitHub Actions
Para despliegue automático, configura estos secrets en tu repositorio de GitHub:

- `VERCEL_TOKEN`: Tu token de Vercel
- `VERCEL_ORG_ID`: ID de tu organización en Vercel
- `VERCEL_PROJECT_ID`: ID del proyecto en Vercel

### 5. Configurar Webhooks en Vercel
1. Ve a tu proyecto en Vercel
2. Ve a Settings > Git
3. En "Deploy Hooks", crea un webhook con URL:
   ```
   https://tu-dominio.vercel.app/api/webhook
   ```
4. Copia el webhook secret y configúralo como `VERCEL_WEBHOOK_SECRET`

## Funcionamiento

### Despliegue Automático
- Cada push a `main`/`master` activa el workflow de GitHub Actions
- El workflow construye y despliega automáticamente a Vercel
- Vercel envía webhooks para notificar sobre el estado del despliegue

### Webhooks
- Los webhooks se procesan en `/api/webhook.ts`
- Actualmente registra eventos de despliegue en los logs
- Puedes extender la funcionalidad para enviar notificaciones, etc.

## Comandos Útiles

### Despliegue Manual
```bash
vercel --prod
```

### Ver logs de despliegue
```bash
vercel logs
```

### Ver estado del proyecto
```bash
vercel ls
```

## Solución de Problemas

### Error de build
- Verifica que todas las dependencias estén en `package.json`
- Asegúrate de que el build funciona localmente con `npm run build`

### Error de webhooks
- Verifica que `VERCEL_WEBHOOK_SECRET` esté configurado
- Revisa los logs de Vercel para errores en `/api/webhook.ts`

### Error de GitHub Actions
- Verifica que todos los secrets estén configurados correctamente
- Revisa los logs del workflow en GitHub Actions