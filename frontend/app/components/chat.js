import { fetchUserProfile, fetchUsers, fetchChats, fetchMessages, fetchMessagesChatroom, fetchChatRooms } from "../utils/requests.js";
import { SERVER_IP } from '../config.js';
class ChatComponent extends HTMLElement {
    constructor() {
        super();
        this.user = null;
        this.users = [];
        this.chatRooms = [];
        this.messages = [];
        this.chats = null;
        this.messagesBox = null;
        this.messageInput = null;
        this.sendButton = null;
        this.socket = null;
        this.currentChat = "GENERAL";
        this.currentChatHeader = null;
        this.chatChannels = null;
        this.chatDMs = null;
        this.attachShadow({ mode: "open" });
        this.load();
        ;
    }
    async load() {
        await this.getProfile();
        await this.getUsers();
        await this.getChats();
        await this.getChatRooms();
        this.connect();
        this.render();
    }
    async getProfile() {
        this.user = await fetchUserProfile();
    }
    async getUsers() {
        this.users = await fetchUsers();
    }
    async getChats() {
        this.chats = await fetchChats();
    }
    async getChatRooms() {
        this.chatRooms = await fetchChatRooms();
    }
    connect() {
        this.socket = new WebSocket(`wss://${SERVER_IP}:8443/api/chat`);
        const pingInterval = setInterval(() => {
            if (this.socket && this.socket.readyState === WebSocket.OPEN) {
                this.socket.send(JSON.stringify({ type: "ping" }));
            }
        }, 30000);
        this.socket.onclose = () => {
            clearInterval(pingInterval);
            console.log("Websocket connection closed");
        };
        this.socket.onmessage = (event) => {
            console.log(event);
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
        // console.log("el user es ");
        // console.log(this.user);
        const avatar = this.user.avatar;
        const avatarUrl = `https://${SERVER_IP}:8443/api/static/${avatar}`;
        this.shadowRoot.innerHTML = `
			<div class="flex h-screen items-center">
				<div><pong-menu></pong-menu></div> 
				<div class="flex flex-col flex-grow h-[87%] m-1">
					<pong-header></pong-header>
					<div class="flex flex-col grow">
						<div class="flex h-10 w-80 md:h-15 md:w-[600px] xl:w-[900px] items-center justify-around border-e border-violet-700 bg-violet-100 rounded-4xl px-1 m-1 mx-auto  md:text-[16px]">
							<div id="newChat" class="relative">
								<button id="new-chat-btn" class="flex flex-col items-center">➕<span class="text-[10px] md:text-[16px]">New chat</span></button>
								<div id="new-chat-dropdown" class="absolute hidden z-50 bg-white border border-gray-300 rounded shadow flex-col min-w-[100px]"></div>
							</div>
							<div id="newChatroom" class="relative">
								<button id="new-chatromm-btn" class="flex flex-col items-center">➕<span class="text-[10px] md:text-[16px]">New channel</span></button>
								<div id="new-chatroom" class="absolute hidden z-50 bg-white border border-gray-300 rounded shadow p-4 flex-col min-w-[200px] space-y-2">
									<input type="text" id="channel-name" class="border p-1 w-full rounded text-[11px]" placeholder="Channel name" />

									<div class="flex gap-2 items-center  text-[10px] md:text-[16px]">
										<input type="radio" name="privacy" id="public" value="public" checked />
										<label for="public">Public</label>

										<input type="radio" name="privacy" id="private" value="private" />
										<label for="private">Private</label>
									</div>

									<div id="password-container" class="hidden text-[10px] md:text-[16px]">
										<input type="password" id="channel-password" class="border p-1 w-full rounded" placeholder="Password" />
									</div>

									<div class="flex justify-end gap-2">
										<button id="cancel-channel" class=" text-[11px] md:text-[16px] bg-gray-200 px-2 py-1 rounded hover:bg-gray-300">Cancel</button>
										<button id="create-channel" class=" text-[11px] md:text-[16px] bg-violet-500 text-white px-2 py-1 rounded hover:bg-violet-600">Create</button>
									</div>
								</div>
							</div>
							<div id="joinChannel" class="relative">
								<button id="join-chatroom-btn" class="flex flex-col items-center">⊕<span class="text-[10px] md:text-[16px]">Join channel</span></button>
								<div id="join-chatroom-dropdown" class="absolute hidden z-50 bg-white border border-gray-300 rounded shadow flex-col min-w-[100px]"></div>
							</div>
							<div id="blockUser" class="relative">
								<button id="block-user-btn" class="flex flex-col items-center">➖<span class="text-[10px] md:text-[16px]">Block user</span></button>
								<div id="block-user-dropdown" class="absolute hidden z-50 bg-white border border-gray-300 rounded shadow flex-col min-w-[100px]"></div>
							</div>
						</div>
						<div class=" m-1 p-1 rounded-2xl flex flex-row w-80 h-96  md:w-[600px] md:h-[400px] xl:w-[900px] xl:h-[500px] overflow-hidden  max-w-4xl border-2 border-violet-600 mx-auto bg-neutral-100">
							<div class="flex flex-col flex-[1] border-r border-violet-300 overflow-auto">
								<div id="chat-channels" class="flex bg-neutral-50 flex-col rounded-t-2xl"></div>
								<div id="chat-dms" class="flex bg-neutral-50 flex-col flex-grow rounded-b-2xl"></div>
							</div>
							<div id="profileCard" class="fixed z-50 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"></div>
							<div class="flex flex-col flex-[2]">
			
								<div class="flex items-center justify-between border-b border-violet-600 m-1 p-1">
									<h2 id="current-chat" class="text-center flex-grow text-[13px] md:text-[18px]">${this.currentChat}</h2>
								</div>
								<div id="messages" class="flex flex-col flex-grow p-2 overflow-y-auto max-h-[400px] bg-white rounded-b-2xl border-b border-gray-300"></div>
								<div class="flex p-2 border-t border-gray-300">
									<input id="message" class="flex-grow p-2 border border-gray-300 rounded-l-md  text-[12px] md:text-[18px]" placeholder="Type a message..." />
									<button id="send" class="bg-violet-500 text-white px-4 py-2 rounded-r-md hover:bg-violet-600 text-[12px] md:text-[18px]">Send</button>
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
        var _a;
        this.printListChannels();
        this.newChat();
        this.createChannel();
        this.joinChannel();
        this.blockUser();
        (_a = this.sendButton) === null || _a === void 0 ? void 0 : _a.addEventListener("click", () => {
            var _a, _b, _c, _d, _e, _f, _g, _h, _j;
            let toWho = (_b = (_a = this.currentChatHeader) === null || _a === void 0 ? void 0 : _a.textContent) !== null && _b !== void 0 ? _b : "";
            const isChatroom = (_e = (_d = (_c = this.chats) === null || _c === void 0 ? void 0 : _c.chatrooms) === null || _d === void 0 ? void 0 : _d.some(chatroom => chatroom.name === toWho)) !== null && _e !== void 0 ? _e : false;
            // console.log(`El destinatary seria: ${toWho}`);
            const messageToSend = ((_f = this.messageInput) === null || _f === void 0 ? void 0 : _f.value) || "";
            if (messageToSend) {
                if (toWho === "GENERAL") {
                    const msg = { type: 0, message: messageToSend };
                    (_g = this.socket) === null || _g === void 0 ? void 0 : _g.send(JSON.stringify(msg));
                }
                else if (isChatroom) {
                    const msg = { type: 5, chatroom_name: toWho, message: messageToSend };
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
        // const allProfileButtons = [
        // 	...this.shadowRoot?.querySelectorAll(".user-button") ?? [],
        // 	...this.shadowRoot?.querySelectorAll(".friend-button") ?? []
        // ];
        // allProfileButtons.forEach((button) => {
        // 	button.addEventListener("click", (event) => {
        // 		const target = event.currentTarget as HTMLElement;
        // 		const username = target.getAttribute("data-username") || target.getAttribute("data-friendname");
        // 		if (username) {
        // 			this.showUserProfile(username);
        // 		}
        // 	});
        // });
    }
    showUserProfile(username) {
        var _a;
        const profileCard = (_a = this.shadowRoot) === null || _a === void 0 ? void 0 : _a.querySelector("#profileCard");
        if (profileCard) {
            profileCard.innerHTML = "";
            const publicProfile = document.createElement("pong-public-profile");
            publicProfile.setAttribute("username", username);
            profileCard.appendChild(publicProfile);
        }
    }
    async printListChannels() {
        var _a, _b;
        this.chatChannels = (_a = this.shadowRoot) === null || _a === void 0 ? void 0 : _a.querySelector("#chat-channels");
        this.chatDMs = (_b = this.shadowRoot) === null || _b === void 0 ? void 0 : _b.querySelector("#chat-dms");
        if (this.chatChannels && this.chatDMs) {
            this.chatChannels.innerHTML = "";
            this.chatDMs.innerHTML = "";
        }
        if (this.chatChannels && this.chats) {
            const labelChannels = document.createElement("h2");
            labelChannels.textContent = "Channels";
            labelChannels.className = "text-left italic font-bold p-1 w-full border-b border-gray-400 bg-gray-100 text-[11px] md:text-[16px] rounded-t";
            this.chatChannels.appendChild(labelChannels);
            const btn = document.createElement("button");
            btn.textContent = "GENERAL";
            btn.className = "text-left p-1 hover:bg-violet-100 w-full border-b border-gray-300 text-[11px] md:text-[16px]";
            btn.addEventListener("click", () => {
                this.updateCurrentChat("GENERAL");
            });
            this.chatChannels.appendChild(btn);
            for (const chatroom of this.chats.chatrooms) {
                const btn = document.createElement("button");
                btn.textContent = chatroom.name;
                btn.className = "text-left p-1 hover:bg-violet-100 w-full border-b border-gray-300 text-[11px] md:text-[16px]";
                btn.addEventListener("click", async () => {
                    this.updateCurrentChat(chatroom.name);
                    this.printChatroomMessages(chatroom.id);
                });
                this.chatChannels.appendChild(btn);
            }
        }
        if (this.chatDMs && this.chats) {
            const labelDMs = document.createElement("h2");
            labelDMs.textContent = "DMs";
            labelDMs.className = "text-left italic font-bold p-1 w-full border-b border-gray-400 bg-gray-100 text-[11px] md:text-[16px]";
            this.chatDMs.appendChild(labelDMs);
            for (const chat of this.chats.oneToOneChats) {
                const btn = document.createElement("button");
                btn.textContent = chat.other_user;
                btn.className = "text-left p-1 hover:bg-violet-100 w-full border-b border-gray-300 text-[11px] md:text-[16px]";
                btn.addEventListener("click", async (event) => {
                    const target = event.currentTarget;
                    const username = chat.other_user;
                    if (username) {
                        this.showUserProfile(username);
                    }
                    this.updateCurrentChat(chat.other_user);
                    this.printChatMessages(chat.id);
                });
                this.chatDMs.appendChild(btn);
            }
        }
    }
    async newChat() {
        var _a, _b;
        await this.getUsers();
        const newChatBtn = (_a = this.shadowRoot) === null || _a === void 0 ? void 0 : _a.querySelector("#new-chat-btn");
        const dropdown = (_b = this.shadowRoot) === null || _b === void 0 ? void 0 : _b.querySelector("#new-chat-dropdown");
        newChatBtn === null || newChatBtn === void 0 ? void 0 : newChatBtn.addEventListener("click", () => {
            var _a;
            if (!dropdown)
                return;
            dropdown.classList.toggle("hidden");
            dropdown.innerHTML = "";
            if (dropdown.childNodes.length === 0) {
                this.users.forEach(user => {
                    var _a;
                    if (user.username === this.user.username || ((_a = this.chats) === null || _a === void 0 ? void 0 : _a.oneToOneChats.some(chat => chat.other_user === user.username)))
                        return;
                    const userBtn = document.createElement("button");
                    userBtn.textContent = user.username;
                    userBtn.className = "text-left p-1 hover:bg-violet-100 w-full text-[11px] md:text-[16px]";
                    userBtn.addEventListener("click", () => {
                        const newChat = { id: -1, other_user: user.username, avatar: "" };
                        if (!this.chats) {
                            this.chats = { oneToOneChats: [], chatrooms: [] };
                        }
                        this.chats.oneToOneChats.push(newChat);
                        this.updateCurrentChat(newChat.other_user);
                        dropdown.classList.add("hidden");
                        this.printListChannels();
                    });
                    dropdown.appendChild(userBtn);
                });
            }
            // Corrige la posición absoluta con respecto al botón
            const dropdownRect = dropdown.getBoundingClientRect();
            const buttonRect = newChatBtn.getBoundingClientRect();
            const containerRect = (_a = this.shadowRoot) === null || _a === void 0 ? void 0 : _a.host.getBoundingClientRect();
            const spaceRight = window.innerWidth - buttonRect.right;
            const spaceLeft = buttonRect.left;
            dropdown.style.position = "absolute";
            dropdown.style.top = `${newChatBtn.offsetTop + newChatBtn.offsetHeight}px`;
            if (spaceRight >= dropdownRect.width) {
                // suficiente espacio a la derecha
                dropdown.style.left = `${newChatBtn.offsetLeft + 8}px`;
                dropdown.style.right = "auto";
            }
            else {
                // despliega a la izquierda
                dropdown.style.left = "auto";
                dropdown.style.right = "0px";
            }
        });
    }
    createChannel() {
        var _a, _b, _c, _d, _e, _f, _g;
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
        if (createChnBtn && privateRadio && publicRadio && passwordContainer && chatroomDropdown) {
            createChnBtn.addEventListener('click', () => {
                var _a, _b, _c, _d;
                chatroomDropdown.classList.add('hidden');
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
                    const msg = { type: 3, chatroom_name: channelNameInput.value, password: passwordInput.value, is_private: true };
                    (_c = this.socket) === null || _c === void 0 ? void 0 : _c.send(JSON.stringify(msg));
                }
                this.updateCurrentChat(channelNameInput.value);
                const newChatroom = { id: -1, name: channelNameInput.value, is_private: privateRadio.checked };
                (_d = this.chats) === null || _d === void 0 ? void 0 : _d.chatrooms.push(newChatroom);
                this.updateCurrentChat(channelNameInput.value);
                chatroomDropdown.classList.add('hidden');
                channelNameInput.value = "";
                this.printListChannels();
            });
        }
    }
    async joinChannel() {
        var _a, _b;
        await this.getChatRooms();
        // console.log("en web component this.chatrooms:");
        // console.log(this.chatRooms);
        const newChatroomBtn = (_a = this.shadowRoot) === null || _a === void 0 ? void 0 : _a.querySelector("#join-chatroom-btn");
        const dropdown = (_b = this.shadowRoot) === null || _b === void 0 ? void 0 : _b.querySelector("#join-chatroom-dropdown");
        newChatroomBtn === null || newChatroomBtn === void 0 ? void 0 : newChatroomBtn.addEventListener("click", () => {
            if (!dropdown)
                return;
            dropdown.classList.toggle("hidden");
            dropdown.innerHTML = "";
            if (dropdown.childNodes.length === 0) {
                this.chatRooms.forEach(chatroom => {
                    var _a;
                    if ((_a = this.chats) === null || _a === void 0 ? void 0 : _a.chatrooms.some(chat => chat.name === chatroom.name))
                        return;
                    const wrapper = document.createElement("div");
                    wrapper.className = "flex flex-col p-2 border-b border-gray-200 text-[11px] md:text-[16px]";
                    const userBtn = document.createElement("button");
                    userBtn.textContent = chatroom.name;
                    userBtn.className = "text-left p-2 hover:bg-violet-100 w-full text-[11px] md:text-[16px]";
                    wrapper.appendChild(userBtn);
                    dropdown.appendChild(wrapper);
                    userBtn.addEventListener("click", () => {
                        var _a;
                        // console.log("en join channel, el chatroom que he pulsado:");
                        // console.log(chatroom);
                        if (!chatroom.is_private) {
                            const msg = { type: 4, chatroom_name: chatroom.name };
                            (_a = this.socket) === null || _a === void 0 ? void 0 : _a.send(JSON.stringify(msg));
                            const newChatroom = { id: -1, name: chatroom.name, is_private: false };
                            if (!this.chats) {
                                this.chats = { oneToOneChats: [], chatrooms: [] };
                            }
                            this.chats.chatrooms.push(newChatroom);
                            this.updateCurrentChat(chatroom.name);
                            dropdown.classList.add("hidden");
                            this.printListChannels();
                            return;
                        }
                        if (wrapper.querySelector("input"))
                            return;
                        const passwordInput = document.createElement("input");
                        passwordInput.type = "password";
                        passwordInput.placeholder = "Password";
                        passwordInput.className = "border p-1 rounded w-full mt-2";
                        const joinBtn = document.createElement("button");
                        joinBtn.textContent = "Join";
                        joinBtn.className = "bg-violet-500 text-white px-3 py-1 rounded mt-2 hover:bg-violet-600";
                        joinBtn.addEventListener("click", () => {
                            var _a;
                            const password = passwordInput.value;
                            const msg = {
                                type: 4,
                                chatroom_name: chatroom.name,
                                password: password,
                            };
                            (_a = this.socket) === null || _a === void 0 ? void 0 : _a.send(JSON.stringify(msg));
                            const newChatroom = { id: -1, name: chatroom.name, is_private: true };
                            if (!this.chats) {
                                this.chats = { oneToOneChats: [], chatrooms: [] };
                            }
                            this.chats.chatrooms.push(newChatroom);
                            this.updateCurrentChat(chatroom.name);
                            dropdown.classList.add("hidden");
                            this.printListChannels();
                        });
                        wrapper.appendChild(passwordInput);
                        wrapper.appendChild(joinBtn);
                    });
                    dropdown.appendChild(userBtn);
                });
            }
            const btnRect = newChatroomBtn.getBoundingClientRect();
            dropdown.style.position = "absolute";
            dropdown.style.top = `${newChatroomBtn.offsetTop}px`;
            dropdown.style.left = `${newChatroomBtn.offsetLeft + newChatroomBtn.offsetWidth + 8}px`;
        });
    }
    async blockUser() {
        var _a, _b;
        await this.getUsers();
        const blockUserBtn = (_a = this.shadowRoot) === null || _a === void 0 ? void 0 : _a.querySelector("#block-user-btn");
        const dropdown = (_b = this.shadowRoot) === null || _b === void 0 ? void 0 : _b.querySelector("#block-user-dropdown");
        blockUserBtn === null || blockUserBtn === void 0 ? void 0 : blockUserBtn.addEventListener("click", () => {
            if (!dropdown)
                return;
            dropdown.classList.toggle("hidden");
            if (dropdown.childNodes.length === 0) {
                this.users.forEach(user => {
                    if (user.username === this.user.username)
                        return;
                    const userBtn = document.createElement("button");
                    userBtn.textContent = user.username;
                    userBtn.className = "text-left p-2 hover:bg-violet-100 w-full text-[11px] md:text-[16px]";
                    userBtn.addEventListener("click", () => {
                        var _a;
                        const msg = { type: 7, destinatary: user.username };
                        (_a = this.socket) === null || _a === void 0 ? void 0 : _a.send(JSON.stringify(msg));
                        dropdown.classList.add("hidden");
                    });
                    dropdown.appendChild(userBtn);
                });
            }
            const btnRect = blockUserBtn.getBoundingClientRect();
            const dropdownWidth = 150;
            let left = btnRect.left - dropdownWidth - 16; // más a la izquierda
            let top = btnRect.bottom + 16; // más abajo que antes (antes era +8)
            // Si no hay espacio a la izquierda, lo ponemos a la derecha
            if (left < 0) {
                left = btnRect.right + 16;
            }
            dropdown.style.position = "fixed";
            dropdown.style.top = `${top}px`;
            dropdown.style.left = `${left}px`;
        });
    }
    updateCurrentChat(name) {
        this.messagesBox.innerHTML = "";
        // console.log("Chat seleccionado:", name);
        this.currentChat = name;
        if (this.currentChatHeader)
            this.currentChatHeader.textContent = this.currentChat;
    }
    async printChatroomMessages(chatroomId) {
        const data = await fetchMessagesChatroom(chatroomId);
        this.messages = data.messages;
        this.messages.forEach(msg => {
            this.addMessageToList(msg.sender, msg.message);
        });
    }
    async printChatMessages(chatId) {
        const data = await fetchMessages(chatId);
        this.messages = data.messages;
        this.messages.forEach(msg => {
            this.addMessageToList(msg.sender, msg.message);
        });
    }
    addMessageToList(sender, message) {
        if (!this.messagesBox)
            return;
        const messageElement = document.createElement("div");
        messageElement.textContent = `${sender}: ${message}`;
        messageElement.className = "p-2 border-b border-gray-300 text-[10px] md:text-[16px]";
        this.messagesBox.appendChild(messageElement);
        this.messagesBox.scrollTop = this.messagesBox.scrollHeight;
    }
}
customElements.define("pong-chat", ChatComponent);
