import { fetchUserProfile, User } from "../utils/requests.js";

class HeaderComponent extends HTMLElement {
	private user: User | any | null = null;


	constructor() {
		super();
		this.attachShadow({mode: "open"});
		this.load();
	}

	private async load() {
		await this.getProfile();
		this.render();
	}

	private async getProfile() {
		this.user = await fetchUserProfile();
	}

	private render(): void {
		if(!this.shadowRoot)
			return;
		const style = document.createElement("link");
		style.rel = "stylesheet";
		style.href = "./app/tailwind.css"; // Asegúrate de que la ruta sea correcta

		const avatar = this.user.avatar;
		const avatarUrl = `http://localhost:8000/static/${avatar}`;

		this.shadowRoot.innerHTML = `
		<div class="flex flex-col items-center w-full h-full my-2 bg-amber-500">
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