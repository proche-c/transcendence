var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
// tengo que crear la interfaz data!!!!!!!!!!!!!!!!!
import { fetchUserProfile } from "../utils/requests.js";
class ProfileComponent extends HTMLElement {
    constructor() {
        super();
        this.response = null;
        this.attachShadow({ mode: "open" });
        this.load();
    }
    load() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.getProfile();
            this.render();
            this.updateData();
        });
    }
    getProfile() {
        return __awaiter(this, void 0, void 0, function* () {
            this.response = yield fetchUserProfile();
        });
    }
    render() {
        if (!this.shadowRoot)
            return;
        const style = document.createElement("link");
        style.rel = "stylesheet";
        style.href = "./app/tailwind.css"; // Asegúrate de que la ruta sea correcta
        const avatar = this.response.avatar || "avatars/default.jpg";
        const avatarUrl = `http://localhost:8000/static/${avatar}`;
        this.shadowRoot.innerHTML = `
			<div class="flex h-screen justify-between">
				<div class="">
					<pong-menu></pong-menu>
				</div>
				<div class="grow h-7/8 my-10 mx-4 w-7/12 flex items-center justify-center">

					<div class="group relative block max-w-screen-sm mx-auto h-120 lg:h-150">
						<div id="editCard" class="absolute z-50 top-0 left-0 bg-white mt-8 ml-8"></div>
						<span class="absolute inset-0 border-2 border-dashed border-black"></span>
						<div class="relative flex flex-col h-full w-60 md:w-72 transform border-2 border-black bg-white transition-transform group-hover:scale-105">
							<div class="w-32 h-32 rounded-full overflow-hidden border-4 border-black flex items-center justify-center my-5 mx-auto">
								<img src="${avatarUrl}" class="w-full h-full object-cover" />
							</div>
							<div id="username" class="text-2xl font-bold text-center mt-4">
							usuario
							</div>
							<div id="email" class="text-xl text-center mt-4">
							email
							</div>
							<div id="rank" class="text-xl text-center mt-4 font-bold text-violet-900">
							Rank
							</div>


							<div class="absolute p-4 opacity-0 transition-opacity group-hover:relative group-hover:opacity-100 sm:p-6 lg:p-8">
								<div class="text-xl text-center mt-2">
								Total games: <span id="totalGames" class="font-bold">0</span>
								</div>
								<div class="text-xl text-center mt-2">
								Total wins: <span id="wins" class="font-bold">0</span>
								</div>
								<div class="text-xl text-center mt-2">
								Total losses: <span id="losses" class="font-bold">0</span>
								</div>
								<div class="text-xl text-center mt-2 mb-4">
								Win rate: <span id="rate" class="font-bold">0</span>
								</div>
								<div class="text-xl text-center mt-2">
								Goals for: <span id="goalsFor" class="font-bold">0</span>
								</div>
								<div class="text-xl text-center mt-2">
								Goals against: <span id="goalsAgainst" class="font-bold">0</span>
								</div>
								<div class="place-self-start mt-4">
									<button id="edit">
									<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-8">
									<path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
									</svg>
									</button>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		`;
        this.shadowRoot.appendChild(style);
        this.addEventListeners();
    }
    updateData() {
        if (!this.shadowRoot)
            return;
        const username = this.shadowRoot.querySelector("#username");
        if (username) {
            username.innerHTML = this.response.username;
        }
        const email = this.shadowRoot.querySelector("#email");
        if (email) {
            email.innerHTML = this.response.email;
        }
        const rank = this.shadowRoot.querySelector("#rank");
        if (rank) {
            this.response.ranking = this.response.ranking || 1;
            rank.innerHTML = 'Rank: ' + this.response.ranking;
        }
        const totalGames = this.shadowRoot.querySelector("#totalGames");
        if (totalGames) {
            this.response.total_matches = this.response.total_matches || 0;
            totalGames.innerHTML = this.response.total_matches;
        }
        const wins = this.shadowRoot.querySelector("#wins");
        if (wins) {
            this.response.total_wins = this.response.total_wins || 0;
            wins.innerHTML = this.response.total_wins;
        }
        const losses = this.shadowRoot.querySelector("#losses");
        if (losses) {
            this.response.total_losses = this.response.total_losses || 0;
            losses.innerHTML = this.response.total_losses;
        }
        const rate = this.shadowRoot.querySelector("#rate");
        if (rate) {
            let winsRate = 0;
            if (this.response.total_matches > 0) {
                winsRate = this.response.total_wins / this.response.total_matches;
                winsRate = Math.round(winsRate * 100);
            }
            rate.innerHTML = winsRate + '%';
        }
        const goalsFor = this.shadowRoot.querySelector("#goalsFor");
        if (goalsFor) {
            this.response.goals_for = this.response.goals_for || 0;
            goalsFor.innerHTML = this.response.goals_for;
        }
        const goalsAgainst = this.shadowRoot.querySelector("#goalsAgainst");
        if (goalsAgainst) {
            this.response.goals_against = this.response.goals_against || 0;
            goalsAgainst.innerHTML = this.response.goals_against;
        }
    }
    addEventListeners() {
        var _a;
        const editButton = (_a = this.shadowRoot) === null || _a === void 0 ? void 0 : _a.querySelector("#edit");
        if (editButton) {
            editButton.addEventListener("click", () => {
                var _a;
                const editCard = (_a = this.shadowRoot) === null || _a === void 0 ? void 0 : _a.querySelector("#editCard");
                if (editCard) {
                    editCard.innerHTML = "";
                    const editProfile = document.createElement("pong-edit-profile");
                    editProfile.addEventListener("profile-updated", () => __awaiter(this, void 0, void 0, function* () {
                        yield this.getProfile();
                        this.updateData();
                    }));
                    editCard.appendChild(editProfile);
                }
            });
        }
    }
}
customElements.define("pong-profile", ProfileComponent);
