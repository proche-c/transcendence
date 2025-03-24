class HomeComponent extends HTMLElement {
    // private emailInput: HTMLInputElement | null = null;
    // private passwordInput: HTMLInputElement | null = null;
    // private loginButton: HTMLElement | null = null;
    private dataContainer: HTMLElement | null = null;
    // private registerButton: HTMLElement | null = null;
    // private response: Promise<Response> | null = null;

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
            <div id="dataContainer"></div>
        `;

        this.dataContainer = this.shadowRoot.querySelector("#dataContainer");
        if (window.location.hash === "#register") {
            this.dataContainer?.appendChild(document.createElement("pong-register"));
        } else {
            this.dataContainer?.appendChild(document.createElement("pong-login"));
        }
        this.shadowRoot.appendChild(style);

    }

    // private addEventListeners(): void {
    //     this.loginButton?.addEventListener("click", async (event) => {
    //         event.preventDefault();

    //         const email = this.emailInput?.value || "";
    //         const password = this.passwordInput?.value || "";

    //         if (email && password) {
    //             await this.postData(email, password);
    //         }
    //     });
        
    //     this.registerButton?.addEventListener("click", () => {
    //         console.log("He pulsado registrar");
    //         // this.showRegister();
    //     });
    // }

    // private async postData(email: string, password: string) {
    //     const data = { email, password };

    //     try {
    //         // Esta url sera el endponit que configure el servidor
    //         const response = await fetch("http://localhost:8000/login", {
    //             method: "POST",
    //             body: JSON.stringify(data),
    //             headers: { "Content-Type": "application/json" },
    //         });

    //         this.response = await response.json();
    //         location.hash = "#profile"; // Cambiar la vista
    //         // Aqui el backend hará las validaciones de email y password y me enviara un error
    //         // en caso de que haya algun problema
    //         // Si la autenticacion es valida, el backend creara un token jwt y lo guardara en las cookies
    //         console.log(response);
    //         if (!response.ok) {
    //             throw { status: response.status, statusText: response.statusText };
    //         }
    //     } catch (error: any) {
    //         console.log("error en la peticion");
    //     }
    // }

    // private showRegister() {
    //     if (!this.inputData)
    //         return ;
    //     this.inputData.innerHTML = `
    //                        <p class="text-white mx-1 my-2">Doesn't have an account yet? <button id="register" class="font-bold"> Sing in</button></p>
    //                 <input type="text" id="email" placeholder="Email" class="bg-white mx-1 my-2 p-1" required><br>
    //                 <input type="password" id="password" placeholder="Password" class="bg-white mx-1 my-2 p-1" required><br>
    //                 <div class="align-middle">
    //                 <button id="login" class="bg-gray-800 text-white m-1 p-1 text-center font-bold text-lg">Login</button>
    //                 </div>`;
    // }
}

customElements.define("pong-home", HomeComponent);
