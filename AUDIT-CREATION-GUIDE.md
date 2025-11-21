# 🔧 GUIDE CRÉATION D'AUDIT - Configuration Avancée Strings Inégaux

## ❌ PROBLÈME IDENTIFIÉ

La page `/audits/create` ne propose plus l'option **"Configuration Avancée"** permettant de créer des audits avec **strings de longueurs différentes** (comme JALIBAT : S1=26 modules, S2-S10=24 modules).

---

## ✅ SOLUTION TEMPORAIRE - API Directe

En attendant la correction de l'interface, utilisez l'**API directe** :

### **Créer Audit avec Strings Inégaux**

```bash
curl -X POST "https://diagnostic-hub.pages.dev/api/el/audit/create" \
  -H "Content-Type: application/json" \
  -d '{
    "projectName": "NOM-PROJET",
    "clientName": "NOM-CLIENT",
    "location": "Adresse du site",
    "configuration": {
      "mode": "advanced",
      "totalModules": 242,
      "stringCount": 10,
      "strings": [
        {"mpptNumber": 1, "moduleCount": 26, "physicalRow": 1, "physicalCol": 0},
        {"mpptNumber": 2, "moduleCount": 24, "physicalRow": 2, "physicalCol": 0},
        {"mpptNumber": 3, "moduleCount": 24, "physicalRow": 3, "physicalCol": 0},
        {"mpptNumber": 4, "moduleCount": 24, "physicalRow": 4, "physicalCol": 0},
        {"mpptNumber": 5, "moduleCount": 24, "physicalRow": 5, "physicalCol": 0},
        {"mpptNumber": 6, "moduleCount": 24, "physicalRow": 6, "physicalCol": 0},
        {"mpptNumber": 7, "moduleCount": 24, "physicalRow": 7, "physicalCol": 0},
        {"mpptNumber": 8, "moduleCount": 24, "physicalRow": 8, "physicalCol": 0},
        {"mpptNumber": 9, "moduleCount": 24, "physicalRow": 9, "physicalCol": 0},
        {"mpptNumber": 10, "moduleCount": 24, "physicalRow": 10, "physicalCol": 0}
      ]
    }
  }'
```

**Réponse** :
```json
{
  "success": true,
  "auditToken": "0e74eb29-...",
  "auditUrl": "/audit/0e74eb29-...",
  "totalModules": 242,
  "configuration": "advanced",
  "message": "Audit créé avec succès"
}
```

---

## 📝 EXEMPLES CONFIGURATIONS

### **Exemple 1 : JALIBAT (242 modules)**
- S1 : 26 modules
- S2-S10 : 24 modules chacun
- Total : 26 + (9 × 24) = 242 modules

### **Exemple 2 : LES FORGES (220 modules)**
- S1-S9 : 24 modules chacun  
- S10 : 16 modules
- Total : (9 × 24) + 16 = 220 modules

### **Exemple 3 : Configuration Simple (100 modules)**
- S1-S5 : 20 modules chacun
- Total : 5 × 20 = 100 modules

```json
{
  "mode": "simple",
  "stringCount": 5,
  "modulesPerString": 20,
  "totalModules": 100
}
```

---

## 🔧 FORMAT JSON Strings Inégaux

```json
{
  "configuration": {
    "mode": "advanced",
    "totalModules": TOTAL,
    "stringCount": NOMBRE_STRINGS,
    "strings": [
      {
        "mpptNumber": 1,
        "moduleCount": NOMBRE_MODULES_STRING_1,
        "physicalRow": 1,
        "physicalCol": 0
      },
      {
        "mpptNumber": 2,
        "moduleCount": NOMBRE_MODULES_STRING_2,
        "physicalRow": 2,
        "physicalCol": 0
      }
      // ... répéter pour chaque string
    ]
  }
}
```

---

## 🎯 WORKFLOW COMPLET

### **1. Créer l'Audit (API)**
```bash
# Utiliser curl ou Postman pour envoyer la requête ci-dessus
curl -X POST "https://diagnostic-hub.pages.dev/api/el/audit/create" ...
```

### **2. Récupérer le Token**
```json
{
  "auditToken": "0e74eb29-69d7-4923-8675-32dbb8e926d1"
}
```

### **3. Accéder aux Modules**
- **Dashboard** : https://diagnostic-hub.pages.dev/api/dashboard/audits
- **Éditeur Calepinage** : https://diagnostic-hub.pages.dev/api/calepinage/editor/{TOKEN}?module_type=el
- **Rapport EL** : https://diagnostic-hub.pages.dev/api/el/reports/complete/{TOKEN}

---

## ⚠️ POINTS IMPORTANTS

### **PhysicalRow / PhysicalCol**
- `physicalRow` : Numéro de ligne physique (souvent = numéro string)
- `physicalCol` : Colonne de départ (généralement 0)
- Utilisé pour le positionnement dans l'éditeur calepinage

### **Total Modules**
```javascript
totalModules = strings.reduce((sum, s) => sum + s.moduleCount, 0)
```

### **Identifiers Générés**
Format : `S{mpptNumber}-{position}`
- String 1, Module 1 → `S1-1`
- String 1, Module 26 → `S1-26`
- String 2, Module 1 → `S2-1`

---

## 🚀 CORRECTION EN COURS

**TODO : Ajouter interface dans `/audits/create` avec :**
1. Toggle "Mode Simple" / "Mode Avancé"
2. En mode avancé : champs dynamiques pour chaque string
3. Bouton "Ajouter String" / "Supprimer String"
4. Preview nombre total modules calculé
5. Validation avant soumission

**Fichier à modifier** : `/home/user/webapp/src/pages/audits-create.tsx`

---

## 📞 BESOIN D'AIDE ?

**Contact** : Adrien PAPPALARDO  
**Email** : info@diagnosticphotovoltaique.fr  
**Tél** : 06 07 29 22 12

En attendant la correction de l'interface, utilisez l'API directe ci-dessus ! 🔥
