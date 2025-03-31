"use strict";
class ChatComponent extends HTMLElement {
    constructor() {
        super();
        this.messages = [];
        this.chats = [];
        this.globalChat = [];
        this.messagesBox = null;
        this.messageInput = null;
        this.sendButton = null;
        this.socket = null;
        this.attachShadow({ mode: "open" });
        this.connect();
        this.render();
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
    render() {
        if (!this.shadowRoot)
            return;
        const style = document.createElement("link");
        style.rel = "stylesheet";
        style.href = "./app/tailwind.css"; // Asegúrate de que la ruta sea correcta
        this.shadowRoot.innerHTML = `
            <pong-header></pong-header>
            <pong-menu></pong-menu>
			<div id="content" class="bg-purple-300 m-4 p-4 border border-violet-500 rounded-lg flex flex-col h-120 justify-between">
				<div id="chat" class="grow bg-amber-50 overflow-auto flex">
					<div id="chats">
					</div>
					<ul id="messages"></ul>
				</div>
				<div id="form">
					<input type="text" id="message" placeholder="Type a message" class="border">
					<button id="send" class="bg-gray-800 text-white m-1 p-1 text-center font-bold text-lg">Send</button>
				</div>
		`;
        this.shadowRoot.appendChild(style);
        this.messagesBox = this.shadowRoot.querySelector("#messages");
        this.messageInput = this.shadowRoot.querySelector("#message");
        this.sendButton = this.shadowRoot.querySelector("#send");
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
