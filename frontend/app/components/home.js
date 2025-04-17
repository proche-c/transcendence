"use strict";
class HomeComponent extends HTMLElement {
    constructor() {
        super();
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
        <section class="h-screen">
            <div class="container h-full px-6 py-24">
                <div class="flex h-full flex-wrap items-center justify-center lg:justify-between">
                    <div class="mb-12 md:mb-0 md:w-8/12 lg:w-6/12">
                        <img src="./app/assets/chica.svg" class="w-full"/>
                    </div>
                    <div id="dataContainer"></div>
                </div>
            </div>
        </section>
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
