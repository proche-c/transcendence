"use strict";
class ChatComponent extends HTMLElement {
    constructor() {
        super();
        this.messageInput = null;
        this.sendButton = null;
        this.socket = null;
        this.attachShadow({ mode: "open" });
        this.connect();
        this.render();
    }
    connect() {
        this.socket = new WebSocket("ws://localhost:8000/chat");
        console.log(this.socket);
    }
    render() {
        if (!this.shadowRoot)
            return;
        const style = document.createElement("link");
        style.rel = "stylesheet";
        style.href = "./app/tailwind.css"; // Asegúrate de que la ruta sea correcta
        this.shadowRoot.innerHTML = `
            <pong-header></pong-header>
            <pong-menu></pong-menu>
			<div id="content" class="bg-purple-300 m-4 p-4 border border-violet-500 rounded-lg">
				Esto es el chat
				<div>
					<input type="text" id="message" placeholder="Type a message">
					<button id="send" class="bg-gray-800 text-white m-1 p-1 text-center font-bold text-lg">Send</button>
				</div>
			</div>
		`;
        this.shadowRoot.appendChild(style);
        this.messageInput = this.shadowRoot.querySelector("#message");
        this.sendButton = this.shadowRoot.querySelector("#send");
        this.addEventListeners();
    }
    addEventListeners() {
        var _a;
        (_a = this.sendButton) === null || _a === void 0 ? void 0 : _a.addEventListener("click", () => {
            var _a, _b;
            const messageToSend = ((_a = this.messageInput) === null || _a === void 0 ? void 0 : _a.value) || "";
            const data = { user: "paula", type: 0, destinatary: "", message: messageToSend };
            (_b = this.socket) === null || _b === void 0 ? void 0 : _b.send(JSON.stringify(data));
        });
    }
}
customElements.define("pong-chat", ChatComponent);
