var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { fetchUserProfile } from "../utils/requests.js";
class EditProfileComponent extends HTMLElement {
    constructor() {
        super();
        this.response = null;
        this.twofaEnabled = false;
        this.attachShadow({ mode: "open" });
        this.load();
    }
    load() {
        return __awaiter(this, void 0, void 0, function* () {
            console.log("Cargando edit profile");
            yield this.getProfile();
            this.render();
        });
    }
    getProfile() {
        return __awaiter(this, void 0, void 0, function* () {
            this.response = yield fetchUserProfile();
            const twofaStatus = yield fetch("http://localhost:8000/2fa/status", {
                credentials: "include",
            });
            const data = yield twofaStatus.json();
            this.twofaEnabled = data.enabled;
        });
    }
    render() {
        if (!this.shadowRoot)
            return;
        const style = document.createElement("link");
        style.rel = "stylesheet";
        style.href = "./app/tailwind.css"; // Asegúrate de que la ruta sea correcta
        const avatar = this.response.avatar;
        const avatarUrl = `http://localhost:8000/static/${avatar}`;
        this.shadowRoot.innerHTML = `
			<div class="relative flex flex-col h-full w-60 md:w-72 transform border-2 border-black bg-white transition-transform group-hover:scale-105 ">
                <div class="relative group w-32 h-32 rounded-full overflow-hidden border-4 border-black flex items-center justify-center my-5 mx-auto">
                    <img id="avatar" src="${avatarUrl}" class="w-full h-full object-cover" />
					<button id="uploadImg" class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 border-2 border-black rounded-full p-2 bg-white/20 backdrop-blur-sm hover:bg-white/80 transition">
						<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-16">
						<path stroke-linecap="round" stroke-linejoin="round" d="M12 16.5V9.75m0 0 3 3m-3-3-3 3M6.75 19.5a4.5 4.5 0 0 1-1.41-8.775 5.25 5.25 0 0 1 10.233-2.33 3 3 0 0 1 3.758 3.848A3.752 3.752 0 0 1 18 19.5H6.75Z" />
						</svg>
					</button>
					<input type="file" id="fileInput" accept=".jpg,.jpeg,.png" class="hidden" />
                </div>

				<div class="text-2xl font-bold text-center mt-4">
					<input type="text" id="username" placeholder="Type new username" value="${this.response.username}" class="border rounded-lg px-3 py-2 mt-1 mx-5 mb-5 text-sm bg-gray-200 focus:border-violet-900 focus:ring-4 focus:ring-violet-900"/>
				</div>
				<div class="flex items-center justify-center gap-3 mb-5">
					<input type="checkbox" id="2fa-checkbox" ${this.twofaEnabled ? "checked" : ""}>

					<label for="2fa-checkbox" class="text-sm font-medium text-gray-700">Two-Factor Authentication</label>
				</div>
				<div class="flex justify-center items-center gap-12 h-full mb-4">
				<button id="exit" class="group flex h-fit w-fit flex-col items-center justify-center rounded-2xl bg-violet-200 px-[1em] py-1 border">
					<p class="font-semibold text-violet-900 duration-200 group-active:translate-y-[5%]">Exit</p>
				</button>
				<button id="save" class="group flex h-fit w-fit flex-col items-center justify-center rounded-2xl bg-violet-200 px-[1em] py-1 border">
					<p class="font-semibold text-violet-900 duration-200 group-active:translate-y-[5%]">Save</p>
				</button>
				</div>
			</div>

		`;
        this.shadowRoot.appendChild(style);
        this.addEventListeners();
    }
    addEventListeners() {
        var _a, _b, _c, _d, _e, _f, _g;
        const uploadImg = (_a = this.shadowRoot) === null || _a === void 0 ? void 0 : _a.querySelector("#uploadImg");
        const fileInput = (_b = this.shadowRoot) === null || _b === void 0 ? void 0 : _b.querySelector("#fileInput");
        const avatarImg = (_c = this.shadowRoot) === null || _c === void 0 ? void 0 : _c.querySelector("#avatar");
        const exitButton = (_d = this.shadowRoot) === null || _d === void 0 ? void 0 : _d.querySelector("#exit");
        const saveButton = (_e = this.shadowRoot) === null || _e === void 0 ? void 0 : _e.querySelector("#save");
        const usernameInput = (_f = this.shadowRoot) === null || _f === void 0 ? void 0 : _f.querySelector("#username");
        const twofaCheckbox = (_g = this.shadowRoot) === null || _g === void 0 ? void 0 : _g.querySelector("#2fa-checkbox");
        if (exitButton) {
            exitButton.addEventListener("click", () => {
                this.remove(); // Ferme le composant
            });
        }
        if (uploadImg && fileInput && avatarImg) {
            uploadImg.addEventListener("click", () => {
                fileInput.click();
            });
            fileInput.addEventListener("change", (e) => __awaiter(this, void 0, void 0, function* () {
                var _a;
                const file = (_a = e.target.files) === null || _a === void 0 ? void 0 : _a[0];
                if (!file)
                    return;
                const validTypes = ["image/jpeg", "image/jpg", "image/png"];
                if (!validTypes.includes(file.type)) {
                    alert("Only JPG or PNG allowed.");
                    return;
                }
                const tempUrl = URL.createObjectURL(file);
                avatarImg.src = tempUrl;
            }));
        }
        if (saveButton && fileInput && usernameInput) {
            saveButton.addEventListener("click", () => __awaiter(this, void 0, void 0, function* () {
                var _a;
                let username = usernameInput.value.trim();
                if (username === this.response.username)
                    username = "";
                const file = (_a = fileInput.files) === null || _a === void 0 ? void 0 : _a[0];
                const formData = new FormData();
                formData.append("username", username);
                if (file)
                    formData.append("avatar", file);
                try {
                    const response = yield fetch("http://localhost:8000/edit-profile", {
                        method: "POST",
                        body: formData,
                        credentials: "include",
                    });
                    if (response.ok) {
                        console.log("Profile updated.");
                        this.dispatchEvent(new CustomEvent("profile-updated", { bubbles: true }));
                        this.remove();
                    }
                    else {
                        const errorData = yield response.json();
                        console.error(errorData.message || "Error saving changes");
                    }
                }
                catch (error) {
                    console.error("Error uploading profile", error);
                }
            }));
        }
        // ✅ 2FA logic
        if (twofaCheckbox) {
            twofaCheckbox.addEventListener("change", () => __awaiter(this, void 0, void 0, function* () {
                var _a;
                if (twofaCheckbox.checked) {
                    try {
                        const response = yield fetch("http://localhost:8000/2fa/setup", {
                            method: "POST",
                            credentials: "include",
                        });
                        const data = yield response.json();
                        // Création de la modale
                        const modal = document.createElement("div");
                        modal.className = "fixed inset-0 bg-black/50 flex items-center justify-center z-50";
                        modal.innerHTML = `
							<div class="bg-white p-6 rounded-xl shadow-xl text-center w-80">
								<h2 class="text-lg font-bold mb-3">Setup Two-Factor Authentication</h2>
								<img src="${data.qrCode}" alt="QR Code" class="w-32 h-32 mx-auto mb-3"/>
								<p class="text-sm mb-2">Scan the QR code with Google Authenticator</p>
								<input id="totp-code" type="text" placeholder="Enter 6-digit code" maxlength="6"
									class="w-full border border-gray-300 rounded px-3 py-2 mb-4 focus:ring-2 focus:ring-violet-700 outline-none"/>
								<div class="flex justify-around">
									<button id="cancel-2fa" class="bg-gray-200 hover:bg-gray-300 text-sm px-4 py-2 rounded">Cancel</button>
									<button id="confirm-2fa" class="bg-violet-500 hover:bg-violet-600 text-white text-sm px-4 py-2 rounded">Verify</button>
								</div>
							</div>
						`;
                        (_a = this.shadowRoot) === null || _a === void 0 ? void 0 : _a.appendChild(modal);
                        const confirmBtn = modal.querySelector("#confirm-2fa");
                        const cancelBtn = modal.querySelector("#cancel-2fa");
                        const input = modal.querySelector("#totp-code");
                        cancelBtn.addEventListener("click", () => {
                            modal.remove();
                            twofaCheckbox.checked = false;
                        });
                        confirmBtn.addEventListener("click", () => __awaiter(this, void 0, void 0, function* () {
                            const token = input.value.trim();
                            if (token.length !== 6) {
                                alert("Enter a valid 6-digit code.");
                                return;
                            }
                            const verifyResponse = yield fetch("http://localhost:8000/2fa/verify", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                credentials: "include",
                                body: JSON.stringify({ token }),
                            });
                            if (!verifyResponse.ok) {
                                alert("Invalid code. 2FA not enabled.");
                                twofaCheckbox.checked = false;
                            }
                            else {
                                alert("2FA enabled successfully!");
                            }
                            modal.remove();
                        }));
                    }
                    catch (err) {
                        alert("Error setting up 2FA.");
                        twofaCheckbox.checked = false;
                    }
                }
                else {
                    const confirmDisable = confirm("Are you sure you want to disable 2FA?");
                    if (!confirmDisable) {
                        twofaCheckbox.checked = true;
                        return;
                    }
                    try {
                        const response = yield fetch("http://localhost:8000/2fa/disable", {
                            method: "POST",
                            credentials: "include",
                        });
                        if (!response.ok) {
                            alert("Failed to disable 2FA.");
                            twofaCheckbox.checked = true;
                            return;
                        }
                        alert("2FA disabled.");
                    }
                    catch (err) {
                        alert("Error disabling 2FA.");
                        twofaCheckbox.checked = true;
                    }
                }
            }));
        }
    }
}
customElements.define("pong-edit-profile", EditProfileComponent);
