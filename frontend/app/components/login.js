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
            <div class="border-1 border-purple-900 flex justify-center items-center content-center m-1 p-1">
                <div id="inputData" class="flex-col bg-black m-4 py-4 px-6 justify-center content-center">
                    <p class="text-white mx-1 my-2">Doesn't have an account yet? <button id="register" class="font-bold"> Sing in</button></p>
                    <input type="text" id="email" placeholder="Email" class="bg-white mx-1 my-2 p-1" required><br>
                    <input type="password" id="password" placeholder="Password" class="bg-white mx-1 my-2 p-1" required><br>
                    <div class="align-middle">
                    <button id="login" class="bg-gray-800 text-white m-1 p-1 text-center font-bold text-lg">Login</button>
                    </div>
                <div>
            </div>
        `;
        this.shadowRoot.appendChild(style);
        this.emailInput = this.shadowRoot.querySelector("#email");
        this.passwordInput = this.shadowRoot.querySelector("#password");
        this.loginButton = this.shadowRoot.querySelector("#login");
        this.inputData = this.shadowRoot.querySelector("#inputData");
        this.registerButton = this.shadowRoot.querySelector("#register");
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
        }));
        (_b = this.registerButton) === null || _b === void 0 ? void 0 : _b.addEventListener("click", () => {
            console.log("he pulsado sign in");
            window.location.hash = "#register";
        });
    }
    postData(email, password) {
        return __awaiter(this, void 0, void 0, function* () {
            const data = { email, password };
            try {
                // Esta url sera el endponit que configure el servidor
                const response = yield fetch("http://localhost:8000/login", {
                    method: "POST",
                    body: JSON.stringify(data),
                    headers: { "Content-Type": "application/json" },
                });
                this.response = yield response.json();
                location.hash = "#profile"; // Cambiar la vista
                // Aqui el backend hará las validaciones de email y password y me enviara un error
                // en caso de que haya algun problema
                // Si la autenticacion es valida, el backend creara un token jwt y lo guardara en las cookies
                console.log(response);
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
customElements.define("pong-login", LoginComponent);
