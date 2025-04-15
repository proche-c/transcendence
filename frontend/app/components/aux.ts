class HomeComponent extends HTMLElement {
    private dataContainer: HTMLElement | null = null;

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
}

customElements.define("pong-home", HomeComponent);




class LoginComponent extends HTMLElement {
    private emailInput: HTMLInputElement | null = null;
    private passwordInput: HTMLInputElement | null = null;
    private loginButton: HTMLElement | null = null;
    private registerButton: HTMLElement | null = null;
    private inputData: HTMLElement | null = null;
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
            <div class="border-1 border-purple-900 flex justify-center items-center content-center m-1 p-1">
                <div id="inputData" class="flex-col bg-black m-4 py-4 px-6 justify-center content-center">
                    <p class="text-white mx-1 my-2">Doesn't have an account yet? <button id="register" class="font-bold"> Sing in</button></p>
                    <input type="text" id="email" placeholder="Email" class="bg-white mx-1 my-2 p-1" required><br>
                    <input type="password" id="password" placeholder="Password" class="bg-white mx-1 my-2 p-1" required><br>
                    <div class="align-middle">
                    <button id="login" class="bg-gray-800 text-white m-1 p-1 text-center font-bold text-lg">Login</button>
                    </div>
                    <div class="text-red-600">
                    <p id="error"> </p>
                    </div>
                <div>
            </div>
        `;

        this.shadowRoot.appendChild(style);

        this.emailInput = this.shadowRoot.querySelector("#email") as HTMLInputElement;
        this.passwordInput = this.shadowRoot.querySelector("#password") as HTMLInputElement;
        this.loginButton = this.shadowRoot.querySelector("#login");
        this.inputData = this.shadowRoot.querySelector("#inputData");
        this.registerButton = this.shadowRoot.querySelector("#register");
        this.errorMsg = this.shadowRoot.querySelector("#error") as HTMLElement;

        this.addEventListeners();
    }

    private addEventListeners(): void {
        this.loginButton?.addEventListener("click", async (event) => {
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
    }

    private async postData(email: string, password: string) {
        const data = { "email": email, "password": password };

        try {
            // Esta url sera el endponit que configure el servidor
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
                this.resetValues();
            }
        } catch (error: any) {
            console.log("error en la peticion");
        }
    }

    private resetValues() {
        if (this.emailInput)
            this.emailInput.value = "";
        if (this.passwordInput)
            this.passwordInput.value = "";
    } 

}

customElements.define("pong-login", LoginComponent);





<div class="flex h-screen w-16 flex-col justify-between border-e border-gray-100 bg-white">
  <div>
    <div class="inline-flex size-16 items-center justify-center">
      <span class="grid size-10 place-content-center rounded-lg bg-gray-100 text-xs text-gray-600">
        L
      </span>
    </div>

    <div class="border-t border-gray-100">
      <div class="px-2">
        <div class="py-4">
          <a
            href="#"
            class="t group relative flex justify-center rounded-sm bg-blue-50 px-2 py-1.5 text-blue-700"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="size-5 opacity-75"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              stroke-width="2"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>

            <span
              class="invisible absolute start-full top-1/2 ms-4 -translate-y-1/2 rounded-sm bg-gray-900 px-2 py-1.5 text-xs font-medium text-white group-hover:visible"
            >
              General
            </span>
          </a>
        </div>

        <ul class="space-y-1 border-t border-gray-100 pt-4">
          <li>
            <a
              href="#"
              class="group relative flex justify-center rounded-sm px-2 py-1.5 text-gray-500 hover:bg-gray-50 hover:text-gray-700"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="size-5 opacity-75"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                stroke-width="2"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>

              <span
                class="invisible absolute start-full top-1/2 ms-4 -translate-y-1/2 rounded-sm bg-gray-900 px-2 py-1.5 text-xs font-medium text-white group-hover:visible"
              >
                Teams
              </span>
            </a>
          </li>

          <li>
            <a
              href="#"
              class="group relative flex justify-center rounded-sm px-2 py-1.5 text-gray-500 hover:bg-gray-50 hover:text-gray-700"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="size-5 opacity-75"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                stroke-width="2"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                />
              </svg>

              <span
                class="invisible absolute start-full top-1/2 ms-4 -translate-y-1/2 rounded-sm bg-gray-900 px-2 py-1.5 text-xs font-medium text-white group-hover:visible"
              >
                Billing
              </span>
            </a>
          </li>

          <li>
            <a
              href="#"
              class="group relative flex justify-center rounded-sm px-2 py-1.5 text-gray-500 hover:bg-gray-50 hover:text-gray-700"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="size-5 opacity-75"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                stroke-width="2"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                />
              </svg>

              <span
                class="invisible absolute start-full top-1/2 ms-4 -translate-y-1/2 rounded-sm bg-gray-900 px-2 py-1.5 text-xs font-medium text-white group-hover:visible"
              >
                Invoices
              </span>
            </a>
          </li>

          <li>
            <a
              href="#"
              class="group relative flex justify-center rounded-sm px-2 py-1.5 text-gray-500 hover:bg-gray-50 hover:text-gray-700"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="size-5 opacity-75"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                stroke-width="2"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>

              <span
                class="invisible absolute start-full top-1/2 ms-4 -translate-y-1/2 rounded-sm bg-gray-900 px-2 py-1.5 text-xs font-medium text-white group-hover:visible"
              >
                Account
              </span>
            </a>
          </li>
        </ul>
      </div>
    </div>
  </div>

  <div class="sticky inset-x-0 bottom-0 border-t border-gray-100 bg-white p-2">
    <a
      href="#"
      class="group relative flex w-full justify-center rounded-lg px-2 py-1.5 text-sm text-gray-500 hover:bg-gray-50 hover:text-gray-700"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        class="size-5 opacity-75"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        stroke-width="2"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
        />
      </svg>

      <span
        class="invisible absolute start-full top-1/2 ms-4 -translate-y-1/2 rounded-sm bg-gray-900 px-2 py-1.5 text-xs font-medium text-white group-hover:visible"
      >
        Logout
      </span>
    </a>
  </div>
</div>



<nav class="flex h-screen w-16 flex-col justify-between border-e border-gray-100 bg-white">
<div>
    <a id="profile" href="#profile" class="ml-0 ${isActive("#profile")} hover:text-purple-900 font-bold mx-1 my-1 lg:text-3xl lg:mx-10 lg:ml-0">PROFILE</a>
    <a id="board" href="#board" class="${isActive("#board")} hover:text-purple-900 font-bold mx-1 my-1 lg:text-3xl lg:mx-10 lg:ml-0">LEADER BOARD</a>
    <a id="play" href="#play" class="${isActive("#play")} hover:text-purple-900 font-bold mx-1 my-1 lg:text-3xl lg:mx-10 lg:ml-0">PLAY</a>
    <a id="chat" href="#chat" class="${isActive("#chat")} hover:text-purple-900 font-bold mx-1 my-1 lg:text-3xl lg:mx-10 lg:ml-0">CHAT</a>
</div>
<button id="logout" class="bg-purple-400 text-black mx-1 ml-3 p-1 text-center text-xs font-bold rounded-lg my-1 lg:text-base px-2">Logout</button>
</nav>



<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
  <path stroke-linecap="round" stroke-linejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
</svg>
