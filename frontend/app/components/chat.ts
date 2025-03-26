class ChatComponent extends HTMLElement {
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
			<div id="content" class="bg-purple-300 m-4 p-4 border border-violet-500 rounded-lg">
				Esto es el chat
			</div>
		`;

		this.shadowRoot.appendChild(style);
	}

}

customElements.define("pong-chat", ChatComponent);