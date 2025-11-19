# 📊 GIRASOLE - Stockage des Données

## 🎯 Question : Où vont les photos et les résultats de checklist ?

---

## 📸 **Photos Techniciens**

### **Table Database : `photos`**

**Où** : Cloudflare D1 Database `diagnostic-hub-production`

**Schéma** :
```sql
CREATE TABLE photos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  audit_token TEXT NOT NULL,
  module_type TEXT NOT NULL,        -- 'CONFORMITE_GIRASOLE', 'TOITURE_GIRASOLE', 'EL', 'VISUAL'
  photo_data TEXT NOT NULL,         -- Base64 string (data:image/jpeg;base64,...)
  photo_format TEXT,                -- 'jpeg', 'png', 'webp'
  photo_size INTEGER,               -- Taille en bytes
  description TEXT,                 -- ID item checklist (ex: "id_centrale")
  string_number INTEGER,
  module_number INTEGER,
  latitude REAL,
  longitude REAL,
  gps_accuracy REAL,
  captured_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### **API Routes Photos** :
```
POST   /api/photos/upload                       Upload photo (base64)
GET    /api/photos/:auditToken                  Liste photos audit
GET    /api/photos/:auditToken/:photoId         Photo spécifique
DELETE /api/photos/:auditToken/:photoId         Supprimer photo
GET    /api/photos/:auditToken/module/:type     Photos par type module
```

### **Workflow Upload Photo** :
1. **Technicien clique bouton 📸** sur item checklist
2. **Caméra native s'ouvre** (Camera API mobile)
3. **Photo capturée** → convertie en base64
4. **POST /api/photos/upload** avec :
   ```json
   {
     "audit_token": "TEST-SOL",
     "module_type": "CONFORMITE_GIRASOLE",
     "photo_data": "data:image/jpeg;base64,/9j/4AAQ...",
     "description": "id_centrale",
     "latitude": 43.2951,
     "longitude": 5.3712,
     "accuracy": 10.5
   }
   ```
5. **Response** : `{ photo_id: 123, size: 245678 }`
6. **Photo_id stocké** dans `photos[item.id]` array (localStorage)
7. **À la soumission** : tous les photo_id envoyés dans `photo_url` (JSON array)

### **Exemple Données Stockées** :
```json
{
  "id": 123,
  "audit_token": "TEST-SOL",
  "module_type": "CONFORMITE_GIRASOLE",
  "photo_data": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQ...",
  "photo_format": "jpeg",
  "photo_size": 245678,
  "description": "auto_pv_reception",
  "latitude": 43.2951,
  "longitude": 5.3712,
  "captured_at": "2025-01-15 14:32:15"
}
```

---

## ✅ **Résultats Checklist (Conformité + Commentaires)**

### **Table Database : `visual_inspections`**

**Où** : Cloudflare D1 Database `diagnostic-hub-production`

**Schéma (avec champs GIRASOLE)** :
```sql
CREATE TABLE visual_inspections (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  audit_token TEXT NOT NULL,
  intervention_id INTEGER,
  
  -- Champs standards
  inspection_type TEXT NOT NULL,           -- 'conformite_nfc15100', 'toiture_dtu4035'
  string_number INTEGER,
  module_number INTEGER,
  location_description TEXT,               -- Label item checklist
  defect_found INTEGER DEFAULT 0,          -- 1 si non_conforme
  defect_type TEXT,
  severity_level TEXT,
  notes TEXT,                              -- Commentaires technicien
  photo_url TEXT,                          -- JSON array photo_ids: "[123,456]"
  gps_latitude REAL,
  gps_longitude REAL,
  corrective_action_required INTEGER,
  corrective_action_description TEXT,
  inspection_date DATE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  -- 🆕 Champs GIRASOLE
  conformite TEXT CHECK(conformite IN ('conforme', 'non_conforme', 'so', NULL)),
  prescriptions_girasole TEXT,
  bonnes_pratiques TEXT,
  audit_category TEXT DEFAULT 'general',   -- 'conformite_nfc15100', 'toiture_dtu4035', 'bureau_etudes'
  checklist_section TEXT,                  -- "1. Identification Centrale"
  item_order INTEGER DEFAULT 0             -- 100, 101, 102... (tri)
);
```

### **API Routes Inspections** :
```
GET    /api/visual/inspections/:token          Liste inspections audit
POST   /api/visual/inspections/:token          Créer inspection (1 item)
GET    /api/visual/report/:token               Rapport PDF complet
```

### **Workflow Soumission Checklist** :
1. **Technicien remplit checklist** (conformité + commentaires + photos)
2. **Données stockées temporairement** dans localStorage :
   ```javascript
   checklistData = {
     "id_centrale": { conformite: "conforme", comment: "OK", value: "Centrale Narbonne" },
     "auto_pv_reception": { conformite: "non_conforme", comment: "PV manquant" },
     // ...
   }
   photos = {
     "auto_pv_reception": [{ id: 123, data: "..." }, { id: 456, data: "..." }]
   }
   ```
3. **Clic "Soumettre Audit"** → boucle sur tous les items
4. **Pour chaque item** :
   ```javascript
   POST /api/visual/inspections/TEST-SOL
   {
     "audit_token": "TEST-SOL",
     "inspection_type": "conformite_nfc15100",
     "audit_category": "conformite_nfc15100",
     "checklist_section": "2. Autocontrôle Installateur",
     "item_order": 201,
     "location_description": "PV de réception lot PV présent",
     "defect_found": true,
     "conformite": "non_conforme",
     "notes": "PV manquant",
     "photo_url": "[123,456]"
   }
   ```
5. **Résultat** : ~80 rows insérées dans `visual_inspections` (1 par item)

### **Exemple Données Stockées** :
```json
{
  "id": 1,
  "audit_token": "TEST-SOL",
  "inspection_type": "conformite_nfc15100",
  "audit_category": "conformite_nfc15100",
  "checklist_section": "2. Autocontrôle Installateur",
  "item_order": 201,
  "location_description": "PV de réception lot PV présent",
  "defect_found": 1,
  "conformite": "non_conforme",
  "notes": "PV manquant",
  "photo_url": "[123,456]",
  "inspection_date": "2025-01-15",
  "created_at": "2025-01-15 14:35:22"
}
```

---

## 🔍 **Requêtes Utiles**

### **Lister toutes les inspections d'un audit** :
```sql
SELECT 
  checklist_section,
  location_description,
  conformite,
  notes,
  photo_url
