var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { fetchUserProfile, fetchUsers, fetchChats } from "../utils/requests.js";
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
        this.attachShadow({ mode: "open" });
        this.load();
        this.connect();
    }
    load() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.getProfile();
            yield this.getUsers();
            yield this.getChats();
            this.render();
        });
    }
    getProfile() {
        return __awaiter(this, void 0, void 0, function* () {
            this.user = yield fetchUserProfile();
        });
    }
    getUsers() {
        return __awaiter(this, void 0, void 0, function* () {
            this.users = yield fetchUsers();
        });
    }
    getChats() {
        return __awaiter(this, void 0, void 0, function* () {
            this.chats = yield fetchChats();
        });
    }
    connect() {
        this.socket = new WebSocket("ws://localhost:8000/chat");
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
    addEventListeners() {
        var _a, _b, _c, _d;
        const chatList = (_a = this.shadowRoot) === null || _a === void 0 ? void 0 : _a.querySelector("#chat-list");
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
        (_b = this.sendButton) === null || _b === void 0 ? void 0 : _b.addEventListener("click", () => {
            var _a, _b;
            const messageToSend = ((_a = this.messageInput) === null || _a === void 0 ? void 0 : _a.value) || "";
            if (messageToSend) {
                const msg = {
                    sender: this.user.username,
                    type: 1,
                    destinatary: "alex",
                    message: messageToSend,
                    chatId: -1
                };
                (_b = this.socket) === null || _b === void 0 ? void 0 : _b.send(JSON.stringify(msg));
                if (this.messageInput)
                    this.messageInput.value = "";
            }
        });
        const newChatBtn = (_c = this.shadowRoot) === null || _c === void 0 ? void 0 : _c.querySelector("#new-chat-btn");
        const dropdown = (_d = this.shadowRoot) === null || _d === void 0 ? void 0 : _d.querySelector("#new-chat-dropdown");
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
                            participant: user,
                        };
                        if (!this.chats) {
                            this.chats = { oneToOneChats: [], chatrooms: [] };
                        }
                        this.chats.oneToOneChats.push(newChat);
                        console.log("Nuevo chat creado:", newChat);
                        dropdown.classList.add("hidden");
                        const chatList = (_a = this.shadowRoot) === null || _a === void 0 ? void 0 : _a.querySelector("#chat-list");
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
    addMessageToMessages(data) {
        const datas = data.split(":");
        const user = datas[0];
        const messageToPrint = datas.slice(1).join(":"); // Por si el mensaje contiene ":"
        const message = {
            sender: user,
            type: 0,
            destinatary: "",
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
