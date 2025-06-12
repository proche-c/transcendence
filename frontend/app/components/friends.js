var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { fetchUserProfile, fetchUsers, fetchFriends } from "../utils/requests.js";
class FriendsComponent extends HTMLElement {
    constructor() {
        super();
        this.user = null;
        this.users = [];
        this.friends = [];
        this.attachShadow({ mode: "open" });
        this.load();
    }
    load() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.getProfile();
            yield this.getFriends();
            yield this.getUsers();
            this.render();
        });
    }
    getProfile() {
        return __awaiter(this, void 0, void 0, function* () {
            this.user = yield fetchUserProfile();
        });
    }
    getUsers() {
        return __awaiter(this, void 0, void 0, function* () {
            this.users = yield fetchUsers();
        });
    }
    getFriends() {
        return __awaiter(this, void 0, void 0, function* () {
            this.friends = yield fetchFriends();
        });
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
					<div class="w-6 h-6 md:w-8 md:h-8 rounded-full overflow-hidden border-1 md:border-2 border-black flex items-center justify-center bg-emerald-200">
						<img src="${avatarUrl}" class="w-full h-full object-cover" />
					</div>
					<button class="friend-button ml-1 flex-1 text-left text-[10px] md:text-[14px]"  data-friendname="${friend.username}">${friend.username}</button>
				</div>
				`;
        }).join("");
        const usersButtons = this.users
            .filter((user) => {
            // Filtramos: no es el mismo que el usuario logueado y no está ya en la lista de amigos
            return user.username !== this.user.username &&
                !this.friends.some((friend) => friend.username === user.username);
        })
            .map((user) => {
            const avatar = user.avatar;
            const avatarUrl = `http://localhost:8000/static/${avatar}`;
            return `
				<div class="flex m-1 ml-3 items center">
					<div class="w-6 h-6 md:w-8 md:h-8 rounded-full overflow-hidden border-1 md:border-2 border-black flex items-center justify-center bg-emerald-200">
						<img src="${avatarUrl}" class="w-full h-full object-cover" />
					</div>
					<button class="user-button ml-1 flex-1 text-left text-[10px] md:text-[14px]" data-username="${user.username}">${user.username}</button>
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
					<div class="flex grow justify-center md:gap-4 h-120 md:h-100">
						<div class=" bg-neutral-100 m-1 rounded-2xl flex flex-col flex-1 max-w-sm border-2 border-violet-600">
							<h2 class="text-center text-[10px] md:text-[14px] border-b-1 border-violet-600 m-1 p-1 font-bold">Friends</h2>
							<div class="flex bg-neutral-50 flex-col flex-grow overflow-y-auto rounded-b-2xl">
							${friendsButtons}
							</div>
						</div>
						<div id="profileCard" class="fixed z-50 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-orange-200"></div>

						<div class=" bg-neutral-100 m-1 rounded-2xl flex flex-col flex-2 max-w-sm border-2 border-violet-600">
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
    addEventListeners() {
        var _a, _b, _c, _d, _e;
        const addButtons = (_a = this.shadowRoot) === null || _a === void 0 ? void 0 : _a.querySelectorAll(".add-button");
        addButtons === null || addButtons === void 0 ? void 0 : addButtons.forEach((button) => {
            button.addEventListener("click", (event) => __awaiter(this, void 0, void 0, function* () {
                const target = event.currentTarget;
                const username = target.getAttribute("name-to-add");
                if (username) {
                    yield this.sendFriendRequest(username);
                    yield this.load();
                }
            }));
        });
        // Listeners para user y friend buttons
        const allProfileButtons = [
            ...(_c = (_b = this.shadowRoot) === null || _b === void 0 ? void 0 : _b.querySelectorAll(".user-button")) !== null && _c !== void 0 ? _c : [],
            ...(_e = (_d = this.shadowRoot) === null || _d === void 0 ? void 0 : _d.querySelectorAll(".friend-button")) !== null && _e !== void 0 ? _e : []
        ];
        allProfileButtons.forEach((button) => {
            button.addEventListener("click", (event) => {
                const target = event.currentTarget;
                const username = target.getAttribute("data-username") || target.getAttribute("data-friendname");
                if (username) {
                    this.showUserProfile(username);
                }
            });
        });
    }
    showUserProfile(username) {
        var _a;
        const profileCard = (_a = this.shadowRoot) === null || _a === void 0 ? void 0 : _a.querySelector("#profileCard");
        if (profileCard) {
            profileCard.innerHTML = "";
            const publicProfile = document.createElement("pong-public-profile");
            publicProfile.setAttribute("username", username);
            profileCard.appendChild(publicProfile);
        }
    }
    sendFriendRequest(username) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log("Entro en sendFriendRequest");
            try {
                const response = yield fetch("http://localhost:8000/users/friends", {
                    method: "POST",
                    headers: {
                        "Content-type": "application/json",
                    },
                    credentials: "include",
                    body: JSON.stringify({ username }),
                });
                const data = yield response.json();
                if (!response.ok) {
                    alert(`Error: ${data.message}`);
                }
            }
            catch (error) {
                console.error("Error sending friend request", error);
                alert("Failed to send ");
            }
        });
    }
}
customElements.define("pong-friends", FriendsComponent);
