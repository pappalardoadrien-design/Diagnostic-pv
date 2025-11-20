# 🚀 GIRASOLE - URLs Production & Documentation

**Mission**: 52 centrales photovoltaïques (39 SOL + 13 DOUBLE)  
**Contrat**: 66.885€ HT  
**Période**: Janvier - Mars 2025  
**Status**: ✅ **PRODUCTION READY** (20 novembre 2025)

---

## 🌐 URLs Production Principales

### **Plateforme DiagPV Hub**
- **Dashboard**: https://751939b9.diagnostic-hub.pages.dev
- **Module GIRASOLE**: https://751939b9.diagnostic-hub.pages.dev/api/girasole

### **Rapports PDF GIRASOLE** (Exemples avec données test)

#### ✅ Rapport CONFORMITE (Centrale SOL)
**URL**: https://751939b9.diagnostic-hub.pages.dev/api/girasole/inspection/GIRASOLE-CONFORMITE-59-TEST/report

**Détails**:
- Projet: Centrale SOL 06 - Bouix (ID Référent: 31971)
- Type: Audit Conformité Électrique NF C 15-100
- Statistiques: 3 conformes ✅ | 1 non conforme ❌ | 1 sans objet ⏭️
- Taux conformité: 75%
- Catégories: Protections Électriques, Mise à la Terre, Câblage
- Format: HTML imprimable A4 avec branding DiagPV officiel

#### ✅ Rapport TOITURE (Centrale DOUBLE)
**URL**: https://751939b9.diagnostic-hub.pages.dev/api/girasole/inspection/GIRASOLE-TOITURE-60-TEST/report

**Détails**:
- Projet: Centrale DOUBLE 01 - EARL CADOT (ID Référent: 32010)
- Type: Audit Conformité Toiture DTU 40.35
- Statistiques: 2 conformes ✅ | 1 non conforme ❌
- Taux conformité: 67%
- Catégories: Étanchéité, Fixations
- Format: HTML imprimable A4 avec branding DiagPV officiel

---

## 📋 Workflow Terrain (Janvier-Mars 2025)

### **1. Préparer Mission**
1. Créer projet dans CRM: `/crm/projects/create`
2. Assigner ID Référent GIRASOLE (ex: 31971, 32010, ...)
3. Indiquer type audit:
   - SOL → `audit_types: ["CONFORMITE"]`
   - DOUBLE → `audit_types: ["CONFORMITE", "TOITURE"]`

### **2. Sur Terrain**
1. Accéder checklist mobile:
   - CONFORMITE: `/audit/{audit_token}/visual/girasole/conformite`
   - TOITURE: `/audit/{audit_token}/visual/girasole/toiture`
2. Pour chaque item:
   - 📸 Prendre photo
   - ✅ Marquer conformité (conforme / non conforme / sans objet)
   - 📝 Ajouter commentaire
3. Sauvegarder brouillons (localStorage offline-first)
4. Finaliser audit → Envoyer données serveur

### **3. Générer Rapport**
1. Accéder URL rapport:
   - Format: `/api/girasole/inspection/{audit_token}/report`
   - Remplacer `{audit_token}` par le token de l'audit
2. Imprimer rapport (bouton "📄 Imprimer")
3. Envoyer PDF client par email

---

## 🎯 Types d'Audits & Checklists

### **CONFORMITE (39 centrales SOL)**
**Normes**: NF C 15-100 + UTE C 15-712

**Catégories**:
1. **PROTECTIONS** - Protections Électriques
   - Protection différentielle 30mA
   - Disjoncteur magnétothermique DC
   - Parafoudre adapté

2. **MISE_A_TERRE** - Mise à la Terre
   - Continuité liaison équipotentielle
   - Résistance de terre < 100 Ω

3. **CABLAGE** - Câblage
   - Section câbles DC conformes (6mm² min)
   - Câbles résistants UV
   - Connecteurs MC4 serrés
   - Étiquetage DC/AC conforme

4. **EQUIPEMENTS** - Équipements
   - Onduleur état général
   - Compteur production
   - Coffret AC/DC

5. **SIGNALISATION** - Signalisation
   - Panneaux réglementaires
   - Schémas unifilaires
   - Consignes sécurité

**Total items**: ~80 points de contrôle répartis en 12 sections

---

### **TOITURE (13 centrales DOUBLE)**
**Normes**: DTU 40.35 + ETN

**Catégories**:
1. **ETANCHEITE** - Étanchéité
   - État membrane étanchéité
   - Traversées étanches (passe-câbles)
   - Joints relevés d'étanchéité
   - Zinguerie en bon état

2. **FIXATIONS** - Fixations
   - Système fixation adapté support
   - Lestage conforme (si applicable)
   - Bacs acier fixés solidement

3. **STRUCTURE** - Structure
   - Rails aluminium sans corrosion
   - Assemblage mécanique correct
   - Espacements respect DTU

4. **EVACUATION** - Évacuation EP
   - Évacuation eaux pluviales libre
   - Pente toiture conforme
   - Grilles avaloirs dégagées

5. **SECURITE** - Sécurité
   - Lignes de vie conformes
   - Garde-corps présents
   - Accès toiture sécurisé
   - EPI obligatoires disponibles

