var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
export function fetchUserProfile() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const response = yield fetch("http://localhost:8000/profile", {
                method: "GET",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
            });
            if (!response.ok) {
                throw new Error("Error en la respuesta del servidor");
            }
            const data = yield response.json();
            return data.user;
        }
        catch (error) {
            console.error("Error al obtener el perfil:", error);
            return null;
        }
    });
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
            return data;
        }
        catch (error) {
            console.error("Error fetching users:", error);
            return [];
        }
    });
}
export function fetchFriends() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const response = yield fetch("http://localhost:8000/users/friends", {
                method: "GET",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
            });
            if (!response.ok) {
                throw new Error("Error en la respuesta del servidor");
            }
            const data = yield response.json();
            return data.friends;
        }
        catch (error) {
            console.error("Error al obtener friends:", error);
            return null;
        }
    });
}
