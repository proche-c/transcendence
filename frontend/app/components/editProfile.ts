import { fetchUserProfile } from "../utils/requests.js";
import { SERVER_IP } from '../config.js';

class EditProfileComponent extends HTMLElement {
	private response: any | null = null;
	constructor() {
		super();
		this.attachShadow({mode: "open"});
		this.load();
	}

	private async load() {
		console.log("Cargando edit profile");
		await this.getProfile();
		this.render();
	}

	private async getProfile() {
		this.response = await fetchUserProfile();
	}

	private render(): void {
		if(!this.shadowRoot)
			return;
		const style = document.createElement("link");
		style.rel = "stylesheet";
		style.href = "./app/tailwind.css";

		const avatar = this.response.avatar;
		const avatarUrl = avatar && avatar.startsWith('/static/') 
        ? `https://${SERVER_IP}:8443/api${avatar}`
        : `https://${SERVER_IP}:8443/api/static/${avatar}`;

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
					<input type="checkbox" id="twofa-checkbox" ${this.response.twofa ? "checked" : ""} class="w-5 h-5 text-violet-900 border-gray-300 rounded focus:ring-violet-900">
					<label for="twofa-checkbox" autocomplete="one-time-code" class="text-sm font-medium text-gray-700">Two-Factor Authentication</label>
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

	// QR Code generation and modal display
	private showQrModal(qrCodeDataUrl: string): Promise<string | null> {
	return new Promise((resolve) => {
		const modal = document.createElement("div");
		modal.className = "fixed top-0 left-0 w-full h-full bg-black/60 flex items-center justify-center z-50";

		modal.innerHTML = `
			<div class="bg-white p-6 rounded-lg shadow-lg text-center max-w-sm w-full">
				<h2 class="text-lg font-bold mb-4">Scan this QR Code</h2>
				<img src="${qrCodeDataUrl}" alt="QR Code" class="mx-auto mb-4 max-h-64"/>
				<input type="text" id="qr-code-input" autocomplete="off" placeholder="Enter 6-digit code" class="border px-4 py-2 rounded w-full mb-4 text-center" />
				<div class="flex justify-center gap-4">
					<button id="qr-cancel" class="bg-gray-300 px-4 py-2 rounded">Cancel</button>
					<button id="qr-confirm" class="bg-violet-500 text-white px-4 py-2 rounded">Confirm</button>
				</div>
			</div>
		`;

		document.body.appendChild(modal);

		const input = modal.querySelector("#qr-code-input") as HTMLInputElement;
		input.value = ""; // Clear input field initially
		const cancel = modal.querySelector("#qr-cancel") as HTMLButtonElement;
		const confirm = modal.querySelector("#qr-confirm") as HTMLButtonElement;

		cancel.addEventListener("click", () => {
			modal.remove();
			resolve(null);
		});

		confirm.addEventListener("click", () => {
			const value = input.value.trim();
			modal.remove();
			resolve(value || null);
		});
	});
}

//password check for 2FA disable
private askPassword(): Promise<string | null> {
  return new Promise((resolve) => {
    const modal = document.createElement("div");
    modal.className = "fixed top-0 left-0 w-full h-full bg-black/60 flex items-center justify-center z-50";

    modal.innerHTML = `
      <div class="bg-white p-6 rounded-lg shadow-lg text-center max-w-sm w-full">
        <h2 class="text-lg font-bold mb-4">Enter your password to disable 2FA</h2>
        <input type="password" id="password-input" autocomplete="current-password" placeholder="Password" class="border px-4 py-2 rounded w-full mb-4 text-center" />
        <div class="flex justify-center gap-4">
          <button id="cancel" class="bg-gray-300 px-4 py-2 rounded">Cancel</button>
          <button id="confirm" class="bg-red-500 text-white px-4 py-2 rounded">Confirm</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    const input = modal.querySelector("#password-input") as HTMLInputElement;
    const cancel = modal.querySelector("#cancel") as HTMLButtonElement;
    const confirm = modal.querySelector("#confirm") as HTMLButtonElement;

    cancel.addEventListener("click", () => {
      modal.remove();
      resolve(null);
    });

    confirm.addEventListener("click", () => {
      const pwd = input.value.trim();
      modal.remove();
      resolve(pwd || null);
    });
  });
}




	private addEventListeners(): void {
		const uploadImg = this.shadowRoot?.querySelector("#uploadImg") as HTMLButtonElement;
		const fileInput = this.shadowRoot?.querySelector("#fileInput") as HTMLInputElement;
		const avatarImg = this.shadowRoot?.querySelector("#avatar") as HTMLImageElement;
		const exitButton = this.shadowRoot?.querySelector("#exit") as HTMLButtonElement;
		const saveButton = this.shadowRoot?.querySelector("#save") as HTMLButtonElement;
		const usernameInput = this.shadowRoot?.querySelector("#username") as HTMLInputElement;
		const twofaCheckbox = this.shadowRoot?.querySelector("#twofa-checkbox") as HTMLInputElement;


		if (exitButton) {
			exitButton.addEventListener("click", () => {
				this.remove(); // destroy the component
			});
		}

		if (uploadImg && fileInput && avatarImg) {
			uploadImg.addEventListener("click", () => {
				fileInput.click();
			});
			fileInput.addEventListener("change", async (e: Event) => {
				const file = (e.target as HTMLInputElement).files?.[0];
				if (!file)
					return ;
				const validTypes = ["image/jpeg", "image/jpg", "image/png"];
				if (!validTypes.includes(file.type)) {
					alert("Only JPG or PNG.");
					return;
				}
				const tempUrl = URL.createObjectURL(file);
				avatarImg.src = tempUrl;
			});
		}

		if (saveButton && fileInput && usernameInput) {
			saveButton.addEventListener("click", async () => {
				let username = usernameInput.value.trim();
				if (username === this.response.username)
				  username = "";
			  
				const file = fileInput.files?.[0];
			  
				// Ici on regarde si la case 2FA est cochée ET que ce n'était pas activé avant
				if (twofaCheckbox.checked && !this.response.twofa) {
				  try {
					// Setup 2FA seulement maintenant, au moment du "Save"
					console.log("Setup 2FA attempt with cookies", document.cookie);
					const res = await fetch(`https://${SERVER_IP}:8443/api/2fa/setup`, {
					  method: "POST",
					  credentials: "include",
					});
					if (!res.ok) throw new Error("Failed to enable 2FA");
					const data = await res.json();
			  
					// QR Code window
					const userCode = await this.showQrModal(data.qrCode);

					if (!userCode) {
					  alert("2FA activation cancelled.");
					  return;
					}

					try {
  					const res = await fetch(`https://${SERVER_IP}:8443/api/debug-token`, {
    				credentials: "include",
					});

  					const data = await res.json();
  					console.log("↩️ /debug-token response", data);
					} catch (err) {
  					console.error("❌ Erreur debug-token:", err);
					}

				// Auth check
				try {
  				const authRes = await fetch(`https://${SERVER_IP}:8443/api/test-auth`, {
    			credentials: "include",
  			});

  				const authData = await authRes.json();
  				console.log("🛡️ /test-auth response:", authData);
				} catch (err) {
  				console.error("❌ Erreur test-auth:", err);
				}

			  
				// 2FA verification
					
				const verifyRes = await fetch(`https://${SERVER_IP}:8443/api/2fa/verify`, {
					  method: "POST",
					  headers: { "Content-Type": "application/json" },
					  body: JSON.stringify({ token: userCode }),
					  credentials: "include",
					});
				if (!verifyRes.ok) {
					  alert("Invalid 2FA code. Please try again.");
					  return;
					}
				alert("2FA activated!");
					this.response.twofa = true; // database updated
				  } catch (err) {
					console.error(err);
					alert("Error enabling 2FA");
					return;
				  }
				}
			  
