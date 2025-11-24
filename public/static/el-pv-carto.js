// ============================================================================
// BOUTON PV CARTO - Créer cartographie PV depuis audit EL
// ============================================================================

document.addEventListener('DOMContentLoaded', function() {
  const pvCartoBtn = document.getElementById('pvCartoBtn')
  
  if (pvCartoBtn) {
    pvCartoBtn.addEventListener('click', async function() {
      // Récupérer le token de l'audit depuis l'URL
      const auditToken = window.location.pathname.split('/audit/')[1]
      
      if (!auditToken) {
        alert('❌ Token d\'audit introuvable')
        return
      }
      
      // Afficher loading
      const originalHTML = pvCartoBtn.innerHTML
      pvCartoBtn.disabled = true
      pvCartoBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i>Création...'
      
      try {
        // Appel API pour créer/récupérer la centrale PV
        const response = await fetch(`/api/pv/create-from-el-audit/${auditToken}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          }
        })
        
        const data = await response.json()
        
        if (data.success && data.plant_id && data.zone_id) {
          // Ouvrir le DESIGNER SATELLITE (Leaflet avec dessin polygones toiture)
          const designerUrl = `/pv/plant/${data.plant_id}/zone/${data.zone_id}/designer`
          window.open(designerUrl, '_blank')
          
          // Feedback utilisateur
          pvCartoBtn.innerHTML = '<i class="fas fa-check mr-1"></i>Ouvert !'
          setTimeout(() => {
            pvCartoBtn.innerHTML = originalHTML
            pvCartoBtn.disabled = false
          }, 2000)
        } else {
          throw new Error(data.error || 'Erreur lors de la création')
        }
        
      } catch (error) {
        console.error('Erreur PV CARTO:', error)
        alert(`❌ Erreur: ${error.message}`)
        pvCartoBtn.innerHTML = originalHTML
        pvCartoBtn.disabled = false
      }
    })
  }
})
