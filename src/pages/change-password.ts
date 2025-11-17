/**
 * Page Change Password - DiagPV
 * Force changement si must_change_password=true
 */

export function getChangePasswordPage() {
  return `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Changement de mot de passe - DiagPV</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    <style>
        body {
            background: linear-gradient(135deg, #000000 0%, #1a1a1a 100%);
            min-height: 100vh;
        }
        .password-card {
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
            box-shadow: 0 20px 60px rgba(255, 140, 0, 0.3);
        }
        .btn-submit {
            background: linear-gradient(135deg, #ff8c00 0%, #ff6600 100%);
            transition: all 0.3s ease;
        }
        .btn-submit:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 30px rgba(255, 140, 0, 0.4);
        }
        .input-focus:focus {
            border-color: #ff8c00;
            box-shadow: 0 0 0 3px rgba(255, 140, 0, 0.1);
        }
        .strength-weak { background: #ef4444; }
        .strength-medium { background: #f59e0b; }
        .strength-strong { background: #10b981; }
    </style>
</head>
<body class="flex items-center justify-center p-4">
    
    <div class="password-card rounded-2xl p-8 md:p-12 max-w-md w-full">
        
        <!-- Header -->
        <div class="text-center mb-8">
            <div class="inline-block mb-4">
                <i class="fas fa-key text-6xl text-orange-500"></i>
            </div>
            <h1 class="text-3xl font-bold text-gray-800 mb-2">
                Changement de mot de passe
            </h1>
            <p class="text-gray-600 text-sm" id="header-message">
                <i class="fas fa-lock text-orange-500 mr-2"></i>
                Pour des raisons de sécurité, vous devez changer votre mot de passe
            </p>
        </div>

        <!-- Alert Messages -->
        <div id="error-message" class="hidden mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded">
            <div class="flex items-center">
                <i class="fas fa-exclamation-circle text-red-500 mr-3"></i>
                <p id="error-text" class="text-red-700 text-sm"></p>
            </div>
        </div>

        <div id="success-message" class="hidden mb-6 p-4 bg-green-50 border-l-4 border-green-500 rounded">
            <div class="flex items-center">
                <i class="fas fa-check-circle text-green-500 mr-3"></i>
                <p id="success-text" class="text-green-700 text-sm"></p>
            </div>
        </div>

        <!-- Form -->
        <form id="change-password-form" class="space-y-6">
            
            <!-- Old Password -->
            <div>
                <label for="old_password" class="block text-sm font-semibold text-gray-700 mb-2">
                    <i class="fas fa-lock text-orange-500 mr-2"></i>
                    Mot de passe actuel
                </label>
                <div class="relative">
                    <input 
                        type="password" 
                        id="old_password" 
                        name="old_password"
                        required
                        class="input-focus w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none"
                        placeholder="••••••••"
                    >
                    <button 
                        type="button" 
                        onclick="togglePassword('old_password')"
                        class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-orange-500"
                    >
                        <i class="fas fa-eye" id="old_password_icon"></i>
                    </button>
                </div>
            </div>

            <!-- New Password -->
            <div>
                <label for="new_password" class="block text-sm font-semibold text-gray-700 mb-2">
                    <i class="fas fa-key text-orange-500 mr-2"></i>
                    Nouveau mot de passe
                </label>
                <div class="relative">
                    <input 
                        type="password" 
                        id="new_password" 
                        name="new_password"
                        required
                        class="input-focus w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none"
                        placeholder="••••••••"
                        oninput="checkPasswordStrength()"
                    >
                    <button 
                        type="button" 
                        onclick="togglePassword('new_password')"
                        class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-orange-500"
                    >
                        <i class="fas fa-eye" id="new_password_icon"></i>
                    </button>
                </div>
                
                <!-- Password Strength Indicator -->
                <div class="mt-2">
                    <div class="flex space-x-1 mb-1">
                        <div id="strength-bar-1" class="h-1 flex-1 bg-gray-200 rounded"></div>
                        <div id="strength-bar-2" class="h-1 flex-1 bg-gray-200 rounded"></div>
                        <div id="strength-bar-3" class="h-1 flex-1 bg-gray-200 rounded"></div>
                        <div id="strength-bar-4" class="h-1 flex-1 bg-gray-200 rounded"></div>
                    </div>
                    <p id="strength-text" class="text-xs text-gray-500"></p>
                </div>

                <!-- Password Requirements -->
                <div class="mt-3 text-xs text-gray-600 space-y-1">
                    <p id="req-length" class="flex items-center">
                        <i class="fas fa-circle text-gray-300 mr-2 text-xs"></i>
                        Au moins 8 caractères
                    </p>
                    <p id="req-uppercase" class="flex items-center">
                        <i class="fas fa-circle text-gray-300 mr-2 text-xs"></i>
                        Une majuscule
                    </p>
                    <p id="req-lowercase" class="flex items-center">
                        <i class="fas fa-circle text-gray-300 mr-2 text-xs"></i>
                        Une minuscule
                    </p>
                    <p id="req-number" class="flex items-center">
                        <i class="fas fa-circle text-gray-300 mr-2 text-xs"></i>
                        Un chiffre
                    </p>
                    <p id="req-special" class="flex items-center">
                        <i class="fas fa-circle text-gray-300 mr-2 text-xs"></i>
                        Un caractère spécial (!@#$%^&*)
                    </p>
                </div>
            </div>

            <!-- Confirm Password -->
            <div>
                <label for="confirm_password" class="block text-sm font-semibold text-gray-700 mb-2">
                    <i class="fas fa-check-double text-orange-500 mr-2"></i>
                    Confirmer le mot de passe
                </label>
                <input 
                    type="password" 
                    id="confirm_password" 
                    name="confirm_password"
                    required
                    class="input-focus w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none"
                    placeholder="••••••••"
                >
            </div>

            <!-- Submit Button -->
            <button 
                type="submit" 
                id="submit-btn"
                class="btn-submit w-full py-3 text-white font-bold rounded-lg flex items-center justify-center"
            >
                <span id="btn-text">
                    <i class="fas fa-save mr-2"></i>
                    Changer le mot de passe
                </span>
                <div id="btn-spinner" class="hidden spinner"></div>
            </button>
        </form>

        <!-- Footer -->
        <div class="mt-6 text-center">
            <p class="text-xs text-gray-500">
                <i class="fas fa-shield-alt text-orange-500 mr-1"></i>
                Vos données sont sécurisées
            </p>
        </div>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
    <script>
        // Toggle password visibility
        function togglePassword(fieldId) {
            const field = document.getElementById(fieldId);
            const icon = document.getElementById(fieldId + '_icon');
            
            if (field.type === 'password') {
                field.type = 'text';
                icon.classList.remove('fa-eye');
                icon.classList.add('fa-eye-slash');
            } else {
                field.type = 'password';
                icon.classList.remove('fa-eye-slash');
                icon.classList.add('fa-eye');
            }
        }

        // Check password strength
        function checkPasswordStrength() {
            const password = document.getElementById('new_password').value;
            let strength = 0;
            
            // Check requirements
            const hasLength = password.length >= 8;
            const hasUppercase = /[A-Z]/.test(password);
            const hasLowercase = /[a-z]/.test(password);
            const hasNumber = /[0-9]/.test(password);
            const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
            
            // Update requirement indicators
            updateRequirement('req-length', hasLength);
            updateRequirement('req-uppercase', hasUppercase);
            updateRequirement('req-lowercase', hasLowercase);
            updateRequirement('req-number', hasNumber);
            updateRequirement('req-special', hasSpecial);
            
            // Calculate strength
            if (hasLength) strength++;
            if (hasUppercase) strength++;
            if (hasLowercase) strength++;
            if (hasNumber) strength++;
            if (hasSpecial) strength++;
            
            // Update strength bars
            const bars = [1, 2, 3, 4];
            bars.forEach((bar, index) => {
                const element = document.getElementById('strength-bar-' + bar);
                if (index < strength) {
                    element.className = 'h-1 flex-1 rounded ' + 
                        (strength <= 2 ? 'strength-weak' : 
                         strength === 3 ? 'strength-medium' : 
                         'strength-strong');
                } else {
                    element.className = 'h-1 flex-1 bg-gray-200 rounded';
                }
            });
            
            // Update strength text
            const strengthText = document.getElementById('strength-text');
            if (password.length === 0) {
                strengthText.textContent = '';
            } else if (strength <= 2) {
                strengthText.textContent = 'Mot de passe faible';
                strengthText.className = 'text-xs text-red-600';
            } else if (strength === 3) {
                strengthText.textContent = 'Mot de passe moyen';
                strengthText.className = 'text-xs text-yellow-600';
            } else {
                strengthText.textContent = 'Mot de passe fort';
                strengthText.className = 'text-xs text-green-600';
            }
        }

        function updateRequirement(id, met) {
            const element = document.getElementById(id);
            const icon = element.querySelector('i');
            
            if (met) {
                icon.classList.remove('fa-circle', 'text-gray-300');
                icon.classList.add('fa-check-circle', 'text-green-500');
                element.classList.add('text-green-600');
            } else {
                icon.classList.remove('fa-check-circle', 'text-green-500');
                icon.classList.add('fa-circle', 'text-gray-300');
                element.classList.remove('text-green-600');
            }
        }

        // Form submission
        document.getElementById('change-password-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const errorMessage = document.getElementById('error-message');
            const successMessage = document.getElementById('success-message');
            const submitBtn = document.getElementById('submit-btn');
            const btnText = document.getElementById('btn-text');
            const btnSpinner = document.getElementById('btn-spinner');
            
            // Hide messages
            errorMessage.classList.add('hidden');
            successMessage.classList.add('hidden');
            
            // Get form data
            const formData = new FormData(e.target);
            const oldPassword = formData.get('old_password');
            const newPassword = formData.get('new_password');
            const confirmPassword = formData.get('confirm_password');
            
            // Validate passwords match
            if (newPassword !== confirmPassword) {
                document.getElementById('error-text').textContent = 'Les mots de passe ne correspondent pas';
                errorMessage.classList.remove('hidden');
                return;
            }
            
            // Show loading
            btnText.classList.add('hidden');
            btnSpinner.classList.remove('hidden');
            submitBtn.disabled = true;
            
            try {
                // Get session token
                const sessionToken = localStorage.getItem('session_token');
                if (!sessionToken) {
                    throw new Error('Session expirée - Reconnexion requise');
                }
                
                // Call API
                const response = await axios.post('/api/auth/change-password', {
                    old_password: oldPassword,
                    new_password: newPassword
                }, {
                    headers: {
                        'Authorization': 'Bearer ' + sessionToken
                    }
                });
                
                if (response.data.success) {
                    // Show success
                    document.getElementById('success-text').textContent = 
                        'Mot de passe changé avec succès ! Redirection...';
                    successMessage.classList.remove('hidden');
                    
                    // Redirect to dashboard after 2 seconds
                    setTimeout(() => {
                        window.location.href = '/';
                    }, 2000);
                } else {
                    throw new Error(response.data.message);
                }
                
            } catch (error) {
                console.error('Change password error:', error);
                
                const errorText = error.response?.data?.message || error.message || 'Erreur lors du changement de mot de passe';
                document.getElementById('error-text').textContent = errorText;
                errorMessage.classList.remove('hidden');
                
                // Reset button
                btnText.classList.remove('hidden');
                btnSpinner.classList.add('hidden');
                submitBtn.disabled = false;
            }
        });
        
        // Focus first field
        document.getElementById('old_password').focus();
    </script>
</body>
</html>
  `;
}
