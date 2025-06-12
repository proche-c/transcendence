import { fetchUserProfile, fetchUsers, fetchFriends, User } from "../utils/requests.js";
import { SERVER_IP } from '../config.js';


class FriendsComponent extends HTMLElement {
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
	}

	private async getProfile() {
		this.user = await fetchUserProfile();
	}

	private async getUsers() {
		this.users = await fetchUsers();
	}

	private async getFriends() {
		this.friends = await fetchFriends();
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
		const avatarUrl = `https://${SERVER_IP}:8443/api/static/${avatar}`;

		const friendsButtons = this.friends.map((friend: User) => {
			const avatar = friend.avatar;
			const avatarUrl = `https://${SERVER_IP}:8443/api/static/${avatar}`;
			const displayName = friend.username.length > 7 ? friend.username.slice(0, 4) + "..." : friend.username;
			return `
				<div class="flex m-1 ml-3 items center">
					<div class="w-6 h-6 md:w-8 md:h-8 rounded-full overflow-hidden border-1 md:border-2 border-black flex items-center justify-center bg-emerald-200">
						<img src="${avatarUrl}" class="w-full h-full object-cover" />
					</div>
					<button class="friend-button ml-1 flex-1 text-left text-[10px] md:text-[14px]" data-friendname="${friend.username}">${displayName}</button>
				</div>
			`;
		}).join("");

		const usersButtons = this.users
		.filter((user: User) => {
			// Filtramos: no es el mismo que el usuario logueado y no está ya en la lista de amigos
			return user.username !== this.user.username &&
				!this.friends.some((friend: User) => friend.username === user.username);
		})
		.map((user: User) => {
			const avatar = user.avatar;
			const avatarUrl = `https://${SERVER_IP}:8443/api/static/${avatar}`;
			const displayName = user.username.length > 7 ? user.username.slice(0, 4) + "..." : user.username;
			return `
				<div class="flex m-1 ml-3 items center">
					<div class="w-6 h-6 md:w-8 md:h-8 rounded-full overflow-hidden border-1 md:border-2 border-black flex items-center justify-center bg-emerald-200">
						
					
					</div>
					<button class="user-button ml-1 flex-1 text-left text-[10px] md:text-[14px]" data-username="${user.username}">${displayName}</button>
					<div class="ml-auto flex items-center space-x-1">
						<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1" stroke="currentColor" class="size-6">
						<path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
						</svg>
						<button class="add-button text-[10px] md:text-[14px] text-green-700 font-bold italic" name-to-add="${user.username}">Add friend</button>
					</div>
				</div>
			`;
		})
		.join("");
	

		this.shadowRoot.innerHTML = `
			<div class="flex h-screen items-center">
				<div>
					<pong-menu></pong-menu>
				</div>
				<div class="flex flex-col flex-grow h-[87%]">
					<pong-header></pong-header>
					<div class="flex grow justify-center md:gap-4 w-80 h-96  md:w-[600px] md:h-[400px] mx-auto">
						<div class=" bg-neutral-100 m-1 rounded-2xl flex flex-col flex-1 max-w-sm border-2 border-violet-600">
							<h2 class="text-center text-[10px] md:text-[14px] border-b-1 border-violet-600 m-1 p-1 font-bold">Friends</h2>
							<div class="flex bg-neutral-50 flex-col flex-grow overflow-y-auto rounded-b-2xl">
							${friendsButtons}
							</div>
						</div>
						<div id="profileCard" class="fixed z-50 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"></div>

						<div class=" bg-neutral-100 m-1 rounded-2xl flex flex-col flex-2 max-w-sm border-2 border-violet-600 overflow-auto">
							<h2 class="text-center text-[10px] md:text-[14px] border-b-1 border-violet-600 m-1 p-1 font-bold">Users</h2>
							<div class="flex bg-neutral-50 flex-col flex-grow overflow-y-auto rounded-b-2xl px-2">
							${usersButtons}
							</div>
						</div>

					</div>
				</div>
			</div>
		`;

		this.shadowRoot.appendChild(style);
		this.addEventListeners();
	}

	private addEventListeners() {
		const addButtons = this.shadowRoot?.querySelectorAll(".add-button");
		addButtons?.forEach((button) => {
			button.addEventListener("click", async (event) => {
				const target = event.currentTarget as HTMLElement;
				const username = target.getAttribute("name-to-add");
				if (username) {
					await this.sendFriendRequest(username);
					await this.load();
				}
			});
		});
	
		// Listeners para user y friend buttons
		const allProfileButtons = [
			...this.shadowRoot?.querySelectorAll(".user-button") ?? [],
			...this.shadowRoot?.querySelectorAll(".friend-button") ?? []
		];
	
		allProfileButtons.forEach((button) => {
			button.addEventListener("click", (event) => {
				const target = event.currentTarget as HTMLElement;
				const username = target.getAttribute("data-username") || target.getAttribute("data-friendname");
				if (username) {
					this.showUserProfile(username);
				}
			});
		});
	}

	private showUserProfile(username: string): void {
		const profileCard = this.shadowRoot?.querySelector("#profileCard");
		if (profileCard) {
			profileCard.innerHTML = "";
			const publicProfile = document.createElement("pong-public-profile");
			publicProfile.setAttribute("username", username);
			profileCard.appendChild(publicProfile);
		}
	}

	private async sendFriendRequest(username: string) {
		console.log("Entro en sendFriendRequest");
		try {
			const response = await fetch(`https://${SERVER_IP}:8443/api/users/friends`, {
				method: "POST",
				headers: {
					"Content-type": "application/json",
				},
				credentials: "include",
				body: JSON.stringify({username}),
			});

			const data = await response.json();
			if (response.ok) {
				alert(`Friend request sent to ${username}`);
			} else {
				alert(`Error: ${data.message}`);
			}
		} catch(error: any) {
			console.error("Error sending friend request", error);
			alert("Failed to send ")
		}
	}

}

customElements.define("pong-friends", FriendsComponent);