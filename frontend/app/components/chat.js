var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { fetchUserProfile, fetchUsers, fetchChats, fetchMessages } from "../utils/requests.js";
class ChatComponent extends HTMLElement {
    constructor() {
        super();
        this.user = null;
        this.users = [];
        this.messages = [];
        this.chats = null;
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
    load() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.getProfile();
            yield this.getUsers();
            yield this.getChats();
            this.connect();
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
            const data = JSON.parse(event.data);
            this.addMessageToList(data.sender, data.message);
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
    addEventListeners() {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m;
        const chatroomBtn = (_a = this.shadowRoot) === null || _a === void 0 ? void 0 : _a.getElementById('new-chatromm-btn');
        const chatroomDropdown = (_b = this.shadowRoot) === null || _b === void 0 ? void 0 : _b.getElementById('new-chatroom');
        const cancelBtn = (_c = this.shadowRoot) === null || _c === void 0 ? void 0 : _c.getElementById('cancel-channel');
        const createChnBtn = (_d = this.shadowRoot) === null || _d === void 0 ? void 0 : _d.getElementById('create-channel');
        const publicRadio = (_e = this.shadowRoot) === null || _e === void 0 ? void 0 : _e.getElementById('public');
        const privateRadio = (_f = this.shadowRoot) === null || _f === void 0 ? void 0 : _f.getElementById('private');
        const passwordContainer = (_g = this.shadowRoot) === null || _g === void 0 ? void 0 : _g.getElementById('password-container');
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
                if (publicRadio.checked)
                    passwordContainer.classList.add('hidden');
            });
        }
        if (privateRadio && passwordContainer) {
            privateRadio.addEventListener('change', () => {
                if (privateRadio.checked)
                    passwordContainer.classList.remove('hidden');
            });
        }
        if (createChnBtn && privateRadio && publicRadio && passwordContainer) {
            createChnBtn.addEventListener('click', () => {
                var _a, _b, _c;
                const passwordInput = passwordContainer.querySelector("input");
                const channelNameInput = (_a = this.shadowRoot) === null || _a === void 0 ? void 0 : _a.getElementById('channel-name');
                if (privateRadio.checked && passwordInput && passwordInput.value.trim() === "") {
                    alert("Type the password channel");
                    return;
                }
                if (publicRadio.checked) {
                    const msg = { type: 3, chatroom_name: channelNameInput.value };
                    (_b = this.socket) === null || _b === void 0 ? void 0 : _b.send(JSON.stringify(msg));
                }
                else {
                    const msg = { type: 3, chatroom_name: channelNameInput.value, password: passwordInput.value };
                    (_c = this.socket) === null || _c === void 0 ? void 0 : _c.send(JSON.stringify(msg));
                }
            });
        }
        const chatChannels = (_h = this.shadowRoot) === null || _h === void 0 ? void 0 : _h.querySelector("#chat-channels");
        const chatDMs = (_j = this.shadowRoot) === null || _j === void 0 ? void 0 : _j.querySelector("#chat-dms");
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
                btn.addEventListener("click", () => __awaiter(this, void 0, void 0, function* () {
                    console.log("Chatroom seleccionado:", chatroom.name);
                    if (this.currentChatHeader)
                        this.currentChatHeader.textContent = chatroom.name;
                    const chatId = chatroom.id;
                    const data = yield fetchMessages(chatId);
                    this.messages = data.messages;
                    this.messagesBox.innerHTML = "";
                    this.messages.forEach(msg => {
                        this.addMessageToList(msg.sender, msg.message);
                    });
                }));
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
                btn.addEventListener("click", () => __awaiter(this, void 0, void 0, function* () {
                    console.log("ChatDM seleccionado:", chat.other_user);
                    this.currentChat = chat.other_user;
                    if (this.currentChatHeader)
                        this.currentChatHeader.textContent = this.currentChat;
                    const chatId = chat.id;
                    const data = yield fetchMessages(chatId);
                    this.messages = data.messages;
                    this.messagesBox.innerHTML = "";
                    this.messages.forEach(msg => {
                        this.addMessageToList(msg.sender, msg.message);
                    });
                }));
                chatDMs.appendChild(btn);
            }
        }
        (_k = this.sendButton) === null || _k === void 0 ? void 0 : _k.addEventListener("click", () => {
            var _a, _b, _c, _d, _e, _f, _g, _h, _j;
            let toWho = (_b = (_a = this.currentChatHeader) === null || _a === void 0 ? void 0 : _a.textContent) !== null && _b !== void 0 ? _b : "";
            const isChatroom = (_e = (_d = (_c = this.chats) === null || _c === void 0 ? void 0 : _c.chatrooms) === null || _d === void 0 ? void 0 : _d.some(chatroom => chatroom.name === toWho)) !== null && _e !== void 0 ? _e : false;
            console.log(`El destinatary seria: ${toWho}`);
            const messageToSend = ((_f = this.messageInput) === null || _f === void 0 ? void 0 : _f.value) || "";
            if (messageToSend) {
                if (toWho === "GENERAL") {
                    const msg = { type: 0, message: messageToSend };
                    (_g = this.socket) === null || _g === void 0 ? void 0 : _g.send(JSON.stringify(msg));
                }
                else if (isChatroom) {
                    const msg = { type: 5, destinatary: toWho, message: messageToSend };
                    (_h = this.socket) === null || _h === void 0 ? void 0 : _h.send(JSON.stringify(msg));
                }
                else {
                    const msg = { type: 1, destinatary: toWho, message: messageToSend };
                    (_j = this.socket) === null || _j === void 0 ? void 0 : _j.send(JSON.stringify(msg));
                }
                if (this.messageInput)
                    this.messageInput.value = "";
            }
        });
        const newChatBtn = (_l = this.shadowRoot) === null || _l === void 0 ? void 0 : _l.querySelector("#new-chat-btn");
        const dropdown = (_m = this.shadowRoot) === null || _m === void 0 ? void 0 : _m.querySelector("#new-chat-dropdown");
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
    addMessageToList(sender, message) {
        if (!this.messagesBox)
            return;
        const messageElement = document.createElement("div");
        messageElement.textContent = `${sender}: ${message}`;
        messageElement.className = "p-2 border-b border-gray-300";
        this.messagesBox.appendChild(messageElement);
        this.messagesBox.scrollTop = this.messagesBox.scrollHeight;
    }
}
customElements.define("pong-chat", ChatComponent);
