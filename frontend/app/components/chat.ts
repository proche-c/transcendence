interface Data {
	user: string;
	type: number; // 0 for global messages and 1 for dms
	destinatary: string;
	message: string;
}

class ChatComponent extends HTMLElement {
	private messageInput:  HTMLInputElement | null = null;
	private sendButton: HTMLElement | null = null;
	private socket: WebSocket | null = null;
	constructor() {
		super();
		this.attachShadow({mode: "open"});
		this.connect();
		this.render();
	}

	private connect() {
		this.socket = new WebSocket(
			"ws://localhost:8000/chat",

		);
		console.log(this.socket);
	}

	private render(): void {
		if(!this.shadowRoot)
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
		this.messageInput = this.shadowRoot.querySelector("#message") as HTMLInputElement;
		this.sendButton = this.shadowRoot.querySelector("#send") as HTMLElement;
		this.addEventListeners();
	}

	private addEventListeners(): void {
		this.sendButton?.addEventListener("click", () => {
			const messageToSend = this.messageInput?.value || "";
			const data: Data = { user: "paula", type: 0, destinatary: "", message: messageToSend };
			this.socket?.send(JSON.stringify(data));
		});
	}

}

customElements.define("pong-chat", ChatComponent);