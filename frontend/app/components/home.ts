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
            this.dataContainer?.appendChild(document.createElement("pong-register"));
        } else {
            this.dataContainer?.appendChild(document.createElement("pong-login"));
        }
        this.shadowRoot.appendChild(style);

    }
}

customElements.define("pong-home", HomeComponent);