**Total items**: ~60 points de contrôle répartis en 7 sections

---

## 🛠️ API Endpoints GIRASOLE

### **Inspections Visuelles**
```http
GET    /api/girasole/projects                      # Liste projets GIRASOLE
GET    /api/girasole/project/:id                   # Détail projet
GET    /api/girasole/inspection/:audit_token       # Détail inspection
GET    /api/girasole/inspection/:audit_token/report # Rapport PDF HTML
POST   /api/girasole/inspection/:audit_token       # Créer/mettre à jour inspection
```

### **Exemples requêtes**

#### Créer inspection CONFORMITE
```bash
curl -X POST https://751939b9.diagnostic-hub.pages.dev/api/girasole/inspection/GIRASOLE-CONFORMITE-59-TEST \
  -H "Content-Type: application/json" \
  -d '{
    "project_id": 59,
    "checklist_type": "CONFORMITE",
    "items": [
      {
        "inspection_type": "CONF-01",
        "audit_category": "PROTECTIONS",
        "checklist_section": "Protection différentielle",
        "conformite": "conforme",
        "notes": "{\"description\": \"Protection 30mA OK\", \"normReference\": \"NF C 15-100 Section 531.2\"}"
      }
    ]
  }'
```

#### Récupérer rapport
```bash
curl https://751939b9.diagnostic-hub.pages.dev/api/girasole/inspection/GIRASOLE-CONFORMITE-59-TEST/report
```

---

## 📊 Données Test Disponibles

### **Client**
- ID: 1
- Nom: GIRASOLE Energies
- Type: client
- Status: active

### **Projets**
1. **Centrale SOL 06 - Bouix**
   - ID: 59
   - ID Référent: 31971
   - Adresse: Bouix 11100
   - Puissance: 250 kWc
   - Type audit: CONFORMITE
   - Audit token: `GIRASOLE-CONFORMITE-59-TEST`

2. **Centrale DOUBLE 01 - EARL CADOT**
   - ID: 60
   - ID Référent: 32010
   - Adresse: CADOT 34000
   - Puissance: 300 kWc
   - Type audit: CONFORMITE + TOITURE
   - Audit token: `GIRASOLE-TOITURE-60-TEST`

### **Inspections (8 items)**
- CONFORMITE: 5 items (3 conformes, 1 non conforme, 1 sans objet)
- TOITURE: 3 items (2 conformes, 1 non conforme)

---

## ✅ Checklist Déploiement (COMPLETED)

- [x] **Build production** (1,011.66 kB bundle)
- [x] **Déploiement Cloudflare Pages** (https://751939b9.diagnostic-hub.pages.dev)
- [x] **Migrations database appliquées** (migration 0040)
- [x] **Données test insérées** (2 projets, 8 inspections)
- [x] **Tests rapports CONFORMITE** (✅ 75% conformité)
- [x] **Tests rapports TOITURE** (✅ 67% conformité)
- [x] **Branding DiagPV vérifié** (logo, L'Union, RCS 792972309, Fabien CORRERA)
- [x] **Git commit & documentation** (README.md updated)
- [x] **URLs production validées** (endpoints fonctionnels)

---

## 🎯 Prochaines Étapes (Janvier 2025)

### **Avant Première Mission**
1. ✅ Créer les 52 projets dans CRM (import CSV planificateur GIRASOLE)
2. ✅ Générer audit tokens pour chaque centrale
3. ✅ Tester checklists mobile sur terrain (smartphone/tablette)
4. ✅ Former techniciens workflow GIRASOLE

### **Pendant Missions (Janvier-Mars)**
1. ✅ Remplir checklists terrain (photos + conformité)
2. ✅ Générer rapports PDF individuels (52 rapports)
3. ✅ Vérifier taux conformité global
4. ✅ Export Excel ANNEXE 2 (si nécessaire)

### **Après Missions (Avril)**
1. ✅ Rapport synthèse général client GIRASOLE
2. ✅ Facturation mission (66.885€ HT)
3. ✅ Archivage données audit
4. ✅ Retour expérience workflow

---

## 🔐 Sécurité & Confidentialité

**Données GIRASOLE**:
- ✅ Base de données Cloudflare D1 (chiffrement automatique)
- ✅ Accès HTTPS uniquement (TLS 1.3)
- ✅ Pas d'authentification requise pour rapports (URLs tokens uniques)
- ✅ Backup automatique database Cloudflare

**Conformité**:
- ✅ RGPD: Données clients stockées EU (Frankfurt)
- ✅ Traçabilité: Timestamps création/modification
- ✅ Archivage: 10 ans minimum (conformité réglementaire)

---

## 📞 Support Technique

**Adrien PAPPALARDO**  
Business Developer DiagPV  
📱 06 07 29 22 12  
📧 info@diagnosticphotovoltaique.fr  

**Diagnostic Photovoltaïque**  
3 rue d'Apollo, 31240 L'Union  
☎ 05.81.10.16.59  
📧 contact@diagpv.fr  
🌐 www.diagnosticphotovoltaique.fr  
RCS 792972309

---

**Version Document**: v1.0 - 20 novembre 2025  
**Status**: ✅ Production Ready  
**Prochaine MAJ**: Après première mission terrain (janvier 2025)
