import { SERVER_IP } from '../config.js';
class RegisterComponent extends HTMLElement {
    constructor() {
        super();
        this.emailInput = null;
        this.userInput = null;
        this.passwordInput = null;
        this.password2Input = null;
        this.registerButton = null;
        this.registerForm = null;
        this.errorMsg = null;
        this.response = null;
        this.debounceTimer = null; // Timer to not call the function too often
        this.attachShadow({ mode: "open" });
        this.render();
    }
    render() {
        if (!this.shadowRoot)
            return;
        const style = document.createElement("link");
        style.rel = "stylesheet";
        style.href = "./app/tailwind.css";
        this.shadowRoot.innerHTML = `
      <div class="relative py-3 sm:max-w-xl sm:mx-auto w-full">
          <div class="relative px-4 pt-5 pb-5 bg-black mx-8 md:mx-0 shadow rounded-2xl sm:px-8">

              <div class="max-w-md mx-auto text-white">
                  <form id="registerForm">
                      <div class="mt-1">
                          <label for="email" class="font-semibold text-sm text-gray-400 pb-1 block">E-mail</label>
                          <input id="email" type="text"
                              class="border autocomplete=email rounded-lg px-3 py-2 mt-1 mb-1 text-sm w-full bg-gray-700 text-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500"/>
                          <p class="text-sm text-red-500 mb-2" id="emailError"></p>

                          <label for="username" class="font-semibold text-sm text-gray-400 pb-1 block">Username</label>
                          <input id="username" autocomplete=username type="text"
                              class="border rounded-lg px-3 py-2 mt-1 mb-1 text-sm w-full bg-gray-700 text-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500"/>                    
                          <p class="text-sm text-red-500 mb-2" id="usernameError"></p>

                          <label for="password" class="font-semibold text-sm text-gray-400 pb-1 block">Password</label>
                          <input id="password" autocomplete=new-password type="password"
                              class="border rounded-lg px-3 py-2 mt-1 mb-1 text-sm w-full bg-gray-700 text-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500"/>
                          <p class="text-sm text-red-500 mb-2" id="passwordError"></p>
                          
                          <label for="password2" class="font-semibold text-sm text-gray-400 pb-1 block">Confirm Password</label>
                          <input id="password2" autocomplete=new-password type="password"
                              class="border rounded-lg px-3 py-2 mt-1 mb-1 text-sm w-full bg-gray-700 text-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500"/>
                          <p class="text-sm text-red-500" id="password2Error"></p>
                      </div>

                      <div class="mt-5">
                          <button id="register" type="submit"
                              class="py-2 px-4 bg-blue-600 hover:bg-blue-700 focus:ring-blue-500 focus:ring-offset-blue-200 text-white w-full transition ease-in duration-200 text-center text-base font-semibold shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 rounded-lg">
                              Register
                          </button>
                      </div>
                  </form>
                  <div class="text-red-500 text-sm mt-1">
                      <p id="error"></p>
                  </div>
              </div>
          </div>
      </div>
      `;
        this.shadowRoot.appendChild(style);
        this.emailInput = this.shadowRoot.querySelector("#email");
        this.userInput = this.shadowRoot.querySelector("#username");
        this.passwordInput = this.shadowRoot.querySelector("#password");
        this.password2Input = this.shadowRoot.querySelector("#password2");
        this.registerButton = this.shadowRoot.querySelector("#register");
        this.registerForm = this.shadowRoot.querySelector("#registerForm");
        this.errorMsg = this.shadowRoot.querySelector("#error");
        this.addEventListeners();
    }
    addEventListeners() {
        var _a, _b, _c, _d, _e;
        (_a = this.registerForm) === null || _a === void 0 ? void 0 : _a.addEventListener("submit", async (event) => {
            var _a, _b, _c, _d;
            event.preventDefault();
            const email = ((_a = this.emailInput) === null || _a === void 0 ? void 0 : _a.value) || "";
            const user = ((_b = this.userInput) === null || _b === void 0 ? void 0 : _b.value) || "";
            const password = ((_c = this.passwordInput) === null || _c === void 0 ? void 0 : _c.value) || "";
            const password2 = ((_d = this.password2Input) === null || _d === void 0 ? void 0 : _d.value) || "";
            // Fields validation before sending the request
            if (this.validateEmail() && this.validateUsername() && this.validatePasswordMatch()) {
                await this.postData(email, user, password);
            }
            else {
                this.errorMsg.textContent = "Fix the errors first"; // main error message
            }
        });
        // Real time fields validation
        (_b = this.emailInput) === null || _b === void 0 ? void 0 : _b.addEventListener("input", () => {
            this.validateEmail();
            if (this.debounceTimer)
                clearTimeout(this.debounceTimer);
            this.debounceTimer = window.setTimeout(() => {
                this.checkEmailAvailability();
            }, 400);
        });
        (_c = this.userInput) === null || _c === void 0 ? void 0 : _c.addEventListener("input", () => {
            const isValid = this.validateUsername();
            if (!isValid)
                return;
            if (this.debounceTimer)
                clearTimeout(this.debounceTimer);
            this.debounceTimer = window.setTimeout(() => {
                this.checkUsernameAvailability();
            }, 400);
        });
        (_d = this.passwordInput) === null || _d === void 0 ? void 0 : _d.addEventListener("input", () => {
            this.checkPasswordStrength();
        });
        (_e = this.password2Input) === null || _e === void 0 ? void 0 : _e.addEventListener("input", () => {
            this.validatePasswordMatch();
        });
    }
    // email validation
    validateEmail() {
        var _a, _b;
        const value = ((_a = this.emailInput) === null || _a === void 0 ? void 0 : _a.value) || "";
        const emailError = (_b = this.shadowRoot) === null || _b === void 0 ? void 0 : _b.querySelector("#emailError");
        const regex = /^\S+@\S+\.\S+$/;
        if (!regex.test(value)) {
            emailError.textContent = "Invalid email format"; // Print the error message
            return false;
        }
        else {
            emailError.textContent = "";
            return true;
        }
    }
    async checkEmailAvailability() {
        var _a, _b;
        const email = ((_a = this.emailInput) === null || _a === void 0 ? void 0 : _a.value) || "";
        const emailError = (_b = this.shadowRoot) === null || _b === void 0 ? void 0 : _b.querySelector("#emailError");
        if (!this.validateEmail())
            return; // If the email is not valid, do not check availability
        try {
            // Appel à l'API pour vérifier la disponibilité de l'email
            const response = await fetch(`https://${SERVER_IP}:8443/api/check-email?email=${encodeURIComponent(email)}`);
            // Vérifier si la réponse est correcte
            if (!response.ok) {
                emailError.textContent = "Server error, please try again later.";
                return;
            }
            const data = await response.json();
            // Si la clé "available" existe et est false, cela signifie que l'email est déjà pris
            if (data && data.available) {
                emailError.textContent = "Email is already taken";
            }
            else {
                emailError.textContent = ""; // Aucun problème, email disponible
            }
        }
        catch (err) {
            // Gérer les erreurs réseau ou autres
            console.error("Validation of email hasn't worked", err);
            emailError.textContent = "Network error, please try again.";
        }
    }
    // username validation
    validateUsername() {
        var _a, _b;
        const value = ((_a = this.userInput) === null || _a === void 0 ? void 0 : _a.value) || "";
        const usernameError = (_b = this.shadowRoot) === null || _b === void 0 ? void 0 : _b.querySelector("#usernameError");
        // len check
        if (value.length < 3) {
            usernameError.textContent = "Must be at least 3 characters long";
            return false;
        }
        //special characters check
        const validUsernameRegex = /^[a-zA-Z0-9]+$/;
        if (!validUsernameRegex.test(value)) {
            usernameError.textContent = "Only letters and numbers";
            return false;
        }
        usernameError.textContent = "";
        return true;
    }
    async checkUsernameAvailability() {
        var _a, _b;
        const username = ((_a = this.userInput) === null || _a === void 0 ? void 0 : _a.value) || "";
        const usernameError = (_b = this.shadowRoot) === null || _b === void 0 ? void 0 : _b.querySelector("#usernameError");
        if (username.length < 3)
            return;
        try {
            // Appel à l'API pour vérifier la disponibilité du nom d'utilisateur
            const response = await fetch(`https://${SERVER_IP}:8443/api/check-username?username=${encodeURIComponent(username)}`);
            // Vérifier si la réponse est correcte
            if (!response.ok) {
                usernameError.textContent = "Server error, please try again later.";
                return;
            }
            const data = await response.json();
            if (data && data.available) {
                usernameError.textContent = "Username is already taken";
            }
            else {
                usernameError.textContent = ""; // Aucun problème, nom d'utilisateur disponible
            }
        }
        catch (err) {
            // Gérer les erreurs réseau ou autres
            console.error("Validation of username hasn't worked", err);
            usernameError.textContent = "Network error, please try again.";
        }
    }
    // password1 validation
    checkPasswordStrength() {
        var _a, _b;
        const value = ((_a = this.passwordInput) === null || _a === void 0 ? void 0 : _a.value) || "";
        const passwordError = (_b = this.shadowRoot) === null || _b === void 0 ? void 0 : _b.querySelector("#passwordError");
        const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{6,}$/; // Min 6 chars, 1 upper, 1 lower, 1 number
        if (!value) {
            passwordError.textContent = ""; // Si champ vide, pas d'erreur affichée
            return false;
        }
        if (!regex.test(value)) {
            passwordError.textContent = "Min 6 chars, 1 upper, 1 lower and 1 num";
            return false;
        }
        else {
            passwordError.textContent = "";
            return true;
        }
    }
    // password2 validation
    validatePasswordMatch() {
        var _a, _b, _c;
        const password = ((_a = this.passwordInput) === null || _a === void 0 ? void 0 : _a.value) || "";
        const password2 = ((_b = this.password2Input) === null || _b === void 0 ? void 0 : _b.value) || "";
        const password2Error = (_c = this.shadowRoot) === null || _c === void 0 ? void 0 : _c.querySelector("#password2Error");
        if (password !== password2) {
            password2Error.textContent = "Passwords do not match";
            return false;
        }
        password2Error.textContent = "";
        return true;
    }
    async postData(email, user, password) {
        const data = { "username": user, "email": email, "password": password };
        try {
            const response = await fetch(`https://${SERVER_IP}:8443/api/register`, {
                method: "POST",
                body: JSON.stringify(data),
                headers: { "Content-Type": "application/json" },
            });
            this.response = await response.json();
            console.log("Se ha enviado la peticion");
            if (response.ok) {
                location.hash = "#";
            }
            if (!response.ok) {
                throw { status: response.status, statusText: response.statusText };
            }
        }
        catch (error) {
            console.log("error en la peticion");
        }
    }
}
customElements.define("pong-register", RegisterComponent);
