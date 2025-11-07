# TODO - Configuration Électrique Phase 2 (JavaScript)

**Statut:** 75% complété - Fondations déployées  
**Temps estimé:** ~30 minutes  
**Priorité:** Haute (bloquant MVP)

---

## ✅ PHASE 1 COMPLÉTÉE (Commit 0fca570)

### Base de Données
- ✅ Tables créées: `pv_inverters`, `pv_string_assignments`, `pv_junction_boxes`
- ✅ Vues agrégées: `v_inverter_summary`, `v_electrical_validation`
- ✅ Migration appliquée: locale + production

### API Routes
- ✅ GET `/api/pv/plants/:plantId/zones/:zoneId/inverters` - Liste onduleurs
- ✅ GET `/api/pv/plants/:plantId/zones/:zoneId/inverters/:inverterId` - Détail onduleur
- ✅ POST `/api/pv/plants/:plantId/zones/:zoneId/inverters` - Créer onduleur
- ✅ PUT `/api/pv/plants/:plantId/zones/:zoneId/inverters/:inverterId` - Mettre à jour
- ✅ DELETE `/api/pv/plants/:plantId/zones/:zoneId/inverters/:inverterId` - Supprimer
- ✅ POST `/api/pv/plants/:plantId/zones/:zoneId/inverters/:inverterId/assign-string` - Attribuer string
- ✅ DELETE `/api/pv/plants/:plantId/zones/:zoneId/inverters/:inverterId/assign-string/:stringNumber` - Retirer
- ✅ GET `/api/pv/plants/:plantId/zones/:zoneId/electrical-validation` - Validation

### Interface UI
- ✅ ÉTAPE 4: Configuration Électrique (panneau gauche PV Carto Editor V2)
- ✅ Modal création/édition onduleur avec formulaire complet
- ✅ Variables globales: `inverters = []`, `currentEditingInverter = null`

---

## ⚠️ PHASE 2 À COMPLÉTER (JavaScript)

### 1. Fonctions de Chargement et Affichage

#### `loadInverters()` - Récupération API
```javascript
async function loadInverters() {
    try {
        const response = await fetch(`/api/pv/plants/${plantId}/zones/${zoneId}/inverters`)
        const data = await response.json()
        
        if (data.success) {
            inverters = data.inverters || []
            renderInvertersList()
        }
    } catch (error) {
        console.error('Erreur chargement onduleurs:', error)
        alert('Erreur chargement onduleurs')
    }
}
```

#### `renderInvertersList()` - Affichage liste
```javascript
function renderInvertersList() {
    const container = document.getElementById('invertersList')
    
    if (inverters.length === 0) {
        container.innerHTML = '<p class="text-xs text-gray-500 text-center py-2">Aucun onduleur configuré</p>'
        return
    }
    
    container.innerHTML = inverters.map(inv => `
        <div class="bg-black rounded p-2 text-xs border border-yellow-600">
            <div class="flex justify-between items-center mb-1">
                <span class="font-bold text-yellow-400">${inv.inverter_name}</span>
                <div class="flex gap-1">
                    <button onclick="editInverter(${inv.id})" 
                            class="bg-blue-600 hover:bg-blue-700 px-2 py-1 rounded text-xs">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="deleteInverter(${inv.id})" 
                            class="bg-red-600 hover:bg-red-700 px-2 py-1 rounded text-xs">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
            <div class="text-gray-400 space-y-1">
                <div>⚡ ${inv.rated_power_kw} kW</div>
                <div>📊 ${inv.assigned_strings || 0} strings / ${inv.module_count || 0} modules</div>
                <div class="flex items-center gap-2">
                    <span>Charge:</span>
                    <div class="flex-1 bg-gray-700 rounded-full h-2">
                        <div class="bg-yellow-400 h-2 rounded-full" style="width: ${inv.load_percent || 0}%"></div>
                    </div>
                    <span class="font-bold">${inv.load_percent || 0}%</span>
                </div>
            </div>
        </div>
    `).join('')
}
```

