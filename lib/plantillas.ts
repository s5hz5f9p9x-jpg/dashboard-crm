export type NombrePlantilla = "pedir_referido" | "aniversario" | "contacto_vencido";

// SPEC.md sección 9 — Plantillas de mensajes.
export const PLANTILLAS: Record<NombrePlantilla, string> = {
  pedir_referido:
    "Hola {nombre}, te quería comentar algo aparte del reporte. Este año estoy abriendo lugar para unos pocos clientes nuevos y prefiero que lleguen por recomendación antes que por publicidad. ¿Se te ocurre algún colega o amigo tuyo que tenga dólares o pesos parados sin saber bien qué hacer? Si te parece, presentámelo y yo me encargo del resto. Sin compromiso para nadie.",
  aniversario:
    "Hola {nombre}, hoy se cumplen {años} año/s desde que empezamos a trabajar juntos. Gracias por la confianza. Aprovecho para pedirte algo: si en este tiempo el trabajo te sirvió, la mejor forma de devolverlo es presentándome a alguien que necesite lo mismo. ¿Se te ocurre alguien?",
  contacto_vencido: "Hola {nombre}, ¿cómo va? Te escribo para ponernos al día con tu cartera. ¿Tenés unos minutos esta semana?",
};

export function renderPlantilla(nombrePlantilla: NombrePlantilla, vars: Record<string, string | number>): string {
  const texto = PLANTILLAS[nombrePlantilla];
  return texto.replace(/\{([\p{L}\d_]+)\}/gu, (coincidencia, clave: string) =>
    clave in vars ? String(vars[clave]) : coincidencia,
  );
}

/** Arma el link de WhatsApp con el mensaje pre-cargado. El usuario lo revisa y envía a mano — nunca se manda solo. */
export function construirLinkWhatsapp(telefono: string, mensaje: string): string {
  const telefonoLimpio = telefono.replace(/[^\d+]/g, "");
  return `https://wa.me/${telefonoLimpio}?text=${encodeURIComponent(mensaje)}`;
}
