"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
class RegisterComponent extends HTMLElement {
    constructor() {
        super();
        this.emailInput = null;
        this.userInput = null;
        this.passwordInput = null;
        this.password2Input = null;
        this.registerButton = null;
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
        <div class="relative px-4 py-10 bg-black mx-8 md:mx-0 shadow rounded-3xl sm:p-10">
            <div class="max-w-md mx-auto text-white">
                <div class="mt-1">
                    <label for="email" class="font-semibold text-sm text-gray-400 pb-1 block">E-mail</label>
                    <input id="email" type="text"
                        class="border rounded-lg px-3 py-2 mt-1 mb-1 text-sm w-full bg-gray-700 text-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500"/>
                        <p class="text-sm text-red-500 mb-4" id="emailError"></p>
 
    
                    <label for="username" class="font-semibold text-sm text-gray-400 pb-1 block">Username</label>
                    <input id="username" type="text"
                        class="border rounded-lg px-3 py-2 mt-1 mb-1 text-sm w-full bg-gray-700 text-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500"/>                    
                        <p class="text-sm text-red-500 mb-4" id="usernameError"></p>
    
                    <label for="password" class="font-semibold text-sm text-gray-400 pb-1 block">Password</label>
                    <input id="password" type="password"
                        class="border rounded-lg px-3 py-2 mt-1 mb-1 text-sm w-full bg-gray-700 text-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500"/>
                        <p class="text-sm text-red-500 mb-4" id="passwordError"></p>
                    
                    <label for="password2" class="font-semibold text-sm text-gray-400 pb-1 block">Confirm Password</label>
                    <input id="password2" type="password"
                        class="border rounded-lg px-3 py-2 mt-1 mb-1 text-sm w-full bg-gray-700 text-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500"/>
                        <p class="text-sm text-red-500" id="password2Error"></p> <!-- Message d'erreur pour la confirmation du mot de passe -->            
        
                </div>
                <div class="mt-5">
                    <button id="register"
                        class="py-2 px-4 bg-blue-600 hover:bg-blue-700 focus:ring-blue-500 focus:ring-offset-blue-200 text-white w-full transition ease-in duration-200 text-center text-base font-semibold shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 rounded-lg">
                        Register
                    </button>
                </div>
                <div class="text-red-600">
                    <p id="error"> </p>
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
        this.errorMsg = this.shadowRoot.querySelector("#error");
        this.addEventListeners();
    }
    addEventListeners() {
        var _a, _b, _c, _d, _e, _f;
        (_a = this.registerButton) === null || _a === void 0 ? void 0 : _a.addEventListener("click", (event) => __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d;
            event.preventDefault();
            const email = ((_a = this.emailInput) === null || _a === void 0 ? void 0 : _a.value) || "";
            const user = ((_b = this.userInput) === null || _b === void 0 ? void 0 : _b.value) || "";
            const password = ((_c = this.passwordInput) === null || _c === void 0 ? void 0 : _c.value) || "";
            const password2 = ((_d = this.password2Input) === null || _d === void 0 ? void 0 : _d.value) || "";
            // Fields validation before sending the request
            if (this.validateEmail() && this.validateUsername() && this.validatePasswordMatch()) {
                yield this.postData(email, user, password);
            }
            else {
                this.errorMsg.textContent = "Please fix the errors"; // main error message
            }
        }));
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
        // Enter key event
        (_f = this.shadowRoot) === null || _f === void 0 ? void 0 : _f.addEventListener("keydown", (event) => {
            var _a;
            // Explicitly cast the event to KeyboardEvent
            const keyboardEvent = event;
            if (keyboardEvent.key === "Enter") {
                keyboardEvent.preventDefault();
                (_a = this.registerButton) === null || _a === void 0 ? void 0 : _a.click();
            }
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
    checkEmailAvailability() {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            const email = ((_a = this.emailInput) === null || _a === void 0 ? void 0 : _a.value) || "";
            const emailError = (_b = this.shadowRoot) === null || _b === void 0 ? void 0 : _b.querySelector("#emailError");
            if (!this.validateEmail())
                return; // If the email is not valid, do not check availability
            try {
                // Appel à l'API pour vérifier la disponibilité de l'email
                const response = yield fetch(`http://localhost:8000/check-email?email=${encodeURIComponent(email)}`);
                // Vérifier si la réponse est correcte
                if (!response.ok) {
                    emailError.textContent = "Server error, please try again later.";
                    return;
                }
                const data = yield response.json();
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
        });
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
    checkUsernameAvailability() {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            const username = ((_a = this.userInput) === null || _a === void 0 ? void 0 : _a.value) || "";
            const usernameError = (_b = this.shadowRoot) === null || _b === void 0 ? void 0 : _b.querySelector("#usernameError");
            if (username.length < 3)
                return;
            try {
                // Appel à l'API pour vérifier la disponibilité du nom d'utilisateur
                const response = yield fetch(`http://localhost:8000/check-username?username=${encodeURIComponent(username)}`);
                // Vérifier si la réponse est correcte
                if (!response.ok) {
                    usernameError.textContent = "Server error, please try again later.";
                    return;
                }
                const data = yield response.json();
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
        });
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
    postData(email, user, password) {
        return __awaiter(this, void 0, void 0, function* () {
            const data = { "username": user, "email": email, "password": password };
            try {
                const response = yield fetch("http://localhost:8000/register", {
                    method: "POST",
                    body: JSON.stringify(data),
                    headers: { "Content-Type": "application/json" },
                });
                this.response = yield response.json();
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
        });
    }
}
customElements.define("pong-register", RegisterComponent);
