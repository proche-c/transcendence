// tengo que crear la interfaz data!!!!!!!!!!!!!!!!!
import { fetchUserProfile, fetchUsers, fetchFriends } from "../utils/requests.js";
// interface User	{
// 	id: number;
// 	username: string;
// 	avatar: string;
// }
class FriendsComponent extends HTMLElement {
    constructor() {
        super();
        this.user = null;
        this.users = [];
        this.friends = [];
        this.attachShadow({ mode: "open" });
        this.load();
    }
    async load() {
        await this.getProfile();
        await this.getFriends();
        await this.getUsers();
        this.render();
        // this.updateData();
    }
    async getProfile() {
        this.user = await fetchUserProfile();
        console.log("user:");
        console.log(this.user);
    }
    async getUsers() {
        this.users = await fetchUsers();
        console.log(this.users);
    }
    async getFriends() {
        this.friends = await fetchFriends();
        console.log("friends:");
        console.log(this.friends);
    }
    render() {
        if (!this.shadowRoot)
            return;
        const style = document.createElement("link");
        style.rel = "stylesheet";
        style.href = "./app/tailwind.css"; // Asegúrate de que la ruta sea correcta
        console.log("El user es :");
        console.log(this.user);
        const avatar = this.user.avatar;
        const avatarUrl = `http://localhost:8000/static/${avatar}`;
        const friendsButtons = this.friends.map((friend) => {
            const avatar = friend.avatar;
            const avatarUrl = `http://localhost:8000/static/${avatar}`;
            return `
				<div class="flex m-1 ml-3 items center">
					<div class="w-8 h-8 rounded-full overflow-hidden border-2 border-black flex items-center justify-center bg-emerald-200">
						<img src="${avatarUrl}" class="w-full h-full object-cover" />
					</div>
					<button class="friend-button ml-1 flex-1 text-left "  data-friendname="${friend.username}">${friend.username}</button>
				</div>
				`;
        }).join("");
        const usersButtons = this.users.map((user) => {
            if (user.username != this.user.username) {
                const avatar = user.avatar;
                const avatarUrl = `http://localhost:8000/static/${avatar}`;
                return `
					<div class="flex m-1 ml-3 items center">
						<div class="w-8 h-8 rounded-full overflow-hidden border-2 border-black flex items-center justify-center bg-emerald-200">
							<img src="${avatarUrl}" class="w-full h-full object-cover" />
						</div>
						<button class="user-button ml-1 flex-1 text-left" data-username="${user.username}">${user.username}</button>
						<div class="ml-auto flex items-center space-x-1">
							<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1" stroke="currentColor" class="size-6">
							<path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
							</svg>
							<button class="add-button text-xs text-green-700 font-bold italic" name-to-add="${user.username}">Add friend</button>
						</div>
					</div>
					`;
            }
            else
                return null;
        }).join("");
        this.shadowRoot.innerHTML = `
			<div class="flex h-screen items-center">
				<div>
					<pong-menu></pong-menu>
				</div>
				<div class="flex flex-col w-3/4 h-7/8">
					<div id="profileCard" class="absolute z-50 top-0 left-0 bg-white mt-8 ml-8"></div>
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
							<div class="flex bg-neutral-50 flex-col flex-grow rounded-b-2xl px-2">
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
    addEventListeners() {
        var _a, _b;
        console.log("Entro en addEventListeners");
        const addButtons = (_a = this.shadowRoot) === null || _a === void 0 ? void 0 : _a.querySelectorAll(".add-button");
        addButtons === null || addButtons === void 0 ? void 0 : addButtons.forEach((button) => {
            button.addEventListener("click", async (event) => {
                const target = event.currentTarget;
                const username = target.getAttribute("name-to-add");
                console.log(`username: $(username)`);
                if (username) {
                    await this.sendFriendRequest(username);
                }
            });
        });
        const userButtons = (_b = this.shadowRoot) === null || _b === void 0 ? void 0 : _b.querySelectorAll(".user-button");
        userButtons === null || userButtons === void 0 ? void 0 : userButtons.forEach((button) => {
            button.addEventListener("click", async (event) => {
                var _a;
                const target = event.currentTarget;
                const username = target.getAttribute("data-username");
                console.log(`Username: ${username}`);
                if (username) {
                    const profileCard = (_a = this.shadowRoot) === null || _a === void 0 ? void 0 : _a.querySelector("#profileCard");
                    if (profileCard) {
                        profileCard.innerHTML = "";
                        const publicProfile = document.createElement("pong-public-profile");
                        publicProfile.setAttribute("username", username);
                        profileCard.appendChild(publicProfile);
                    }
                }
            });
        });
    }
    async sendFriendRequest(username) {
        console.log("Entro en sendFriendRequest");
        try {
            const response = await fetch("http://localhost:8000/users/friends", {
                method: "POST",
                headers: {
                    "Content-type": "application/json",
                },
                credentials: "include",
                body: JSON.stringify({ username }),
            });
            const data = await response.json();
            if (response.ok) {
                alert(`Friend request sent to ${username}`);
            }
            else {
                alert(`Error: ${data.message}`);
            }
        }
        catch (error) {
            console.error("Error sending friend request", error);
            alert("Failed to send ");
        }
    }
}
customElements.define("pong-friends", FriendsComponent);
