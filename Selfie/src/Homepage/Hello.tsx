import { JwtPayload, jwtDecode } from "jwt-decode";

// Definisci l'interfaccia che estende JwtPayload
interface DecodedToken extends JwtPayload {
  username?: string;
}

function Hello() {
  const token = localStorage.getItem("token");
  let name = "Stranger";

  if (token) {
    try {
      // Decodifica il token JWT e lo cast a DecodedToken
      const decodedToken = jwtDecode<DecodedToken>(token);

      // Verifica se il campo 'username' esiste nel token decodificato
      name = decodedToken.username || "Stranger";
    } catch (error) {
      console.error("Errore nella decodifica del token:", error);
    }
  }

  return <h1>Hello {name} lesgosky</h1>;
}

export default Hello;
