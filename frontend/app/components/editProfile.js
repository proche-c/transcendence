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
            yield this.getEditProfile();
            this.render();
        });
    }
    getEditProfile() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield fetch("http://localhost:8000/edit-profile", {
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
			<div class="relative flex flex-col h-full w-60 md:w-72 transform border-2 border-black bg-white transition-transform group-hover:scale-105">
                <div class="relative group w-32 h-32 rounded-full overflow-hidden border-4 border-black flex items-center justify-center my-5 mx-auto">
                    <img src="./app/avatars/default.jpg" class="w-full h-full object-cover" />
					<button id="uploadImg" class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white border-2 border-black rounded-full p-2 bg-white/20 backdrop-blur-sm hover:bg-white/80 transition">
						<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-16">
						<path stroke-linecap="round" stroke-linejoin="round" d="M12 16.5V9.75m0 0 3 3m-3-3-3 3M6.75 19.5a4.5 4.5 0 0 1-1.41-8.775 5.25 5.25 0 0 1 10.233-2.33 3 3 0 0 1 3.758 3.848A3.752 3.752 0 0 1 18 19.5H6.75Z" />
						</svg>
					</button>
					<input type="file" id="fileInput" accept="image/*" class="hidden" />
                </div>

				<div class="text-2xl font-bold text-center mt-4">
					<input type="text" id="username" placeholder="Type new username" value="${this.response.username}" class="border rounded-lg px-3 py-2 mt-1 mx-5 mb-5 text-sm bg-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500"/>
				</div>
			</div>
		`;
        this.shadowRoot.appendChild(style);
        this.addEventListeners();
    }
    addEventListeners() {
        var _a, _b;
        const uploadImg = (_a = this.shadowRoot) === null || _a === void 0 ? void 0 : _a.querySelector("#uploadImg");
        const fileInput = (_b = this.shadowRoot) === null || _b === void 0 ? void 0 : _b.querySelector("#fileInput");
        if (uploadImg && fileInput) {
            uploadImg.addEventListener("click", () => {
                fileInput.click();
            });
        }
    }
}
customElements.define("pong-edit-profile", EditProfileComponent);
