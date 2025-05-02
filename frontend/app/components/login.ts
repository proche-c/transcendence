class LoginComponent extends HTMLElement {
    private emailInput: HTMLInputElement | null = null;
    private passwordInput: HTMLInputElement | null = null;
    private loginButton: HTMLElement | null = null;
    private registerButton: HTMLElement | null = null;
    private inputData: HTMLElement | null = null;
    private errorMsg: HTMLElement | null = null;
    private response: Promise<Response> | null = null;
    private googleButton: HTMLElement | null = null;


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
            <input id="email" type="text"
                class="border rounded-lg px-3 py-2 mb-2 text-sm w-full bg-gray-700 text-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500"/>
            <label for="password" class="font-semibold text-sm text-gray-400 pb-1 block">Password</label>
            <input id="password" type="password"
                class="border rounded-lg px-3 py-2 text-sm w-full bg-gray-700 text-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500"/>
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

        this.emailInput = this.shadowRoot.querySelector("#email") as HTMLInputElement;
        this.passwordInput = this.shadowRoot.querySelector("#password") as HTMLInputElement;
        this.loginButton = this.shadowRoot.querySelector("#login");
        this.inputData = this.shadowRoot.querySelector("#inputData");
        this.registerButton = this.shadowRoot.querySelector("#register");
        this.errorMsg = this.shadowRoot.querySelector("#error") as HTMLElement;
        this.googleButton = this.shadowRoot.querySelector("#google-login");

        this.addEventListeners();
    }

    private addEventListeners(): void {
        const loginForm = this.shadowRoot?.querySelector("#loginForm") as HTMLFormElement;
        loginForm?.addEventListener("submit", async (event) => {
            event.preventDefault();
    
            const email = this.emailInput?.value || "";
            const password = this.passwordInput?.value || "";
    
            if (email && password) {
                await this.postData(email, password);
            } else {
                this.errorMsg!.textContent = "All fields are required";
            }
        });
    
        this.registerButton?.addEventListener("click", () => {
            console.log("he pulsado sign in");
            window.location.hash = "#register";
        });
    
        if (this.googleButton) {
            console.log("Google button found"); // Vérifiez si ce log s'affiche
            this.googleButton.addEventListener("click", () => {
                console.log("Google button clicked");
                window.location.href = "http://localhost:8000/login/google";
            });
        } else {
            console.error("Google button not found");
        }
    }

    private async postData(email: string, password: string) {
        const data = { "email": email, "password": password };

        try {
            // Esta url sera el endpoint que configure el servidor
            const response = await fetch("http://localhost:8000/login", {
                method: "POST",
                body: JSON.stringify(data),
                headers: { "Content-Type": "application/json" },
                credentials: "include",
            });

            this.response = await response.json();
            // location.hash = "#profile"; // Cambiar la vista
            // Aqui el backend hará las validaciones de email y password y me enviara un error
            // en caso de que haya algun problema
            // Si la autenticacion es valida, el backend creara un token jwt y lo guardara en las cookies
            console.log(response);
            if (response.ok) {
                location.hash = "#profile";
            }
            if (response.status === 404 || response.status === 401) {
                this.errorMsg!.textContent = "Incorrect email or password";
                //this.resetValues();
            }
        } catch (error: any) {
            console.log("error en la peticion");
        }
    }
    /*
    private resetValues() {
        if (this.emailInput)
            this.emailInput.value = "";
        if (this.passwordInput)
            this.passwordInput.value = "";
    } */

}

customElements.define("pong-login", LoginComponent);