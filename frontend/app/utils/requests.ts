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
	} catch (error) {
		console.error("Error al obtener el perfil:", error);
		return null;
	}
}