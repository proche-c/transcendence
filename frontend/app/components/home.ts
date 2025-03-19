class HomeComponent extends HTMLElement {
    private usernameInput: HTMLInputElement | null = null;
    private passwordInput: HTMLInputElement | null = null;
    private loginButton: HTMLElement | null = null;
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
            <div class="bg-black flex items-center justify-center overflow-hidden m-2 rounded-lg shadow-lg">
                <img src="./app/assets/start2.png" class="p-1">
            </div>
            <div class="p-2">
                <h1 class="font-sans text-center font-bold text-purple-900 text-2xl">WELCOME TO PONG!</h1>
            </div>
            <div class="border-1 border-purple-900 flex justify-center items-center content-center m-1 p-1">
                <div class="flex-col bg-black m-4 py-4 px-6 justify-center content-center">
                    <p class="text-white mx-1 my-2">Doesn't have an account yet? <button id="register" class="font-bold"> Sing in</button></p>
                    <input type="text" id="username" placeholder="Username" class="bg-white mx-1 my-2 p-1" required><br>
                    <input type="password" id="password" placeholder="Password" class="bg-white mx-1 my-2 p-1" required><br>
                    <div class="align-middle">
                    <button id="login" class="bg-gray-800 text-white m-1 p-1 text-center font-bold text-lg">Login</button>
                    </div>
                <div>
            </div>
        `;

        this.shadowRoot.appendChild(style);

        this.usernameInput = this.shadowRoot.querySelector("#username") as HTMLInputElement;
        this.passwordInput = this.shadowRoot.querySelector("#password") as HTMLInputElement;
        this.loginButton = this.shadowRoot.querySelector("#login");

        this.addEventListeners();
    }

    private addEventListeners(): void {
        this.loginButton?.addEventListener("click", async (event) => {
            event.preventDefault();

            const username = this.usernameInput?.value || "";
            const password = this.passwordInput?.value || "";

            if (username && password) {
                await this.postData(username, password);
            }
        });
        console.log(this.response);
    }

    private async postData(username: string, password: string) {
        const data = { id: 9, username, password };

        try {
            // Esta url sera el endponit que configure el servidor
            const response = await fetch("http://localhost:3000/users", {
                method: "POST",
                body: JSON.stringify(data),
                headers: { "Content-Type": "application/json" },
            });

            this.response = await response.json();
            location.hash = "#profile"; // Cambiar la vista
            // Aqui el backend hará las validaciones de username y password y me enviara un error
            // en caso de que haya algun problema
            // Si la autenticacion es valida, el backend creara un token jwt y lo guardara en las cookies
            if (!response.ok) {
                throw { status: response.status, statusText: response.statusText };
            }
        } catch (error: any) {
            console.log("error en la peticion");
        }
    } 

    // addEventListeners() {
    //     // const loginButton = this.shadowRoot?.querySelector("#login");
    //     // if (loginButton) {
    //     //     loginButton.addEventListener("click", () => {
    //     //         location.hash = "#login"; // Cambiar la vista
    //     //     });
    //     // }
    //     // const registerButton = this.shadowRoot?.querySelector("#register");
    //     // if (loginButton) {
    //     //     loginButton.addEventListener("click", () => {
    //     //         location.hash = "#register"; // Cambiar la vista
    //     //     });
    //     // }
}

customElements.define("pong-home", HomeComponent);
