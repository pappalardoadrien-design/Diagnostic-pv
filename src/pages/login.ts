/**
 * Page Login - Authentification DiagPV
 * Design: Noir/Orange, moderne, responsive
 */

export function getLoginPage() {
  return `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Connexion - Diagnostic Photovoltaïque</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    <style>
        body {
            background: linear-gradient(135deg, #000000 0%, #1a1a1a 100%);
            min-height: 100vh;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }
        
        .login-card {
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
            box-shadow: 0 20px 60px rgba(255, 140, 0, 0.3);
        }
        
        .logo-glow {
            filter: drop-shadow(0 0 20px rgba(255, 140, 0, 0.6));
        }
        
        .input-focus:focus {
            border-color: #ff8c00;
            box-shadow: 0 0 0 3px rgba(255, 140, 0, 0.1);
        }
        
        .btn-login {
            background: linear-gradient(135deg, #ff8c00 0%, #ff6600 100%);
            transition: all 0.3s ease;
        }
        
        .btn-login:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 30px rgba(255, 140, 0, 0.4);
        }
        
        .error-message {
            animation: shake 0.5s ease-in-out;
        }
        
        @keyframes shake {
            0%, 100% { transform: translateX(0); }
            25% { transform: translateX(-10px); }
            75% { transform: translateX(10px); }
        }
        
        .spinner {
            border: 3px solid rgba(255, 255, 255, 0.3);
            border-top: 3px solid white;
            border-radius: 50%;
            width: 20px;
            height: 20px;
            animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    </style>
</head>
<body class="flex items-center justify-center p-4">
    
    <!-- Login Container -->
    <div class="login-card rounded-2xl p-8 md:p-12 max-w-md w-full">
        
        <!-- Logo & Title -->
        <div class="text-center mb-8">
            <div class="logo-glow inline-block mb-4">
                <i class="fas fa-solar-panel text-6xl text-orange-500"></i>
            </div>
            <h1 class="text-3xl font-bold text-gray-800 mb-2">
                Diagnostic Photovoltaïque
            </h1>
            <p class="text-gray-600">
                <i class="fas fa-shield-alt text-orange-500 mr-2"></i>
                Espace Sécurisé - Connexion Requise
            </p>
        </div>

        <!-- Error Message -->
        <div id="error-message" class="hidden error-message mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded">
            <div class="flex items-center">
                <i class="fas fa-exclamation-circle text-red-500 mr-3"></i>
                <p id="error-text" class="text-red-700 text-sm"></p>
            </div>
        </div>

        <!-- Success Message (must change password) -->
        <div id="success-message" class="hidden mb-6 p-4 bg-orange-50 border-l-4 border-orange-500 rounded">
            <div class="flex items-center">
                <i class="fas fa-key text-orange-500 mr-3"></i>
                <p id="success-text" class="text-orange-700 text-sm"></p>
            </div>
        </div>

        <!-- Login Form -->
        <form id="login-form" class="space-y-6">
            
            <!-- Email -->
            <div>
                <label for="email" class="block text-sm font-semibold text-gray-700 mb-2">
                    <i class="fas fa-envelope text-orange-500 mr-2"></i>
                    Email professionnel
                </label>
                <input 
                    type="email" 
                    id="email" 
                    name="email"
                    required
                    autocomplete="email"
                    class="input-focus w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none transition-all"
                    placeholder="votre@email.fr"
                >
            </div>

            <!-- Password -->
            <div>
                <label for="password" class="block text-sm font-semibold text-gray-700 mb-2">
                    <i class="fas fa-lock text-orange-500 mr-2"></i>
                    Mot de passe
                </label>
                <div class="relative">
                    <input 
                        type="password" 
                        id="password" 
                        name="password"
                        required
                        autocomplete="current-password"
                        class="input-focus w-full px-4 py-3 pr-12 border-2 border-gray-300 rounded-lg focus:outline-none transition-all"
                        placeholder="••••••••"
                    >
                    <button 
                        type="button" 
                        id="toggle-password"
                        class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-orange-500 transition-colors"
                    >
                        <i class="fas fa-eye" id="eye-icon"></i>
                    </button>
                </div>
            </div>

            <!-- Remember Me -->
            <div class="flex items-center">
                <input 
                    type="checkbox" 
                    id="remember_me" 
                    name="remember_me"
                    class="w-4 h-4 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
                >
                <label for="remember_me" class="ml-2 text-sm text-gray-700">
                    Se souvenir de moi (30 jours)
                </label>
            </div>

            <!-- Submit Button -->
            <button 
                type="submit" 
                id="submit-btn"
                class="btn-login w-full py-3 text-white font-bold rounded-lg focus:outline-none focus:ring-4 focus:ring-orange-300 flex items-center justify-center"
            >
                <span id="btn-text">
                    <i class="fas fa-sign-in-alt mr-2"></i>
                    Se connecter
                </span>
                <div id="btn-spinner" class="spinner hidden"></div>
            </button>
        </form>

        <!-- Footer Info -->
        <div class="mt-8 pt-6 border-t border-gray-200">
            <p class="text-xs text-gray-500 text-center">
                <i class="fas fa-info-circle text-orange-500 mr-1"></i>
                Accès réservé aux collaborateurs autorisés
            </p>
            <p class="text-xs text-gray-400 text-center mt-2">
                Problème de connexion ? Contactez <a href="mailto:a.pappalardo@diagnosticphotovoltaique.fr" class="text-orange-500 hover:underline">a.pappalardo@diagnosticphotovoltaique.fr</a>
            </p>
        </div>

    </div>

    <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
    <script>
        // Toggle password visibility
        document.getElementById('toggle-password').addEventListener('click', () => {
            const passwordInput = document.getElementById('password');
            const eyeIcon = document.getElementById('eye-icon');
            
            if (passwordInput.type === 'password') {
                passwordInput.type = 'text';
                eyeIcon.className = 'fas fa-eye-slash';
            } else {
                passwordInput.type = 'password';
                eyeIcon.className = 'fas fa-eye';
            }
        });

        // Handle form submission
        document.getElementById('login-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const submitBtn = document.getElementById('submit-btn');
            const btnText = document.getElementById('btn-text');
            const btnSpinner = document.getElementById('btn-spinner');
            const errorMessage = document.getElementById('error-message');
            const successMessage = document.getElementById('success-message');
            
            // Hide messages
            errorMessage.classList.add('hidden');
            successMessage.classList.add('hidden');
            
            // Show loading
            btnText.classList.add('hidden');
            btnSpinner.classList.remove('hidden');
            submitBtn.disabled = true;
            
            try {
                const formData = new FormData(e.target);
                const response = await axios.post('/api/auth/login', {
                    email: formData.get('email'),
                    password: formData.get('password'),
                    remember_me: formData.get('remember_me') === 'on'
                });
                
                if (response.data.success) {
                    // Sauvegarder session token
                    localStorage.setItem('session_token', response.data.session_token);
                    
                    // Vérifier si changement mot de passe requis
                    if (response.data.must_change_password) {
                        document.getElementById('success-text').textContent = 
                            'Connexion réussie ! Redirection vers changement de mot de passe...';
                        successMessage.classList.remove('hidden');
                        
                        setTimeout(() => {
                            window.location.href = '/change-password';
                        }, 1500);
                    } else {
                        // Rediriger vers dashboard
                        window.location.href = '/';
                    }
                } else {
                    throw new Error(response.data.message);
                }
                
            } catch (error) {
                console.error('Login error:', error);
                
                const errorText = error.response?.data?.message || error.message || 'Erreur de connexion';
                document.getElementById('error-text').textContent = errorText;
                errorMessage.classList.remove('hidden');
                
                // Reset button
                btnText.classList.remove('hidden');
                btnSpinner.classList.add('hidden');
                submitBtn.disabled = false;
            }
        });
        
        // Auto-focus email input
        document.getElementById('email').focus();
    </script>
</body>
</html>
  `;
}
