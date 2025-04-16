class EditProfileComponent extends HTMLElement {
	private response: any | null = null;
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
		try {
            const response = await fetch("http://localhost:8000/profile", {
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

	private addEventListeners(): void {
		const editButton = this.shadowRoot?.querySelector("#edit");
		if (editButton) {
			editButton.addEventListener("click", () => {

			});
		}
	}
}

customElements.define("pong-edit-profile", EditProfileComponent);