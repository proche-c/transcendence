"use strict";
class HomeComponent extends HTMLElement {
    // private registerButton: HTMLElement | null = null;
    // private response: Promise<Response> | null = null;
    constructor() {
        super();
        // private emailInput: HTMLInputElement | null = null;
        // private passwordInput: HTMLInputElement | null = null;
        // private loginButton: HTMLElement | null = null;
        this.dataContainer = null;
        this.attachShadow({ mode: "open" });
        this.render();
    }
    render() {
        var _a, _b;
        if (!this.shadowRoot)
            return;
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
            (_a = this.dataContainer) === null || _a === void 0 ? void 0 : _a.appendChild(document.createElement("pong-register"));
        }
        else {
            (_b = this.dataContainer) === null || _b === void 0 ? void 0 : _b.appendChild(document.createElement("pong-login"));
        }
        this.shadowRoot.appendChild(style);
    }
}
customElements.define("pong-home", HomeComponent);