FROM visual_inspections
WHERE audit_token = 'TEST-SOL'
ORDER BY item_order;
```

### **Compter les non-conformités** :
```sql
SELECT 
  COUNT(*) as total_nc
FROM visual_inspections
WHERE audit_token = 'TEST-SOL' 
  AND conformite = 'non_conforme';
```

### **Photos d'un audit GIRASOLE** :
```sql
SELECT 
  description,
  photo_format,
  photo_size,
  captured_at
FROM photos
WHERE audit_token = 'TEST-SOL'
  AND module_type = 'CONFORMITE_GIRASOLE'
ORDER BY captured_at;
```

### **Récupérer une photo spécifique (avec base64)** :
```sql
SELECT photo_data
FROM photos
WHERE id = 123;
```

---

## 📦 **Taille Stockage**

### **Limites Cloudflare D1** :
- **Free Plan** : 5 GB storage, 5M rows
- **Photo moyenne** : ~250 KB (JPEG compressé)
- **Base64 overhead** : +33% (330 KB en DB)
- **Stockage typique** : 
  - 1 audit SOL (39 centrales) = ~80 items × 2 photos = 160 photos × 330 KB = **52 MB**
  - 52 audits GIRASOLE = **~2.7 GB** (photos seules)

### **Optimisations Possibles** :
- Compression JPEG qualité 80% (actuelle)
- Redimensionnement max 1920px (actuelle)
- Migration vers **Cloudflare R2** si > 5 GB (S3-compatible, pas de limite)

---

## 🚀 **URLs Production**

### **Checklists** :
```
Conformité SOL (39 centrales) :
https://b5ff45a5.diagnostic-hub.pages.dev/audit/TEST-SOL/visual/girasole/conformite

Toiture (13 centrales) :
https://b5ff45a5.diagnostic-hub.pages.dev/audit/TEST-TOITURE/visual/girasole/toiture
```

### **API** :
```
Photos :
https://b5ff45a5.diagnostic-hub.pages.dev/api/photos/upload
https://b5ff45a5.diagnostic-hub.pages.dev/api/photos/TEST-SOL

Inspections :
https://b5ff45a5.diagnostic-hub.pages.dev/api/visual/inspections/TEST-SOL
```

---

## 🔐 **Sécurité & Accès**

### **Authentification** :
- Actuellement : **Désactivée** (AUTH_ENABLED=false)
- Production future : JWT tokens + rôles (admin, auditor, client)

### **RGPD Photos** :
- Photos stockées avec GPS → **données sensibles**
- Supprimer après génération PDF ? (optionnel)
- Ou anonymiser GPS après rapport

### **Backup** :
- Export CSV inspections : `/api/visual/export-csv/:token`
- Export JSON photos : `/api/photos/export/:token`
- Backup complet D1 : `wrangler d1 backup`

---

## ✅ **Résumé**

**Photos** → Table `photos` (base64) via API `/api/photos/upload`  
**Checklist** → Table `visual_inspections` (1 row par item) via API `/api/visual/inspections/:token`  
**Stockage** → Cloudflare D1 SQLite (5 GB free, ~2.7 GB pour GIRASOLE)  
**Production** → https://b5ff45a5.diagnostic-hub.pages.dev

**Tout est opérationnel ! 🎉**
