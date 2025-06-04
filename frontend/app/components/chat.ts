import { fetchUserProfile, fetchUsers, fetchChats, fetchMessages, User, Chat, Message, ChatData, OneToOneChat } from "../utils/requests.js";

class ChatComponent extends HTMLElement {
	private user: User | any | null = null;
	private users: Array<User> = [];
	private messages: Array<Message> = [];
	private chats: ChatData | null = null;
	private messagesBox: HTMLElement | null = null;
	private messageInput: HTMLInputElement | null = null;
	private sendButton: HTMLElement | null = null;
	private socket: WebSocket | null = null;
	private currentChat: string = "GENERAL";
	private currentChatHeader: HTMLElement | null = null;

	constructor() {
		super();
		this.attachShadow({ mode: "open" });
		this.load();;
	}

	private async load() {
		await this.getProfile();
		await this.getUsers();
		await this.getChats();
		this.connect(); 
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
			const data = JSON.parse(event.data);
			this.addMessageToList(data.sender, data.message);
		};
	}

	private render(): void {
		if (!this.shadowRoot) return;

		const style = document.createElement("link");
		style.rel = "stylesheet";
		style.href = "./app/tailwind.css";
		console.log("el user es ");
		console.log(this.user);

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
									<div id="newChatroom" class="relative">
										<button id="new-chatromm-btn" class="flex flex-col items-center">➕<span class="text-[10px]">New channel</span></button>
										<div id="new-chatroom" class="absolute hidden z-50 bg-white border border-gray-300 rounded shadow p-4 flex-col min-w-[200px] space-y-2">
											<input type="text" id="channel-name" class="border p-1 w-full rounded" placeholder="Channel name" />

											<div class="flex gap-2 items-center">
												<input type="radio" name="privacy" id="public" value="public" checked />
												<label for="public">Public</label>

												<input type="radio" name="privacy" id="private" value="private" />
												<label for="private">Private</label>
											</div>

											<div id="password-container" class="hidden">
												<input type="password" id="channel-password" class="border p-1 w-full rounded" placeholder="Password" />
											</div>

											<div class="flex justify-end gap-2">
												<button id="cancel-channel" class="text-sm bg-gray-200 px-3 py-1 rounded hover:bg-gray-300">Cancel</button>
												<button id="create-channel" class="text-sm bg-violet-500 text-white px-3 py-1 rounded hover:bg-violet-600">Create</button>
											</div>
										</div>
									</div>
									<div id="joinChannel" class="relative">
										<button id="new-chat-btn" class="flex flex-col items-center">⊕<span class="text-[10px]">Join channel</span></button>
										<div id="join-channel-dropdown" class="absolute hidden z-50 bg-white border border-gray-300 rounded shadow flex-col min-w-[100px]"></div>
									</div>
								</div>
							</div>
							<div class="flex flex-col flex-[1] border-r border-violet-300">
								<div id="chat-channels" class="flex bg-neutral-50 flex-col rounded-b-2xl"></div>
								<div id="chat-dms" class="flex bg-neutral-50 flex-col flex-grow rounded-b-2xl"></div>
							</div>
							<div class="flex flex-col flex-[2]">
								<h2 id="current-chat" class="text-center border-b border-violet-600 m-2 p-3">${this.currentChat}</h2>
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
		this.currentChatHeader = this.shadowRoot.querySelector("#current-chat");

		this.addEventListeners();
	}

	private addEventListeners(): void {
		const chatroomBtn = this.shadowRoot?.getElementById('new-chatromm-btn');
		const chatroomDropdown = this.shadowRoot?.getElementById('new-chatroom');
		const cancelBtn = this.shadowRoot?.getElementById('cancel-channel');
		const createChnBtn = this.shadowRoot?.getElementById('create-channel');
		const publicRadio = this.shadowRoot?.getElementById('public') as HTMLInputElement | null;
		const privateRadio = this.shadowRoot?.getElementById('private') as HTMLInputElement | null;
		const passwordContainer = this.shadowRoot?.getElementById('password-container');

		if (chatroomBtn && chatroomDropdown) {
			chatroomBtn.addEventListener('click', () => {
				chatroomDropdown.classList.remove('hidden');
			});
		}

		if (cancelBtn && chatroomDropdown) {
			cancelBtn.addEventListener('click', () => {
				chatroomDropdown.classList.add('hidden');
			});
		}

		if (publicRadio && passwordContainer) {
			publicRadio.addEventListener('change', () => {
				if (publicRadio.checked) passwordContainer.classList.add('hidden');
			});
		}

		if (privateRadio && passwordContainer) {
			privateRadio.addEventListener('change', () => {
				if (privateRadio.checked) passwordContainer.classList.remove('hidden');
			});
		}

		if (createChnBtn && privateRadio && publicRadio && passwordContainer) {
			createChnBtn.addEventListener('click', () => {
				const passwordInput = passwordContainer.querySelector("input") as HTMLInputElement;
				const channelNameInput = this.shadowRoot?.getElementById('channel-name') as HTMLInputElement;
				if (privateRadio.checked && passwordInput && passwordInput.value.trim() === "") {
					alert("Type the password channel");
					return;  
				}
				if (publicRadio.checked) {
					const msg = { type: 3, chatroom_name: channelNameInput.value };
					this.socket?.send(JSON.stringify(msg));
				} else {
					const msg = { type: 3, chatroom_name: channelNameInput.value, password: passwordInput.value };
					this.socket?.send(JSON.stringify(msg));					
				}

			});
		}

		const chatChannels = this.shadowRoot?.querySelector("#chat-channels");
		const chatDMs = this.shadowRoot?.querySelector("#chat-dms");

		if (chatChannels && this.chats) {
			const labelChannels = document.createElement("h2");
			labelChannels.textContent = "Channels";
			labelChannels.className = "text-left italic font-bold p-2 w-full border-b border-gray-400 bg-gray-100";
			chatChannels.appendChild(labelChannels);

			const btn = document.createElement("button");
			btn.textContent = "GENERAL";
			btn.className = "text-left p-3 hover:bg-violet-100 w-full border-b border-gray-300";
			btn.addEventListener("click", () => {
				console.log("Chatroom seleccted: GENERAL");
				this.currentChat = "GENERAL";
				if (this.currentChatHeader)
					this.currentChatHeader.textContent = "GENERAL";
			});
			chatChannels.appendChild(btn);

			for (const chatroom of this.chats.chatrooms) {
				const btn = document.createElement("button");
				btn.textContent = chatroom.name;
				btn.className = "text-left p-2 hover:bg-violet-100 w-full border-b border-gray-300";
				btn.addEventListener("click", async () => {
					console.log("Chatroom seleccionado:", chatroom.name);
					if (this.currentChatHeader)
						this.currentChatHeader.textContent = chatroom.name;
					const chatId = chatroom.id;
					const data = await fetchMessages(chatId);
					this.messages = data.messages;
					this.messagesBox!.innerHTML = "";
					this.messages.forEach(msg => {
						this.addMessageToList(msg.sender, msg.message);
					});
				});
				chatChannels.appendChild(btn);
			}
		}

		if (chatDMs && this.chats) {
			const labelDMs = document.createElement("h2");
			labelDMs.textContent = "DMs";
			labelDMs.className = "text-left italic font-bold p-2 w-full border-b border-gray-400 bg-gray-100";
			chatDMs.appendChild(labelDMs);
		
			for (const chat of this.chats.oneToOneChats) {
				const btn = document.createElement("button");
				btn.textContent = chat.other_user;
				btn.className = "text-left p-2 hover:bg-violet-100 w-full border-b border-gray-300";
				console.log(`Èl chatId de ${chat.other_user} es ${chat.id} `);
				btn.addEventListener("click",async () => {
					console.log("ChatDM seleccionado:", chat.other_user);
					this.currentChat = chat.other_user;
					if (this.currentChatHeader)
						this.currentChatHeader.textContent = this.currentChat;
					const chatId = chat.id;
					const data = await fetchMessages(chatId);
					this.messages = data.messages;
					this.messagesBox!.innerHTML = "";
					this.messages.forEach(msg => {
						this.addMessageToList(msg.sender, msg.message);
					});
					
				});
				chatDMs.appendChild(btn);
			}
		}

		this.sendButton?.addEventListener("click", () => {
			let toWho: string  = this.currentChatHeader?.textContent ?? "";
			const isChatroom = this.chats?.chatrooms?.some(chatroom => chatroom.name === toWho) ?? false;
			console.log(`El destinatary seria: ${toWho}`);
			const messageToSend = this.messageInput?.value || "";
			if (messageToSend) {
				if (toWho === "GENERAL") {
					const msg = { type: 0, message: messageToSend };
					this.socket?.send(JSON.stringify(msg));
				} else if (isChatroom) {
					const msg = { type: 5, destinatary: toWho, message: messageToSend };
					this.socket?.send(JSON.stringify(msg));
				} else {
					const msg = { type: 1, destinatary: toWho, message: messageToSend };
					this.socket?.send(JSON.stringify(msg));					
				}
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
							other_user: user.username,
							avatar: "",
						};
						if (!this.chats) {
							this.chats = { oneToOneChats: [], chatrooms: [] };
						}
						this.chats.oneToOneChats.push(newChat);
						this.currentChat = newChat.other_user;
						if (this.currentChatHeader)
							this.currentChatHeader.textContent = this.currentChat;
						console.log("Nuevo chat creado:", newChat);
						dropdown.classList.add("hidden");

						const chatDMS = this.shadowRoot?.querySelector("#chat-dms");
						if (chatDMs) {
							const btn = document.createElement("button");
							btn.textContent = user.username;
							btn.className = "text-left p-2 hover:bg-violet-100 w-full border-b border-gray-300";
							btn.addEventListener("click", () => {
								console.log("Chat one-to-one seleccionado:", user.username);
								this.currentChat = newChat.other_user;
								if (this.currentChatHeader)
									this.currentChatHeader.textContent = this.currentChat;
							});
							chatDMs.appendChild(btn);
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

	private addMessageToList(sender: string, message: string): void {
		if (!this.messagesBox) return;
		const messageElement = document.createElement("div");
		messageElement.textContent = `${sender}: ${message}`
		messageElement.className = "p-2 border-b border-gray-300";
		this.messagesBox.appendChild(messageElement);
		this.messagesBox.scrollTop = this.messagesBox.scrollHeight;
	}
}

customElements.define("pong-chat", ChatComponent);