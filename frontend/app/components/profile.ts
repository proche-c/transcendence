// tengo que crear la interfaz data!!!!!!!!!!!!!!!!!


class ProfileComponent extends HTMLElement {
	private response: any | null = null;
	constructor() {
		super();
		this.attachShadow({mode: "open"});
		this.load();
	}

	private async load() {
		await this.getProfile();
		this.render();
		this.updateData();
	}

	private async getProfile() {
		try {
            const response = await fetch("http://localhost:8000/profile", {
                method: "GET",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
            });

			const data = await response.json();
			this.response = data.user;
			console.log(data.user);


		} catch (error: any) {
			console.log('Error en la peticion');
		}
	}

	private render(): void {
		if(!this.shadowRoot)
			return;
		const style = document.createElement("link");
		style.rel = "stylesheet";
		style.href = "./app/tailwind.css"; // Asegúrate de que la ruta sea correcta

		this.shadowRoot.innerHTML = `
			<div class="flex h-screen justify-between">
				<div class="">
					<pong-menu></pong-menu>
				</div>
				<div class="grow h-7/8 my-10 mx-4 w-7/12 flex items-center justify-center">
					<div class="group relative block max-w-screen-sm mx-auto h-80 sm:h-80 lg:h-96">

						<span class="absolute inset-0 border-2 border-dashed border-black"></span>
						<div class="relative flex flex-col h-full w-60 md:w-72 transform border-2 border-black bg-white transition-transform group-hover:scale-105">
							<div class="w-32 h-32 rounded-full overflow-hidden border-4 border-black flex items-center justify-center my-5 mx-auto">
								<img src="./app/avatars/default.jpg" class="w-full h-full object-cover" />
							</div>
							<div id="username" class="text-2xl font-bold text-center mt-4">
							usuario
							</div>
							<div id="email" class="text-xl text-center mt-4">
							email
							</div>
							<div class="absolute p-4 opacity-0 transition-opacity group-hover:relative group-hover:opacity-100 sm:p-6 lg:p-8">
								<h3 class="mt-4 text-xl font-medium sm:text-2xl">Go around the world</h3>
								<p class="mt-4 text-sm sm:text-base">
									Lorem ipsum dolor sit amet consectetur adipisicing elit. Cupiditate,
									praesentium voluptatem omnis atque culpa repellendus.
								</p>
								<p class="mt-8 font-bold">Read more</p>
							</div>
						</div>
					</div>
				</div>
			</div>
		`;

		this.shadowRoot.appendChild(style);
	}

	private updateData(): void {
		if(!this.shadowRoot)
			return;

		const username = this.shadowRoot.querySelector("#username");
		if (username) {
			username.innerHTML = this.response.username;
		}

		const email = this.shadowRoot.querySelector("#email");
		if (email) {
			email.innerHTML = this.response.email;
		}
	}
}

customElements.define("pong-profile", ProfileComponent);