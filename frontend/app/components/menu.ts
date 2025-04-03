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

		const currentHash = window.location.hash;
		const isActive = (hash: string) => currentHash === hash ? "text-purple-900" : "text-purple-200";
		const style = document.createElement("link");
		style.rel = "stylesheet";
		style.href = "./app/tailwind.css"; // Asegúrate de que la ruta sea correcta

		this.shadowRoot.innerHTML = `
			<nav class="flex p-2 rounded-lg shadow-lg m-2 justify-between">
				<div>
					<a id="profile" href="#profile" class="ml-0 ${isActive("#profile")} hover:text-purple-900 font-bold mx-1 my-1 lg:text-3xl lg:mx-10 lg:ml-0">PROFILE</a>
					<a id="board" href="#board" class="${isActive("#board")} hover:text-purple-900 font-bold mx-1 my-1 lg:text-3xl lg:mx-10 lg:ml-0">LEADER BOARD</a>
					<a id="play" href="#play" class="${isActive("#play")} hover:text-purple-900 font-bold mx-1 my-1 lg:text-3xl lg:mx-10 lg:ml-0">PLAY</a>
				</div>
				<button id="logout" class="bg-purple-400 text-black mx-1 ml-3 p-1 text-center text-xs font-bold rounded-lg my-1 lg:text-base px-2">Logout</button>
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
						this.render();
					}
				});
			}
		});
	}
}

customElements.define("pong-menu", MenuComponent);