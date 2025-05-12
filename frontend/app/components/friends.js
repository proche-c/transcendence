"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
class FriendsComponent extends HTMLElement {
    constructor() {
        super();
        this.responseProfile = null;
        this.responseFriends = null;
        this.responseUsers = null;
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
            // this.updateData();
        });
    }
    getProfile() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield fetch("http://localhost:8000/profile", {
                    method: "GET",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                });
                const data = yield response.json();
                this.user = data.user;
                console.log(this.user);
            }
            catch (error) {
                console.log('Error en la peticion');
            }
        });
    }
    getUsers() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield fetch("http://localhost:8000/users", {
                    method: "GET",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                });
                const data = yield response.json();
                this.users = data;
                console.log(this.users);
            }
            catch (error) {
                console.log('Error en la peticion');
            }
        });
    }
    getFriends() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield fetch("http://localhost:8000/users/friends", {
                    method: "GET",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                });
                const data = yield response.json();
                this.friends = data.friends;
                console.log(this.friends);
            }
            catch (error) {
                console.log('Error en la peticion');
            }
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
            return `<button class="">${friend.username}</button>`;
        }).join("");
        const usersButtons = this.users.map((user) => {
            if (user.username != this.user.username) {
                const avatar = user.avatar;
                const avatarUrl = `http://localhost:8000/static/${avatar}`;
                return `
					<div class="flex m-1">
						<div class="w-8 h-8 rounded-full overflow-hidden border-4 border-black flex items-center justify-center bg-emerald-200">
							<img src="${avatarUrl}" class="w-full h-full object-cover" />
						</div>
						<button class="ml-1">${user.username}</button>
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
					<div class="flex flex-col items-center">
						<div class="w-16 h-16 rounded-full overflow-hidden border-4 border-black flex items-center justify-center bg-emerald-200">
							<img src="${avatarUrl}" class="w-full h-full object-cover" />
						</div>
						<div class="my-1">
							<p>${this.user.username}</p>
						</div>
					</div>
					<div class="flex grow ml-6 gap-4">
						<div class=" bg-neutral-50 m-4 rounded-2xl flex flex-col flex-1 max-w-sm">
							<h2 class="text-center border-b-1 border-violet-600 m-2 p-3">Friends</h2>
							<div class="flex bg-neutral-50 flex-col flex-grow rounded-b-2xl">
							${friendsButtons}
							</div>
						</div>
						<div class=" bg-neutral-50 m-4 rounded-2xl flex flex-col flex-1 max-w-sm">
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
