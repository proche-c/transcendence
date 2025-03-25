class HomeComponent extends HTMLElement {
    private dataContainer: HTMLElement | null = null;

    constructor() {
        super();
        this.attachShadow({ mode: "open" });
        this.render();
    }

    render() {
        if (!this.shadowRoot) return;

        const style = document.createElement("link");
        style.rel = "stylesheet";
        style.href = "./app/tailwind.css";

        this.shadowRoot.innerHTML = `
            <div class="bg-black flex items-center justify-center overflow-hidden m-2 rounded-lg shadow-lg">
                <img src="./app/assets/start2.png" class="p-1">
            </div>
            <div class="p-2">
                <h1 class="font-sans text-center font-bold text-purple-900 text-2xl">WELCOME TO PONG!</h1>
            </div>
            <div id="dataContainer"></div>
        `;

        this.dataContainer = this.shadowRoot.querySelector("#dataContainer");
        if (window.location.hash === "#register") {
            this.dataContainer?.appendChild(document.createElement("pong-register"));
        } else {
            this.dataContainer?.appendChild(document.createElement("pong-login"));
        }
        this.shadowRoot.appendChild(style);

    }
}

customElements.define("pong-home", HomeComponent);