---

### 2. Gestion Modal Onduleur

#### `showInverterModal(inverterId = null)` - Ouverture modal
```javascript
function showInverterModal(inverterId = null) {
    const modal = document.getElementById('inverterModal')
    const form = document.getElementById('inverterForm')
    const title = document.getElementById('inverterModalTitle')
    
    // Mode création vs édition
    if (inverterId) {
        const inverter = inverters.find(i => i.id === inverterId)
        if (!inverter) return
        
        currentEditingInverter = inverter
        title.textContent = 'MODIFIER ONDULEUR'
        
        // Remplir formulaire
        document.getElementById('inverterId').value = inverter.id
        document.getElementById('inverterName').value = inverter.inverter_name
        document.getElementById('inverterPower').value = inverter.rated_power_kw
        document.getElementById('inverterBrand').value = inverter.inverter_brand || ''
        document.getElementById('inverterModel').value = inverter.inverter_model || ''
        document.getElementById('inverterMppt').value = inverter.mppt_count || 4
        document.getElementById('inverterEfficiency').value = inverter.efficiency_percent || 98
        document.getElementById('inverterNotes').value = inverter.notes || ''
    } else {
        currentEditingInverter = null
        title.textContent = 'NOUVEL ONDULEUR'
        form.reset()
        document.getElementById('inverterId').value = ''
    }
    
    // Générer checkboxes strings disponibles
    populateStringCheckboxes(inverterId)
    
    modal.classList.remove('hidden')
}
```

#### `populateStringCheckboxes(inverterId)` - Génération checkboxes
```javascript
function populateStringCheckboxes(inverterId) {
    const container = document.getElementById('stringCheckboxes')
    
    // Récupérer strings uniques des modules
    const uniqueStrings = [...new Set(modules.map(m => m.string_number))]
        .filter(s => s != null)
        .sort((a, b) => a - b)
    
    if (uniqueStrings.length === 0) {
        container.innerHTML = '<p class="col-span-4 text-xs text-gray-500 text-center">Aucun string détecté</p>'
        return
    }
    
    // Si édition, récupérer strings déjà attribués
    let assignedStrings = []
    if (inverterId) {
        const inv = inverters.find(i => i.id === inverterId)
        assignedStrings = inv?.assigned_string_numbers || []
    }
    
    container.innerHTML = uniqueStrings.map(strNum => {
        const checked = assignedStrings.includes(strNum) ? 'checked' : ''
        return `
            <label class="flex items-center gap-1 text-xs bg-gray-700 p-2 rounded cursor-pointer hover:bg-gray-600">
                <input type="checkbox" name="strings" value="${strNum}" ${checked}
                       class="form-checkbox text-yellow-400">
                <span>S${strNum}</span>
            </label>
        `
    }).join('')
}
```

---

### 3. Sauvegarde et Suppression

