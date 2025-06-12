import { fetchPublicProfile } from "../utils/requests.js";
import { SERVER_IP } from '../config.js';
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
    async load() {
        await this.getPublicProfile();
        this.render();
        this.updateData();
    }
    async getPublicProfile() {
        this.response = await fetchPublicProfile(this.username);
        console.log("en public profile, imprimo user:");
        console.log(this.response);
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
		
		<div class="relative flex flex-col h-90 w-40 md:h-110 md:w-50 border-2 border-black bg-white">
				<div id="profile-picture" class="w-16 h-16 rounded-full overflow-hidden border-2 border-black flex items-center justify-center my-2 mx-auto">
					<img src="${avatarUrl}" class="w-full h-full object-cover" />
				</div>
				<div id="username" class="font-bold text-center mt-1 md:text-lg">usuario</div>
				
				<div id="rank" class="text-center mt-2 font-bold text-violet-900  md:text-lg">Rank</div>

				<div class="text-xs md:text-base text-center mt-2">Total games: <span id="totalGames" class="font-bold">0</span></div>
				<div class="text-xs md:text-base  text-center mt-2">Total wins: <span id="wins" class="font-bold">0</span></div>
				<div class="text-xs md:text-base  text-center mt-2">Total losses: <span id="losses" class="font-bold">0</span></div>
				<div class="text-xs md:text-base  text-center mt-2">Win rate: <span id="rate" class="font-bold">0</span></div>
				<div class="text-xs md:text-base  text-center mt-2">Goals for: <span id="goalsFor" class="font-bold">0</span></div>
				<div class="text-xs md:text-base  text-center mt-2">Goals against: <span id="goalsAgainst" class="font-bold">0</span></div>
				<div class="m-1 mt-4 flex items-center justify-center">
					<button id="close" class="align-center justify-center rounded-2xl bg-violet-200 px-[1em] py-1 border">
						<p class="text-xs md:text-base  font-semibold text-violet-900 duration-200 group-active:translate-y-[5%]">Close</p>
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
            const fullUsername = this.response.username || "";
            username.innerHTML = fullUsername.length > 10
                ? `${fullUsername.slice(0, 7)}...`
                : fullUsername;
            username.setAttribute("title", fullUsername);
        }
        const profilePicContainer = this.shadowRoot.querySelector("#profile-picture");
        const img = profilePicContainer === null || profilePicContainer === void 0 ? void 0 : profilePicContainer.querySelector("img");
        if (img instanceof HTMLImageElement) {
            const avatar = this.response.avatar || "avatars/default.jpg";
            img.src = `https://${SERVER_IP}:8443/api/static/${avatar}?ts=${Date.now()}`; // Avoid caché
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
