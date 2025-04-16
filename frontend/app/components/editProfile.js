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
class EditProfileComponent extends HTMLElement {
    constructor() {
        super();
        this.response = null;
        this.attachShadow({ mode: "open" });
        this.load();
    }
    load() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.getProfile();
            this.render();
        });
    }
    getProfile() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield fetch("http://localhost:8000/profile", {
                    method: "GET",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                });
                const data = yield response.json();
                this.response = data.user;
                console.log(data.user);
            }
            catch (error) {
                console.log('Error en la peticion');
            }
        });
    }
    render() {
        if (!this.shadowRoot)
            return;
        const style = document.createElement("link");
        style.rel = "stylesheet";
        style.href = "./app/tailwind.css"; // Asegúrate de que la ruta sea correcta
        this.shadowRoot.innerHTML = `
			<div class="flex justify-between">
            <p>ESTO ES EDIT ROFILE</p>
            <p>ESTO ES EDIT ROFILE</p>
            <p>ESTO ES EDIT ROFILE</p>
            <p>ESTO ES EDIT ROFILE</p>
            <p>ESTO ES EDIT ROFILE</p>
            <p>ESTO ES EDIT ROFILE</p>
			</div>
		`;
        this.shadowRoot.appendChild(style);
        this.addEventListeners();
    }
    addEventListeners() {
        var _a;
        const editButton = (_a = this.shadowRoot) === null || _a === void 0 ? void 0 : _a.querySelector("#edit");
        if (editButton) {
            editButton.addEventListener("click", () => {
            });
        }
    }
}
customElements.define("pong-edit-profile", EditProfileComponent);
