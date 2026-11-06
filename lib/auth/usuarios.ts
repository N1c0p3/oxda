// Supabase Auth identifica por correo; el equipo entra solo con su usuario.
const DOMINIO = "oxda.space";

export function correoDeUsuario(usuario: string) {
  const limpio = usuario.normalize("NFD").replace(/[̀-ͯ]/g, "").trim().toLowerCase();
  return `${limpio}@${DOMINIO}`;
}
