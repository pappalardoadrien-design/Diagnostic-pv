// ===== RECTANGLE ORIENTABLE POUR DIAGNOSTIC PHOTOVOLTAÏQUE =====
// Système de rectangle avec rotation pour aligner sur toiture

class RotatableRectangle {
    constructor(map, bounds, angle = 0) {
        this.map = map;
        this.bounds = bounds;
        this.angle = angle; // Angle en degrés
        this.layer = null;
        this.rotationHandle = null;
        this.corners = [];
        
        this.create();
    }
    
    // Créer le rectangle orientable
    create() {
        const center = this.bounds.getCenter();
        const corners = this.calculateRotatedCorners();
        
        // Créer polygon pour représenter le rectangle orienté
        this.layer = L.polygon(corners, {
            color: '#3b82f6',
            weight: 3,
            fillOpacity: 0.15,
            fillColor: '#3b82f6',
            className: 'rotatable-rectangle'
        });
        
        // Stocker métadonnées
        this.layer.options.isRotatable = true;
        this.layer.options.rotation = this.angle;
        this.layer.options.originalBounds = this.bounds;
        
        // Ajouter handle de rotation au centre
        this.createRotationHandle(center);
        
        return this.layer;
    }
    
    // Calculer les 4 coins du rectangle après rotation
    calculateRotatedCorners() {
        const center = this.bounds.getCenter();
        const north = this.bounds.getNorth();
        const south = this.bounds.getSouth();
        const east = this.bounds.getEast();
        const west = this.bounds.getWest();
        
        // Coins originaux (non-rotés)
        const corners = [
            [north, west],  // NW
            [north, east],  // NE
            [south, east],  // SE
            [south, west]   // SW
        ];
        
        // Appliquer rotation autour du centre
        const rotatedCorners = corners.map(([lat, lng]) => {
            return this.rotatePoint(lat, lng, center.lat, center.lng, this.angle);
        });
        
        return rotatedCorners.map(([lat, lng]) => L.latLng(lat, lng));
    }
    
    // Rotation d'un point autour d'un centre
    rotatePoint(lat, lng, centerLat, centerLng, angleDeg) {
        const angleRad = angleDeg * Math.PI / 180;
        
        // Conversion approximative degrés <-> mètres
        const metersPerDegreeLat = 111320;
        const metersPerDegreeLng = 111320 * Math.cos(centerLat * Math.PI / 180);
        
        // Coordonnées relatives au centre (en mètres)
        const y = (lat - centerLat) * metersPerDegreeLat;
        const x = (lng - centerLng) * metersPerDegreeLng;
        
        // Rotation 2D
        const xRot = x * Math.cos(angleRad) - y * Math.sin(angleRad);
        const yRot = x * Math.sin(angleRad) + y * Math.cos(angleRad);
        
        // Conversion retour vers lat/lng
        const newLat = centerLat + (yRot / metersPerDegreeLat);
        const newLng = centerLng + (xRot / metersPerDegreeLng);
        
        return [newLat, newLng];
    }
    
    // Créer handle de rotation
    createRotationHandle(center) {
        const icon = L.divIcon({
            className: 'rotation-handle',
            html: '<div style="background: #3b82f6; border: 2px solid white; border-radius: 50%; width: 20px; height: 20px; cursor: grab; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>',
            iconSize: [20, 20],
            iconAnchor: [10, 10]
        });
        
        this.rotationHandle = L.marker(center, {
            icon: icon,
            draggable: true,
            zIndexOffset: 1000
        });
        
        // Événements drag pour rotation
        this.rotationHandle.on('drag', (e) => {
            this.onRotationDrag(e);
        });
        
        return this.rotationHandle;
    }
    
