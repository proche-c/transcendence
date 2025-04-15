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
		const isActive = (hash: string) => currentHash === hash ? "text-purple-900" : "text-purple-700";
		const style = document.createElement("link");
		style.rel = "stylesheet";
		style.href = "./app/tailwind.css"; // Asegúrate de que la ruta sea correcta

		this.shadowRoot.innerHTML = `
			<div class="flex h-screen w-16 flex-col justify-between border-e border-gray-100 bg-white">
  				<div>
    				<div class="border-t border-gray-100">
      					<div class="px-2">
							<ul class="space-y-1 border-t border-gray-100 pt-4">
          <li>
            <a href="#" class="group relative flex justify-center rounded-sm px-2 py-1.5 text-gray-500 hover:bg-gray-50 hover:text-gray-700">
<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
  <path stroke-linecap="round" stroke-linejoin="round" d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
</svg>


              <span
                class="invisible absolute start-full top-1/2 ms-4 -translate-y-1/2 rounded-sm bg-gray-900 px-2 py-1.5 text-xs font-medium text-white group-hover:visible"
              >
                Teams
              </span>
            </a>
          </li>

          <li>
            <a
              href="#"
              class="group relative flex justify-center rounded-sm px-2 py-1.5 text-gray-500 hover:bg-gray-50 hover:text-gray-700"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="size-5 opacity-75"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                stroke-width="2"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                />
              </svg>

              <span
                class="invisible absolute start-full top-1/2 ms-4 -translate-y-1/2 rounded-sm bg-gray-900 px-2 py-1.5 text-xs font-medium text-white group-hover:visible"
              >
                Billing
              </span>
            </a>
          </li>

          <li>
            <a
              href="#"
              class="group relative flex justify-center rounded-sm px-2 py-1.5 text-gray-500 hover:bg-gray-50 hover:text-gray-700"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="size-5 opacity-75"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                stroke-width="2"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                />
              </svg>

              <span
                class="invisible absolute start-full top-1/2 ms-4 -translate-y-1/2 rounded-sm bg-gray-900 px-2 py-1.5 text-xs font-medium text-white group-hover:visible"
              >
                Invoices
              </span>
            </a>
          </li>

          <li>
            <a
              href="#"
              class="group relative flex justify-center rounded-sm px-2 py-1.5 text-gray-500 hover:bg-gray-50 hover:text-gray-700"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="size-5 opacity-75"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                stroke-width="2"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>

              <span
                class="invisible absolute start-full top-1/2 ms-4 -translate-y-1/2 rounded-sm bg-gray-900 px-2 py-1.5 text-xs font-medium text-white group-hover:visible"
              >
                Account
              </span>
            </a>
          </li>
        </ul>
      </div>
    </div>
  </div>

  <div class="sticky inset-x-0 bottom-0 border-t border-gray-100 bg-white p-2">
    <a
      href="#"
      class="group relative flex w-full justify-center rounded-lg px-2 py-1.5 text-sm text-gray-500 hover:bg-gray-50 hover:text-gray-700"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        class="size-5 opacity-75"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        stroke-width="2"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
        />
      </svg>

      <span
        class="invisible absolute start-full top-1/2 ms-4 -translate-y-1/2 rounded-sm bg-gray-900 px-2 py-1.5 text-xs font-medium text-white group-hover:visible"
      >
        Logout
      </span>
    </a>
  </div>
</div>
		`;

		this.shadowRoot.appendChild(style);
		// this.content = this.shadowRoot.querySelector("#content");
		this.addEventListeners();
	}

	private addEventListeners(): void {
		const profileLink = this.shadowRoot?.querySelector("#profile");
		const boardLink = this.shadowRoot?.querySelector("#board");
		const playLink = this.shadowRoot?.querySelector("#play");
		const chatLink = this.shadowRoot?.querySelector("#chat");

		[profileLink, boardLink, playLink, chatLink].forEach((link) => {
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