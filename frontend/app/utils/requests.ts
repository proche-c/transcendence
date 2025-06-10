import { SERVER_IP } from '../config.js';

export interface User {
	id: number;
	username: string;
	avatar: string;
	total_matches: number;
	totalWins: number;
	totalLosses: number;
	goalsFor: number;
	goalsAgainst: number;
	ranking: number;
}

export interface Chat {
	id : number;
	name: string;
}

export interface Message {
	type : number;
	sender: string;
	destinatary: string;
	message: string;
	chatId: number;
}

export interface OneToOneChat {
	id: number;
	other_user  : string; // el otro usuario
	avatar: string;
}

export interface ChatRoom {
	id: number;
	name: string;
	is_private: boolean;

}

export interface ChatData {
	oneToOneChats: OneToOneChat[];
	chatrooms: ChatRoom[];
}

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
	} catch (error) {
		console.error("Error al obtener el perfil:", error);
		return null;
	}
}

export async function fetchUsers(): Promise<User[]> {
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
	} catch (error: any) {
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
	} catch (error) {   
		console.error("Error al obtener friends:", error);
		return null;
	}
}

export async function fetchPublicProfile(user: string | null) {
	try {
		const response = await fetch(`https://${SERVER_IP}:8443/api/public-profile?username=${encodeURIComponent(user ?? "")}`, {
			method: "GET",
			headers: { "Content-Type": "application/json" },
			credentials: "include",
		});

		if (!response.ok) {
			throw new Error("Error en la respuesta del servidor");
		}

		const data = await response.json();
		return data.profile;
	} catch (error) {
		console.error("Error al obtener el perfil:", error);
		return null;
	}
}

export async function fetchChats(): Promise<any | ChatData | null> {
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

	} catch (error) {
		console.error("Error al obtener los chats:", error);
		return null;
	}
}

export async function fetchMessages(chatId: number | null) {
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
	} catch (error) {
		console.error("Error al obtener messages:", error);
		return null;
	}
}

export async function fetchMessagesChatroom(chatroomId: number | null) {
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
	} catch (error) {
		console.error("Error al obtener messages:", error);
		return null;
	}
}

export async function fetchChatRooms(): Promise<ChatRoom[]> {
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
	} catch (error: any) {
		console.error("Error fetching users:", error);
		return [];
	}
}