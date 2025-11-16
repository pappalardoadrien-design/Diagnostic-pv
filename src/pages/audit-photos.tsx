/**
 * Page Upload Photos EL - Intégration Picsellia
 * Interface simple drag & drop pour upload photos audit
 */

export function getAuditPhotosPage(auditToken: string) {
  return `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Upload Photos - ${auditToken}</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
</head>
<body class="bg-gray-100">
    <div class="max-w-6xl mx-auto p-6">
        <div class="bg-white rounded-lg shadow-lg p-6 mb-6">
            <div class="flex items-center justify-between mb-6">
                <h1 class="text-3xl font-bold flex items-center">
                    <i class="fas fa-camera mr-3 text-green-600"></i>
                    Upload Photos EL
                </h1>
                <a href="/audit/${auditToken}" class="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded">
                    <i class="fas fa-arrow-left mr-2"></i>Retour Audit
                </a>
            </div>
            
            <div id="dropZone" class="border-4 border-dashed border-gray-300 rounded-lg p-12 text-center cursor-pointer hover:border-green-500 transition">
                <i class="fas fa-cloud-upload-alt text-6xl text-gray-400 mb-4"></i>
                <p class="text-xl font-bold mb-2">Glissez vos photos ici</p>
                <p class="text-gray-600 mb-4">ou cliquez pour sélectionner</p>
                <input type="file" id="fileInput" multiple accept="image/*" class="hidden">
                <button onclick="document.getElementById('fileInput').click()" class="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-bold">
                    <i class="fas fa-folder-open mr-2"></i>Sélectionner Photos
                </button>
            </div>

            <div id="photosList" class="mt-6 grid grid-cols-4 gap-4"></div>

            <div id="uploadProgress" class="hidden mt-6">
                <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div class="flex items-center justify-between mb-2">
                        <span class="font-bold">Upload en cours...</span>
                        <span id="progressText">0%</span>
                    </div>
                    <div class="w-full bg-gray-200 rounded-full h-4">
                        <div id="progressBar" class="bg-blue-600 h-4 rounded-full transition-all" style="width: 0%"></div>
                    </div>
                </div>
            </div>

            <button id="uploadBtn" class="hidden w-full mt-6 bg-green-600 hover:bg-green-700 text-white px-6 py-4 rounded-lg font-bold text-lg">
                <i class="fas fa-upload mr-2"></i>Upload <span id="photoCount">0</span> Photo(s)
            </button>
        </div>

        <div id="photosGrid" class="grid grid-cols-3 gap-4"></div>
    </div>

    <script>
        const auditToken = '${auditToken}';
        let selectedFiles = [];

        const dropZone = document.getElementById('dropZone');
        const fileInput = document.getElementById('fileInput');
        const photosList = document.getElementById('photosList');
        const uploadBtn = document.getElementById('uploadBtn');
        const photoCount = document.getElementById('photoCount');

        // Drag & Drop
        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.classList.add('border-green-500', 'bg-green-50');
        });

        dropZone.addEventListener('dragleave', () => {
            dropZone.classList.remove('border-green-500', 'bg-green-50');
        });

        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.classList.remove('border-green-500', 'bg-green-50');
            handleFiles(e.dataTransfer.files);
        });

        fileInput.addEventListener('change', (e) => {
            handleFiles(e.target.files);
        });

        function handleFiles(files) {
            selectedFiles = Array.from(files);
            displayPhotos();
            uploadBtn.classList.remove('hidden');
            photoCount.textContent = selectedFiles.length;
        }

        function displayPhotos() {
            photosList.innerHTML = selectedFiles.map((file, index) => \`
                <div class="relative">
                    <img src="\${URL.createObjectURL(file)}" class="w-full h-32 object-cover rounded-lg">
                    <button onclick="removePhoto(\${index})" class="absolute top-2 right-2 bg-red-600 text-white w-8 h-8 rounded-full">
                        <i class="fas fa-times"></i>
                    </button>
                    <div class="text-xs mt-1 truncate">\${file.name}</div>
                </div>
            \`).join('');
        }

        function removePhoto(index) {
            selectedFiles.splice(index, 1);
            displayPhotos();
            photoCount.textContent = selectedFiles.length;
            if (selectedFiles.length === 0) {
                uploadBtn.classList.add('hidden');
            }
        }

        uploadBtn.addEventListener('click', async () => {
            const progressDiv = document.getElementById('uploadProgress');
            const progressBar = document.getElementById('progressBar');
            const progressText = document.getElementById('progressText');

            progressDiv.classList.remove('hidden');
            uploadBtn.disabled = true;

            try {
                const photos = await Promise.all(selectedFiles.map(async (file, index) => {
                    const base64 = await fileToBase64(file);
                    const moduleId = \`M\${String(index + 1).padStart(3, '0')}\`;
                    
                    return {
                        module_id: moduleId,
                        string_number: Math.floor(index / 24) + 1,
                        file_name: file.name,
                        file_data: base64,
                        file_size: file.size,
                        file_type: file.type
                    };
                }));

                const response = await axios.post('/api/picsellia/upload-photos', {
                    audit_token: auditToken,
                    photos,
                    uploaded_by: 'Adrien PAPPALARDO'
                });

                if (response.data.success) {
                    alert(\`✅ \${response.data.uploaded} photo(s) uploadée(s) avec succès !\`);
                    selectedFiles = [];
                    displayPhotos();
                    uploadBtn.classList.add('hidden');
                    loadExistingPhotos();
                }
            } catch (error) {
                alert('❌ Erreur upload: ' + error.message);
            } finally {
                progressDiv.classList.add('hidden');
                uploadBtn.disabled = false;
            }
        });

        function fileToBase64(file) {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result);
                reader.onerror = reject;
                reader.readAsDataURL(file);
            });
        }

        async function loadExistingPhotos() {
            try {
                const response = await axios.get(\`/api/picsellia/photos/\${auditToken}\`);
                const grid = document.getElementById('photosGrid');
                
                if (response.data.photos && response.data.photos.length > 0) {
                    grid.innerHTML = response.data.photos.map(photo => \`
                        <div class="bg-white rounded-lg shadow p-4">
                            <img src="\${photo.photo_url}" class="w-full h-48 object-cover rounded mb-2">
                            <div class="text-sm font-bold">\${photo.module_id}</div>
                            <div class="text-xs text-gray-600">String \${photo.string_number}</div>
                            <div class="text-xs text-gray-500 mt-2">
                                \${photo.ai_status === 'completed' ? '✅ Analysé' : '⏳ En attente'}
                            </div>
                        </div>
                    \`).join('');
                }
            } catch (error) {
                console.error('Erreur chargement photos:', error);
            }
        }

        loadExistingPhotos();
    </script>
</body>
</html>
`;
}
