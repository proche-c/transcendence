class RegisterComponent extends HTMLElement {
    private emailInput: HTMLInputElement | null = null;
    private userInput: HTMLInputElement | null = null;
    private passwordInput: HTMLInputElement | null = null;
    private password2Input: HTMLInputElement | null = null;
    private registerButton: HTMLElement | null = null;
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
            <div id="inputData" class="flex-col bg-black m-4 py-4 px-6 justify-center content-center">
                <input type="text" id="email" placeholder="Email" class="bg-white mx-1 my-2 p-1" required><br>
                <input type="text" id="username" placeholder="Username" class="bg-white mx-1 my-2 p-1" required><br>
                <input type="password" id="password" placeholder="Password" class="bg-white mx-1 my-2 p-1" required><br>
                <input type="password" id="password2" placeholder="Confirm password" class="bg-white mx-1 my-2 p-1" required><br>
                <div class="align-middle">
                <button id="register" class="bg-gray-800 text-white m-1 p-1 text-center font-bold text-lg">Register</button>
                </div>
            <div>
        `;

        this.shadowRoot.appendChild(style);

        this.emailInput = this.shadowRoot.querySelector("#email") as HTMLInputElement;
        this.userInput = this.shadowRoot.querySelector("#username") as HTMLInputElement;
        this.passwordInput = this.shadowRoot.querySelector("#password") as HTMLInputElement;
        this.password2Input = this.shadowRoot.querySelector("#password2") as HTMLInputElement;
        this.registerButton = this.shadowRoot.querySelector("#register");

        this.addEventListeners();
    }

    private addEventListeners(): void {
        this.registerButton?.addEventListener("click", async (event) => {
            event.preventDefault();

            const email = this.emailInput?.value || "";
            const password = this.passwordInput?.value || "";

            if (email && password) {
                await this.postData(email, password);
            }
        });
        
        this.registerButton?.addEventListener("click", () => {
            window.location.hash = "#register";
            
        });
    }

    private async postData(email: string, password: string) {
        const data = { email, password };

        try {
            // Esta url sera el endponit que configure el servidor
            const response = await fetch("http://localhost:8000/register", {
                method: "POST",
                body: JSON.stringify(data),
                headers: { "Content-Type": "application/json" },
            });

            this.response = await response.json();
            location.hash = "#profile"; // Cambiar la vista
            // Aqui el backend hará las validaciones de email y password y me enviara un error
            // en caso de que haya algun problema
            // Si la autenticacion es valida, el backend creara un token jwt y lo guardara en las cookies
            console.log(response);
            if (!response.ok) {
                throw { status: response.status, statusText: response.statusText };
            }
        } catch (error: any) {
            console.log("error en la peticion");
        }
    }

}

customElements.define("pong-register", RegisterComponent);


