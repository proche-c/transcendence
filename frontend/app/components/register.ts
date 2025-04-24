class RegisterComponent extends HTMLElement {
    private emailInput: HTMLInputElement | null = null;
    private userInput: HTMLInputElement | null = null;
    private passwordInput: HTMLInputElement | null = null;
    private password2Input: HTMLInputElement | null = null;
    private registerButton: HTMLElement | null = null;
    private errorMsg: HTMLElement | null = null;
    private response: Promise<Response> | null = null;

    constructor() {
        super();
        this.attachShadow({ mode: "open" });
        this.render();
    }

    render() {
        if (!this.shadowRoot) return;

        const style = document.createElement("link");
        style.rel = "stylesheet";
        style.href = "./app/tailwind.css";

        this.shadowRoot.innerHTML = `
        <div class="relative py-3 sm:max-w-xl sm:mx-auto w-full">
        <div class="relative px-4 py-10 bg-black mx-8 md:mx-0 shadow rounded-3xl sm:p-10">
            <div class="max-w-md mx-auto text-white">
                <div class="mt-5">
                    <label for="email" class="font-semibold text-sm text-gray-400 pb-1 block">E-mail</label>
                    <input id="email" type="text"
                        class="border rounded-lg px-3 py-2 mt-1 mb-5 text-sm w-full bg-gray-700 text-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500"/>
    <p class="text-sm text-red-500 mt-1" id="emailError"></p> <!-- Message d'erreur pour l'email -->
    
                    <label for="username" class="font-semibold text-sm text-gray-400 pb-1 block">Username</label>
                    <input id="username" type="text"
                        class="border rounded-lg px-3 py-2 mt-1 mb-5 text-sm w-full bg-gray-700 text-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500"/>                    
    <p class="text-sm text-red-500 mt-1" id="usernameError"></p> <!-- Message d'erreur pour le nom d'utilisateur -->
    
                    <label for="password" class="font-semibold text-sm text-gray-400 pb-1 block">Password</label>
                    <input id="password" type="password"
                        class="border rounded-lg px-3 py-2 mt-1 mb-5 text-sm w-full bg-gray-700 text-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500"/>
    <p class="text-sm text-red-500 mt-1" id="passwordError"></p> <!-- Message d'erreur pour le mot de passe -->
                    
                    <label for="password2" class="font-semibold text-sm text-gray-400 pb-1 block">Confirm Password</label>
                    <input id="password2" type="password"
                        class="border rounded-lg px-3 py-2 mt-1 mb-5 text-sm w-full bg-gray-700 text-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500"/>
    <p class="text-sm text-red-500 mt-1" id="password2Error"></p> <!-- Message d'erreur pour la confirmation du mot de passe -->            
        
                </div>
                <div class="mt-5">
                    <button id="register"
                        class="py-2 px-4 bg-blue-600 hover:bg-blue-700 focus:ring-blue-500 focus:ring-offset-blue-200 text-white w-full transition ease-in duration-200 text-center text-base font-semibold shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 rounded-lg">
                        Register
                    </button>
                </div>
                <div class="text-red-600">
                    <p id="error"> </p>
                </div>
            </div>
        </div>
        </div>
        `;

        this.shadowRoot.appendChild(style);

        this.emailInput = this.shadowRoot.querySelector("#email") as HTMLInputElement;
        this.userInput = this.shadowRoot.querySelector("#username") as HTMLInputElement;
        this.passwordInput = this.shadowRoot.querySelector("#password") as HTMLInputElement;
        this.password2Input = this.shadowRoot.querySelector("#password2") as HTMLInputElement;
        this.registerButton = this.shadowRoot.querySelector("#register");
        this.errorMsg = this.shadowRoot.querySelector("#error") as HTMLElement;

        this.addEventListeners();
    }

    private addEventListeners(): void {
        this.registerButton?.addEventListener("click", async (event) => {
            event.preventDefault();

            const email = this.emailInput?.value || "";
            const user = this.userInput?.value || "";
            const password = this.passwordInput?.value || "";
            const password2 = this.password2Input?.value || "";

            // Validation des champs avant envoi
            if (this.validateEmail() && this.validateUsername() && this.validatePassword() && this.validatePasswordMatch()) {
                await this.postData(email, user, password);
            } else {
                this.errorMsg!.textContent = "Please fix the errors"; // Afficher un message d'erreur générique
            }
        });

        // Validation en temps réel pour l'email
        this.emailInput?.addEventListener("input", () => this.validateEmail());
    }

    private validateEmail(): boolean {
        const value = this.emailInput?.value || "";
        const emailError = this.shadowRoot?.querySelector("#emailError") as HTMLElement;
        const regex = /^\S+@\S+\.\S+$/;
        if (!regex.test(value)) {
            emailError.textContent = "Invalid email format"; // Afficher le message d'erreur
            this.emailInput?.classList.add("border-red-500");
            this.emailInput?.classList.remove("border-blue-500");
            return false;
        } else {
            emailError.textContent = "";
            this.emailInput?.classList.remove("border-red-500");
            this.emailInput?.classList.add("border-blue-500");
            return true;
        }
    }

    private validateUsername(): boolean {
        const value = this.userInput?.value || "";
        if (value.length < 3) {
            this.errorMsg!.textContent = "Username must be at least 3 characters long";
            return false;
        }
        return true;
    }

    private validatePassword(): boolean {
        const value = this.passwordInput?.value || "";
        if (value.length < 6) {
            this.errorMsg!.textContent = "Password must be at least 6 characters long";
            return false;
        }
        return true;
    }

    private validatePasswordMatch(): boolean {
        const password = this.passwordInput?.value || "";
        const password2 = this.password2Input?.value || "";
        if (password !== password2) {
            this.errorMsg!.textContent = "Passwords do not match";
            return false;
        }
        return true;
    }

    private async postData(email: string, user: string, password: string) {
        const data = { "username": user, "email": email, "password": password };

        try {
            const response = await fetch("http://localhost:8000/register", {
                method: "POST",
                body: JSON.stringify(data),
                headers: { "Content-Type": "application/json" },
            });

            this.response = await response.json();
            console.log("Se ha enviado la peticion");

            if (response.ok) {
                location.hash = "#";
            }
            if (!response.ok) {
                throw { status: response.status, statusText: response.statusText };
            }
        } catch (error: any) {
            console.log("error en la peticion");
        }
    }

    private resetValues() {
        if (this.emailInput)
            this.emailInput.value = "";
        if (this.userInput)
            this.userInput.value = "";
        if (this.passwordInput)
            this.passwordInput.value = "";
        if (this.password2Input)
            this.password2Input.value = "";
    }
}

customElements.define("pong-register", RegisterComponent);