    // Gestion rotation pendant drag
    onRotationDrag(e) {
        const center = this.bounds.getCenter();
        const handlePos = e.latlng;
        
        // Calculer angle entre centre et position handle
        const metersPerDegreeLat = 111320;
        const metersPerDegreeLng = 111320 * Math.cos(center.lat * Math.PI / 180);
        
        const dy = (handlePos.lat - center.lat) * metersPerDegreeLat;
        const dx = (handlePos.lng - center.lng) * metersPerDegreeLng;
        
        // Angle en degrés (0° = Est, 90° = Nord)
        let angleDeg = Math.atan2(dy, dx) * 180 / Math.PI;
        
        // Normaliser angle 0-360
        if (angleDeg < 0) angleDeg += 360;
        
        this.angle = angleDeg;
        this.layer.options.rotation = this.angle;
        
        // Redessiner rectangle avec nouvel angle
        const newCorners = this.calculateRotatedCorners();
        this.layer.setLatLngs(newCorners);
    }
    
    // Obtenir grille de positions modules orientée
    getOrientedModuleGrid(moduleLength, moduleWidth, spacing) {
        const center = this.bounds.getCenter();
        const bounds = this.bounds;
        
        // Dimensions de la zone en mètres
        const boundsWidth = this.map.distance(bounds.getNorthWest(), bounds.getNorthEast());
        const boundsHeight = this.map.distance(bounds.getNorthWest(), bounds.getSouthWest());
        
        // Calcul nombre de modules
        const moduleLengthM = moduleLength / 1000;
        const moduleWidthM = moduleWidth / 1000;
        const spacingM = spacing / 1000;
        
        const modulesPerRow = Math.floor(boundsWidth / (moduleLengthM + spacingM));
        const numberOfRows = Math.floor(boundsHeight / (moduleWidthM + spacingM));
        
        const modules = [];
        
        // Générer grille orientée
        for (let row = 0; row < numberOfRows; row++) {
            for (let col = 0; col < modulesPerRow; col++) {
                // Position dans repère local (non-roté)
                const localY = -(row * (moduleWidthM + spacingM) + moduleWidthM / 2) + boundsHeight / 2;
                const localX = (col * (moduleLengthM + spacingM) + moduleLengthM / 2) - boundsWidth / 2;
                
                // Appliquer rotation
                const [lat, lng] = this.rotatePoint(
                    center.lat + localY / 111320,
                    center.lng + localX / (111320 * Math.cos(center.lat * Math.PI / 180)),
                    center.lat,
                    center.lng,
                    this.angle
                );
                
                // Vérifier si dans polygon
                const point = L.latLng(lat, lng);
                if (this.isPointInPolygon(point)) {
                    modules.push({
                        lat: lat,
                        lng: lng,
                        angle: this.angle,
                        length: moduleLength,
                        width: moduleWidth
                    });
                }
            }
        }
        
        return modules;
    }
    
    // Test point dans polygon
    isPointInPolygon(point) {
        const latlngs = this.layer.getLatLngs()[0];
        let inside = false;
        
        for (let i = 0, j = latlngs.length - 1; i < latlngs.length; j = i++) {
            if (((latlngs[i].lat > point.lat) !== (latlngs[j].lat > point.lat)) &&
                (point.lng < (latlngs[j].lng - latlngs[i].lng) * (point.lat - latlngs[i].lat) / (latlngs[j].lat - latlngs[i].lat) + latlngs[i].lng)) {
                inside = !inside;
            }
        }
        
        return inside;
    }
    
    // Ajouter au groupe de calques
    addTo(featureGroup, map) {
        this.layer.addTo(featureGroup);
        this.rotationHandle.addTo(map);
    }
    
    // Retirer de la carte
    remove() {
        if (this.layer) this.layer.remove();
        if (this.rotationHandle) this.rotationHandle.remove();
    }
    
    // Obtenir angle actuel
    getRotation() {
        return this.angle;
    }
    
    // Définir angle
    setRotation(angleDeg) {
        this.angle = angleDeg;
        this.layer.options.rotation = this.angle;
        const newCorners = this.calculateRotatedCorners();
        this.layer.setLatLngs(newCorners);
        
        // Mettre à jour position handle
        const center = this.bounds.getCenter();
        this.rotationHandle.setLatLng(center);
    }
}

// Export pour utilisation globale
if (typeof window !== 'undefined') {
    window.RotatableRectangle = RotatableRectangle;
}
