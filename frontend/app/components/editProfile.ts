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

	private addEventListeners(): void {
		const uploadImg = this.shadowRoot?.querySelector("#uploadImg") as HTMLButtonElement;
		const fileInput = this.shadowRoot?.querySelector("#fileInput") as HTMLInputElement;
		if (uploadImg && fileInput) {
			uploadImg.addEventListener("click", () => {
				fileInput.click();
			});
		}
	}
}

customElements.define("pong-edit-profile", EditProfileComponent);