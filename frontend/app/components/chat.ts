import { fetchUserProfile, fetchUsers, fetchChats, User, Chat, Message, ChatData, OneToOneChat } from "../utils/requests.js";


class ChatComponent extends HTMLElement {
	private user: User | any | null = null;
	private users: Array<User> = [];
	private messages: Array<Message> = [];
	private chats: ChatData | null = null;
	private globalChat: Array<Message> = [];
	private messagesBox: HTMLElement | null = null;
	private messageInput: HTMLInputElement | null = null;
	private sendButton: HTMLElement | null = null;
	private socket: WebSocket | null = null;

	constructor() {
		super();
		this.attachShadow({ mode: "open" });
		this.load();
		this.connect();
	}

	private async load() {
		await this.getProfile();
		await this.getUsers();
		await this.getChats();
		this.render();
	}

	private async getProfile() {
		this.user = await fetchUserProfile();
	}

	private async getUsers() {
		this.users = await fetchUsers();
	}

	private async getChats() {
		this.chats = await fetchChats();
	}

	private connect() {
		this.socket = new WebSocket("ws://localhost:8000/chat");

		this.socket.onmessage = (event) => {
			console.log("data que recibo:", event.data);
			this.addMessageToMessages(event.data);
			this.addMessageToList(event.data);
		};
	}

	private render(): void {
		if (!this.shadowRoot) return;

		const style = document.createElement("link");
		style.rel = "stylesheet";
		style.href = "./app/tailwind.css";

		const avatar = this.user.avatar;
		const avatarUrl = `http://localhost:8000/static/${avatar}`;

		this.shadowRoot.innerHTML = `
			<div class="flex h-screen items-center">
				<div><pong-menu></pong-menu></div>
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
							<div class="flex items-center h-full border-r border-violet-300 pr-2">
								<div class="flex h-5/8 w-8 md:w-24 flex-col items-center justify-around border-e border-violet-700 bg-violet-100 rounded-4xl px-2 ml-4">
									<div id="newChat" class="relative">
										<button id="new-chat-btn" class="flex flex-col items-center">➕<span class="text-[10px]">New chat</span></button>
										<div id="new-chat-dropdown" class="absolute hidden z-50 bg-white border border-gray-300 rounded shadow flex-col min-w-[100px]"></div>
									</div>
								</div>
							</div>
							<div class="flex flex-col flex-[1] border-r border-violet-300">
								<h2 class="text-center border-b border-violet-600 m-2 p-3">Chats</h2>
								<div id="chat-list" class="flex bg-neutral-50 flex-col flex-grow rounded-b-2xl"></div>
							</div>
							<div class="flex flex-col flex-[2]">
								<h2 class="text-center border-b border-violet-600 m-2 p-3">Messages</h2>
								<div id="messages" class="flex flex-col flex-grow p-2 overflow-y-auto max-h-[400px] bg-white rounded-b-2xl border-b border-gray-300"></div>
								<div class="flex p-2 border-t border-gray-300">
									<input id="message" class="flex-grow p-2 border border-gray-300 rounded-l-md" placeholder="Type a message..." />
									<button id="send" class="bg-violet-500 text-white px-4 py-2 rounded-r-md hover:bg-violet-600">Send</button>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		`;

		this.shadowRoot.appendChild(style);
		this.messagesBox = this.shadowRoot.querySelector("#messages");
		this.messageInput = this.shadowRoot.querySelector("#message");
		this.sendButton = this.shadowRoot.querySelector("#send");

		this.addEventListeners();
	}

	private addEventListeners(): void {
		const chatList = this.shadowRoot?.querySelector("#chat-list");

		if (chatList && this.chats) {
			// Chats one-to-one
			for (const oneToOne of this.chats.oneToOneChats) {
				const btn = document.createElement("button");
				btn.textContent = oneToOne.participant.username;
				btn.className = "text-left p-2 hover:bg-violet-100 w-full border-b border-gray-300";
				btn.addEventListener("click", () => {
					console.log("Chat one-to-one seleccionado:", oneToOne.participant.username);
				});
				chatList.appendChild(btn);
			}
			// Chatrooms
			for (const chatroom of this.chats.chatrooms) {
				const btn = document.createElement("button");
				btn.textContent = chatroom.name;
				btn.className = "text-left p-2 hover:bg-violet-100 w-full border-b border-gray-300";
				btn.addEventListener("click", () => {
					console.log("Chatroom seleccionado:", chatroom.name);
				});
				chatList.appendChild(btn);
			}
		}

		this.sendButton?.addEventListener("click", () => {
			const messageToSend = this.messageInput?.value || "";
			if (messageToSend) {
				const msg: Message = {
					sender: this.user.username,
					type: 0,
					destinatary: "",
					message: messageToSend,
					chatId: -1
				};
				this.socket?.send(JSON.stringify(msg));
				if (this.messageInput) this.messageInput.value = "";
			}
		});

		const newChatBtn = this.shadowRoot?.querySelector("#new-chat-btn") as HTMLElement;
		const dropdown = this.shadowRoot?.querySelector("#new-chat-dropdown") as HTMLElement;

		newChatBtn?.addEventListener("click", () => {
			if (!dropdown) return;

			dropdown.classList.toggle("hidden");

			if (dropdown.childNodes.length === 0) {
				this.users.forEach(user => {
					if (user.username === this.user.username) return;
					const userBtn = document.createElement("button");
					userBtn.textContent = user.username;
					userBtn.className = "text-left p-2 hover:bg-violet-100 w-full";
					userBtn.addEventListener("click", () => {
						const newChat: OneToOneChat = {
							id: -1,
							participant: user,
						};
						if (!this.chats) {
							this.chats = { oneToOneChats: [], chatrooms: [] };
						}
						this.chats.oneToOneChats.push(newChat);
						console.log("Nuevo chat creado:", newChat);
						dropdown.classList.add("hidden");

						const chatList = this.shadowRoot?.querySelector("#chat-list");
						if (chatList) {
							const btn = document.createElement("button");
							btn.textContent = user.username;
							btn.className = "text-left p-2 hover:bg-violet-100 w-full border-b border-gray-300";
							btn.addEventListener("click", () => {
								console.log("Chat one-to-one seleccionado:", user.username);
							});
							chatList.appendChild(btn);
						}
					});
					dropdown.appendChild(userBtn);
				});
			}

			const btnRect = newChatBtn.getBoundingClientRect();
			dropdown.style.position = "absolute";
			dropdown.style.top = `${newChatBtn.offsetTop}px`;
			dropdown.style.left = `${newChatBtn.offsetLeft + newChatBtn.offsetWidth + 8}px`;
		});
	}

	private addMessageToMessages(data: string): void {
		const datas = data.split(":");
		const user = datas[0];
		const messageToPrint = datas.slice(1).join(":"); // Por si el mensaje contiene ":"
		const message: Message = {
			sender: user,
			type: 0,
			destinatary: "",
			message: messageToPrint,
			chatId: -1
		};
		this.globalChat.push(message);
	}

	private addMessageToList(data: string): void {
		if (!this.messagesBox) return;
		const messageElement = document.createElement("div");
		messageElement.textContent = data;
		messageElement.className = "p-2 border-b border-gray-300";
		this.messagesBox.appendChild(messageElement);
		this.messagesBox.scrollTop = this.messagesBox.scrollHeight;
	}
}

customElements.define("pong-chat", ChatComponent);