				// If the checkbox is unchecked and 2FA was enabled before, we disable it
				if (!twofaCheckbox.checked && this.response.twofa) {
				  	const password = await this.askPassword();
					if (!password) return;

				  try {
  					const res = await fetch(`https://${SERVER_IP}:8443/api/2fa/disable`, {
    				method: "POST",
    				credentials: "include",
    				headers: {
      				"Content-Type": "application/json"
    				},
    				body: JSON.stringify({ password })	
  					});

					if (!res.ok) throw new Error("Failed to disable 2FA");
					alert("2FA disabled.");
					this.response.twofa = false; // database updated
				  } catch (err) {
					console.error(err);
					alert("Error disabling 2FA");
					return;
				  }
				}
			  
				// Continue the Profile load (username/avatar)
				const formData = new FormData();
				formData.append("username", username);
				try {
					if (file) {
						const maxSize = 1 * 1024 * 1024; // 2 MB
						const validTypes = ["image/jpeg", "image/png", "image/webp"];

						if (file.size > maxSize) {
							alert("El archivo es demasiado grande. Máximo 2MB.");
							return;
						}
						if (!validTypes.includes(file.type)) {
							alert("El tipo de archivo no es válido. Solo se permiten JPG, PNG o WEBP.");
							return;
						}

						formData.append("avatar", file);
					}
				} catch (error) {
					console.error("Error uploading picture", error);
					alert("Error con la imagen seleccionada.");
				}
			  
				try {
				  const response = await fetch(`https://${SERVER_IP}:8443/api/edit-profile`, {
					method: "POST",
					body: formData,
					credentials: "include",
				  });
				  if (response.ok) {
					console.log("Profile saved successfully");
					await this.getProfile(); // Refresh profile
					this.dispatchEvent(new CustomEvent("profile-updated", { bubbles: true }));
					this.remove();
				} else if (response.status === 413) {
					alert("El archivo es demasiado grande o tiene un formato no permitido.");
				} else {
					// Intenta obtener JSON si no es 413
					try {
						const errorData = await response.json();
						console.error(errorData.message || "Error saving changes");
					} catch (e) {
						console.error("Error inesperado al guardar cambios");
					}
				}
			} catch (error) {
				console.error("Error uploading profile", error);
				alert("Error al subir el perfil. Intenta nuevamente.");
			}
			  });
			  
		}			
		
	}
}

customElements.define("pong-edit-profile", EditProfileComponent);