#### `saveInverter()` - Création/Édition via API
```javascript
async function saveInverter(event) {
    event.preventDefault()
    
    const inverterId = document.getElementById('inverterId').value
    const formData = {
        inverter_name: document.getElementById('inverterName').value,
        rated_power_kw: parseFloat(document.getElementById('inverterPower').value),
        inverter_brand: document.getElementById('inverterBrand').value,
        inverter_model: document.getElementById('inverterModel').value,
        mppt_count: parseInt(document.getElementById('inverterMppt').value),
        efficiency_percent: parseFloat(document.getElementById('inverterEfficiency').value),
        notes: document.getElementById('inverterNotes').value
    }
    
    try {
        let response
        if (inverterId) {
            // Mise à jour
            response = await fetch(`/api/pv/plants/${plantId}/zones/${zoneId}/inverters/${inverterId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            })
        } else {
            // Création
            response = await fetch(`/api/pv/plants/${plantId}/zones/${zoneId}/inverters`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            })
        }
        
        const data = await response.json()
        
        if (data.success) {
            // Gérer attributions strings
            const newInverterId = inverterId || data.inverter.id
            await updateStringAssignments(newInverterId)
            
            // Recharger liste
            await loadInverters()
            hideInverterModal()
            alert('Onduleur enregistré avec succès!')
        } else {
            alert('Erreur: ' + data.error)
        }
    } catch (error) {
        console.error('Erreur sauvegarde onduleur:', error)
        alert('Erreur sauvegarde onduleur')
    }
}
```

#### `updateStringAssignments(inverterId)` - Sync attributions
```javascript
async function updateStringAssignments(inverterId) {
    const selectedStrings = Array.from(document.querySelectorAll('input[name="strings"]:checked'))
        .map(cb => parseInt(cb.value))
    
    // Récupérer strings actuellement attribués
    const inverter = inverters.find(i => i.id === inverterId)
    const currentStrings = inverter?.assigned_string_numbers || []
    
    // Retirer strings décochés
    for (const strNum of currentStrings) {
        if (!selectedStrings.includes(strNum)) {
            await fetch(`/api/pv/plants/${plantId}/zones/${zoneId}/inverters/${inverterId}/assign-string/${strNum}`, {
                method: 'DELETE'
            })
        }
    }
    
    // Ajouter nouveaux strings
    for (const strNum of selectedStrings) {
        if (!currentStrings.includes(strNum)) {
            await fetch(`/api/pv/plants/${plantId}/zones/${zoneId}/inverters/${inverterId}/assign-string`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ string_number: strNum })
            })
        }
    }
}
```

#### `deleteInverter(id)` - Suppression
```javascript
async function deleteInverter(id) {
    const inverter = inverters.find(i => i.id === id)
    if (!inverter) return
    
    if (!confirm(`Supprimer l'onduleur "${inverter.inverter_name}" ?`)) {
        return
    }
    
    try {
        const response = await fetch(`/api/pv/plants/${plantId}/zones/${zoneId}/inverters/${id}`, {
            method: 'DELETE'
        })
        
        const data = await response.json()
        
        if (data.success) {
            await loadInverters()
            alert('Onduleur supprimé')
        } else {
            alert('Erreur: ' + data.error)
        }
    } catch (error) {
        console.error('Erreur suppression onduleur:', error)
        alert('Erreur suppression onduleur')
    }
}
```

---

### 4. Validation Configuration

#### `validateElectricalConfig()` - Validation complète
```javascript
async function validateElectricalConfig() {
    const validationDiv = document.getElementById('electricalValidation')
    const warningsDiv = document.getElementById('validationWarnings')
    const errorsDiv = document.getElementById('validationErrors')
    
    try {
        const response = await fetch(`/api/pv/plants/${plantId}/zones/${zoneId}/electrical-validation`)
        const data = await response.json()
        
        if (data.success) {
            const val = data.validation
            
            let warningsHtml = ''
            if (val.warnings && val.warnings.length > 0) {
                warningsHtml = val.warnings.map(w => `<div>⚠️ ${w}</div>`).join('')
            }
            
            let errorsHtml = ''
            if (val.errors && val.errors.length > 0) {
                errorsHtml = val.errors.map(e => `<div>❌ ${e}</div>`).join('')
            }
            
            if (warningsHtml || errorsHtml) {
                validationDiv.classList.remove('hidden')
                warningsDiv.innerHTML = warningsHtml
                errorsDiv.innerHTML = errorsHtml
            } else {
                validationDiv.classList.remove('hidden')
                warningsDiv.innerHTML = '<div class="text-green-400">✅ Configuration valide</div>'
                errorsDiv.innerHTML = ''
            }
            
            // Afficher résumé dans console
            console.log('📊 Validation Électrique:', val)
        }
    } catch (error) {
        console.error('Erreur validation:', error)
        alert('Erreur validation configuration')
    }
}
```

---

### 5. Event Listeners

#### À ajouter dans la section `// Event Listeners` du code
```javascript
// Configuration électrique - Event listeners
document.getElementById('addInverterBtn').addEventListener('click', () => {
    showInverterModal(null)
})

document.getElementById('inverterForm').addEventListener('submit', saveInverter)

document.getElementById('cancelInverterBtn').addEventListener('click', hideInverterModal)

document.getElementById('validateElectricalBtn').addEventListener('click', validateElectricalConfig)

// Fonction helper pour fermer modal
function hideInverterModal() {
    document.getElementById('inverterModal').classList.add('hidden')
    currentEditingInverter = null
}

// Fonctions globales pour onclick (edit, delete)
window.editInverter = (id) => showInverterModal(id)
window.deleteInverter = deleteInverter
```

