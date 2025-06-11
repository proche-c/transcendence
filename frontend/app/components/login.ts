import { SERVER_IP } from '../config.js';

class LoginComponent extends HTMLElement {
    private emailInput: HTMLInputElement | null = null;
    private passwordInput: HTMLInputElement | null = null;
    private twofaInput: HTMLInputElement | null = null;
    private loginButton: HTMLElement | null = null;
    private registerButton: HTMLElement | null = null;
    private errorMsg: HTMLElement | null = null;
    private googleButton: HTMLElement | null = null;
    private twofaWrapper: HTMLElement | null = null;
    private twofaRequired = false;

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
<div class="max-w-md mx-auto text-white bg-black p-8 rounded-lg">
    <form id="loginForm">
        <div class="mt-1">
            <label for="email" class="font-semibold text-sm text-gray-400 pb-1 block">E-mail</label>
            <input id="email" autocomplete="email" type="text"
                class="border rounded-lg px-3 py-2 mb-2 text-sm w-full bg-gray-700 text-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500"/>
            <label for="password" class="font-semibold text-sm text-gray-400 pb-1 block">Password</label>
            <input id="password" autocomplete="current-password" type="password"
                class="border rounded-lg px-3 py-2 mb-2 text-sm w-full bg-gray-700 text-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500"/>

            <div id="twofa-wrapper" style="display:none;">
                <label for="twofa" class="font-semibold text-sm text-gray-400 pb-1 block">2FA Code</label>
                <input id="twofa" type="text"
                    class="border rounded-lg px-3 py-2 mb-2 text-sm w-full bg-gray-700 text-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500"/>
            </div>
        </div>
        <div class="mt-5">
            <button id="login" type="submit"
                class="py-2 px-4 bg-blue-600 hover:bg-blue-700 focus:ring-blue-500 focus:ring-offset-blue-200 text-white w-full transition ease-in duration-200 text-center text-base font-semibold shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 rounded-lg">
                Log in
            </button>
        </div>
    </form>
    <div class="text-red-600 mt-1">
      <p id="error" class="text-left text-sm"></p>
    </div>

    <hr class="border-gray-600 my-5" />

    <div class="flex justify-center items-center">
        <button id="google-login" class="mb-5 flex flex-row items-center justify-center py-2 px-4 bg-white hover:bg-gray-200 focus:ring-blue-500 focus:ring-offset-blue-200 text-gray-700 w-full transition ease-in duration-200 text-center text-sm font-semibold shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 rounded-lg space-x-3">
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google icon" class="w-5 h-5" />
            <span>Sign in with Google</span>
        </button>
    </div>

    <div>
        <button id="register" class="flex items-center justify-center py-2 px-10 bg-green-600 hover:bg-green-700 focus:ring-green-500 focus:ring-offset-green-200 text-white w-full transition ease-in duration-200 text-center text-base font-semibold shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 rounded-lg">
            <span>Sign up</span>
        </button>
    </div>
</div>
`;

        this.shadowRoot.appendChild(style);

        this.emailInput = this.shadowRoot.querySelector("#email");
        this.passwordInput = this.shadowRoot.querySelector("#password");
        this.twofaInput = this.shadowRoot.querySelector("#twofa");
        this.twofaWrapper = this.shadowRoot.querySelector("#twofa-wrapper");
        this.loginButton = this.shadowRoot.querySelector("#login");
        this.registerButton = this.shadowRoot.querySelector("#register");
        this.errorMsg = this.shadowRoot.querySelector("#error");
        this.googleButton = this.shadowRoot.querySelector("#google-login");

        this.addEventListeners();
    }

    private addEventListeners(): void {
        const loginForm = this.shadowRoot?.querySelector("#loginForm") as HTMLFormElement;
        loginForm?.addEventListener("submit", async (event) => {
            event.preventDefault();

            const email = this.emailInput?.value || "";
            const password = this.passwordInput?.value || "";
            const twofa_token = this.twofaInput?.value || "";

            if (!email || !password) {
                this.errorMsg!.textContent = "All fields are required";
                return;
            }

            const data: any = { email, password };
            if (this.twofaRequired && twofa_token) {
                data.twofa_token = twofa_token;
            }

            await this.postData(data);
        });

        this.registerButton?.addEventListener("click", () => {
            window.location.hash = "#register";
        });

        this.googleButton?.addEventListener("click", () => {
            window.location.href = `https://${SERVER_IP}:8443/api/login/google`;
        });
    }

    private async postData(data: { email: string; password: string; twofa_token?: string }) {
        try {
            const response = await fetch(`https://${SERVER_IP}:8443/api/login`, {
                method: "POST",
                body: JSON.stringify(data),
                headers: { "Content-Type": "application/json" },
                credentials: "include",
            });

            const result = await response.json();

            if (response.ok) {
                location.hash = "#profile";
            } else if (result.message === "2FA token required") {
                this.twofaRequired = true;
                this.twofaWrapper!.style.display = "block";
                this.errorMsg!.textContent = "2FA required. Please enter your code.";
            } else if (result.message === "Invalid 2FA token") {
                this.errorMsg!.textContent = "Invalid 2FA code.";
            } else if (result.message === "Invalid credentials") {
                this.errorMsg!.textContent = "Incorrect email or password.";
            } else {
                this.errorMsg!.textContent = "Login failed.";
            }
        } catch (error: any) {
            console.error("Login request failed", error);
            this.errorMsg!.textContent = "Network error. Please try again.";
        }
    }
}

customElements.define("pong-login", LoginComponent);