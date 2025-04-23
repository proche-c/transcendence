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
                <input type="text" id="email" placeholder="Email" class="bg-white mx-1 my-2 p-1" required><br>
                <input type="text" id="username" placeholder="Username" class="bg-white mx-1 my-2 p-1" required><br>
                <input type="password" id="password" placeholder="Password" class="bg-white mx-1 my-2 p-1" required><br>
                <input type="password" id="password2" placeholder="Confirm password" class="bg-white mx-1 my-2 p-1" required><br>
                <div class="align-middle">
                <button id="register" class="bg-gray-800 text-white m-1 p-1 text-center font-bold text-lg">Register</button>
                </div>
                <div class="text-red-600">
                <p id="error"> </p>
                </div>
            <div>
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
        var _a;
        (_a = this.registerButton) === null || _a === void 0 ? void 0 : _a.addEventListener("click", (event) => __awaiter(this, void 0, void 0, function* () {
            var _b, _c, _d, _e;
            event.preventDefault();
            const email = ((_b = this.emailInput) === null || _b === void 0 ? void 0 : _b.value) || "";
            const user = ((_c = this.userInput) === null || _c === void 0 ? void 0 : _c.value) || "";
            const password = ((_d = this.passwordInput) === null || _d === void 0 ? void 0 : _d.value) || "";
            const password2 = ((_e = this.password2Input) === null || _e === void 0 ? void 0 : _e.value) || "";
            if (email && user && password && password2) {
                if (password === password2) {
                    yield this.postData(email, user, password);
                }
                else {
                    this.errorMsg.textContent = "Password doesn't match";
                    this.resetValues();
                }
            }
            else {
                this.errorMsg.textContent = "All fields are required";
            }
        }));
    }
    postData(email, user, password) {
        return __awaiter(this, void 0, void 0, function* () {
            const data = { "username": user, "email": email, "password": password };
            try {
                // Esta url sera el endponit que configure el servidor
                const response = yield fetch("http://localhost:8000/register", {
                    method: "POST",
                    body: JSON.stringify(data),
                    headers: { "Content-Type": "application/json" },
                });
                this.response = yield response.json();
                console.log("Se ha enviado la peticion");
                // location.hash = "#profile"; // Cambiar la vista
                // Aqui el backend hará las validaciones de email y password y me enviara un error
                // en caso de que haya algun problema
                // Si la autenticacion es valida, el backend creara un token jwt y lo guardara en las cookies
                console.log(response);
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