---

### 6. Initialisation au Chargement Page

#### Modifier fonction `loadZoneData()` existante
```javascript
async function loadZoneData() {
    // ... code existant ...
    
    // NOUVEAU: Charger onduleurs après modules
    await loadInverters()
}
```

---

## 📋 CHECKLIST IMPLEMENTATION

- [ ] Copier fonction `loadInverters()`
- [ ] Copier fonction `renderInvertersList()`
- [ ] Copier fonction `showInverterModal()`
- [ ] Copier fonction `populateStringCheckboxes()`
- [ ] Copier fonction `saveInverter()`
- [ ] Copier fonction `updateStringAssignments()`
- [ ] Copier fonction `deleteInverter()`
- [ ] Copier fonction `validateElectricalConfig()`
- [ ] Ajouter event listeners (5 events)
- [ ] Ajouter `await loadInverters()` dans `loadZoneData()`
- [ ] Test workflow complet: Créer → Éditer → Attribuer strings → Valider → Supprimer
- [ ] Commit + Deploy production

---

## 🧪 TESTS À EFFECTUER

### Test 1: Création Onduleur
1. Ouvrir PV Carto Editor V2 (centrale JALIBAT)
2. Cliquer "Ajouter" dans ÉTAPE 4
3. Remplir formulaire: "Onduleur 1", 100kW, Huawei, cocher strings 1-5
4. Sauvegarder → Vérifier carte apparaît dans liste

### Test 2: Édition
1. Cliquer icône édition sur onduleur créé
2. Modifier nom → "Onduleur Principal"
3. Décocher string 5, cocher string 6
4. Sauvegarder → Vérifier modifications

### Test 3: Validation
1. Créer 2e onduleur (strings 7-10)
2. Cliquer "Valider Configuration"
3. Vérifier warnings/errors affichés (si strings manquants)

### Test 4: Suppression
1. Supprimer 2e onduleur
2. Confirmer suppression
3. Vérifier disparition de la liste

---

## 📊 LOCALISATION CODE

**Fichier:** `/home/user/diagnostic-hub/src/index.tsx`  
**Section Functions:** Après ligne ~6500 (avant fermeture `</script>`)  
**Section Event Listeners:** Après ligne ~6900  
**Section Init:** Fonction `loadZoneData()` ligne ~5100

---

## 🎯 IMPACT BUSINESS

✅ **MVP Configuration Électrique Complète:**
- Traçabilité Module → String → Onduleur  
- Validation normative IEC 62446-1  
- Export rapports commissioning  
- Détection anomalies électriques (surdimensionnement, déséquilibres)

✅ **Intégration Workflow DiagPV:**
- Post audit EL: Configuration électrique centrale  
- Commissioning: Validation schéma électrique  
- Expertise judiciaire: Traçabilité complète défauts → impact électrique

---

**Estimation temps:** ~30 minutes (copier-coller + tests)  
**Priorité:** Haute (bloquant MVP Phase 1)  
**Dépendances:** Aucune (fondations déployées)
