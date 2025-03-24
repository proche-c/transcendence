"use strict";
class PlayComponent extends HTMLElement {
    constructor() {
        super();
        this.content = null;
        this.attachShadow({ mode: "open" });
        this.render();
    }
    render() {
        if (!this.shadowRoot)
            return;
        const style = document.createElement("link");
        style.rel = "stylesheet";
        style.href = "./app/tailwind.css"; // Asegúrate de que la ruta sea correcta
        this.shadowRoot.innerHTML = `
            <pong-header></pong-header>
            <pong-menu></pong-menu>
			<div id="content" class="mt-4 p-4 border border-gray-300 rounded-lg">
				Esto es el play game
			</div>
		`;
        this.shadowRoot.appendChild(style);
        this.content = this.shadowRoot.querySelector("#content");
    }
}
customElements.define("pong-play", PlayComponent);
