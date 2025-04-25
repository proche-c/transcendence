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
                <div class="mt-5">
                    <label for="email" class="font-semibold text-sm text-gray-400 pb-1 block">E-mail</label>
                    <input id="email" type="text"
                        class="border rounded-lg px-3 py-2 mt-1 mb-1 text-sm w-full bg-gray-700 text-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500"/>
                        <p class="text-sm text-red-500 mb-4" id="emailError"></p>
 
    
                    <label for="username" class="font-semibold text-sm text-gray-400 pb-1 block">Username</label>
                    <input id="username" type="text"
                        class="border rounded-lg px-3 py-2 mt-1 mb-5 text-sm w-full bg-gray-700 text-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500"/>                    
    <p class="text-sm text-red-500 mb-4" id="usernameError"></p> <!-- Message d'erreur pour le nom d'utilisateur -->
    
                    <label for="password" class="font-semibold text-sm text-gray-400 pb-1 block">Password</label>
                    <input id="password" type="password"
                        class="border rounded-lg px-3 py-2 mt-1 mb-5 text-sm w-full bg-gray-700 text-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500"/>
    <p class="text-sm text-red-500 mt-1" id="passwordError"></p> <!-- Message d'erreur pour le mot de passe -->
                    
                    <label for="password2" class="font-semibold text-sm text-gray-400 pb-1 block">Confirm Password</label>
                    <input id="password2" type="password"
                        class="border rounded-lg px-3 py-2 mt-1 mb-5 text-sm w-full bg-gray-700 text-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500"/>
    <p class="text-sm text-red-500 mt-1" id="password2Error"></p> <!-- Message d'erreur pour la confirmation du mot de passe -->            
        
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
        var _a, _b, _c;
        (_a = this.registerButton) === null || _a === void 0 ? void 0 : _a.addEventListener("click", (event) => __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d;
            event.preventDefault();
            const email = ((_a = this.emailInput) === null || _a === void 0 ? void 0 : _a.value) || "";
            const user = ((_b = this.userInput) === null || _b === void 0 ? void 0 : _b.value) || "";
            const password = ((_c = this.passwordInput) === null || _c === void 0 ? void 0 : _c.value) || "";
            const password2 = ((_d = this.password2Input) === null || _d === void 0 ? void 0 : _d.value) || "";
            // Fileds validation before sending the request
            if (this.validateEmail() && this.validateUsername() && this.validatePassword() && this.validatePasswordMatch()) {
                yield this.postData(email, user, password);
            }
            else {
                this.errorMsg.textContent = "Please fix the errors"; // main error message
            }
        }));
        // Real time fields validation
        (_b = this.emailInput) === null || _b === void 0 ? void 0 : _b.addEventListener("input", () => this.validateEmail());
        (_c = this.userInput) === null || _c === void 0 ? void 0 : _c.addEventListener("input", () => {
            this.validateUsername();
            if (this.debounceTimer)
                clearTimeout(this.debounceTimer);
            this.debounceTimer = window.setTimeout(() => {
                this.checkUsernameAvailability();
            }, 400);
        });
    }
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
    validateUsername() {
        var _a, _b;
        const value = ((_a = this.userInput) === null || _a === void 0 ? void 0 : _a.value) || "";
        const usernameError = (_b = this.shadowRoot) === null || _b === void 0 ? void 0 : _b.querySelector("#usernameError");
        if (value.length < 3) {
            usernameError.textContent = "Username must be at least 3 characters long";
            return false;
        }
        else {
            usernameError.textContent = "";
            return true;
        }
    }
    checkUsernameAvailability() {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            const username = ((_a = this.userInput) === null || _a === void 0 ? void 0 : _a.value) || "";
            const usernameError = (_b = this.shadowRoot) === null || _b === void 0 ? void 0 : _b.querySelector("#usernameError");
            if (username.length < 3)
                return; // ne vérifie que si longueur ok
            try {
                const response = yield fetch(`http://localhost:8000/check-username?username=${encodeURIComponent(username)}`);
                const data = yield response.json();
                if (!data.available) {
                    usernameError.textContent = "Username is already taken";
                }
                else {
                    usernameError.textContent = "";
                }
            }
            catch (err) {
                console.error("Erreur lors de la vérification du username", err);
            }
        });
    }
    checkPasswordStrength() {
        var _a, _b;
        const value = ((_a = this.passwordInput) === null || _a === void 0 ? void 0 : _a.value) || "";
        const passwordError = (_b = this.shadowRoot) === null || _b === void 0 ? void 0 : _b.querySelector("#passwordError");
        const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{6,}$/; // At least 6 characters, 1 uppercase, 1 lowercase, 1 number
        if (!regex.test(value)) {
            passwordError.textContent = "Password must be at least 6 characters long and contain at least one uppercase letter, one lowercase letter, and one number";
            return false;
        }
        else {
            passwordError.textContent = "";
            return true;
        }
    }
    validatePassword() {
        var _a;
        const value = ((_a = this.passwordInput) === null || _a === void 0 ? void 0 : _a.value) || "";
        if (value.length < 6) {
            this.errorMsg.textContent = "Password must be at least 6 characters long";
            return false;
        }
        return true;
    }
    validatePasswordMatch() {
        var _a, _b;
        const password = ((_a = this.passwordInput) === null || _a === void 0 ? void 0 : _a.value) || "";
        const password2 = ((_b = this.password2Input) === null || _b === void 0 ? void 0 : _b.value) || "";
        if (password !== password2) {
            this.errorMsg.textContent = "Passwords do not match";
            return false;
        }
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
    resetValues() {
        if (this.emailInput)
            this.emailInput.value = "";
        if (this.userInput)
            this.userInput.value = "";
        if (this.passwordInput)
            this.passwordInput.value = "";
        if (this.password2Input)
            this.password2Input.value = "";
    }
}
customElements.define("pong-register", RegisterComponent);
