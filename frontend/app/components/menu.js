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
        const currentHash = window.location.hash;
        const isActive = (hash) => currentHash === hash ? "text-purple-900" : "text-purple-700";
        const style = document.createElement("link");
        style.rel = "stylesheet";
        style.href = "./app/tailwind.css"; // Asegúrate de que la ruta sea correcta
        this.shadowRoot.innerHTML = `
		<div class="flex h-screen items-center">
			<div class="flex h-6/8 w-10 md:w-24 flex-col items-center justify-around border-e border-violet-700 bg-white rounded-4xl my-10 px-2 ml-1">	
				<div>
					<a href="#profile" id="profile" class="group relative flex justify-center rounded-sm px-2 py-1.5 text-gray-500 hover:bg-gray-50 hover:text-gray-700">
					<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6 md:size-10">
					<path stroke-linecap="round" stroke-linejoin="round" d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Zm6-10.125a1.875 1.875 0 1 1-3.75 0 1.875 1.875 0 0 1 3.75 0Zm1.294 6.336a6.721 6.721 0 0 1-3.17.789 6.721 6.721 0 0 1-3.168-.789 3.376 3.376 0 0 1 6.338 0Z" />
					</svg>

					<span class="invisible absolute start-full top-1/2 ms-4 -translate-y-1/2 rounded-sm bg-gray-900 px-2 py-1.5 text-xs font-medium text-white group-hover:visible">
						Profile
					</span>
					</a>
				</div>
				<div>
					<a href="#friends" id="friends" class="group relative flex justify-center rounded-sm px-2 py-1.5 text-gray-500 hover:bg-gray-50 hover:text-gray-700">
					<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6 md:size-10">
					<path stroke-linecap="round" stroke-linejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
					</svg>


					<span class="invisible absolute start-full top-1/2 ms-4 -translate-y-1/2 rounded-sm bg-gray-900 px-2 py-1.5 text-xs font-medium text-white group-hover:visible">
						Friends
					</span>
					</a>
				</div>
				<div>
					<a href="#board" id="board" class="group relative flex justify-center rounded-sm px-2 py-1.5 text-gray-500 hover:bg-gray-50 hover:text-gray-700">
					<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6 md:size-10">
					<path stroke-linecap="round" stroke-linejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 0 1 3 3h-15a3 3 0 0 1 3-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 0 1-.982-3.172M9.497 14.25a7.454 7.454 0 0 0 .981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 0 0 7.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 0 0 2.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 0 1 2.916.52 6.003 6.003 0 0 1-5.395 4.972m0 0a6.726 6.726 0 0 1-2.749 1.35m0 0a6.772 6.772 0 0 1-3.044 0" />
					</svg>
					<span class="invisible absolute start-full top-1/2 ms-4 -translate-y-1/2 rounded-sm bg-gray-900 px-2 py-1.5 text-xs font-medium text-white group-hover:visible">
						Board
					</span>
					</a>
				</div>
				<div>
					<a href="#chat" id="chat" class="group relative flex justify-center rounded-sm px-2 py-1.5 text-gray-500 hover:bg-gray-50 hover:text-gray-700">
					<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6 md:size-10">
					<path stroke-linecap="round" stroke-linejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 0 1-.825-.242m9.345-8.334a2.126 2.126 0 0 0-.476-.095 48.64 48.64 0 0 0-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0 0 11.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
					</svg>

					<span class="invisible absolute start-full top-1/2 ms-4 -translate-y-1/2 rounded-sm bg-gray-900 px-2 py-1.5 text-xs font-medium text-white group-hover:visible">
						Chat
					</span>
					</a>
				</div>
				<div>
					<a href="#play" id="play" class="group relative flex justify-center rounded-sm px-2 py-1.5 text-gray-500 hover:bg-gray-50 hover:text-gray-700">
					<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6 md:size-10">
					<path stroke-linecap="round" stroke-linejoin="round" d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
					<path stroke-linecap="round" stroke-linejoin="round" d="M15.91 11.672a.375.375 0 0 1 0 .656l-5.603 3.113a.375.375 0 0 1-.557-.328V8.887c0-.286.307-.466.557-.327l5.603 3.112Z" />
					</svg>

					<span class="invisible absolute start-full top-1/2 ms-4 -translate-y-1/2 rounded-sm bg-gray-900 px-2 py-1.5 text-xs font-medium text-white group-hover:visible">
						Play
					</span>
					</a>
				</div>
				<div class="border-t border-gray-100 bg-white">
    				<a href="#" class="group relative flex w-full justify-center rounded-lg py-1.5 text-sm text-gray-500 hover:bg-gray-50 hover:text-gray-700">
      				<svg xmlns="http://www.w3.org/2000/svg" class="size-6 md:size-10 opacity-75" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        			<path stroke-linecap="round" stroke-linejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
      				</svg>
      				<span class="invisible absolute start-full top-1/2 ms-4 -translate-y-1/2 rounded-sm bg-gray-900 px-2 py-1.5 text-xs font-medium text-white group-hover:visible">
        				Logout
      				</span>
    				</a>
  				</div>
				

  			</div>
		</div>

		`;
        this.shadowRoot.appendChild(style);
        // this.content = this.shadowRoot.querySelector("#content");
        this.addEventListeners();
    }
    addEventListeners() {
        var _a, _b, _c, _d, _e;
        const profileLink = (_a = this.shadowRoot) === null || _a === void 0 ? void 0 : _a.querySelector("#profile");
        const boardLink = (_b = this.shadowRoot) === null || _b === void 0 ? void 0 : _b.querySelector("#board");
        const playLink = (_c = this.shadowRoot) === null || _c === void 0 ? void 0 : _c.querySelector("#play");
        const chatLink = (_d = this.shadowRoot) === null || _d === void 0 ? void 0 : _d.querySelector("#chat");
        const friendsLink = (_e = this.shadowRoot) === null || _e === void 0 ? void 0 : _e.querySelector("#friends");
        [profileLink, boardLink, playLink, chatLink, friendsLink].forEach((link) => {
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
                        this.render();
                    }
                });
            }
        });
    }
}
customElements.define("pong-menu", MenuComponent);
