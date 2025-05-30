var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { fetchPublicProfile } from "../utils/requests.js";
class PublicProfileComponent extends HTMLElement {
    constructor() {
        super();
        this.username = null;
        this.response = null;
        this.attachShadow({ mode: "open" });
    }
    connectedCallback() {
        this.username = this.getAttribute("username");
        this.load();
    }
    load() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.getPublicProfile();
            this.render();
            this.updateData();
        });
    }
    getPublicProfile() {
        return __awaiter(this, void 0, void 0, function* () {
            this.response = yield fetchPublicProfile(this.username);
            console.log("en public profile, imprimo user:");
            console.log(this.response);
        });
    }
    render() {
        if (!this.shadowRoot)
            return;
        const style = document.createElement("link");
        style.rel = "stylesheet";
        style.href = "./app/tailwind.css"; // Asegúrate de que la ruta sea correcta
        const avatar = this.response.avatar;
        const avatarUrl = `https://${SERVER_IP}:8443/api/static/${avatar}`;
        this.shadowRoot.innerHTML = `
			<div class="group relative block max-w-screen-sm mx-auto h-120 lg:h-150">
				<span class="absolute inset-0 border-2 border-dashed border-black"></span>
				<div class="relative flex flex-col h-full w-60 md:w-72 transform border-2 border-black bg-white transition-transform group-hover:scale-105">
					<div id="profile-picture" class="w-32 h-32 rounded-full overflow-hidden border-4 border-black flex items-center justify-center my-5 mx-auto">
						<img src="${avatarUrl}" class="w-full h-full object-cover" />
					</div>
					<div id="username" class="text-2xl font-bold text-center mt-4">usuario</div>
					<div id="rank" class="text-xl text-center mt-4 font-bold text-violet-900">Rank</div>

						<div class="text-xl text-center mt-2">Total games: <span id="totalGames" class="font-bold">0</span></div>
						<div class="text-xl text-center mt-2">Total wins: <span id="wins" class="font-bold">0</span></div>
						<div class="text-xl text-center mt-2">Total losses: <span id="losses" class="font-bold">0</span></div>
						<div class="text-xl text-center mt-2 mb-4">Win rate: <span id="rate" class="font-bold">0</span></div>
						<div class="text-xl text-center mt-2">Goals for: <span id="goalsFor" class="font-bold">0</span></div>
						<div class="text-xl text-center mt-2">Goals against: <span id="goalsAgainst" class="font-bold">0</span></div>
						<div class="mt-4">
				<button id="close" class="align-center justify-center rounded-2xl bg-violet-200 px-[1em] py-1 border">
					<p class="font-semibold text-violet-900 duration-200 group-active:translate-y-[5%]">Close</p>
				</button>
						</div>
				</div>
			</div>

		`;
        this.shadowRoot.appendChild(style);
        this.addEventListeners();
    }
    addEventListeners() {
        var _a;
        const closeButton = (_a = this.shadowRoot) === null || _a === void 0 ? void 0 : _a.querySelector("#close");
        if (closeButton) {
            closeButton.addEventListener("click", () => {
                this.remove(); // Elimina el componente del DOM
            });
        }
    }
    updateData() {
        if (!this.shadowRoot)
            return;
        const username = this.shadowRoot.querySelector("#username");
        if (username) {
            username.innerHTML = this.response.username;
        }
        const profilePicContainer = this.shadowRoot.querySelector("#profile-picture");
        const img = profilePicContainer === null || profilePicContainer === void 0 ? void 0 : profilePicContainer.querySelector("img");
        if (img instanceof HTMLImageElement) {
            const avatar = this.response.avatar || "avatars/default.jpg";
            img.src = `http://localhost:8000/static/${avatar}?ts=${Date.now()}`; // Avoid caché
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
}
customElements.define("pong-public-profile", PublicProfileComponent);
