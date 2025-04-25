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
class LoginComponent extends HTMLElement {
    constructor() {
        super();
        this.emailInput = null;
        this.passwordInput = null;
        this.loginButton = null;
        this.registerButton = null;
        this.inputData = null;
        this.errorMsg = null;
        this.response = null;
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
                        class="border rounded-lg px-3 py-2 mt-1 mb-5 text-sm w-full bg-gray-700 text-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500"/>
                    <label for="password" class="font-semibold text-sm text-gray-400 pb-1 block">Password</label>
                    <input id="password" type="password"
                        class="border rounded-lg px-3 py-2 mt-1 mb-5 text-sm w-full bg-gray-700 text-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500"/>
                </div>
                <div class="flex justify-center items-center">
                    <div>
                    <button class="flex items-center justify-center py-2 px-10 bg-white hover:bg-gray-200 focus:ring-blue-500 focus:ring-offset-blue-200 text-gray-700 w-full transition ease-in duration-200 text-center text-sm font-semibold shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 rounded-lg">
                        <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google icon" class="w-5 h-5 mr-2" />
                        <span class="ml-8">Sign in with Google</span>
                    </button>
                    </div>
                </div>
                <div class="mt-5">
                    <button id="login"
                        class="py-2 px-4 bg-blue-600 hover:bg-blue-700 focus:ring-blue-500 focus:ring-offset-blue-200 text-white w-full transition ease-in duration-200 text-center text-base font-semibold shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 rounded-lg">
                        Log in
                    </button>
                </div>
                <div class="flex items-center justify-between mt-4">
                    <span class="w-1/5 border-b dark:border-gray-600 md:w-1/4"></span>
                    <button id="register" class="text-2xl text-gray-500 uppercase dark:text-gray-400 hover:underline">
                        or sign up
                    </button>
                    <span class="w-1/5 border-b dark:border-gray-600 md:w-1/4"></span>
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
        this.passwordInput = this.shadowRoot.querySelector("#password");
        this.loginButton = this.shadowRoot.querySelector("#login");
        this.inputData = this.shadowRoot.querySelector("#inputData");
        this.registerButton = this.shadowRoot.querySelector("#register");
        this.errorMsg = this.shadowRoot.querySelector("#error");
        this.addEventListeners();
    }
    addEventListeners() {
        var _a, _b;
        (_a = this.loginButton) === null || _a === void 0 ? void 0 : _a.addEventListener("click", (event) => __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            event.preventDefault();
            const email = ((_a = this.emailInput) === null || _a === void 0 ? void 0 : _a.value) || "";
            const password = ((_b = this.passwordInput) === null || _b === void 0 ? void 0 : _b.value) || "";
            if (email && password) {
                yield this.postData(email, password);
            }
            else {
                this.errorMsg.textContent = "All fields are required";
            }
        }));
        (_b = this.registerButton) === null || _b === void 0 ? void 0 : _b.addEventListener("click", () => {
            console.log("he pulsado sign in");
            window.location.hash = "#register";
        });
    }
    postData(email, password) {
        return __awaiter(this, void 0, void 0, function* () {
            const data = { "email": email, "password": password };
            try {
                // Esta url sera el endponit que configure el servidor
                const response = yield fetch("http://localhost:8000/login", {
                    method: "POST",
                    body: JSON.stringify(data),
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                });
                this.response = yield response.json();
                // location.hash = "#profile"; // Cambiar la vista
                // Aqui el backend hará las validaciones de email y password y me enviara un error
                // en caso de que haya algun problema
                // Si la autenticacion es valida, el backend creara un token jwt y lo guardara en las cookies
                console.log(response);
                if (response.ok) {
                    location.hash = "#profile";
                }
                if (response.status === 404 || response.status === 401) {
                    this.errorMsg.textContent = "Incorrect email or password";
                    this.resetValues();
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
        if (this.passwordInput)
            this.passwordInput.value = "";
    }
}
customElements.define("pong-login", LoginComponent);
