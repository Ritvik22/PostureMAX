const { ipcRenderer } = require('electron');

class SignInPage {
    constructor() {
        this.initializeElements();
        this.bindEvents();
    }

    initializeElements() {
        // Form elements
        this.signinForm = document.getElementById('signinForm');
        this.emailInput = document.getElementById('email');
        this.passwordInput = document.getElementById('password');
        this.passwordToggle = document.getElementById('passwordToggle');
        this.rememberMeCheckbox = document.getElementById('rememberMe');
        this.signinBtn = document.getElementById('signinBtn');
        this.btnText = this.signinBtn.querySelector('.btn-text');
        this.btnLoader = this.signinBtn.querySelector('.btn-loader');
        
        // Error elements
        this.emailError = document.getElementById('emailError');
        this.passwordError = document.getElementById('passwordError');
        
        // Social buttons
        this.googleBtn = document.querySelector('.google-btn');
        this.appleBtn = document.querySelector('.apple-btn');
        
        // Demo button
        this.demoBtn = document.getElementById('demoBtn');
        
        // Links
        this.signupLink = document.getElementById('signupLink');
        this.forgotPasswordLink = document.querySelector('.forgot-password');
    }

    bindEvents() {
        // Form submission
        this.signinForm.addEventListener('submit', (e) => this.handleSignIn(e));
        
        // Password toggle
        this.passwordToggle.addEventListener('click', () => this.togglePasswordVisibility());
        
        // Input validation
        this.emailInput.addEventListener('blur', () => this.validateEmail());
        this.passwordInput.addEventListener('blur', () => this.validatePassword());
        
        // Social sign in
        this.googleBtn.addEventListener('click', () => this.handleGoogleSignIn());
        this.appleBtn.addEventListener('click', () => this.handleAppleSignIn());
        
        // Demo access
        this.demoBtn.addEventListener('click', () => this.handleDemoAccess());
        
        // Links
        this.signupLink.addEventListener('click', (e) => this.handleSignupLink(e));
        this.forgotPasswordLink.addEventListener('click', (e) => this.handleForgotPassword(e));
        
        // Enter key handling
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !this.signinBtn.disabled) {
                this.handleSignIn(e);
            }
        });
    }

    handleSignIn(e) {
        e.preventDefault();
        
        // Validate form
        const isEmailValid = this.validateEmail();
        const isPasswordValid = this.validatePassword();
        
        if (!isEmailValid || !isPasswordValid) {
            return;
        }
        
        // Show loading state
        this.setLoadingState(true);
        
        // Simulate API call
        setTimeout(() => {
            this.setLoadingState(false);
            this.showSuccessMessage();
            
            // Navigate to main app after a short delay
            setTimeout(() => {
                this.navigateToMainApp();
            }, 1500);
        }, 2000);
    }

    validateEmail() {
        const email = this.emailInput.value.trim();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        
        if (!email) {
            this.showError(this.emailError, 'Email is required');
            return false;
        } else if (!emailRegex.test(email)) {
            this.showError(this.emailError, 'Please enter a valid email address');
            return false;
        } else {
            this.clearError(this.emailError);
            return true;
        }
    }

    validatePassword() {
        const password = this.passwordInput.value;
        
        if (!password) {
            this.showError(this.passwordError, 'Password is required');
            return false;
        } else if (password.length < 6) {
            this.showError(this.passwordError, 'Password must be at least 6 characters');
            return false;
        } else {
            this.clearError(this.passwordError);
            return true;
        }
    }

    showError(errorElement, message) {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
    }

    clearError(errorElement) {
        errorElement.textContent = '';
        errorElement.style.display = 'none';
    }

    setLoadingState(isLoading) {
        if (isLoading) {
            this.signinBtn.disabled = true;
            this.signinBtn.classList.add('loading');
            this.btnText.classList.add('hidden');
            this.btnLoader.classList.remove('hidden');
        } else {
            this.signinBtn.disabled = false;
            this.signinBtn.classList.remove('loading');
            this.btnText.classList.remove('hidden');
            this.btnLoader.classList.add('hidden');
        }
    }

    showSuccessMessage() {
        // Create success message
        const successMessage = document.createElement('div');
        successMessage.className = 'success-message';
        successMessage.innerHTML = `
            <div class="success-icon">✓</div>
            <div class="success-text">Welcome back! Redirecting to dashboard...</div>
        `;
        
        // Add styles
        successMessage.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: linear-gradient(135deg, #00bfff, #0099cc);
            color: white;
            padding: 1.5rem 2rem;
            border-radius: 12px;
            box-shadow: 0 20px 60px rgba(0, 191, 255, 0.3);
            z-index: 1000;
            display: flex;
            align-items: center;
            gap: 1rem;
            animation: slideIn 0.5s ease-out;
        `;
        
        // Add animation keyframes
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideIn {
                from {
                    opacity: 0;
                    transform: translate(-50%, -60%);
                }
                to {
                    opacity: 1;
                    transform: translate(-50%, -50%);
                }
            }
        `;
        document.head.appendChild(style);
        
        document.body.appendChild(successMessage);
        
        // Remove after animation
        setTimeout(() => {
            successMessage.remove();
            style.remove();
        }, 3000);
    }

    togglePasswordVisibility() {
        const isPassword = this.passwordInput.type === 'password';
        this.passwordInput.type = isPassword ? 'text' : 'password';
        this.passwordToggle.querySelector('.toggle-icon').textContent = isPassword ? '🙈' : '👁️';
    }

    handleGoogleSignIn() {
        this.showSocialSignInMessage('Google');
    }

    handleAppleSignIn() {
        this.showSocialSignInMessage('Apple');
    }

    showSocialSignInMessage(provider) {
        // Create notification
        const notification = document.createElement('div');
        notification.className = 'social-notification';
        notification.innerHTML = `
            <div class="notification-content">
                <div class="notification-icon">ℹ️</div>
                <div class="notification-text">${provider} sign-in is not implemented yet</div>
            </div>
        `;
        
        // Add styles
        notification.style.cssText = `
            position: fixed;
            top: 2rem;
            right: 2rem;
            background: rgba(26, 26, 26, 0.95);
            color: #00bfff;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            border: 1px solid rgba(0, 191, 255, 0.3);
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6);
            z-index: 1000;
            display: flex;
            align-items: center;
            gap: 0.75rem;
            animation: slideInRight 0.5s ease-out;
        `;
        
        // Add animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideInRight {
                from {
                    opacity: 0;
                    transform: translateX(100%);
                }
                to {
                    opacity: 1;
                    transform: translateX(0);
                }
            }
        `;
        document.head.appendChild(style);
        
        document.body.appendChild(notification);
        
        // Remove after delay
        setTimeout(() => {
            notification.style.animation = 'slideInRight 0.5s ease-out reverse';
            setTimeout(() => {
                notification.remove();
                style.remove();
            }, 500);
        }, 3000);
    }

    handleDemoAccess() {
        // Show demo access message
        this.showSuccessMessage();
        
        // Navigate to main app
        setTimeout(() => {
            this.navigateToMainApp();
        }, 1500);
    }

    handleSignupLink(e) {
        e.preventDefault();
        // Show signup notification
        this.showSocialSignInMessage('Sign up feature');
    }

    handleForgotPassword(e) {
        e.preventDefault();
        // Show forgot password notification
        this.showSocialSignInMessage('Password reset');
    }

    navigateToMainApp() {
        // Send message to main process to navigate to main app
        ipcRenderer.send('navigate-to-main');
        
        // Alternative: reload with main page
        // window.location.href = 'index.html';
    }
}

// Initialize the sign-in page when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const signInPage = new SignInPage();
    console.log('Sign-in page initialized');
});

// Handle navigation from main process
ipcRenderer.on('navigate-to-signin', () => {
    window.location.href = 'signin.html';
});
