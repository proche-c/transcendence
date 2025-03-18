"use strict";
class MenuComponent extends HTMLElement {
    // private content: HTMLElement | null = null;
    constructor() {
        super();
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
			<nav class="flex gap-4 bg-gray-800 text-white p-4 rounded-lg">
				<a id="profile" href="#profile" class="hover:text-yellow-400">PROFILE</a>
				<a id="board" href="#board" class="hover:text-yellow-400">LEADER BOARD</a>
				<a id="play" href="#play" class="hover:text-yellow-400">PLAY</a>
			</nav>
		`;
        this.shadowRoot.appendChild(style);
        // this.content = this.shadowRoot.querySelector("#content");
        this.addEventListeners();
    }
    addEventListeners() {
        var _a, _b, _c;
        const profileLink = (_a = this.shadowRoot) === null || _a === void 0 ? void 0 : _a.querySelector("#profile");
        const boardLink = (_b = this.shadowRoot) === null || _b === void 0 ? void 0 : _b.querySelector("#board");
        const playLink = (_c = this.shadowRoot) === null || _c === void 0 ? void 0 : _c.querySelector("#play");
        [profileLink, boardLink, playLink].forEach((link) => {
            if (link) {
                link.addEventListener("click", (event) => {
                    var _a;
                    event.preventDefault();
                    const targetId = (_a = link.getAttribute("href")) !== null && _a !== void 0 ? _a : "";
                    console.log(targetId);
                    if (window.location.hash === targetId) {
                        this.render();
                    }
                    else {
                        window.location.hash = targetId;
                    }
                });
            }
        });
    }
}
customElements.define("pong-menu", MenuComponent);
