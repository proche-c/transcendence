class HeaderComponent extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({mode: "open"});
        this.render();
    }

    private render(): void {
        if (!this.shadowRoot)
            return;

		const style = document.createElement("link");
		style.rel = "stylesheet";
		style.href = "./app/tailwind.css"; // Asegúrate de que la ruta sea correcta

        this.shadowRoot.innerHTML = `
        <div class= "bg-gray-950 flex items-center align-middle justify-center p-3 m-1 h-30">
                <img src="./app/assets/pong.png" class="scale-50">
        </div>`

        this.shadowRoot.appendChild(style);
    }
}

customElements.define("pong-header", HeaderComponent);