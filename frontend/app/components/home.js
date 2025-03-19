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
class HomeComponent extends HTMLElement {
    constructor() {
        super();
        this.usernameInput = null;
        this.passwordInput = null;
        this.loginButton = null;
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
            <div class="bg-black flex items-center justify-center overflow-hidden m-2 rounded-lg shadow-lg">
                <img src="./app/assets/start2.png" class="p-1">
            </div>
            <div class="p-2">
                <h1 class="font-sans text-center font-bold text-purple-900 text-2xl">WELCOME TO PONG!</h1>
            </div>
            <div class="border-1 border-purple-900 flex justify-center items-center content-center m-1 p-1">
                <div class="flex-col bg-black m-4 py-4 px-6 justify-center content-center">
                    <p class="text-white mx-1 my-2">Doesn't have an account yet? <button id="register" class="font-bold"> Sing in</button></p>
                    <input type="text" id="username" placeholder="Username" class="bg-white mx-1 my-2 p-1" required><br>
                    <input type="password" id="password" placeholder="Password" class="bg-white mx-1 my-2 p-1" required><br>
                    <div class="align-middle">
                    <button id="login" class="bg-gray-800 text-white m-1 p-1 text-center font-bold text-lg">Login</button>
                    </div>
                <div>
            </div>
        `;
        this.shadowRoot.appendChild(style);
        this.usernameInput = this.shadowRoot.querySelector("#username");
        this.passwordInput = this.shadowRoot.querySelector("#password");
        this.loginButton = this.shadowRoot.querySelector("#login");
        this.addEventListeners();
    }
    addEventListeners() {
        var _a;
        (_a = this.loginButton) === null || _a === void 0 ? void 0 : _a.addEventListener("click", (event) => __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            event.preventDefault();
            const username = ((_a = this.usernameInput) === null || _a === void 0 ? void 0 : _a.value) || "";
            const password = ((_b = this.passwordInput) === null || _b === void 0 ? void 0 : _b.value) || "";
            if (username && password) {
                yield this.postData(username, password);
            }
        }));
        console.log(this.response);
    }
    postData(username, password) {
        return __awaiter(this, void 0, void 0, function* () {
            const data = { id: 9, username, password };
            try {
                // Esta url sera el endponit que configure el servidor
                const response = yield fetch("http://localhost:3000/users", {
                    method: "POST",
                    body: JSON.stringify(data),
                    headers: { "Content-Type": "application/json" },
                });
                this.response = yield response.json();
                location.hash = "#profile"; // Cambiar la vista
                // Aqui el backend hará las validaciones de username y password y me enviara un error
                // en caso de que haya algun problema
                // Si la autenticacion es valida, el backend creara un token jwt y lo guardara en las cookies
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
customElements.define("pong-home", HomeComponent);
