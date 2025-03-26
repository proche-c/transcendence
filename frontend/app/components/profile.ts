class ProfileComponent extends HTMLElement {
	constructor() {
		super();
		this.attachShadow({mode: "open"});
		this.render();
	} 

	private render(): void {
		if(!this.shadowRoot)
			return;
		const style = document.createElement("link");
		style.rel = "stylesheet";
		style.href = "./app/tailwind.css"; // Asegúrate de que la ruta sea correcta

		this.shadowRoot.innerHTML = `
            <pong-header></pong-header>
            <pong-menu></pong-menu>
			<div id="content" class="mt-4 p-4 border border-gray-300 rounded-lg">
				Esto es el profile
			</div>
		`;

		this.shadowRoot.appendChild(style);
	}

}

customElements.define("pong-profile", ProfileComponent);