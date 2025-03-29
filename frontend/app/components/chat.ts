interface Data {
	user: string;
	type: number; // 0 for global messages and 1 for dms
	destinatary: string;
	message: string;
}

class ChatComponent extends HTMLElement {
	private messages: HTMLElement | null = null;
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
		this.socket = new WebSocket("ws://localhost:8000/chat");
		console.log(this.socket);
		this.socket.onmessage = (event) => {
			// const data: Data = JSON.parse(event.data);
			console.log("data que recibo");
			console.log(event);
			console.log(event.data);
			this.addMessageToList(event.data);
		}
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
			<div id="content" class="bg-purple-300 m-4 p-4 border border-violet-500 rounded-lg flex flex-col h-120 justify-between">
				<div id="chat" class="grow bg-amber-50 overflow-auto">
					<ul id="messages"></ul>
				</div>
				<div id="form">
					<input type="text" id="message" placeholder="Type a message" class="border">
					<button id="send" class="bg-gray-800 text-white m-1 p-1 text-center font-bold text-lg">Send</button>
				</div>
		`;

		this.shadowRoot.appendChild(style);
		this.messages = this.shadowRoot.querySelector("#messages") as HTMLElement;
		this.messageInput = this.shadowRoot.querySelector("#message") as HTMLInputElement;
		this.sendButton = this.shadowRoot.querySelector("#send") as HTMLElement;
		this.addEventListeners();

		
	}

	private addEventListeners(): void {
		this.sendButton?.addEventListener("click", () => {
			const messageToSend = this.messageInput?.value || "";
			if (messageToSend) {
				const data: Data = { user: "paula", type: 0, destinatary: "", message: messageToSend };
				this.socket?.send(JSON.stringify(data));
				if (this.messageInput)
					this.messageInput.value = "";
			}
		});
	}

		private addMessageToList(data: string): void {
			if (!this.messages)
				return ;
			const messageElement = document.createElement("li");
			messageElement.textContent = data;
			messageElement.className = "p-2 border-b border-gray-300";
			this.messages.appendChild(messageElement);
			this.messages.scrollTop = this.messages.scrollHeight;
		}
}

customElements.define("pong-chat", ChatComponent);