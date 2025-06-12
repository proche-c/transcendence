var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { fetchUserProfile, fetchUsers } from "../utils/requests.js";
class BoardComponent extends HTMLElement {
    constructor() {
        super();
        this.user = null;
        this.user1 = null;
        this.user2 = null;
        this.user3 = null;
        this.users = [];
        this.attachShadow({ mode: "open" });
        this.load();
    }
    load() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.getProfile();
            yield this.getUsers();
            this.user1 = this.getUserRank(1);
            this.user2 = this.getUserRank(2);
            this.user3 = this.getUserRank(3);
            this.render();
            this.updateData();
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
            console.log(this.users);
        });
    }
    getUserRank(rank) {
        const user = this.users.find((user) => user.ranking === rank);
        return user !== null && user !== void 0 ? user : null;
    }
    render() {
        if (!this.shadowRoot)
            return;
        const style = document.createElement("link");
        style.rel = "stylesheet";
        style.href = "./app/tailwind.css"; // Asegúrate de que la ruta sea correcta
        let avatar1 = "";
        let avatar2 = "";
        let avatar3 = "";
        if (this.user1) {
            console.log("user1 is:");
            console.log(this.user1);
            avatar1 = this.user1.avatar;
            // const avatarUrl1 = `http://localhost:8000/static/${avatar1}`;
        }
        if (this.user2) {
            console.log("user2 is:");
            console.log(this.user2);
            avatar2 = this.user2.avatar;
            // const avatarUrl2 = `http://localhost:8000/static/${avatar2}`;
        }
        if (this.user3) {
            console.log("user3 is:");
            console.log(this.user3);
            avatar3 = this.user3.avatar;
            // const avatarUrl3 = `http://localhost:8000/static/${avatar3}`;
        }
        const avatarUrl1 = `http://localhost:8000/static/${avatar1}`;
        const avatarUrl2 = `http://localhost:8000/static/${avatar2}`;
        const avatarUrl3 = `http://localhost:8000/static/${avatar3}`;
        this.shadowRoot.innerHTML = `
		<div class="flex h-screen items-center">
			<div><pong-menu></pong-menu></div>
			<div class="flex flex-col flex-grow h-[87%] mx-auto">
				<pong-header></pong-header>

				<div class="flex grow justify-center w-80 h-96  md:w-[600px] md:h-[400px]  mx-auto gap-1">
					<div class="relative flex flex-col h-32 w-24 md:h-40 md:w-32 mt-8 border-2 border-black bg-white">
						<div id="profile-picture" class="w-8 h-8 md:w-12 md:h-12 rounded-full overflow-hidden border-2 border-black flex items-center justify-center  my-3 mx-auto">
							<img src="${avatarUrl1}" class="w-full h-full object-cover" />
						</div>
						<div id="username1" class="text-xs md:text-base font-bold text-center mt-1">usuario</div>
						<div id="rank" class="text-center text-xs md:text-base  mt-1 font-bold text-violet-900">Rank: 1</div>
					</div>
					<div class="relative flex flex-col h-32 w-24  md:h-40 md:w-32 mt-18 border-2 border-black bg-white">
						<div id="profile-picture" class="w-8 h-8  md:w-12 md:h-12 rounded-full overflow-hidden border-2 border-black flex items-center justify-center my-3 mx-auto">
							<img src="${avatarUrl2}" class="w-full h-full object-cover" />
						</div>
						<div id="username2" class="text-xs md:text-base  font-bold text-center mt-1">usuario</div>
						<div id="rank" class="text-xs md:text-base  text-center mt-1 font-bold text-violet-900">Rank: 2</div>
					</div>

					<div class="relative flex flex-col h-32 w-24 md:h-40 md:w-32 mt-12 border-2 border-black bg-white">
						<div id="profile-picture" class="w-8 h-8  md:w-12 md:h-12 rounded-full overflow-hidden border-2 border-black flex items-center justify-center my-3 mx-auto">
							<img src="${avatarUrl3}" class="w-full h-full object-cover" />
						</div>
						<div id="username3" class="text-xs md:text-base  font-bold text-center mt-1">usuario</div>
						<div id="rank" class="text-xs md:text-base  text-center mt-1 font-bold text-violet-900">Rank: 3</div>
					</div>
				</div>
			</div>		
		</div>
		`;
        this.shadowRoot.appendChild(style);
    }
    updateData() {
        if (!this.shadowRoot)
            return;
        const username1 = this.shadowRoot.querySelector("#username1");
        if (this.user1 && username1) {
            const fullUsername = this.user1.username || "";
            username1.innerHTML = fullUsername.length > 7
                ? `${fullUsername.slice(0, 4)}...`
                : fullUsername;
            username1.setAttribute("title", fullUsername);
        }
        const username2 = this.shadowRoot.querySelector("#username2");
        if (this.user2 && username2) {
            const fullUsername = this.user2.username || "";
            username2.innerHTML = fullUsername.length > 7
                ? `${fullUsername.slice(0, 4)}...`
                : fullUsername;
            username2.setAttribute("title", fullUsername);
        }
        const username3 = this.shadowRoot.querySelector("#username3");
        if (this.user3 && username3) {
            const fullUsername = this.user3.username || "";
            username3.innerHTML = fullUsername.length > 7
                ? `${fullUsername.slice(0, 4)}...`
                : fullUsername;
            username3.setAttribute("title", fullUsername);
        }
    }
}
customElements.define("pong-board", BoardComponent);
