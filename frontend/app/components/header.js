var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { fetchUserProfile } from "../utils/requests.js";
class HeaderComponent extends HTMLElement {
    constructor() {
        super();
        this.user = null;
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
            this.user = yield fetchUserProfile();
        });
    }
    render() {
        if (!this.shadowRoot)
            return;
        const style = document.createElement("link");
        style.rel = "stylesheet";
        style.href = "./app/tailwind.css"; // Asegúrate de que la ruta sea correcta
        const avatar = this.user.avatar;
        const avatarUrl = `http://localhost:8000/static/${avatar}`;
        this.shadowRoot.innerHTML = `
		<div class="flex flex-col items-center w-5/6 h-full my-2">
			<div class="w-16 h-16 rounded-full overflow-hidden border-4 border-black flex items-center justify-center bg-emerald-200">
				<img src="${avatarUrl}" class="w-full h-full object-cover" />
			</div>
			<div class="my-1">
				<p>${this.user.username}</p>
			</div>
		</div
		`;
        this.shadowRoot.appendChild(style);
    }
}
customElements.define("pong-header", HeaderComponent);
