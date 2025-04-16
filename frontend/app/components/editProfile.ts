class EditProfileComponent extends HTMLElement {
	private response: any | null = null;
	constructor() {
		super();
		this.attachShadow({mode: "open"});
		this.load();
	}

	private async load() {
		await this.getEditProfile();
		this.render();
	}

	private async getEditProfile() {
		try {
            const response = await fetch("http://localhost:8000/edit-profile", {
                method: "GET",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
            });

			const data = await response.json();
			this.response = data.user;
			console.log(data.user);


		} catch (error: any) {
			console.log('Error en la peticion');
		}
	}

	private render(): void {
		if(!this.shadowRoot)
			return;
		const style = document.createElement("link");
		style.rel = "stylesheet";
		style.href = "./app/tailwind.css"; // Asegúrate de que la ruta sea correcta

		this.shadowRoot.innerHTML = `
			<div class="relative flex flex-col h-full w-60 md:w-72 transform border-2 border-black bg-white transition-transform group-hover:scale-105">
                <div class="relative w-32 h-32 rounded-full overflow-hidden border-4 border-black flex items-center justify-center my-5 mx-auto">
                    <img src="./app/avatars/default.jpg" class="w-full h-full object-cover" />
                    <button id="uploadImg" class="absolute bottom-0 m-1 right-0 bg-white border-2 border-black rounded-full p-1 bg-white/60 backdrop-blur-sm hover:bg-white/80 transition">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V7m-6 4l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                    </button>
                </div>
			</div>
		`;

		this.shadowRoot.appendChild(style);
		this.addEventListeners();
	}

	private addEventListeners(): void {
		const editButton = this.shadowRoot?.querySelector("#edit");
		if (editButton) {
			editButton.addEventListener("click", () => {

			});
		}
	}
}

customElements.define("pong-edit-profile", EditProfileComponent);