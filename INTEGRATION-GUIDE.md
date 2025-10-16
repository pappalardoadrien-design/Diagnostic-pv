# 🚀 Guide d'intégration DiagPV Audit EL

## 📋 Options d'intégration disponibles

### 1. 🖼️ Intégration Iframe (Recommandée - Plus simple)

**Avantages :**
- ✅ Aucune modification de votre hub existant
- ✅ Déploiement en 5 minutes
- ✅ Mises à jour automatiques
- ✅ Sécurité isolée
- ✅ Compatible avec tout CMS (WordPress, Drupal, etc.)

**Implémentation :**
```html
<!-- Ajouter dans votre page -->
<iframe 
    src="https://9b8a231d.diagpv-audit.pages.dev"
    style="width: 100%; height: 100vh; border: none;"
    title="DiagPV Audit EL">
</iframe>
```

**Fichier complet :** `integration-iframe.html`

---

### 2. 🔌 Intégration API REST (Plus flexible)

**Avantages :**
- ✅ Contrôle total de l'interface utilisateur
- ✅ Intégration native dans votre design
- ✅ Gestion des utilisateurs personnalisée
- ✅ Compatible PHP, Python, Node.js, etc.

**API Endpoints disponibles :**
```
GET  /api/dashboard/audits          # Liste des audits
POST /api/audit/create              # Créer un audit
GET  /api/audit/{token}             # Détails d'un audit
POST /api/audit/{token}/bulk-update # Mettre à jour modules
GET  /api/audit/{token}/report      # Générer rapport PDF
```

**Fichier exemple :** `integration-api-example.php`

---

### 3. ⚛️ Composant React (Intégration avancée)

**Avantages :**
- ✅ Interface native dans votre application React
- ✅ Gestion d'état intégrée
- ✅ Composants réutilisables
- ✅ Expérience utilisateur fluide

**Fichier complet :** `integration-react.jsx`

---

### 4. 🔧 Plugin WordPress (Si vous utilisez WordPress)

**Avantages :**
- ✅ Installation en un clic
- ✅ Shortcodes pour insertion facile
- ✅ Gestion AJAX sécurisée
- ✅ Interface d'administration

**Shortcodes disponibles :**
```
[diagpv_audits]         # Liste des audits
[diagpv_create]         # Formulaire de création
```

**Fichier plugin :** `diagpv-wordpress-plugin.php`

---

## 🏗️ Déploiement sur votre propre domaine

### Option A : Sous-domaine dédié

1. **Créer un sous-domaine** : `audit.votre-domaine.com`

2. **Configuration DNS CNAME :**
```
audit.votre-domaine.com CNAME 9b8a231d.diagpv-audit.pages.dev
```

3. **Configuration Cloudflare Pages :**
```bash
npx wrangler pages domain add audit.votre-domaine.com --project-name diagpv-audit
```

### Option B : Répertoire dédié

1. **Proxy reverse Apache/Nginx** vers `https://9b8a231d.diagpv-audit.pages.dev`

2. **Configuration Nginx :**
```nginx
location /audit/ {
    proxy_pass https://9b8a231d.diagpv-audit.pages.dev/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
}
```

3. **Configuration Apache :**
```apache
ProxyPass /audit/ https://9b8a231d.diagpv-audit.pages.dev/
ProxyPassReverse /audit/ https://9b8a231d.diagpv-audit.pages.dev/
```

---

## 🔐 Configuration SSO (Authentification unique)

### Middleware d'authentification

```javascript
// middleware/auth.js dans votre hub
app.use('/audit', (req, res, next) => {
    // Vérifier session utilisateur
    if (!req.session.user) {
        return res.redirect('/login');
    }
    
    // Injecter token utilisateur pour DiagPV
    res.setHeader('X-User-Token', req.session.user.id);
    next();
});
```

### Token-based authentication

```php
// Générer token temporaire pour DiagPV
$userToken = jwt_encode([
    'user_id' => $current_user->ID,
    'username' => $current_user->display_name,
    'exp' => time() + 3600 // 1 heure
], YOUR_SECRET_KEY);

// Rediriger vers DiagPV avec token
$diagpvUrl = "https://9b8a231d.diagpv-audit.pages.dev?token=" . $userToken;
header("Location: $diagpvUrl");
```

---

## 📱 Intégration mobile (App hybride)

### Cordova/PhoneGap

```javascript
// Ouvrir DiagPV dans InAppBrowser
const ref = cordova.InAppBrowser.open(
    'https://9b8a231d.diagpv-audit.pages.dev',
    '_blank',
    'location=no,toolbar=no,zoom=no'
);
```

### React Native

```javascript
import { WebView } from 'react-native-webview';

<WebView 
    source={{ uri: 'https://9b8a231d.diagpv-audit.pages.dev' }}
    style={{ flex: 1 }}
/>
```

