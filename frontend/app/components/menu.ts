class MenuComponent extends HTMLElement {
	// private content: HTMLElement | null = null;
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

	private addEventListeners(): void {
		const profileLink = this.shadowRoot?.querySelector("#profile");
		const boardLink = this.shadowRoot?.querySelector("#board");
		const playLink = this.shadowRoot?.querySelector("#play");

		[profileLink, boardLink, playLink].forEach((link) => {
			if (link) {
				link.addEventListener("click", (event) => {
					event.preventDefault();
					const targetId = link.getAttribute("href") ?? "";
					console.log(targetId);
					if (window.location.hash ===targetId) {
						this.render();
					} else {
						window.location.hash = targetId;
					}
				});
			}
		});
	}
}

customElements.define("pong-menu", MenuComponent);