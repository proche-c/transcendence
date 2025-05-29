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
	} catch (error) {
		console.error("Error al obtener el perfil:", error);
		return null;
	}
}

export interface User {
	id: number;
	username: string;
	avatar: string;
}

export async function fetchUsers(): Promise<User[]> {
	try {
		const response = await fetch(`https://${SERVER_IP}:8443/api/users`, {
			method: "GET",
			headers: { "Content-Type": "application/json" },
			credentials: "include",
		});
		const data = await response.json();
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