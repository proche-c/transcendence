// tengo que crear la interfaz data!!!!!!!!!!!!!!!!!
interface User	{
	id: number;
	username: string;
	avatar: string;
}


class FriendsComponent extends HTMLElement {
	private responseProfile: any | null = null;
	private responseFriends: any | null = null;
	private responseUsers: any | null = null;
	private user: User | any | null = null;
	private users: Array<User> = [];
	private friends: Array<User> = [];
	constructor() {
		super();
		this.attachShadow({mode: "open"});
		this.load();
	}

	private async load() {
		await this.getProfile();
		await this.getFriends();
		await this.getUsers();
		this.render();
		// this.updateData();
	}

	private async getProfile() {
		try {
            const response = await fetch("http://localhost:8000/profile", {
                method: "GET",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
            });

			const data = await response.json();
			this.user = data.user;
			console.log(this.user);


		} catch (error: any) {
			console.log('Error en la peticion');
		}
	}

	private async getUsers() {
		try {
            const response = await fetch("http://localhost:8000/users", {
                method: "GET",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
            });

			const data = await response.json();
			this.users = data;
			console.log(this.users);


		} catch (error: any) {
			console.log('Error en la peticion');
		}
	}

	private async getFriends() {
		try {
            const response = await fetch("http://localhost:8000/users/friends", {
                method: "GET",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
            });

			const data = await response.json();
			this.friends = data.friends;
			console.log(this.friends);


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

		console.log("El user es :");
		console.log(this.user);

		const avatar = this.user.avatar;
		const avatarUrl = `http://localhost:8000/static/${avatar}`;

		const friendsButtons = this.friends.map((friend: User) => {
			return `<button class="">${friend.username}</button>`;
		}).join("");

		const usersButtons = this.users.map((user: User) => {
			if (user.username != this.user.username) {
				const avatar = user.avatar;
				const avatarUrl = `http://localhost:8000/static/${avatar}`;
				return `
					<div class="flex m-1 ml-3">
						<div class="w-8 h-8 rounded-full overflow-hidden border-2 border-black flex items-center justify-center bg-emerald-200">
							<img src="${avatarUrl}" class="w-full h-full object-cover" />
						</div>
						<button class="user-boton ml-1" data-username="${user.username}">${user.username}</button>
					</div>
					`;
			} else
				return null;
		}).join("");

		this.shadowRoot.innerHTML = `
			<div class="flex h-screen items-center">
				<div>
					<pong-menu></pong-menu>
				</div>
				<div class="flex flex-col w-3/4 h-7/8">
					<div class="flex flex-col items-center">
						<div class="w-16 h-16 rounded-full overflow-hidden border-4 border-black flex items-center justify-center bg-emerald-200">
							<img src="${avatarUrl}" class="w-full h-full object-cover" />
						</div>
						<div class="my-1">
							<p>${this.user.username}</p>
						</div>
					</div>
					<div class="flex grow ml-6 gap-4">
						<div class=" bg-neutral-50 m-4 rounded-2xl flex flex-col flex-1 max-w-sm border-2 border-violet-600">
							<h2 class="text-center border-b-1 border-violet-600 m-2 p-3">Friends</h2>
							<div class="flex bg-neutral-50 flex-col flex-grow rounded-b-2xl">
							${friendsButtons}
							</div>
						</div>
						<div class=" bg-neutral-50 m-4 rounded-2xl flex flex-col flex-1 max-w-sm border-2 border-violet-600">
							<h2 class="text-center border-b-1 border-violet-600 m-2 p-3">Users</h2>
							<div class="flex bg-neutral-50 flex-col flex-grow rounded-b-2xl">
							${usersButtons}
							</div>
						</div>

					</div>
				</div>
			</div>
		`;

		this.shadowRoot.appendChild(style);
	}

}

customElements.define("pong-friends", FriendsComponent);