# 🎨 SYSTÈME COULEURS PV CARTOGRAPHY - IDENTIQUE MODULE EL

## 📊 STATUS MODULES - NOMENCLATURE EXACTE

| Status | Emoji | Couleur Base | Gradient CSS | Animation | Description FR |
|--------|-------|--------------|--------------|-----------|----------------|
| **ok** | 🟢 | Vert | `linear-gradient(135deg, #22c55e 0%, #16a34a 100%)` | - | Aucun défaut détecté |
| **inequality** | 🟡 | Jaune | `linear-gradient(135deg, #eab308 0%, #ca8a04 100%)` | - | Inégalité qualité cellules |
| **microcracks** | 🟠 | Orange | `linear-gradient(135deg, #f97316 0%, #ea580c 100%)` | - | Microfissures visibles EL |
| **dead** | 🔴 | Rouge | `linear-gradient(135deg, #ef4444 0%, #dc2626 100%)` | `pulse-danger 2s infinite` | Module défaillant HS |
| **string_open** | 🔵 | Bleu | `linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)` | - | String ouvert / sous-string ouvert |
| **not_connected** | ⚫ | Gris | `linear-gradient(135deg, #6b7280 0%, #4b5563 100%)` | - | Non raccordé / non connecté |
| **pending** | ⚪ | Gris clair | `linear-gradient(135deg, #e5e7eb 0%, #d1d5db 100%)` | Border dashed | En attente audit |

---

## 🎯 MODAL STATUT MODULE (Copie exacte EL)

```html
<div class="grid grid-cols-2 gap-3">
    <button data-status="ok" class="bg-green-600 hover:bg-green-700 p-3 rounded font-bold">
        🟢 OK<br>
        <span class="text-sm font-normal">Aucun défaut détecté</span>
    </button>
    
    <button data-status="inequality" class="bg-yellow-600 hover:bg-yellow-700 p-3 rounded font-bold">
        🟡 Inégalité<br>
        <span class="text-sm font-normal">Qualité cellules</span>
    </button>
    
    <button data-status="microcracks" class="bg-orange-600 hover:bg-orange-700 p-3 rounded font-bold">
        🟠 Microfissures<br>
        <span class="text-sm font-normal">Visibles EL</span>
    </button>
    
    <button data-status="dead" class="bg-red-600 hover:bg-red-700 p-3 rounded font-bold">
        🔴 HS<br>
        <span class="text-sm font-normal">Module défaillant</span>
    </button>
    
    <button data-status="string_open" class="bg-blue-600 hover:bg-blue-700 p-3 rounded font-bold">
        🔵 String ouvert<br>
        <span class="text-sm font-normal">Sous-string ouvert</span>
    </button>
    
    <button data-status="not_connected" class="bg-gray-600 hover:bg-gray-700 p-3 rounded font-bold">
        ⚫ Non raccordé<br>
        <span class="text-sm font-normal">Non connecté</span>
    </button>
</div>

<input type="text" id="moduleComment" placeholder="Détails du défaut...">
```

---

## 💾 STOCKAGE DATABASE

### **Table: pv_modules**
```sql
module_status TEXT DEFAULT 'pending' CHECK(module_status IN (
  'ok', 'inequality', 'microcracks', 'dead', 'string_open', 'not_connected', 'pending'
))
status_comment TEXT  -- Commentaire libre défaut
```

### **Table: pv_module_defects**
```sql
module_id INTEGER NOT NULL
module_status TEXT NOT NULL  -- Identique nomenclature ci-dessus
comment TEXT  -- Commentaire défaut
photo_url TEXT  -- Photo défaut (optionnel)
detected_at DATETIME
detected_by TEXT  -- Nom technicien
```

---

## 🎨 CSS ANIMATIONS

```css
/* Animation pulse pour modules HS (dead) */
@keyframes pulse-danger {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.7; }
}

.dead {
    animation: pulse-danger 2s infinite;
}

/* Border dashed pour modules pending */
.pending {
    border: 1px dashed #9ca3af;
}
```

---

## 📈 STATISTIQUES (Dashboard)

```javascript
const stats = {
  total: modules.length,
  ok: modules.filter(m => m.module_status === 'ok').length,
  inequality: modules.filter(m => m.module_status === 'inequality').length,
  microcracks: modules.filter(m => m.module_status === 'microcracks').length,
  dead: modules.filter(m => m.module_status === 'dead').length,
  string_open: modules.filter(m => m.module_status === 'string_open').length,
  not_connected: modules.filter(m => m.module_status === 'not_connected').length,
  pending: modules.filter(m => m.module_status === 'pending').length
}
```

---

## ✅ GARANTIE COMPATIBILITÉ

**Ce système est IDENTIQUE au Module EL :**
- Même nomenclature status
- Mêmes couleurs exactes (codes hex)
- Mêmes gradients CSS
- Même animation pulse
- Même modal structure
- Même champ commentaire

**Migration EL → PV :** Import résultats audit EL directement compatible avec ce système.

**Migration PV → EL :** Export cartographie PV directement compatible avec audits EL.
