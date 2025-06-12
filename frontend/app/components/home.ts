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

        <div class="h-full w-full">
          <div class="flex flex-col h-full items-center justify-center space-y-4 text-center">
            <div class="flex justify-center w-full">
              <svg 
                class="max-w-[700px] w-full h-auto" 
                viewBox="0 0 400 120" 
                xmlns="http://www.w3.org/2000/svg" 
                preserveAspectRatio="xMidYMid meet">
                <style>
                  .title {
                    font-family: 'Press Start 2P', monospace;
                    fill: #A020F0;
                    font-size: 40px;
                    animation: blink 1s steps(1, start) infinite;
                  }
                  @keyframes blink {
                    50% {
                      opacity: 0;
                    }
                  }
                </style>
                <text x="50%" y="50%" class="title" text-anchor="middle" dominant-baseline="middle">
                  PONG
                </text>
              </svg>
            </div>
            <div id="dataContainer" class="w-full flex justify-center items-center px-4"></div>
          </div>
        </div>

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
