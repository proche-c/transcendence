export async function fetchUserProfile() {
    try {
        const response = await fetch("http://localhost:8000/profile", {
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
        const response = await fetch("http://localhost:8000/users", {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
        });
        const data = await response.json();
        return data;
    }
    catch (error) {
        console.error("Error fetching users:", error);
        return [];
    }
}
export async function fetchFriends() {
    try {
        const response = await fetch("http://localhost:8000/users/friends", {
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
