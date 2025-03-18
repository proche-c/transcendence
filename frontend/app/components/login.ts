class LoginComponent extends HTMLElement {
    private usernameInput: HTMLInputElement | null = null;
    private passwordInput: HTMLInputElement | null = null;
    private loginButton: HTMLElement | null = null;
    private response: Promise<Response> | null = null;

    constructor() {
        super();
        this.attachShadow({ mode: "open" });
        this.render();
    }

    private render(): void {
        if (!this.shadowRoot) return;

        const style = document.createElement("link");
        style.rel = "stylesheet";
        style.href = "./app/tailwind.css";

        this.shadowRoot.innerHTML = `
            <header>
                <h1>Login</h1>
            </header>
            <input type="text" id="username" placeholder="Username" required><br>
            <input type="password" id="password" placeholder="Password" required><br>
            <button id="login">Login</button>
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
}
customElements.define("pong-login", LoginComponent);


