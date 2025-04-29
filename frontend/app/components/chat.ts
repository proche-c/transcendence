interface Data {
  user: string; // No lo necesitas porque lo tienes en el payload
  type: number; // 0 : global messages
  destinatary: string; // No te paso nada porque es global
  message: string;
  chatId: number; // Te paso el chatId que ya lo tendre
}

interface Message {
  chat: number;
  type: number;
  sender: string;
  destinatary: string;
  message: string;
}

interface Chat {
  id: number;
  name: string;
  messages: Array<Message>;
}

class ChatComponent extends HTMLElement {
	private messages: Array<Data> = [];
	private chats: Array<Chat> = [];
	private globalChat: Array<Data> = [];
	private messagesBox: HTMLElement | null = null;
	private messageInput:  HTMLInputElement | null = null;
	private sendButton: HTMLElement | null = null;
	private socket: WebSocket | null = null;
	private response: Promise<Response> | null = null;
	constructor() {
		super();
		this.attachShadow({mode: "open"});
		this.connect();
		this.render();
	}
  private response: any | null = null;
  private messages: Array<Data> = [];
  private chats: Array<Chat> = [];
  private globalChat: Array<Data> = [];
  private messagesBox: HTMLElement | null = null;
  private messageInput: HTMLInputElement | null = null;
  private sendButton: HTMLElement | null = null;
  private socket: WebSocket | null = null;
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
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
      this.addMessageToMessages(event.data);
      this.addMessageToList(event.data);
    };
  }

	private async getUsers() {

        try {
            // Esta url sera el endponit que configure el servidor
            const response = await fetch("http://localhost:8000/users", {
                method: "GET",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
            });

            this.response = await response.json();
        } catch (error: any) {
            console.log("error en la peticion");
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
				<div id="chat" class="grow bg-amber-50 overflow-auto flex">
					<div id="chats" class="w-1/4 bg-gray-200 border border-gray-300 rounded-lg p-2">
						CHATS
					</div>
					<div id="messages" class="w-3/4 bg-gray-100 border border-gray-300 rounded-lg p-2 overflow-auto">
					<ul id="messages"></ul>
					</div>
				</div>
				<div id="form">
					<input type="text" id="message" placeholder="Type a message" class="border">
					<button id="send" class="bg-gray-800 text-white m-1 p-1 text-center font-bold text-lg">Send</button>
				</div>
		`;

		this.shadowRoot.appendChild(style);
		this.messagesBox = this.shadowRoot.querySelector("#messages") as HTMLElement;
		this.messageInput = this.shadowRoot.querySelector("#message") as HTMLInputElement;
		this.sendButton = this.shadowRoot.querySelector("#send") as HTMLElement;
		this.getUsers();
		this.addEventListeners();

  private async getUsers() {
    try {
      const response = await fetch("http://localhost:8000/users", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });

      const data = await response.json();
      this.response = data;
      console.log(data);
    } catch (error: any) {
      console.log("Error en la peticion");
    }
  }

  private addEventListeners(): void {
    this.sendButton?.addEventListener("click", () => {
      const messageToSend = this.messageInput?.value || "";
      if (messageToSend) {
        const msg: Data = {
          user: "paula",
          type: 0,
          destinatary: "",
          message: messageToSend,
          chatId: -1,
        };
        this.socket?.send(JSON.stringify(msg));
        if (this.messageInput) this.messageInput.value = "";
      }
    });
  }

  private addMessageToMessages(data: string): void {
    const datas = data.split(":");
    const user = datas[0];
    const messageToPrint = datas[1];
    const message: Data = {
      user: user,
      type: 0,
      destinatary: "",
      message: messageToPrint,
      chatId: -1,
    };
    if (message.type === 0) this.globalChat.push(message);
    else {
      this.messages.push(message);
      // let name: string;
      // if ()
    }
  }

  private addMessageToList(data: string): void {
    if (!this.messagesBox) return;
    const messageElement = document.createElement("li");
    messageElement.textContent = data;
    messageElement.className = "p-2 border-b border-gray-300";
    this.messagesBox.appendChild(messageElement);
    this.messagesBox.scrollTop = this.messagesBox.scrollHeight;
  }
}

customElements.define("pong-chat", ChatComponent);
