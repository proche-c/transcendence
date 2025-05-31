import { fetchUserProfile, fetchUsers, fetchChats, fetchMessages } from "../utils/requests.js";
import { SERVER_IP } from '../config.js';
class ChatComponent extends HTMLElement {
    constructor() {
        super();
        this.user = null;
        this.users = [];
        this.messages = [];
        this.chats = null;
        this.globalChat = [];
        this.messagesBox = null;
        this.messageInput = null;
        this.sendButton = null;
        this.socket = null;
        this.currentChat = "GENERAL";
        this.currentChatHeader = null;
        this.attachShadow({ mode: "open" });
        this.load();
        ;
    }
    async load() {
        await this.getProfile();
        await this.getUsers();
        await this.getChats();
        this.connect(); // <-- Mueve connect aquí
        this.render();
    }
    async getProfile() {
        this.user = await fetchUserProfile();
        // console.log("el user es ");
        // console.log(this.user);
    }
    async getUsers() {
        this.users = await fetchUsers();
    }
    async getChats() {
        this.chats = await fetchChats();
    }
    connect() {
        this.socket = new WebSocket(`wss://${SERVER_IP}:8443/api/chat`);
        console.log(this.socket);
        this.socket.onmessage = (event) => {
            console.log("data que recibo:", event.data);
            this.addMessageToMessages(event.data);
            this.addMessageToList(event.data);
        };
    }
    render() {
        if (!this.shadowRoot)
            return;
        const style = document.createElement("link");
        style.rel = "stylesheet";
        style.href = "./app/tailwind.css";
        console.log("el user es ");
        console.log(this.user);
        const avatar = this.user.avatar;
        const avatarUrl = `https://${SERVER_IP}:8443/api/static/${avatar}`;
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
    addEventListeners() {
        var _a, _b, _c, _d, _e;
        const chatChannels = (_a = this.shadowRoot) === null || _a === void 0 ? void 0 : _a.querySelector("#chat-channels");
        const chatDMs = (_b = this.shadowRoot) === null || _b === void 0 ? void 0 : _b.querySelector("#chat-dms");
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
                btn.addEventListener("click", () => {
                    console.log("Chatroom seleccionado:", chatroom.name);
                    if (this.currentChatHeader)
                        this.currentChatHeader.textContent = chatroom.name;
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
                btn.addEventListener("click", async () => {
                    console.log("ChatDM seleccionado:", chat.other_user);
                    this.currentChat = chat.other_user;
                    if (this.currentChatHeader)
                        this.currentChatHeader.textContent = this.currentChat;
                    const chatId = chat.id;
                    await fetchMessages(chatId);
                });
                chatDMs.appendChild(btn);
            }
        }
        (_c = this.sendButton) === null || _c === void 0 ? void 0 : _c.addEventListener("click", () => {
            var _a, _b, _c, _d;
            let toWho = (_b = (_a = this.currentChatHeader) === null || _a === void 0 ? void 0 : _a.textContent) !== null && _b !== void 0 ? _b : "";
            console.log(`El destinatary seria: ${toWho}`);
            const messageToSend = ((_c = this.messageInput) === null || _c === void 0 ? void 0 : _c.value) || "";
            if (messageToSend) {
                const msg = {
                    sender: this.user.username,
                    type: 1,
                    destinatary: toWho,
                    message: messageToSend,
                    chatId: -1
                };
                (_d = this.socket) === null || _d === void 0 ? void 0 : _d.send(JSON.stringify(msg));
                if (this.messageInput)
                    this.messageInput.value = "";
            }
        });
        const newChatBtn = (_d = this.shadowRoot) === null || _d === void 0 ? void 0 : _d.querySelector("#new-chat-btn");
        const dropdown = (_e = this.shadowRoot) === null || _e === void 0 ? void 0 : _e.querySelector("#new-chat-dropdown");
        newChatBtn === null || newChatBtn === void 0 ? void 0 : newChatBtn.addEventListener("click", () => {
            if (!dropdown)
                return;
            dropdown.classList.toggle("hidden");
            if (dropdown.childNodes.length === 0) {
                this.users.forEach(user => {
                    if (user.username === this.user.username)
                        return;
                    const userBtn = document.createElement("button");
                    userBtn.textContent = user.username;
                    userBtn.className = "text-left p-2 hover:bg-violet-100 w-full";
                    userBtn.addEventListener("click", () => {
                        var _a;
                        const newChat = {
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
                        const chatDMS = (_a = this.shadowRoot) === null || _a === void 0 ? void 0 : _a.querySelector("#chat-dms");
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
    addMessageToMessages(data) {
        var _a, _b;
        let toWho = (_b = (_a = this.currentChatHeader) === null || _a === void 0 ? void 0 : _a.textContent) !== null && _b !== void 0 ? _b : "";
        console.log(`El destinatary seria: ${toWho}`);
        const datas = data.split(":");
        const user = datas[0];
        const messageToPrint = datas.slice(1).join(":"); // Por si el mensaje contiene ":"
        const message = {
            sender: user,
            type: 1,
            destinatary: toWho,
            message: messageToPrint,
            chatId: -1
        };
        this.globalChat.push(message);
    }
    addMessageToList(data) {
        if (!this.messagesBox)
            return;
        const messageElement = document.createElement("div");
        messageElement.textContent = data;
        messageElement.className = "p-2 border-b border-gray-300";
        this.messagesBox.appendChild(messageElement);
        this.messagesBox.scrollTop = this.messagesBox.scrollHeight;
    }
}
customElements.define("pong-chat", ChatComponent);
