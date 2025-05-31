import { fetchUserProfile } from "../utils/requests.js";
import { SERVER_IP } from '../config.js';
class HeaderComponent extends HTMLElement {
    constructor() {
        super();
        this.user = null;
        this.attachShadow({ mode: "open" });
        this.load();
    }
    async load() {
        await this.getProfile();
        this.render();
    }
    async getProfile() {
        this.user = await fetchUserProfile();
    }
    render() {
        if (!this.shadowRoot)
            return;
        const style = document.createElement("link");
        style.rel = "stylesheet";
        style.href = "./app/tailwind.css"; // Asegúrate de que la ruta sea correcta
        const avatar = this.user.avatar;
        const avatarUrl = `https://${SERVER_IP}:8443/api/static/${avatar}`;
        this.shadowRoot.innerHTML = `
		<div class="flex flex-col items-center w-full h-full my-2">
			<div class="md:w-16 md:h-16 w-8 h-8 rounded-full overflow-hidden border-2 border-black flex items-center justify-center bg-emerald-200">
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
