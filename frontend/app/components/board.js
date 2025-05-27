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
        const avatar = this.user.avatar;
        const avatarUrl = `http://localhost:8000/static/${avatar}`;
        this.shadowRoot.innerHTML = `
		<div class="flex h-screen">
			<div><pong-menu></pong-menu></div>
			<div class="flex flex-col w-74">
				<div><pong-header></div>

				<div class="flex flex-col md:flex-row bg-violet-600">

			
					<div class="relative flex flex-col h-100 w-40 mt-8 border-2 border-black bg-white">
						<div id="profile-picture" class="w-16 h-16 rounded-full overflow-hidden border-2 border-black flex items-center justify-center my-2 mx-auto">
							<img src="${avatarUrl}" class="w-full h-full object-cover" />
						</div>
						<div id="username" class="text-xs font-bold text-center mt-2">usuario</div>
						<div id="rank" class="text-center mt-3 font-bold text-violet-900">Rank</div>

							<div class="text-xs text-center mt-2">Total games: <span id="totalGames" class="font-bold">0</span></div>
							<div class="text-center mt-2">Total wins: <span id="wins" class="font-bold">0</span></div>
							<div class="text-center mt-2">Total losses: <span id="losses" class="font-bold">0</span></div>
							<div class="text-center mt-2">Win rate: <span id="rate" class="font-bold">0</span></div>
							<div class="text-center mt-2">Goals for: <span id="goalsFor" class="font-bold">0</span></div>
							<div class="text-center mt-2">Goals against: <span id="goalsAgainst" class="font-bold">0</span></div>
					</div>


					<div class="relative flex flex-col h-100 w-48 mt-8 border-2 border-black bg-white">
						<div id="profile-picture" class="w-24 h-24 rounded-full overflow-hidden border-4 border-black flex items-center justify-center my-3 mx-auto">
							<img src="${avatarUrl}" class="w-full h-full object-cover" />
						</div>
						<div id="username" class="text-xl font-bold text-center mt-2">usuario</div>
						<div id="rank" class="text-l text-center mt-3 font-bold text-violet-900">Rank</div>

							<div class="text-l text-center mt-2">Total games: <span id="totalGames" class="font-bold">0</span></div>
							<div class="text-l text-center mt-2">Total wins: <span id="wins" class="font-bold">0</span></div>
							<div class="text-l text-center mt-2">Total losses: <span id="losses" class="font-bold">0</span></div>
							<div class="text-l text-center mt-2">Win rate: <span id="rate" class="font-bold">0</span></div>
							<div class="text-l text-center mt-2">Goals for: <span id="goalsFor" class="font-bold">0</span></div>
							<div class="text-l text-center mt-2">Goals against: <span id="goalsAgainst" class="font-bold">0</span></div>
					</div>

					<div class="relative flex flex-col h-100 w-48 mt-8 border-2 border-black bg-white">
						<div id="profile-picture" class="w-24 h-24 rounded-full overflow-hidden border-4 border-black flex items-center justify-center my-3 mx-auto">
							<img src="${avatarUrl}" class="w-full h-full object-cover" />
						</div>
						<div id="username" class="text-xl font-bold text-center mt-2">usuario</div>
						<div id="rank" class="text-l text-center mt-3 font-bold text-violet-900">Rank</div>

							<div class="text-l text-center mt-2">Total games: <span id="totalGames" class="font-bold">0</span></div>
							<div class="text-l text-center mt-2">Total wins: <span id="wins" class="font-bold">0</span></div>
							<div class="text-l text-center mt-2">Total losses: <span id="losses" class="font-bold">0</span></div>
							<div class="text-l text-center mt-2">Win rate: <span id="rate" class="font-bold">0</span></div>
							<div class="text-l text-center mt-2">Goals for: <span id="goalsFor" class="font-bold">0</span></div>
							<div class="text-l text-center mt-2">Goals against: <span id="goalsAgainst" class="font-bold">0</span></div>
					</div>

				
				</div>


			</div>
		
		
		
		
		
		
		
		</div>
		`;
        this.shadowRoot.appendChild(style);
    }
}
customElements.define("pong-board", BoardComponent);