---

## 🎨 Personnalisation de l'interface

### CSS personnalisé via postMessage

```javascript
// Injecter CSS personnalisé dans l'iframe
const iframe = document.getElementById('diagpvFrame');
iframe.onload = function() {
    iframe.contentWindow.postMessage({
        type: 'inject_css',
        css: `
            .header-sticky { background: #your-color !important; }
            .btn-primary { background: #your-brand-color !important; }
        `
    }, 'https://9b8a231d.diagpv-audit.pages.dev');
};
```

### Thème sombre/clair

```javascript
// Basculer thème
iframe.contentWindow.postMessage({
    type: 'set_theme',
    theme: 'light' // ou 'dark'
}, 'https://9b8a231d.diagpv-audit.pages.dev');
```

---

## 📊 Analytics et suivi

### Google Analytics

```html
<!-- Ajouter dans votre hub -->
<script>
window.addEventListener('message', function(event) {
    if (event.origin !== 'https://9b8a231d.diagpv-audit.pages.dev') return;
    
    if (event.data.type === 'diagpv_audit_created') {
        gtag('event', 'audit_created', {
            'custom_parameter': event.data.auditToken
        });
    }
});
</script>
```

### Matomo/Piwik

```javascript
// Tracking personnalisé
window.addEventListener('message', function(event) {
    if (event.data.type === 'diagpv_page_view') {
        _paq.push(['setCustomUrl', event.data.url]);
        _paq.push(['trackPageView']);
    }
});
```

---

## 🔧 Configuration avancée

### Variables d'environnement

```bash
# Fichier .env pour personnalisation
DIAGPV_BRAND_NAME="Votre Entreprise"
DIAGPV_BRAND_COLOR="#your-color"
DIAGPV_CONTACT_EMAIL="contact@votre-domaine.com"
DIAGPV_SUPPORT_URL="https://votre-domaine.com/support"
```

### Webhook de notification

```javascript
// Recevoir notifications en temps réel
app.post('/webhook/diagpv', (req, res) => {
    const { type, data } = req.body;
    
    switch(type) {
        case 'audit_created':
            // Notifier votre équipe
            sendSlackNotification(`Nouvel audit: ${data.projectName}`);
            break;
            
        case 'audit_completed':
            // Envoyer email client
            sendClientEmail(data.clientEmail, data.reportUrl);
            break;
    }
    
    res.status(200).send('OK');
});
```

---

## 🚀 Déploiement rapide (5 minutes)

### Étape 1: Choisir votre méthode
```bash
# Option iframe (le plus simple)
wget https://raw.githubusercontent.com/your-repo/integration-iframe.html
# Modifier l'URL selon vos besoins et publier

# Option API
wget https://raw.githubusercontent.com/your-repo/integration-api-example.php  
# Adapter à votre architecture

# Option WordPress
# Télécharger diagpv-wordpress-plugin.php
# Installer dans /wp-content/plugins/
# Activer le plugin
```

### Étape 2: Tester l'intégration
```bash
# Vérifier l'accès API
curl https://9b8a231d.diagpv-audit.pages.dev/api/dashboard/audits

# Tester création d'audit
curl -X POST https://9b8a231d.diagpv-audit.pages.dev/api/audit/create \
  -H "Content-Type: application/json" \
  -d '{"projectName":"Test","clientName":"Test","location":"Test"}'
```

### Étape 3: Configuration production
```bash
# Si domaine personnalisé souhaité
npx wrangler pages domain add votre-domaine.com --project-name diagpv-audit

# Configuration SSL automatique via Cloudflare
```

---

## 📞 Support et maintenance

### Mise à jour automatique
- ✅ DiagPV se met à jour automatiquement
- ✅ Pas d'interruption de service
- ✅ Compatibilité ascendante garantie

### Support technique
- 📧 Email: support@diagpv.com
- 📱 Téléphone: +33 X XX XX XX XX
- 💬 Chat: Disponible dans l'interface DiagPV

### Documentation API
- 📚 Documentation complète: https://docs.diagpv.com
- 🔧 Exemples d'intégration: https://github.com/diagpv/integrations
- 🐛 Rapport de bugs: https://github.com/diagpv/issues

---

## ✅ Checklist de déploiement

- [ ] Méthode d'intégration choisie
- [ ] Tests d'API effectués
- [ ] Interface utilisateur validée
- [ ] Authentification configurée (si nécessaire)
- [ ] Analytics en place
- [ ] Formation équipe effectuée
- [ ] Backup et rollback planifiés
- [ ] Documentation utilisateur rédigée

---

**🎯 Besoin d'aide pour l'intégration ?**

Contactez-nous pour un accompagnement personnalisé selon votre infrastructure !