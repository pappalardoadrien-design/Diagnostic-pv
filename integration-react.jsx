// Composant React pour intégration DiagPV dans votre hub
import React, { useState, useEffect } from 'react';

const DiagPVIntegration = () => {
    const [audits, setAudits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateForm, setShowCreateForm] = useState(false);
    
    const API_BASE = 'https://9b8a231d.diagpv-audit.pages.dev/api';

    // Hook pour charger les audits
    useEffect(() => {
        loadAudits();
    }, []);

    const loadAudits = async () => {
        try {
            const response = await fetch(`${API_BASE}/dashboard/audits`);
            const data = await response.json();
            setAudits(data.audits || []);
        } catch (error) {
            console.error('Erreur chargement audits:', error);
        } finally {
            setLoading(false);
        }
    };

    const createAudit = async (formData) => {
        try {
            const response = await fetch(`${API_BASE}/audit/create`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    projectName: formData.projectName,
                    clientName: formData.clientName,
                    location: formData.location,
                    configuration: {
                        mode: 'simple',
                        stringCount: parseInt(formData.stringCount),
                        modulesPerString: parseInt(formData.modulesPerString)
                    }
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                // Ouvrir l'audit dans un nouvel onglet
                const auditUrl = `https://9b8a231d.diagpv-audit.pages.dev/audit/${result.auditToken}`;
                window.open(auditUrl, '_blank');
                
                // Recharger la liste
                loadAudits();
                setShowCreateForm(false);
            }
        } catch (error) {
            console.error('Erreur création audit:', error);
        }
    };

    if (loading) {
        return (
            <div className="diagpv-loading">
                <div className="loader">🌙 Chargement audits EL...</div>
            </div>
        );
    }

    return (
        <div className="diagpv-integration">
            <div className="diagpv-header">
                <h2>🌙 DiagPV Audit EL</h2>
                <button 
                    className="btn-create-audit"
                    onClick={() => setShowCreateForm(!showCreateForm)}
                >
                    + Nouvel Audit EL
                </button>
            </div>

            {showCreateForm && (
                <CreateAuditForm 
                    onSubmit={createAudit}
                    onCancel={() => setShowCreateForm(false)}
                />
            )}

            <div className="audits-grid">
                {audits.map(audit => (
                    <AuditCard key={audit.token} audit={audit} />
                ))}
            </div>
        </div>
    );
};

// Composant formulaire de création
const CreateAuditForm = ({ onSubmit, onCancel }) => {
    const [formData, setFormData] = useState({
        projectName: '',
        clientName: '',
        location: '',
        stringCount: 4,
        modulesPerString: 6
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData);
    };

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    return (
        <div className="create-audit-form">
            <h3>Créer un Audit Électroluminescence</h3>
            <form onSubmit={handleSubmit}>
                <div className="form-row">
                    <div className="form-group">
                        <label>Nom du projet</label>
                        <input
                            type="text"
                            value={formData.projectName}
                            onChange={(e) => handleChange('projectName', e.target.value)}
                            placeholder="Ex: Installation Résidentielle"
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>Client</label>
                        <input
                            type="text"
                            value={formData.clientName}
                            onChange={(e) => handleChange('clientName', e.target.value)}
                            placeholder="Ex: M. Dupont"
                            required
                        />
                    </div>
                </div>

                <div className="form-group">
                    <label>Localisation</label>
                    <input
                        type="text"
                        value={formData.location}
                        onChange={(e) => handleChange('location', e.target.value)}
                        placeholder="Ex: 123 Rue de la Paix, 75001 Paris"
                        required
                    />
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label>Nombre de strings</label>
                        <input
                            type="number"
                            min="1"
                            max="20"
                            value={formData.stringCount}
                            onChange={(e) => handleChange('stringCount', e.target.value)}
                        />
                    </div>
                    <div className="form-group">
                        <label>Modules par string</label>
                        <input
                            type="number"
                            min="1"
                            max="50"
                            value={formData.modulesPerString}
                            onChange={(e) => handleChange('modulesPerString', e.target.value)}
                        />
                    </div>
                </div>

                <div className="form-actions">
                    <button type="button" onClick={onCancel} className="btn-cancel">
                        Annuler
                    </button>
                    <button type="submit" className="btn-create">
                        🌙 Créer Audit
                    </button>
                </div>
            </form>
        </div>
    );
};

