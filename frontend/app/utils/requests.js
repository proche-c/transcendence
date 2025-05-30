import { SERVER_IP } from '../config.js';
export async function fetchUserProfile() {
    try {
        const response = await fetch(`https://${SERVER_IP}:8443/api/profile`, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
        });
        if (!response.ok) {
            throw new Error("Error en la respuesta del servidor");
        }
        const data = await response.json();
        return data.user;
    }
    catch (error) {
        console.error("Error al obtener el perfil:", error);
        return null;
    }
}
export function fetchUsers() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const response = yield fetch("http://localhost:8000/users", {
                method: "GET",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
            });
            const data = yield response.json();
            console.log("en requests:");
            console.log(data);
            return data;
        }
        catch (error) {
            console.error("Error fetching users:", error);
            return [];
        }
    });
}
export async function fetchFriends() {
    try {
        const response = await fetch(`https://${SERVER_IP}:8443/api/users/friends`, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
        });
        if (!response.ok) {
            throw new Error("Error en la respuesta del servidor");
        }
        const data = await response.json();
        return data.friends;
    }
    catch (error) {
        console.error("Error al obtener friends:", error);
        return null;
    }
}
export function fetchPublicProfile(user) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const response = yield fetch(`http://localhost:8000/public-profile?username=${encodeURIComponent(user !== null && user !== void 0 ? user : "")}`, {
                method: "GET",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
            });
            if (!response.ok) {
                throw new Error("Error en la respuesta del servidor");
            }
            const data = yield response.json();
            return data.profile;
        }
        catch (error) {
            console.error("Error al obtener el perfil:", error);
            return null;
        }
    });
}
export function fetchChats() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const response = yield fetch("http://localhost:8000/chats", {
                method: "GET",
                headers: { "Content-Type": "application/json" },
                credentials: "include", // importante para que se envíen las cookies
            });
            if (!response.ok) {
                throw new Error("Error en la respuesta del servidor");
            }
            const data = yield response.json();
            console.log("En request fetchChats:");
            console.log(data);
            return {
                oneToOneChats: data.oneToOneChats,
                chatrooms: data.chatrooms,
            };
        }
        catch (error) {
            console.error("Error al obtener los chats:", error);
            return null;
        }
    });
}
export function fetchMessages(chatId) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const response = yield fetch(`http://localhost:8000/users/messages?chatId=${chatId}`, {
                method: "GET",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
            });
            if (!response.ok) {
                throw new Error("Error en la respuesta del servidor");
            }
            const data = yield response.json();
            console.log("Cuando pido messages obtengo: ");
            console.log(data);
            return data;
        }
        catch (error) {
            console.error("Error al obtener messages:", error);
            return null;
        }
    });
}
