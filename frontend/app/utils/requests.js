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
export async function fetchUsers() {
    try {
        const response = await fetch(`https://${SERVER_IP}:8443/api/users`, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
        });
        const data = await response.json();
        console.log("en requests:");
        console.log(data);
        return data;
    }
    catch (error) {
        console.error("Error fetching users:", error);
        return [];
    }
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
export async function fetchPublicProfile(user) {
    try {
        const response = await fetch(`https://${SERVER_IP}:8443/api/public-profile?username=${encodeURIComponent(user !== null && user !== void 0 ? user : "")}`, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
        });
        if (!response.ok) {
            throw new Error("Error en la respuesta del servidor");
        }
        const data = await response.json();
        return data.profile;
    }
    catch (error) {
        console.error("Error al obtener el perfil:", error);
        return null;
    }
}
export async function fetchChats() {
    try {
        const response = await fetch(`https://${SERVER_IP}:8443/api/chats`, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            credentials: "include", // importante para que se envíen las cookies
        });
        if (!response.ok) {
            throw new Error("Error en la respuesta del servidor");
        }
        const data = await response.json();
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
}
export async function fetchMessages(chatId) {
    try {
        const response = await fetch(`https://${SERVER_IP}:8443/api/users/messages?chatId=${chatId}`, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
        });
        if (!response.ok) {
            throw new Error("Error en la respuesta del servidor");
        }
        const data = await response.json();
        console.log("Cuando pido messages obtengo: ");
        console.log(data);
        return data;
    }
    catch (error) {
        console.error("Error al obtener messages:", error);
        return null;
    }
}
export async function fetchMessagesChatroom(chatroomId) {
    try {
        const response = await fetch(`https://${SERVER_IP}:8443/api/users/chatroom-messages?chatroomId=${chatroomId}`, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
        });
        if (!response.ok) {
            throw new Error("Error en la respuesta del servidor");
        }
        const data = await response.json();
        console.log("Cuando pido messages obtengo: ");
        console.log(data);
        return data;
    }
    catch (error) {
        console.error("Error al obtener messages:", error);
        return null;
    }
}
export async function fetchChatRooms() {
    try {
        const response = await fetch(`https://${SERVER_IP}:8443/api/users/chatrooms`, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
        });
        const data = await response.json();
        console.log("en requests chatrooms:");
        console.log(data);
        return data.chatrooms;
    }
    catch (error) {
        console.error("Error fetching users:", error);
        return [];
    }
}