// Composant carte d'audit
const AuditCard = ({ audit }) => {
    const openAudit = () => {
        const url = `https://9b8a231d.diagpv-audit.pages.dev/audit/${audit.token}`;
        window.open(url, '_blank');
    };

    const downloadReport = () => {
        const url = `https://9b8a231d.diagpv-audit.pages.dev/api/audit/${audit.token}/report`;
        window.open(url, '_blank');
    };

    const getStatusColor = (progression) => {
        if (progression === 100) return '#10b981';
        if (progression > 50) return '#f59e0b';
        return '#ef4444';
    };

    return (
        <div className="audit-card">
            <div className="audit-header">
                <h4>{audit.project_name}</h4>
                <div 
                    className="status-badge"
                    style={{ backgroundColor: getStatusColor(audit.progression_pct) }}
                >
                    {audit.progression_pct}%
                </div>
            </div>
            
            <div className="audit-info">
                <p><strong>Client:</strong> {audit.client_name}</p>
                <p><strong>Modules:</strong> {audit.total_modules}</p>
                <p><strong>Défauts:</strong> {audit.defauts_total}</p>
                <p><strong>Créé:</strong> {audit.created_at_formatted}</p>
            </div>

            <div className="audit-actions">
                <button onClick={openAudit} className="btn-open">
                    🌙 Ouvrir Audit
                </button>
                <button onClick={downloadReport} className="btn-report">
                    📄 Rapport PDF
                </button>
            </div>
        </div>
    );
};

export default DiagPVIntegration;

// CSS à ajouter à votre application
const styles = `
.diagpv-integration {
    padding: 20px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

.diagpv-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    padding: 20px;
    background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
    border-radius: 12px;
    color: white;
}

.diagpv-header h2 {
    margin: 0;
    font-size: 24px;
}

.btn-create-audit {
    background: #fbbf24;
    color: #000;
    border: none;
    padding: 12px 20px;
    border-radius: 8px;
    font-weight: bold;
    cursor: pointer;
    transition: all 0.2s;
}

.btn-create-audit:hover {
    background: #f59e0b;
    transform: translateY(-2px);
}

.create-audit-form {
    background: #f8fafc;
    border: 2px solid #e5e7eb;
    border-radius: 12px;
    padding: 20px;
    margin-bottom: 20px;
}

.form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 15px;
}

.form-group {
    margin-bottom: 15px;
}

.form-group label {
    display: block;
    margin-bottom: 5px;
    font-weight: 600;
    color: #374151;
}

.form-group input {
    width: 100%;
    padding: 10px 12px;
    border: 2px solid #d1d5db;
    border-radius: 6px;
    font-size: 14px;
    transition: border-color 0.2s;
}

.form-group input:focus {
    outline: none;
    border-color: #fbbf24;
}

.form-actions {
    display: flex;
    gap: 10px;
    justify-content: flex-end;
    margin-top: 20px;
}

.btn-cancel {
    padding: 10px 20px;
    border: 2px solid #6b7280;
    background: transparent;
    border-radius: 6px;
    cursor: pointer;
}

.btn-create {
    padding: 10px 20px;
    background: #fbbf24;
    color: #000;
    border: none;
    border-radius: 6px;
    font-weight: bold;
    cursor: pointer;
}

.audits-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 20px;
}

.audit-card {
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    padding: 20px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    transition: transform 0.2s;
}

.audit-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.audit-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 15px;
}

.audit-header h4 {
    margin: 0;
    color: #1f2937;
    font-size: 18px;
}

.status-badge {
    padding: 4px 8px;
    color: white;
    border-radius: 20px;
    font-size: 12px;
    font-weight: bold;
}

.audit-info p {
    margin: 5px 0;
    color: #6b7280;
    font-size: 14px;
}

.audit-actions {
    display: flex;
    gap: 10px;
    margin-top: 15px;
}

.btn-open, .btn-report {
    padding: 8px 16px;
    border: none;
    border-radius: 6px;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.2s;
}

.btn-open {
    background: #3b82f6;
    color: white;
}

.btn-report {
    background: #6b7280;
    color: white;
}

.btn-open:hover {
    background: #2563eb;
}

.btn-report:hover {
    background: #4b5563;
}

.diagpv-loading {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 200px;
    color: #6b7280;
    font-size: 18px;
}

@media (max-width: 768px) {
    .form-row {
        grid-template-columns: 1fr;
    }
    
    .diagpv-header {
        flex-direction: column;
        gap: 15px;
        text-align: center;
    }
    
    .audits-grid {
        grid-template-columns: 1fr;
    }
}
`;