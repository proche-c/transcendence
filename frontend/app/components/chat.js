var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { fetchUserProfile, fetchUsers } from "../utils/requests.js";
class ChatComponent extends HTMLElement {
    constructor() {
        super();
        this.user = null;
        this.users = [];
        this.messages = [];
        this.chats = [];
        this.globalChat = [];
        this.messagesBox = null;
        this.messageInput = null;
        this.sendButton = null;
        this.socket = null;
        this.responseUsers = null;
        this.attachShadow({ mode: "open" });
        this.load();
        this.connect();
    }
    load() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.getProfile();
            yield this.getUsers();
            this.render();
            // this.updateData();
        });
    }
    getProfile() {
        return __awaiter(this, void 0, void 0, function* () {
            this.user = yield fetchUserProfile();
            console.log("user:");
            console.log(this.user);
        });
    }
    getUsers() {
        return __awaiter(this, void 0, void 0, function* () {
            this.users = yield fetchUsers();
            console.log(this.users);
        });
    }
    connect() {
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
    // private async getUsers() {
    // 	this.responseUsers = await fetchUsers();
    // }
    render() {
        if (!this.shadowRoot)
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
        this.messagesBox = this.shadowRoot.querySelector("#messages");
        this.messageInput = this.shadowRoot.querySelector("#message");
        this.sendButton = this.shadowRoot.querySelector("#send");
        // this.getUsers();
        this.addEventListeners();
    }
    addEventListeners() {
        var _a;
        (_a = this.sendButton) === null || _a === void 0 ? void 0 : _a.addEventListener("click", () => {
            var _a, _b;
            const messageToSend = ((_a = this.messageInput) === null || _a === void 0 ? void 0 : _a.value) || "";
            if (messageToSend) {
                const msg = { user: "paula", type: 0, destinatary: "", message: messageToSend, chatId: -1 };
                (_b = this.socket) === null || _b === void 0 ? void 0 : _b.send(JSON.stringify(msg));
                if (this.messageInput)
                    this.messageInput.value = "";
            }
        });
    }
    addMessageToMessages(data) {
        const datas = data.split(":");
        const user = datas[0];
        const messageToPrint = datas[1];
        const message = { user: user, type: 0, destinatary: "", message: messageToPrint, chatId: -1 };
        if (message.type === 0)
            this.globalChat.push(message);
        else {
            this.messages.push(message);
            // let name: string;
            // if ()
        }
    }
    addMessageToList(data) {
        if (!this.messagesBox)
            return;
        const messageElement = document.createElement("li");
        messageElement.textContent = data;
        messageElement.className = "p-2 border-b border-gray-300";
        this.messagesBox.appendChild(messageElement);
        this.messagesBox.scrollTop = this.messagesBox.scrollHeight;
    }
}
customElements.define("pong-chat", ChatComponent);
