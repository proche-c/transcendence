import { fetchUserProfile, fetchUsers, fetchFriends, User } from "../utils/requests.js";

interface Data {
	user: string; // No lo necesitas porque lo tienes en el payload
	type: number; // 0 : global messages
	destinatary: string; // No te paso nada porque es global
	message: string;
	chatId: number;  // Te paso el chatId que ya lo tendre
}



interface Message {
	chat : number;
	type : number;
	sender: string;
	destinatary: string;
	message: string;
}

interface Chat {
	id : number;
	name: string;
	messages: Array<Message>;
}

class ChatComponent extends HTMLElement {
	private user: User | any | null = null;
	private users: Array<User> = [];
	private messages: Array<Data> = [];
	private chats: Array<Chat> = [];
	private globalChat: Array<Data> = [];
	private messagesBox: HTMLElement | null = null;
	private messageInput:  HTMLInputElement | null = null;
	private sendButton: HTMLElement | null = null;
	private socket: WebSocket | null = null;
	private responseUsers: Promise<Response> | null = null;
	constructor() {
		super();
		this.attachShadow({mode: "open"});
		this.load();
		this.connect();
	}

	private async load() {
		await this.getProfile();
		await this.getUsers();
		this.render();
		// this.updateData();
	}

	private async getProfile() {
		this.user = await fetchUserProfile();
		console.log("user:");
		console.log(this.user);
	}

	private async getUsers() {
		this.users = await fetchUsers();
		console.log(this.users);
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
		}
	}

	// private async getUsers() {
	// 	this.responseUsers = await fetchUsers();
	// }

	private render(): void {
		if(!this.shadowRoot)
			return;
		const style = document.createElement("link");
		style.rel = "stylesheet";
		style.href = "./app/tailwind.css"; // Asegúrate de que la ruta sea correcta

		const avatar = this.user.avatar;
		const avatarUrl = `http://localhost:8000/static/${avatar}`;

		this.shadowRoot.innerHTML = `
		<div class="flex h-screen items-center">
			<div>
				<pong-menu></pong-menu>
			</div>
			<div class="flex flex-col w-3/4 h-7/8">
				<div id="profileCard" class="absolute z-50 top-0 left-0 bg-white mt-8 ml-8"></div>
					<div class="flex flex-col items-center">
						<div class="w-16 h-16 rounded-full overflow-hidden border-4 border-black flex items-center justify-center bg-emerald-200">
							<img src="${avatarUrl}" class="w-full h-full object-cover" />
						</div>
						<div class="my-1">
							<p>${this.user.username}</p>
						</div>
					</div>
					<div class="flex grow ml-6 justify-center">
						<div class="bg-neutral-50 m-4 rounded-2xl flex flex-row w-full max-w-4xl border-2 border-violet-600">
							<div class="flex flex-col flex-[1] border-r border-violet-300">
								<h2 class="text-center border-b border-violet-600 m-2 p-3">Chats</h2>
								<div class="flex bg-neutral-50 flex-col flex-grow rounded-b-2xl">
								</div>
							</div>
							<div class="flex flex-col flex-[2]">
								<h2 class="text-center border-b border-violet-600 m-2 p-3">Messages</h2>
								<div class="flex bg-neutral-50 flex-col flex-grow rounded-b-2xl">
								</div>
							</div>
						</div>
					</div>

				</div>
		</div>
	`;
	

		this.shadowRoot.appendChild(style);
		this.messagesBox = this.shadowRoot.querySelector("#messages") as HTMLElement;
		this.messageInput = this.shadowRoot.querySelector("#message") as HTMLInputElement;
		this.sendButton = this.shadowRoot.querySelector("#send") as HTMLElement;
		// this.getUsers();
		this.addEventListeners();

		
	}

	private addEventListeners(): void {
		this.sendButton?.addEventListener("click", () => {
			const messageToSend = this.messageInput?.value || "";
			if (messageToSend) {
				const msg: Data = { user: "paula", type: 0, destinatary: "", message: messageToSend, chatId: -1};
				this.socket?.send(JSON.stringify(msg));
				if (this.messageInput)
					this.messageInput.value = "";
			}
		});
	}

	private addMessageToMessages(data: string): void {
		const datas = data.split(":");
		const user = datas[0];
		const messageToPrint = datas[1];
		const message: Data = { user: user, type: 0, destinatary: "", message: messageToPrint, chatId: -1};
		if (message.type === 0)
			this.globalChat.push(message);
		else {
			this.messages.push(message);
			// let name: string;
			// if ()
		}
	}

	private addMessageToList(data: string): void {
		if (!this.messagesBox)
			return ;
		const messageElement = document.createElement("li");
		messageElement.textContent = data;
		messageElement.className = "p-2 border-b border-gray-300";
		this.messagesBox.appendChild(messageElement);
		this.messagesBox.scrollTop = this.messagesBox.scrollHeight;
	}
}

customElements.define("pong-chat", ChatComponent);